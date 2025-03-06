import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';

import { Balance, BalanceDetail, Journal, Ledger, Period, Puc, Seat } from '../entities';
import { CrearSeatDto } from '../dto';
import { SEAT_MODULE } from 'src/app/common/enums';
import { toNumber } from 'src/app/common/utils/utils';

@Injectable()
export class SeatService {
    constructor(
        @InjectRepository(Seat)
        private asientoRepository: Repository<Seat>,
        @InjectRepository(Journal)
        private journalRepository: Repository<Journal>,
        @InjectRepository(Ledger)
        private ledgerRepository: Repository<Ledger>,
        @InjectRepository(Balance)
        private balanceRepository: Repository<Balance>,
        @InjectRepository(BalanceDetail)
        private balanceDetailRepository: Repository<BalanceDetail>,
        @InjectRepository(Puc)
        private accountPlanRepository: Repository<Puc>,
        @InjectRepository(Period)
        private periodRepository: Repository<Period>,
        private dataSource: DataSource,
    ) { }

    // Crear asiento contable
    async crearAsiento(asientoData: CrearSeatDto) {

        const queryRunner = this.dataSource.createQueryRunner();

        try {
            await queryRunner.connect();
            await queryRunner.startTransaction();

            // Establecer valores predeterminados para clientes si no se proporcionan
            asientoData.customers_name = asientoData.customers_name || '--';
            asientoData.customers = asientoData.customers || '-';

            // Si no se proporciona un módulo, asignar MANUAL por defecto
            if (!asientoData.module) {
                asientoData.module = SEAT_MODULE.MANUAL;
            }

            // Crear un asiento por cada movimiento
            const asientosCreados: Seat[] = [];

            // Generar código único para este asiento
            const codigo = await this.generateCode(6);

            // Crear las entradas del journal (libro diario)
            const journalEntries: Journal[] = [];

            for (let i = 0; i < asientoData.movimientos.length; i++) {
                const movimiento = asientoData.movimientos[i];
                // Validar que cada movimiento tenga solo un valor (debit o credit)
                const debit = movimiento.debit || 0;
                const credit = movimiento.credit || 0;

                // Validar cuenta en el plan de cuentas para este movimiento
                const accountPlan = await this.accountPlanRepository.findOne({
                    where: {
                        plcu_id: movimiento.account,
                        plcu_cmpy: In(['ALL', asientoData.cmpy]),
                    },
                });


                if (!accountPlan) {
                    throw new NotFoundException(`Cuenta ${movimiento.account} no encontrada en el plan de cuentas`);
                }


                const seatId = await this.getNextSeatId(queryRunner, asientoData.cmpy);

                const nuevoAsiento = this.asientoRepository.create({
                    acch_id: seatId,
                    acch_cmpy: asientoData.cmpy,
                    acch_ware: asientoData.ware,
                    acch_year: asientoData.year,
                    acch_date: '2025-01-11',
                    acch_per: asientoData.per,
                    acch_customers: asientoData.customers,
                    acch_description: asientoData.description,
                    acch_taxable_base: movimiento.taxable_base || null,
                    acch_exempt_base: movimiento.exempt_base || null,
                    acch_code: codigo,
                    acch_account: movimiento.account,
                    acch_account_name: accountPlan.plcu_description,
                    acch_document_type: asientoData.document_type,
                    acch_document_number: asientoData.document_number || null,
                    acch_cost_center: asientoData.cost_center || null,
                    acch_elaboration_date: asientoData.elaboration_date || new Date(),
                    acch_debit: debit,
                    acch_credit: credit,
                    acch_creation_by: asientoData.creation_by || 'system',
                    // Usar el enum SeatModule para el campo de módulo
                    acch_module: asientoData.module,
                    acch_ref: asientoData.ref || null
                });

                const asientoGuardado = await this.asientoRepository.manager.transaction(async (entityManager) => {
                    return await entityManager.save(nuevoAsiento);
                });

                asientosCreados.push(asientoGuardado);

                // Crear entrada en el libro diario
                const journalEntry = queryRunner.manager.create(Journal, {
                    accj_id: seatId,
                    accj_cmpy: asientoData.cmpy,
                    accj_line_number: i + 1,
                    accj_ware: asientoData.ware,
                    accj_year: asientoData.year,
                    accj_per: asientoData.per,
                    accj_code: codigo,
                    accj_account: movimiento.account,
                    accj_taxable_base: movimiento.taxable_base || null,
                    accj_exempt_base: movimiento.exempt_base || null,
                    accj_document_type: asientoData.document_type,
                    accj_document_number: asientoData.document_number || null,
                    accj_cost_center: asientoData.cost_center || null,
                    accj_elaboration_date: asientoData.elaboration_date || new Date(),
                    accj_account_name: accountPlan.plcu_description,
                    accj_debit: movimiento.debit || 0,
                    accj_credit: movimiento.credit || 0,
                    accj_description: asientoData.description,
                    accj_customers: asientoData.customers,
                    accj_customers_name: asientoData.customers_name,
                    accj_creation_by: asientoData.creation_by,
                    accj_is_closing_entry: asientoData.module === SEAT_MODULE.CIERRE, // Es asiento de cierre si el módulo es CIERRE
                });

                const savedJournalEntry = await queryRunner.manager.save(journalEntry);
                journalEntries.push(savedJournalEntry);

                // Actualizar libro mayor
                await this.updateLedger(
                    queryRunner,
                    asientoData.cmpy,
                    asientoData.ware,
                    asientoData.year,
                    asientoData.per,
                    movimiento.account,
                    accountPlan.plcu_description,
                    movimiento.debit || 0,
                    movimiento.credit || 0,
                    asientoData.creation_by
                );
            }

            await queryRunner.commitTransaction();
            //return journalEntries;
            return asientosCreados; // Retornar un array de asientos creados

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw new HttpException({
                success: false,
                message: 'Error al Crear el asiento',
                error: error.message,
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        } finally {
            await queryRunner.release();
        }


    }


    // Actualizar libro mayor
    private async updateLedger(
        queryRunner: QueryRunner,
        cmpy: string,
        ware: string,
        year: number,
        per: number,
        account: string,
        accountName: string,
        debit: number,
        credit: number,
        userId: string
    ): Promise<void> {
        // Buscar o crear entrada en el libro mayor
        let ledgerEntry = await queryRunner.manager.findOne(Ledger, {
            where: {
                accl_cmpy: cmpy,
                accl_ware: ware,
                accl_year: year,
                accl_per: per,
                accl_account: account,
            },
        });

        //console.log(ledgerEntry);

        if (!ledgerEntry) {
            // Si no existe, crear nuevo registro
            // Primero obtener saldos iniciales (del período anterior o año anterior)
            const initialBalances = await this.getInitialBalances(queryRunner, cmpy, ware, year, per, account);

            ledgerEntry = queryRunner.manager.create(Ledger, {
                accl_cmpy: cmpy,
                accl_ware: ware,
                accl_year: year,
                accl_per: per,
                accl_date: '2025-01-11',                
                accl_account: account, 
                accl_account_name: accountName,
                accl_initial_debit: toNumber(initialBalances.initialDebit),
                accl_initial_credit: toNumber(initialBalances.initialCredit),
                accl_period_debit: debit,
                accl_period_credit: credit,
                accl_final_debit: toNumber(initialBalances.initialDebit) + toNumber(debit),
                accl_final_credit: toNumber(initialBalances.initialCredit) + toNumber(credit),
                accl_last_updated: new Date(),
                accl_creation_by: userId,
            });
        } else {
            // Actualizar registro existente
            const numPeriodDebit = typeof ledgerEntry.accl_period_debit === 'string'
                ? Number(ledgerEntry.accl_period_debit)
                : ledgerEntry.accl_period_debit;

            const numPeriodCredit = typeof ledgerEntry.accl_period_credit === 'string'
                ? Number(ledgerEntry.accl_period_credit)
                : ledgerEntry.accl_period_credit;

            const numInitialDebit = typeof ledgerEntry.accl_initial_debit === 'string'
                ? Number(ledgerEntry.accl_initial_debit)
                : ledgerEntry.accl_initial_debit;

            const numInitialCredit = typeof ledgerEntry.accl_initial_credit === 'string'
                ? Number(ledgerEntry.accl_initial_credit)
                : ledgerEntry.accl_initial_credit;


            // Actualizar con valores numéricos
            ledgerEntry.accl_period_debit = toNumber(numPeriodDebit) + toNumber(debit);
            ledgerEntry.accl_period_credit = toNumber(numPeriodCredit) + toNumber(credit);
            ledgerEntry.accl_final_debit = toNumber(numInitialDebit) + (toNumber(numPeriodDebit) + toNumber(debit));
            ledgerEntry.accl_final_credit = toNumber(numInitialCredit) + (toNumber(numPeriodCredit) + toNumber(credit));
            ledgerEntry.accl_last_updated = new Date();
            ledgerEntry.accl_updated_by = userId;


        }

        await queryRunner.manager.save(ledgerEntry);
    }

    // Obtener saldos iniciales para libro mayor
    private async getInitialBalances(
        queryRunner: QueryRunner,
        cmpy: string,
        ware: string,
        year: number,
        per: number,
        account: string
    ): Promise<{ initialDebit: number, initialCredit: number }> {
        let initialDebit = 0;
        let initialCredit = 0;

        if (per > 1) {
            // Si no es el primer período del año, buscar saldos del período anterior
            const previousLedger = await queryRunner.manager.findOne(Ledger, {
                where: {
                    accl_cmpy: cmpy,
                    accl_ware: ware,
                    accl_year: year,
                    accl_per: per - 1,
                    accl_account: account,
                },
            });

            if (previousLedger) {
                initialDebit = previousLedger.accl_final_debit;
                initialCredit = previousLedger.accl_final_credit;
            }
        } else if (per === 1) {
            // Si es el primer período del año, buscar saldos del cierre del año anterior
            const previousYearLedger = await queryRunner.manager.findOne(Ledger, {
                where: {
                    accl_cmpy: cmpy,
                    accl_ware: ware,
                    accl_year: year - 1,
                    accl_per: 13, // Período de cierre
                    accl_account: account,
                },
            });

            if (previousYearLedger) {
                initialDebit = previousYearLedger.accl_final_debit;
                initialCredit = previousYearLedger.accl_final_credit;
            }
        }

        return { initialDebit, initialCredit };
    }

    private async getNextSeatId(queryRunner: QueryRunner, acch_cmpy: string): Promise<number> {
        // Consulta filtrando por compañía
        const result = await queryRunner.manager
            .createQueryBuilder(Seat, 'seat')
            .select('COALESCE(MAX(CAST(seat.acch_id AS INTEGER)), 0)', 'max')
            .where('seat.acch_cmpy = :companyCode', { companyCode: acch_cmpy })
            .getRawOne();

        return Number(result.max) + 1;
    }   

    private async calcularSaldoAcumulado(
        cmpy: string,
        ware: string,
        year: number,
        per: number,
        account: string,
    ): Promise<number> {
        const asientosAnteriores = await this.asientoRepository
            .createQueryBuilder('asiento')
            .where('asiento.acch_cmpy = :cmpy', { cmpy })
            .andWhere('asiento.acch_ware = :ware', { ware })
            .andWhere('asiento.acch_year = :year', { year })
            .andWhere('asiento.acch_per <= :per', { per })
            .andWhere('asiento.acch_account = :account', { account })
            .getMany();

        const saldoAcumulado = asientosAnteriores.reduce((sum, asiento) => {
            return sum + (asiento.acch_debit || 0) - (asiento.acch_credit || 0);
        }, 0);

        return saldoAcumulado;
    }
    private async generateCode(longitud: number = 6): Promise<string> {
        // Generar código único
        let codigo: string = '';
        let existe = true;
        const caracteres = 'abcdefgABCDEFGHIstuvwJK345LMNOP1267QRSTnopqUVWXYZ089hijklmrxyz';

        while (existe) {
            codigo = '';
            for (let i = 0; i < longitud; i++) {
                codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
            }

            const asientoExistente = await this.asientoRepository.findOne({ where: { acch_code: codigo } });
            existe = !!asientoExistente;
        }
        return codigo;
    }

    async obtenerResumenPorFechas(cmpy: string, ware: string, year: number, per: number) {
        const asientos = await this.asientoRepository
            .createQueryBuilder('asiento')
            .where('asiento.acch_cmpy = :cmpy', { cmpy })
            .andWhere('asiento.acch_ware = :ware', { ware })
            .andWhere('asiento.acch_year = :year', { year })
            .andWhere('asiento.acch_per = :per', { per })
            .orderBy('asiento.acch_id', 'ASC')
            .getMany();

        return asientos;
    }

    // Método para filtrar asientos por módulo
    async obtenerAsientosPorModulo(
        cmpy: string, 
        year: number, 
        per: number, 
        module: SEAT_MODULE
    ) {
        const asientos = await this.asientoRepository
            .createQueryBuilder('asiento')
            .where('asiento.acch_cmpy = :cmpy', { cmpy })
            .andWhere('asiento.acch_year = :year', { year })
            .andWhere('asiento.acch_per = :per', { per })
            .andWhere('asiento.acch_module = :module', { module })
            .orderBy('asiento.acch_date', 'ASC')
            .addOrderBy('asiento.acch_id', 'ASC')
            .getMany();

        if (asientos.length === 0) {
            throw new NotFoundException(`No se encontraron asientos del módulo ${module} para el período ${per} del año ${year}`);
        }

        return asientos; 
    }

    async buscarPorCodigo(code: string): Promise<Seat[]> {
        const asiento = await this.asientoRepository.find({ where: { acch_code: code } });
        if (!asiento) throw new NotFoundException('Asiento no encontrado');
        return asiento;
    }

    
}