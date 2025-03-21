import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { SeatService } from './seat.service';
import { PeriodService } from './period.service';
import { NoteHeader, NoteLine } from '../entities';
import { CrearSeatDto, CreateNoteDto, MovimientoDto, UpdateNoteStatusDto } from '../dto';
import { toNumber } from 'src/app/common/utils/utils';
import { SEAT_MODULE } from 'src/app/common/enums';
import { NoteHeaderWithLines, NoteWithLines } from '../interfaces/note.interface';

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

    async create(createNoteDto: CreateNoteDto): Promise<NoteWithLines> {

        createNoteDto.auto_accounting = createNoteDto.auto_accounting ?? true;
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
                totalDebit += line.debit !== null && line.debit !== undefined ? toNumber(line.debit) : 0;
                totalCredit += line.credit !== null && line.credit !== undefined ? toNumber(line.credit) : 0;
            });

            // Verificar partida doble
            if (Math.abs(totalDebit - totalCredit) > 0.01) {
                throw new BadRequestException('La suma de débitos y créditos debe ser igual');
            }

            const acnh_id = await this.getNextNoteHeadId(queryRunner, createNoteDto.cmpy);

            // Generar código único para este asiento
            const codigo = await this.generateCode(createNoteDto.cmpy, 6);

            // Crear cabecera con los nuevos campos
            const header = this.noteHeaderRepository.create({
                acnh_id: acnh_id,
                acnh_cmpy: createNoteDto.cmpy,
                acnh_ware: createNoteDto.ware,
                acnh_year: createNoteDto.year,
                acnh_per: createNoteDto.per,
                acnh_date: createNoteDto.date ? new Date(createNoteDto.date) : new Date(),
                acnh_customer: customer,
                acnh_customer_name: customerName,
                acnh_description: createNoteDto.description,
                acnh_status: 'P', // Pendiente por defecto
                acnh_total_debit: totalDebit,
                acnh_total_credit: totalCredit,
                acnh_reference: createNoteDto.reference,
                acnh_creation_by: createNoteDto.creation_by,
                acnh_code: codigo,
                acnh_cost_center: createNoteDto.cost_center || null,
                acnh_observations: createNoteDto.observations || null,
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
                    acnl_account_name: lineDto.account_name || 'Cuenta sin nombre',
                    acnl_debit: lineDto.debit !== null && lineDto.debit !== undefined ? toNumber(lineDto.debit) : null,
                    acnl_credit: lineDto.credit !== null && lineDto.credit !== undefined ? toNumber(lineDto.credit) : null,
                    acnl_taxable_base: lineDto.taxable_base !== null && lineDto.taxable_base !== undefined ? toNumber(lineDto.taxable_base) : null,
                    acnl_exempt_base: lineDto.exempt_base !== null && lineDto.exempt_base !== undefined ? toNumber(lineDto.exempt_base) : null,
                    acnl_customers: lineDto.customer || customer,
                    acnl_customers_name: lineDto.customer_name || customerName,
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
                savedHeader.acnh_updated_by = savedHeader.acnh_creation_by;
                await queryRunner.manager.save(savedHeader);
            }

            await queryRunner.commitTransaction();

            // Cargar las líneas para la respuesta
            const noteWithLines: NoteWithLines = {
                id: savedHeader.acnh_id,
                cmpy: savedHeader.acnh_cmpy,
                ware: savedHeader.acnh_ware,
                year: savedHeader.acnh_year,
                per: savedHeader.acnh_per,
                date: savedHeader.acnh_date,
                time: savedHeader.acnh_time,
                customer: savedHeader.acnh_customer,
                customer_name: savedHeader.acnh_customer_name,
                status: savedHeader.acnh_status,
                total_debit: savedHeader.acnh_total_debit,
                total_credit: savedHeader.acnh_total_credit,
                reference: savedHeader.acnh_reference,
                creation_by: savedHeader.acnh_creation_by,
                creation_date: savedHeader.acnh_creation_date,
                updated_by: savedHeader.acnh_updated_by,
                updated_date: savedHeader.acnh_updated_date,
                approved_by: savedHeader.acnh_approved_by,
                approved_date: savedHeader.acnh_approved_date,
                observations: savedHeader.acnh_observations!,
                cost_center: savedHeader.acnh_cost_center!,
                doc_type: "NOTE",
                priority: 'N', // Valor por defecto
                auto_accounting: savedHeader.acnh_auto_accounting,
                accounting_date: savedHeader.acnh_accounting_date!,
                code: savedHeader.acnh_code!,
                lines: noteLines
            };

            return noteWithLines;

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    private async getNextNoteHeadId(queryRunner: QueryRunner, acnh_cmpy: string): Promise<number> {
        const result = await queryRunner.manager
            .createQueryBuilder()
            .select('COALESCE(MAX(NoteHeader.acnh_id), 0)', 'max')
            .from(NoteHeader, 'NoteHeader')
            .where('NoteHeader.acnh_cmpy = :companyCode', { companyCode: acnh_cmpy })
            .getRawOne();

        return Number(result.max) + 1;
    }

    private async getNextNoteLineId(queryRunner: QueryRunner, acnl_cmpy: string): Promise<number> {
        const result = await queryRunner.manager
            .createQueryBuilder()
            .select('COALESCE(MAX(NoteLine.acnl_id), 0)', 'max')
            .from(NoteLine, 'NoteLine')
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
            const [cmpy, idStr] = updateStatusDto.id.split('-');
            const id = parseInt(idStr);

            // Obtener la nota y verificar que exista
            const noteWithLines = await this.findOne(cmpy, id);

            // Validar transiciones de estado permitidas
            this.validateStatusTransition(noteWithLines.acnh_status, updateStatusDto.status);

            // Actualizar estado en el objeto de la nota
            noteWithLines.acnh_status = updateStatusDto.status;
            noteWithLines.acnh_updated_by = updateStatusDto.updated_by;

            if (updateStatusDto.status === 'A') { // Aprobado
                noteWithLines.acnh_approved_by = updateStatusDto.updated_by;
                noteWithLines.acnh_approved_date = new Date();
            }

            // Quitamos las líneas para guardar solo el encabezado
            const { lines, ...noteHeader } = noteWithLines;
            await queryRunner.manager.save(NoteHeader, noteHeader);

            // Si está aprobado, contabilizar (crear asientos)
            if (updateStatusDto.status === 'A') {
                await this.contabilizarNota(queryRunner, noteHeader, lines);

                // Actualizar estado a Contabilizado
                noteHeader.acnh_status = 'C';
                noteHeader.acnh_accounting_date = new Date();
                await queryRunner.manager.save(noteHeader);
            }

            await queryRunner.commitTransaction();
            return await this.findOne(cmpy, id);
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

        lines.forEach(line => {
            sientoMov.push({
                account: line.acnl_account,
                debit: line.acnl_debit,
                credit: line.acnl_credit,
                taxable_base: line.acnl_taxable_base,
                exempt_base: line.acnl_exempt_base,
                debitOrCredit: undefined
            });
        });

        // Agregar información de observaciones a la descripción si existe
        let description = `Nota Contable ${note.acnh_id}`;
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
            document_type: "NOTA",
            document_number: note.acnh_id.toString(),
            cost_center: note.acnh_cost_center || null,
            elaboration_date: note.acnh_date || new Date(),
            code: note.acnh_code || undefined,
            module: SEAT_MODULE.NOTA,
            ref: note.acnh_reference || note.acnh_id.toString(),
            movimientos: sientoMov
        };

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

    private async generateCode(cmpy: string, length: number = 6): Promise<string> {
        // Generar código único
        let code: string = '';
        let exists = true;
        const characters = 'abcdefgABCDEFGHIstuvwJK345LMNOP1267QRSTnopqUVWXYZ089hijklmrxyz';

        while (exists) {
            code = '';
            for (let i = 0; i < length; i++) {
                code += characters.charAt(Math.floor(Math.random() * characters.length));
            }

            const existingNote = await this.noteHeaderRepository.findOne({
                where: {
                    acnh_code: code,
                    acnh_cmpy: cmpy
                }
            });

            exists = !!existingNote;
        }
        return code;
    }
}