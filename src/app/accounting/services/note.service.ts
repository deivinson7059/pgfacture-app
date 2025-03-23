import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';

import { NoteHeader, NoteLine, Puc } from '@accounting/entities';

import { SeatService } from '@accounting/services/seat.service';
import { PeriodService } from '@accounting/services/period.service';
import { CommentService } from '@shared/services';

import { CreateCommentDto } from '@shared/dto';
import { CrearSeatDto, CreateNoteDto, MovimientoDto, UpdateNoteStatusDto } from '@accounting/dto';
import { EditNoteDto } from '@accounting/dto/edit-note.dto';
import { AnulateNoteDto } from '@accounting/dto/anulate-note.dto';
import { ApproveNoteDto } from '@accounting/dto/approve-note.dto';

import { toNumber } from '@common/utils/utils';
import { SEAT_MODULE } from '@common/enums';

import { NoteHeaderWithLines, NoteWithLines } from '@accounting/interfaces';

@Injectable()
export class NoteService {
    constructor(
        private seatService: SeatService,
        private dataSource: DataSource,
        private periodService: PeriodService,
        private commentService: CommentService,
        @InjectRepository(NoteHeader)
        private noteHeaderRepository: Repository<NoteHeader>,
        @InjectRepository(NoteLine)
        private noteLineRepository: Repository<NoteLine>,
    ) { }

    /**
  * Valida que todas las cuentas en las líneas de la nota existan en el plan contable
  * @param queryRunner QueryRunner para ejecutar consultas en transacción
  * @param cmpy Código de la compañía
  * @param lines Líneas de la nota contable con las cuentas a validar
  * @returns void - Lanza excepción si alguna cuenta no existe
  */
    private async validateAccounts(
        queryRunner: QueryRunner,
        cmpy: string,
        lines: { account: string }[]
    ): Promise<void> {
        // Extraer todas las cuentas únicas para validar
        const accountsToValidate = [...new Set(lines.map(line => line.account))];

        // Verificar cada cuenta en el plan contable
        for (const accountCode of accountsToValidate) {
            const account = await queryRunner.manager
                .createQueryBuilder(Puc, 'puc')
                .where('(puc.plcu_cmpy = :cmpy OR puc.plcu_cmpy = :all)', {
                    cmpy: cmpy,
                    all: 'ALL'
                })
                .andWhere('puc.plcu_id = :account', { account: accountCode })
                .getOne();

            if (!account) {
                throw new BadRequestException(`Cuenta ${accountCode} no encontrada en el plan de cuentas`);
            }
        }
    }

    async create(createNoteDto: CreateNoteDto): Promise<NoteWithLines> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Verificar que el período exista y esté abierto
            const openPeriod = await this.periodService.findOpenPeriod(createNoteDto.cmpy);

            // Validar que todas las cuentas existan en el plan contable
            await this.validateAccounts(queryRunner, createNoteDto.cmpy, createNoteDto.lines);

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



            // Crear cabecera con los nuevos campos
            const header = this.noteHeaderRepository.create({
                acnh_id: acnh_id,
                acnh_cmpy: createNoteDto.cmpy,
                acnh_ware: createNoteDto.ware,
                acnh_year: openPeriod.accp_year,
                acnh_per: openPeriod.accp_per,
                acnh_date: new Date(),
                acnh_customer: customer,
                acnh_customer_name: customerName,
                acnh_status: 'P', // Pendiente por defecto
                acnh_total_debit: totalDebit,
                acnh_total_credit: totalCredit,
                acnh_reference: createNoteDto.reference,
                acnh_creation_by: createNoteDto.creation_by,
                acnh_cost_center: createNoteDto.cost_center || null,
                acnh_accounting_date: createNoteDto.date ? new Date(createNoteDto.date) : new Date()
            });

            const savedHeader = await queryRunner.manager.save(header);

            // Registrar comentario de creación
            const createDto: CreateCommentDto = {
                cmpy: savedHeader.acnh_cmpy,
                ware: savedHeader.acnh_ware,
                ref: savedHeader.acnh_id.toString(),
                ref2: createNoteDto.reference || null,
                module: SEAT_MODULE.NOTA,
                comment: createNoteDto.comments,
                user_enter: createNoteDto.creation_by,
                system_generated: false,
            }
            const comment = await this.commentService.createComment(queryRunner, createDto);

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

            await queryRunner.commitTransaction();

            // Cargar las líneas para la respuesta
            const noteWithLines: NoteWithLines = {
                id: savedHeader.acnh_id,
                cmpy: savedHeader.acnh_cmpy,
                ware: savedHeader.acnh_ware,
                year: savedHeader.acnh_year,
                per: savedHeader.acnh_per,
                code: savedHeader.acnh_code!,
                accounting_date: savedHeader.acnh_accounting_date!,
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
                cost_center: savedHeader.acnh_cost_center!,
                lines: noteLines,
                comments: [
                    comment
                ],
                seats: []
            };
            return noteWithLines;

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // Método para editar una nota (reemplazar completamente y registrar cambios)
    async editNote(cmpy: string, id: number, editNoteDto: EditNoteDto): Promise<NoteWithLines> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Verificar que la nota exista
            const noteWithLines = await this.findOne(cmpy, id);

            console.log('noteWithLines', noteWithLines);

            // Validar que la nota esté en estado 'P' (Pendiente)
            if (noteWithLines.acnh_status !== 'P') {
                throw new BadRequestException(`Solo se pueden editar notas en estado Pendiente. Estado actual: ${noteWithLines.acnh_status}`);
            }

            // Verificar que el período exista y esté abierto
            const openPeriod = await this.periodService.findOpenPeriod(cmpy);

            // Valores predeterminados
            const customer = editNoteDto.customer || '-';
            const customerName = editNoteDto.customer_name || '--';

            // Calcular totales
            let totalDebit = 0;
            let totalCredit = 0;
            editNoteDto.lines.forEach(line => {
                totalDebit += line.debit !== null && line.debit !== undefined ? toNumber(line.debit) : 0;
                totalCredit += line.credit !== null && line.credit !== undefined ? toNumber(line.credit) : 0;
            });

            // Verificar partida doble
            if (Math.abs(totalDebit - totalCredit) > 0.01) {
                throw new BadRequestException('La suma de débitos y créditos debe ser igual');
            }

            // Actualizar encabezado
            noteWithLines.acnh_year = openPeriod.accp_year;
            noteWithLines.acnh_per = openPeriod.accp_per;
            noteWithLines.acnh_date = new Date();
            noteWithLines.acnh_customer = customer;
            noteWithLines.acnh_customer_name = customerName;
            noteWithLines.acnh_total_debit = totalDebit;
            noteWithLines.acnh_total_credit = totalCredit;
            noteWithLines.acnh_reference = editNoteDto.reference!;
            noteWithLines.acnh_updated_by = editNoteDto.updated_by;
            noteWithLines.acnh_updated_date = new Date();
            noteWithLines.acnh_cost_center = editNoteDto.cost_center || null;
            noteWithLines.acnh_accounting_date = editNoteDto.date ? new Date(editNoteDto.date) : new Date();

            // Guardar cambios en el encabezado
            // Guardar explícitamente como instancia de NoteHeader
            await queryRunner.manager.save(NoteHeader, noteWithLines);

            // Eliminar líneas existentes
            await queryRunner.manager.delete(NoteLine, {
                acnl_acnh_id: id,
                acnl_cmpy: cmpy
            });

            // Crear nuevas líneas
            const noteLines: NoteLine[] = [];
            for (let i = 0; i < editNoteDto.lines.length; i++) {
                const acnl_id = await this.getNextNoteLineId(queryRunner, cmpy);
                const lineDto = editNoteDto.lines[i];
                const line = this.noteLineRepository.create({
                    acnl_id: acnl_id,
                    acnl_acnh_id: id,
                    acnl_cmpy: cmpy,
                    acnl_ware: editNoteDto.ware,
                    acnl_line_number: i + 1,
                    acnl_account: lineDto.account,
                    acnl_account_name: lineDto.account_name || 'Cuenta sin nombre',
                    acnl_debit: lineDto.debit !== null && lineDto.debit !== undefined ? toNumber(lineDto.debit) : null,
                    acnl_credit: lineDto.credit !== null && lineDto.credit !== undefined ? toNumber(lineDto.credit) : null,
                    acnl_taxable_base: lineDto.taxable_base !== null && lineDto.taxable_base !== undefined ? toNumber(lineDto.taxable_base) : null,
                    acnl_exempt_base: lineDto.exempt_base !== null && lineDto.exempt_base !== undefined ? toNumber(lineDto.exempt_base) : null,
                    acnl_customers: lineDto.customer || customer,
                    acnl_customers_name: lineDto.customer_name || customerName,
                    acnl_creation_by: editNoteDto.updated_by
                });

                const savedLine = await queryRunner.manager.save(line);
                noteLines.push(savedLine);
            }

            // Registrar comentario de edición
            const commentDto: CreateCommentDto = {
                cmpy: cmpy,
                ware: editNoteDto.ware,
                ref: id.toString(),
                ref2: editNoteDto.reference || null,
                module: SEAT_MODULE.NOTA,
                comment: `EDITADO: ${editNoteDto.edit_comments}`,
                user_enter: editNoteDto.updated_by,
                system_generated: false,
            };

            await this.commentService.createComment(queryRunner, commentDto);

            await queryRunner.commitTransaction();

            // Obtener nota actualizada
            return this.getNoteInfo(cmpy, id);

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // Método para anular una nota contable
    async anulateNote(cmpy: string, id: number, anulateNoteDto: AnulateNoteDto): Promise<NoteWithLines> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Verificar que la nota exista
            const noteWithLines = await this.findOne(cmpy, id);

            // Validar que la nota NO esté en estado 'X' (Anulada) ya
            if (noteWithLines.acnh_status === 'X') {
                throw new BadRequestException(`La nota ya se encuentra anulada`);
            }

            // Actualizar estado a 'X' (Anulado)
            noteWithLines.acnh_status = 'X';
            noteWithLines.acnh_updated_by = anulateNoteDto.updated_by;
            noteWithLines.acnh_updated_date = new Date();

            // Guardar cambios en el encabezado
            // Guardar explícitamente como instancia de NoteHeader
            await queryRunner.manager.save(NoteHeader, noteWithLines);

            // Registrar comentario de anulación
            const commentDto: CreateCommentDto = {
                cmpy: cmpy,
                ware: noteWithLines.acnh_ware,
                ref: id.toString(),
                ref2: noteWithLines.acnh_reference || null,
                module: SEAT_MODULE.NOTA,
                comment: `ANULADO: ${anulateNoteDto.justification}`,
                user_enter: anulateNoteDto.updated_by,
                system_generated: false,
            };

            const comment = await this.commentService.createComment(queryRunner, commentDto);

            await queryRunner.commitTransaction();

            // Obtener nota actualizada
            return this.getNoteInfo(cmpy, id);

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // Método para aprobar una nota contable y generar asientos
    async approveNote(cmpy: string, id: number, approveNoteDto: ApproveNoteDto): Promise<NoteWithLines> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Verificar que la nota exista
            const noteWithLines = await this.findOne(cmpy, id);

            // Validar que la nota esté en estado 'P' (Pendiente)
            if (noteWithLines.acnh_status !== 'P') {
                throw new BadRequestException(`Solo se pueden aprobar notas en estado Pendiente. Estado actual: ${noteWithLines.acnh_status}`);
            }

            // Actualizar estado a 'A' (Aprobado)
            noteWithLines.acnh_status = 'A';
            noteWithLines.acnh_approved_by = approveNoteDto.approved_by;
            noteWithLines.acnh_approved_date = new Date();
            noteWithLines.acnh_updated_by = approveNoteDto.approved_by;
            noteWithLines.acnh_updated_date = new Date();

            // Guardar cambios en el encabezado
            // Guardar explícitamente como instancia de NoteHeader
            await queryRunner.manager.save(NoteHeader, noteWithLines);

            // Registrar comentario de aprobación
            const commentText = approveNoteDto.comments
                ? `APROBADO: ${approveNoteDto.comments}`
                : `APROBADO por ${approveNoteDto.approved_by}`;

            const commentDto: CreateCommentDto = {
                cmpy: cmpy,
                ware: noteWithLines.acnh_ware,
                ref: id.toString(),
                ref2: noteWithLines.acnh_reference || null,
                module: SEAT_MODULE.NOTA,
                comment: commentText,
                user_enter: approveNoteDto.approved_by,
                system_generated: false,
            };

            await this.commentService.createComment(queryRunner, commentDto);

            // Generar código único para este asiento y la nota
            const codigo = await this.generateCode(cmpy, 6);

            // Asignar el código a la nota antes de contabilizar
            noteWithLines.acnh_code = codigo;
            await queryRunner.manager.save(NoteHeader, noteWithLines);

            // Contabilizar la nota (crear asientos) usando el mismo código
            await this.contabilizarNota(queryRunner, noteWithLines, noteWithLines.lines);

            // Actualizar estado a 'C' (Contabilizado)
            noteWithLines.acnh_status = 'C';
            await queryRunner.manager.save(NoteHeader, noteWithLines);

            // Registrar comentario de contabilización
            const contabilizacionDto: CreateCommentDto = {
                cmpy: cmpy,
                ware: noteWithLines.acnh_ware,
                ref: id.toString(),
                ref2: noteWithLines.acnh_reference || null,
                module: SEAT_MODULE.NOTA,
                comment: `CONTABILIZADO: Se generaron los asientos contables correspondientes con código ${codigo}`,
                user_enter: approveNoteDto.approved_by,
                system_generated: true,
            };

            await this.commentService.createComment(queryRunner, contabilizacionDto);

            await queryRunner.commitTransaction();

            // Obtener nota actualizada
            return this.getNoteInfo(cmpy, id);

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

    async findAll__(
        cmpy: string,
        date_ini: Date,
        date_end: Date,
        status?: string
    ): Promise<NoteHeader[]> {
        console.log('datos', cmpy, date_ini, date_end, status);
        const queryBuilder = this.noteHeaderRepository
            .createQueryBuilder('header')
            .where('header.acnh_cmpy = :cmpy', { cmpy })
            .andWhere('header.acnh_date BETWEEN :date_ini AND :date_end', {
                date_ini,
                date_end
            });

        if (status) {
            queryBuilder.andWhere('header.acnh_status = :status', { status });
        }

        return queryBuilder
            .orderBy('header.acnh_date', 'DESC')
            .getMany();
    }

    async findAll(
        cmpy: string,
        date_ini: Date,
        date_end: Date,
        status?: string
    ): Promise<NoteWithLines[]> {
        // Obtener cabeceras y líneas en una sola consulta con JOIN
        const queryBuilder = this.noteHeaderRepository
            .createQueryBuilder('header')
            .where('header.acnh_cmpy = :cmpy', { cmpy })
            .andWhere('header.acnh_accounting_date BETWEEN :date_ini AND :date_end', {
                date_ini,
                date_end
            });

        if (status) {
            queryBuilder.andWhere('header.acnh_status = :status', { status });
        }

        // Obtener resultados con relaciones incluidas
        const notesWithLines = await queryBuilder
            .orderBy('header.acnh_accounting_date', 'DESC')
            .getMany();

        // Transformar a formato de respuesta
        const result: NoteWithLines[] = [];

        for (const note of notesWithLines) {

            const noteLines = await this.noteLineRepository.find({
                where: {
                    acnl_acnh_id: note.acnh_id,
                    acnl_cmpy: note.acnh_cmpy
                },
                order: {
                    acnl_line_number: 'ASC'
                }
            });


            result.push({
                id: note.acnh_id,
                cmpy: note.acnh_cmpy,
                ware: note.acnh_ware,
                year: note.acnh_year,
                per: note.acnh_per,
                code: note.acnh_code || '',
                accounting_date: note.acnh_accounting_date,
                date: note.acnh_date,
                time: note.acnh_time,
                customer: note.acnh_customer,
                customer_name: note.acnh_customer_name,
                status: note.acnh_status,
                total_debit: note.acnh_total_debit,
                total_credit: note.acnh_total_credit,
                reference: note.acnh_reference,
                creation_by: note.acnh_creation_by,
                creation_date: note.acnh_creation_date,
                updated_by: note.acnh_updated_by,
                updated_date: note.acnh_updated_date,
                approved_by: note.acnh_approved_by,
                approved_date: note.acnh_approved_date,
                cost_center: note.acnh_cost_center || undefined,
                lines: noteLines,
                comments: await this.commentService.getComments(note.acnh_cmpy, SEAT_MODULE.NOTA, note.acnh_id.toString()),
                seats: await this.seatService.listAsientos(cmpy, note.acnh_code)
            });
        }

        return result;
    }

    async getNoteInfo(cmpy: string, id: number): Promise<NoteWithLines> {
        const noteWithLines = await this.findOne(cmpy, id);

        const data: NoteWithLines = {
            id: noteWithLines.acnh_id,
            cmpy: noteWithLines.acnh_cmpy,
            ware: noteWithLines.acnh_ware,
            year: noteWithLines.acnh_year,
            per: noteWithLines.acnh_per,
            code: noteWithLines.acnh_code!,
            accounting_date: noteWithLines.acnh_accounting_date!,
            date: noteWithLines.acnh_date,
            time: noteWithLines.acnh_time,
            customer: noteWithLines.acnh_customer,
            customer_name: noteWithLines.acnh_customer_name,
            status: noteWithLines.acnh_status,
            total_debit: noteWithLines.acnh_total_debit,
            total_credit: noteWithLines.acnh_total_credit,
            reference: noteWithLines.acnh_reference,
            creation_by: noteWithLines.acnh_creation_by,
            creation_date: noteWithLines.acnh_creation_date,
            updated_by: noteWithLines.acnh_updated_by,
            updated_date: noteWithLines.acnh_updated_date,
            approved_by: noteWithLines.acnh_approved_by,
            approved_date: noteWithLines.acnh_approved_date,
            cost_center: noteWithLines.acnh_cost_center!,
            lines: noteWithLines.lines,
            comments: await this.commentService.getComments(noteWithLines.acnh_cmpy, SEAT_MODULE.NOTA, noteWithLines.acnh_id.toString()),
            seats: await this.seatService.listAsientos(cmpy, noteWithLines.acnh_code)
        };

        return data as NoteWithLines;
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

            // Guardar explícitamente como instancia de NoteHeader
            await queryRunner.manager.save(NoteHeader, noteWithLines);

            // Si está aprobado, contabilizar (crear asientos)
            if (updateStatusDto.status === 'A') {
                await this.contabilizarNota(queryRunner, noteWithLines, noteWithLines.lines);

                // Actualizar estado a Contabilizado
                noteWithLines.acnh_status = 'C';
                noteWithLines.acnh_accounting_date = new Date();
                await queryRunner.manager.save(NoteHeader, noteWithLines);
            }

            // Registrar comentario sobre cambio de estado
            let commentText = '';
            switch (updateStatusDto.status) {
                case 'P': commentText = 'ESTADO: Pendiente'; break;
                case 'A': commentText = 'ESTADO: Aprobado'; break;
                case 'R': commentText = 'ESTADO: Rechazado'; break;
                case 'C': commentText = 'ESTADO: Contabilizado'; break;
                case 'X': commentText = 'ESTADO: Anulado'; break;
                default: commentText = `ESTADO: ${updateStatusDto.status}`;
            }

            if (updateStatusDto.comments) {
                commentText += ` - ${updateStatusDto.comments}`;
            }

            const commentDto: CreateCommentDto = {
                cmpy: cmpy,
                ware: noteWithLines.acnh_ware,
                ref: id.toString(),
                ref2: noteWithLines.acnh_reference || null,
                module: SEAT_MODULE.NOTA,
                comment: commentText,
                user_enter: updateStatusDto.updated_by,
                system_generated: false,
            };

            await this.commentService.createComment(queryRunner, commentDto);

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
            code: note.acnh_code!,
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
            'P': ['A', 'R', 'X'], // Pendiente puede pasar a Aprobado, Rechazado o Anulado
            'R': ['P', 'X'], // Rechazado puede volver a Pendiente o ser Anulado
            'A': ['C', 'X'], // Aprobado puede pasar a Contabilizado o ser Anulado
            'C': ['X'], // Contabilizado solo puede ser Anulado
            'X': [] // Anulado es un estado final
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