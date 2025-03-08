import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { SeatService } from './seat.service';
import { PeriodService } from './period.service';
import { NoteHeader, NoteLine } from '../entities';
import { CrearSeatDto, CreateNoteDto, MovimientoDto, UpdateNoteStatusDto } from '../dto';
import { toNumber } from 'src/app/common/utils/utils';
import { SEAT_MODULE } from 'src/app/common/enums';
type NoteHeaderWithLines = NoteHeader & { lines: NoteLine[] };
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

            // Valores predeterminados
            const customer = createNoteDto.customer || '-';
            const customerName = createNoteDto.customer_name || '--';

            // Calcular totales
            let totalDebit = 0;
            let totalCredit = 0;
            createNoteDto.lines.forEach(line => {
                totalDebit += toNumber(line.debit);
                totalCredit += toNumber(line.credit);
            });

            // Verificar partida doble
            if (Math.abs(totalDebit - totalCredit) > 0.01) {
                throw new BadRequestException('La suma de débitos y créditos debe ser igual');
            }

            const acnh_id = await this.getNextNoteHeadId(queryRunner, createNoteDto.cmpy);

            // Crear cabecera con los nuevos campos
            const header = this.noteHeaderRepository.create({
                acnh_id: acnh_id,
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
                acnh_creation_by: createNoteDto.creation_by,
                // Nuevos campos
                acnh_observations: createNoteDto.observations || null,
                acnh_external_reference: createNoteDto.external_reference || null,
                acnh_doc_type: createNoteDto.doc_type || null,
                acnh_area: createNoteDto.area || null,
                acnh_priority: createNoteDto.priority || 'N',
                acnh_auto_accounting: createNoteDto.auto_accounting || false,
                acnh_accounting_date: createNoteDto.accounting_date ? new Date(createNoteDto.accounting_date) : null
            }); 

            const savedHeader = await queryRunner.manager.save(header);

            // Crear líneas
            const noteLines: NoteLine[] = [];
            for (let i = 0; i < createNoteDto.lines.length; i++) {
                const acnl_id = await this.getNextNoteLineId(queryRunner, createNoteDto.cmpy);
                const lineDto = createNoteDto.lines[i];
                const line = this.noteLineRepository.create({
                    acnl_id: acnl_id,
                    acnl_acnh_id: savedHeader.acnh_id,
                    acnl_cmpy: savedHeader.acnh_cmpy,
                    acnl_ware: savedHeader.acnh_ware,
                    acnl_line_number: i + 1,
                    acnl_account: lineDto.account,
                    acnl_account_name: lineDto.account_name,
                    acnl_description: lineDto.description,
                    acnl_debit: toNumber(lineDto.debit),
                    acnl_credit: toNumber(lineDto.credit),
                    acnl_reference: lineDto.reference,
                    acnl_tercero: lineDto.tercero || 'SISTEM ADMIN',
                    acnl_creation_by: createNoteDto.creation_by
                });

                const savedLine = await queryRunner.manager.save(line);
                noteLines.push(savedLine);
            }

            // Si está configurado para contabilización automática, contabilizar inmediatamente
            if (savedHeader.acnh_auto_accounting) {
                // Cambiar estado a Aprobado
                savedHeader.acnh_status = 'A';
                savedHeader.acnh_approved_by = savedHeader.acnh_creation_by;
                savedHeader.acnh_approved_date = new Date();
                await queryRunner.manager.save(savedHeader);
                
                // Contabilizar la nota
                await this.contabilizarNota(queryRunner, savedHeader, noteLines);
                
                // Actualizar estado a Contabilizado
                savedHeader.acnh_status = 'C';
                savedHeader.acnh_accounting_date = new Date();
                await queryRunner.manager.save(savedHeader);
            }

            await queryRunner.commitTransaction();

            // Cargar las líneas para la respuesta
            return {
                ...savedHeader,
                lines: noteLines
            } as NoteHeaderWithLines;

        } catch (error) {
            console.error(error);
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    private async getNextNoteHeadId(queryRunner: QueryRunner, acnh_cmpy: string): Promise<number> {
        const result = await queryRunner.manager
            .createQueryBuilder(NoteHeader, 'NoteHeader')
            .select('COALESCE(MAX(NoteHeader.acnh_id), 0)', 'max')
            .where('NoteHeader.acnh_cmpy = :companyCode', { companyCode: acnh_cmpy })
            .getRawOne();

        return Number(result.max) + 1;
    }

    private async getNextNoteLineId(queryRunner: QueryRunner, acnl_cmpy: string): Promise<number> {
        const result = await queryRunner.manager
            .createQueryBuilder(NoteLine, 'NoteLine')
            .select('COALESCE(MAX(NoteLine.acnl_id), 0)', 'max')
            .where('NoteLine.acnl_cmpy = :companyCode', { companyCode: acnl_cmpy })
            .getRawOne();

        return Number(result.max) + 1;
    }

    async findAll(
        cmpy: string,
        year?: number,
        per?: number,
        status?: string
    ): Promise<NoteHeader[]> {
        const queryBuilder = this.noteHeaderRepository
            .createQueryBuilder('header')
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
            .getMany();
    }

    async findOne(cmpy: string, id: number): Promise<NoteHeaderWithLines> {
        const noteHeader = await this.noteHeaderRepository.findOne({
            where: {
                acnh_id: id,
                acnh_cmpy: cmpy
            },
        });

        if (!noteHeader) {
            throw new NotFoundException(`Nota contable con ID ${id} no encontrada`);
        }

        const noteLines = await this.noteLineRepository.find({
            where: {
                acnl_acnh_id: id,
                acnl_cmpy: cmpy
            }, 
            order: {
                acnl_line_number: 'ASC'
            }
        });

        return {
            ...noteHeader,
            lines: noteLines
        } as NoteHeaderWithLines;
    }

    async updateStatus(updateStatusDto: UpdateNoteStatusDto): Promise<any> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Obtener la nota y verificar que exista
            const note = await this.findOne(updateStatusDto.id.split('-')[0], parseInt(updateStatusDto.id.split('-')[1]));

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
                await this.contabilizarNota(queryRunner, note, note.lines);

                // Actualizar estado a Contabilizado
                note.acnh_status = 'C';
                note.acnh_accounting_date = new Date();
                await queryRunner.manager.save(note);
            }

            await queryRunner.commitTransaction();
            return await this.findOne(note.acnh_cmpy, note.acnh_id);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    private async contabilizarNota(queryRunner: any, note: NoteHeader, lines: NoteLine[]): Promise<void> {
        // Preparar DTO para crear asiento
        const sientoMov: MovimientoDto[] = [];

        lines.map(line => {
            sientoMov.push({
                account: line.acnl_account,
                debit: line.acnl_debit,
                credit: line.acnl_credit,
                taxable_base: 0,
                exempt_base: 0,
                debitOrCredit: undefined
            });
        });

        // Agregar información de observaciones a la descripción si existe
        let description = `Nota Contable ${note.acnh_id}: ${note.acnh_description || ''}`;
        if (note.acnh_observations) {
            description += ` - Obs: ${note.acnh_observations}`;
        }

        const asientoData: CrearSeatDto = {
            cmpy: note.acnh_cmpy,
            ware: note.acnh_ware,
            year: note.acnh_year,
            per: note.acnh_per,
            customers: note.acnh_customer,
            customers_name: note.acnh_customer_name,
            description: description,
            creation_by: note.acnh_updated_by || note.acnh_creation_by,
            document_type: note.acnh_doc_type || "NOTA",
            document_number: note.acnh_id.toString(),
            cost_center: note.acnh_area || null,
            elaboration_date: note.acnh_accounting_date || new Date(),
            // Campos adicionales
            module: SEAT_MODULE.NOTA,
            ref: note.acnh_external_reference || note.acnh_id.toString(),
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
}