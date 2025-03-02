import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SeatService } from './seat.service';
import { PeriodService } from './period.service';
import { NoteHeader, NoteLine } from '../entities';
import { CrearSeatDto, CreateNoteDto, MovimientoDto, UpdateNoteStatusDto } from '../dto';

@Injectable()
export class NoteService {
    constructor(
        @InjectRepository(NoteHeader)
        private noteHeaderRepository: Repository<NoteHeader>,
        @InjectRepository(NoteLine)
        private noteLineRepository: Repository<NoteLine>,
        private dataSource: DataSource,
        private seatService: SeatService,
        private periodService: PeriodService
    ) { }

    async create(createNoteDto: CreateNoteDto): Promise<NoteHeader> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Verificar que el período exista y esté abierto
            await this.periodService.findOne(
                createNoteDto.cmpy,
                createNoteDto.year,
                createNoteDto.per
            );

            // Generar código único para la nota
            const code = await this.generateNoteCode(createNoteDto.cmpy);

            // Valores predeterminados
            const customer = createNoteDto.customer || '-';
            const customerName = createNoteDto.customer_name || '--';

            // Calcular totales
            let totalDebit = 0;
            let totalCredit = 0;
            createNoteDto.lines.forEach(line => {
                totalDebit += this.toNumber(line.debit);
                totalCredit += this.toNumber(line.credit);
            });

            // Verificar partida doble
            if (Math.abs(totalDebit - totalCredit) > 0.01) {
                throw new BadRequestException('La suma de débitos y créditos debe ser igual');
            }

            // Crear cabecera
            const header = this.noteHeaderRepository.create({
                acnh_code: code,
                acnh_cmpy: createNoteDto.cmpy,
                acnh_ware: createNoteDto.ware,
                acnh_year: createNoteDto.year,
                acnh_per: createNoteDto.per,
                acnh_date: new Date(),
                acnh_customer: customer,
                acnh_customer_name: customerName,
                acnh_description: createNoteDto.description,
                acnh_status: 'P', // Pendiente por defecto
                acnh_total_debit: totalDebit,
                acnh_total_credit: totalCredit,
                acnh_reference: createNoteDto.reference,
                acnh_creation_by: createNoteDto.creation_by
            });

            const savedHeader = await queryRunner.manager.save(header);

            // Crear líneas
            for (let i = 0; i < createNoteDto.lines.length; i++) {
                const lineDto = createNoteDto.lines[i];
                const line = this.noteLineRepository.create({
                    acnl_header_id: savedHeader.acnh_id,
                    acnl_line_number: i + 1,
                    acnl_account: lineDto.account,
                    acnl_account_name: lineDto.account_name,
                    acnl_description: lineDto.description,
                    acnl_debit: this.toNumber(lineDto.debit),
                    acnl_credit: this.toNumber(lineDto.credit),
                    acnl_reference: lineDto.reference,
                    acnl_creation_by: createNoteDto.creation_by
                });

                await queryRunner.manager.save(line);
            }

            await queryRunner.commitTransaction();

            // Cargar las líneas para la respuesta
            const noteWithLines = await this.findOne(savedHeader.acnh_id);
            return noteWithLines;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async findAll(
        cmpy: string,
        year?: number,
        per?: number,
        status?: string
    ): Promise<NoteHeader[]> {
        const queryBuilder = this.noteHeaderRepository
            .createQueryBuilder('header')
            .leftJoinAndSelect('header.lines', 'lines')
            .where('header.acnh_cmpy = :cmpy', { cmpy });

        if (year !== undefined) {
            queryBuilder.andWhere('header.acnh_year = :year', { year });
        }

        if (per !== undefined) {
            queryBuilder.andWhere('header.acnh_per = :per', { per });
        }

        if (status) {
            queryBuilder.andWhere('header.acnh_status = :status', { status });
        }

        return queryBuilder
            .orderBy('header.acnh_date', 'DESC')
            .addOrderBy('header.acnh_code', 'ASC')
            .getMany();
    }

    async findOne(id: string): Promise<NoteHeader> {
        const note = await this.noteHeaderRepository.findOne({
            where: { acnh_id: id },
            relations: ['lines']
        });

        if (!note) {
            throw new NotFoundException(`Nota contable con ID ${id} no encontrada`);
        }

        return note;
    }

    async findByCode(code: string): Promise<NoteHeader> {
        const note = await this.noteHeaderRepository.findOne({
            where: { acnh_code: code },
            relations: ['lines']
        });

        if (!note) {
            throw new NotFoundException(`Nota contable con código ${code} no encontrada`);
        }

        return note;
    }

    async updateStatus(updateStatusDto: UpdateNoteStatusDto): Promise<NoteHeader> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const note = await this.findOne(updateStatusDto.id);

            // Validar transiciones de estado permitidas
            this.validateStatusTransition(note.acnh_status, updateStatusDto.status);

            // Actualizar estado
            note.acnh_status = updateStatusDto.status;
            note.acnh_updated_by = updateStatusDto.updated_by;

            if (updateStatusDto.status === 'A') { // Aprobado
                note.acnh_approved_by = updateStatusDto.updated_by;
                note.acnh_approved_date = new Date();
            }

            await queryRunner.manager.save(note);

            // Si está aprobado, contabilizar (crear asientos)
            if (updateStatusDto.status === 'A') {
                await this.contabilizarNota(queryRunner, note);

                // Actualizar estado a Contabilizado
                note.acnh_status = 'C';
                await queryRunner.manager.save(note);
            }

            await queryRunner.commitTransaction();
            return await this.findOne(note.acnh_id);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    private async contabilizarNota(queryRunner: any, note: NoteHeader): Promise<void> {
        // Preparar DTO para crear asiento


        const sientoMov: MovimientoDto[] = [];

        note.lines.map(line => {
            sientoMov.push({
                account: line.acnl_account,
                debit: line.acnl_debit,
                credit: line.acnl_credit,
                debitOrCredit: undefined
            });
        });
        const asientoData: CrearSeatDto = {
            acch_cmpy: note.acnh_cmpy,
            acch_ware: note.acnh_ware,
            acch_year: note.acnh_year,
            acch_per: note.acnh_per,
            acch_customers: note.acnh_customer,
            acch_customers_name: note.acnh_customer_name,
            acch_detbin: `Nota Contable ${note.acnh_code}: ${note.acnh_description || ''}`,
            acch_creation_by: note.acnh_updated_by || note.acnh_creation_by,
            movimientos: sientoMov
        }
        // Llamar al servicio de asientos para contabilizar
        await this.seatService.crearAsiento(asientoData);
    }

    private validateStatusTransition(currentStatus: string, newStatus: string): void {
        // Solo permitir ciertas transiciones de estado
        const allowedTransitions = {
            'P': ['A', 'R'], // Pendiente puede pasar a Aprobado o Rechazado
            'R': ['P'], // Rechazado puede volver a Pendiente
            'A': ['C'], // Aprobado solo puede pasar a Contabilizado (aunque esto ocurre automáticamente)
            'C': [] // Contabilizado es un estado final
        };

        if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
            throw new BadRequestException(`No se permite cambiar de estado ${currentStatus} a ${newStatus}`);
        }
    }

    private async generateNoteCode(cmpy: string): Promise<string> {
        // Formato: NC-{CMPY}-{AÑO}-{SECUENCIAL}
        const year = new Date().getFullYear();

        // Buscar el último número secuencial
        const lastNote = await this.noteHeaderRepository
            .createQueryBuilder('note')
            .where('note.acnh_cmpy = :cmpy', { cmpy })
            .andWhere('note.acnh_code LIKE :pattern', { pattern: `NC-${cmpy}-${year}-%` })
            .orderBy('note.acnh_code', 'DESC')
            .getOne();

        let secuencial = 1;
        if (lastNote) {
            const parts = lastNote.acnh_code.split('-');
            const lastSecuencial = parseInt(parts[parts.length - 1], 10);
            secuencial = lastSecuencial + 1;
        }

        return `NC-${cmpy}-${year}-${secuencial.toString().padStart(5, '0')}`;
    }

    private toNumber(value: any): number {
        if (value === null || value === undefined) return 0;
        if (typeof value === 'number') return value;
        if (typeof value === 'string') return Number(value);
        return 0;
    }
}