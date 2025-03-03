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

            // Crear cabecera
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
                acnh_creation_by: createNoteDto.creation_by
            });

            const savedHeader = await queryRunner.manager.save(header);

            // Crear líneas


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

                await queryRunner.manager.save(line);
            }    
            
            await queryRunner.commitTransaction();

            // Cargar las líneas para la respuesta
            const noteHeader = await this.noteHeaderRepository.findOne({
                where: {
                    acnh_id: acnh_id,
                    acnh_cmpy: createNoteDto.cmpy
                },
            });
            const noteLines = await this.noteLineRepository.find({
                where: {
                    acnl_acnh_id: acnh_id,
                    acnl_cmpy: createNoteDto.cmpy
                },
                order: {
                    acnl_line_number: 'ASC'
                }
            });           

            return {
                ...noteHeader,
                lines: noteLines
            } as NoteHeaderWithLines;

        } catch (error) {
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

    async findOne(cmpy:string,id: number): Promise<NoteHeaderWithLines> {
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

        /* try {
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
        } */
    }

    private async contabilizarNota(queryRunner: any, note: NoteHeader, lines: any): Promise<void> {
        // Preparar DTO para crear asiento
        const sientoMov: MovimientoDto[] = [];
    
        lines.map(line => {
            sientoMov.push({
                account: line.acnl_account,
                debit: line.acnl_debit,
                credit: line.acnl_credit,
                debitOrCredit: undefined
            });
        });
        
        const asientoData: CrearSeatDto = {
            cmpy: note.acnh_cmpy,
            ware: note.acnh_ware,
            year: note.acnh_year,
            per: note.acnh_per,
            customers: note.acnh_customer,
            customers_name: note.acnh_customer_name,
            detbin: `Nota Contable ${note.acnh_id}: ${note.acnh_description || ''}`,
            creation_by: note.acnh_updated_by || note.acnh_creation_by,
            // Nuevos campos module y ref
            module: SEAT_MODULE.NOTA, // Especificamos que viene del módulo de notas
            ref: note.acnh_id.toString(), // Referencia al ID de la nota
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