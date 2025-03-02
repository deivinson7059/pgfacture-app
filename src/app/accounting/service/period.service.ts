import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan } from 'typeorm';
import { CreatePeriodDto, CreateYearPeriodsDto } from '../dto';
import { Period, Ledger } from '../entities';
import { formatDate, primerUltimoDia } from 'src/app/common/utils/utils';

@Injectable()
export class PeriodService {
    constructor(
        @InjectRepository(Period)
        private periodRepository: Repository<Period>,
        @InjectRepository(Ledger)
        private ledgerRepository: Repository<Ledger>,
        private dataSource: DataSource,
    ) { }

    async findAll(cmpy: string, year?: number): Promise<Period[]> {
        const queryBuilder = this.periodRepository
            .createQueryBuilder('period')
            .where('period.accp_cmpy = :cmpy', { cmpy });

        if (year) {
            queryBuilder.andWhere('period.accp_year = :year', { year });
        }

        return queryBuilder
            .orderBy('period.accp_year', 'DESC')
            .addOrderBy('period.accp_per', 'ASC')
            .getMany();
    }

    async findOne(cmpy: string, year: number, per: number): Promise<Period> {
        const period = await this.periodRepository.findOne({
            where: {
                accp_cmpy: cmpy,
                accp_year: year,
                accp_per: per,
            },
        });

        if (!period) {
            throw new NotFoundException(`Período ${per} del año ${year} para la compañía ${cmpy} no encontrado`);
        }

        return period;
    }

    async create(createPeriodDto: CreatePeriodDto): Promise<Period> {
        const { cmpy, year, per, description, start_date, end_date, is_closing_period, creation_by } = createPeriodDto;

        // Verificar si el período ya existe
        const existingPeriod = await this.periodRepository.findOne({
            where: {
                accp_cmpy: cmpy,
                accp_year: year,
                accp_per: per,
            },
        });

        if (existingPeriod) {
            throw new ConflictException(`El período ${per} del año ${year} ya existe para la compañía ${cmpy}`);
        }

        // Verificar que el período esté dentro del rango válido
        if (per < 1 || per > 13) {
            throw new BadRequestException('El período debe estar entre 1 y 13');
        }

        // Crear el nuevo período
        const newPeriod = this.periodRepository.create({
            accp_cmpy: cmpy,
            accp_year: year,
            accp_per: per,
            accp_description: description,
            accp_start_date: formatDate(start_date),
            accp_end_date: formatDate(end_date),
            accp_status: 'O', // Open
            accp_is_closing_period: is_closing_period || false,
            accp_creation_by: creation_by,
        });

        return this.periodRepository.save(newPeriod);
    }



    async createYearPeriods(createYearPeriodsDto: CreateYearPeriodsDto): Promise<Period[]> {
        const { cmpy, year, creation_by } = createYearPeriodsDto;
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Verificar que el año no exista
            const existingYear = await queryRunner.manager.findOne(Period, {
                where: {
                    accp_cmpy: cmpy,
                    accp_year: year,
                },
            });

            if (existingYear) {
                throw new ConflictException(`El año ${year} ya existe para la compañía ${cmpy}`);
            }

            // Crear los 13 períodos (12 meses + cierre)
            const periods: Period[] = [];

            // Períodos mensuales (1-13)
            for (let i = 1; i <= 13; i++) {
                let startDate, endDate, description, isClosingPeriod;

                if (i <= 12) {
                    // Períodos mensuales normales (1-12)
                    startDate = primerUltimoDia(i, year);//new Date(year, i - 1, 1);
                    endDate = primerUltimoDia(i, year, true); //new Date(year, i, 0); // Último día del mes
                    description = this.getMonthName(i) + ' ' + year;
                    isClosingPeriod = false;

                } else {
                    // Período 13 (cierre anual)
                    startDate = primerUltimoDia(12, year); //new Date(year, 11, 31); // 31 de diciembre 
                    endDate = primerUltimoDia(12, year, true); //new Date(year, 11, 31); // 31 de diciembre
                    description = `Cierre Año ${year}`;
                    isClosingPeriod = false;
                }

                // El primer período está abierto (O), el resto bloqueados (B)
                const status = i === 1 ? 'O' : 'B';

                const period = queryRunner.manager.create(Period, {
                    accp_cmpy: cmpy,
                    accp_year: year,
                    accp_per: i,
                    accp_description: description,
                    accp_start_date: startDate,
                    accp_end_date: endDate,
                    accp_status: status,
                    accp_is_closing_period: isClosingPeriod,
                    accp_creation_by: creation_by,
                });

                await queryRunner.manager.save(period);
                periods.push(period);
            }

            await queryRunner.commitTransaction();
            return periods;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async closePeriod(cmpy: string, year: number, period: number, userId: string): Promise<Period> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Verificar que el período exista
            const accountingPeriod = await queryRunner.manager.findOne(Period, {
                where: {
                    accp_cmpy: cmpy,
                    accp_year: year,
                    accp_per: period,
                },
            });

            if (!accountingPeriod) {
                throw new NotFoundException(`Período ${period} del año ${year} para la compañía ${cmpy} no encontrado`);
            }

            // Verificar que el período esté abierto
            if (accountingPeriod.accp_status !== 'O') {
                throw new BadRequestException(`El período ${period} del año ${year} para la compañía ${cmpy} ya está cerrado`);
            }



            // Actualizar el período
            accountingPeriod.accp_status = 'C'; // Closed
            accountingPeriod.accp_closed_by = userId;
            accountingPeriod.accp_closed_date = new Date();
            accountingPeriod.accp_updated_by = userId;

            await queryRunner.manager.save(accountingPeriod);


            // Si no es el período 13 (cierre anual), ejecutar cierre de mes regular
            if (period < 13) {

                //actualizamos O el segirnte periodo

                // Verificar si existe el período siguiente en el mismo año
                const nextPeriod = period + 1;

                // Verificar si el siguiente período existe y está abierto
                const nextAccountingPeriod = await queryRunner.manager.findOne(Period, {
                    where: {
                        accp_cmpy: cmpy,
                        accp_year: year,
                        accp_per: nextPeriod,
                    },
                });

                if (!nextAccountingPeriod) {
                    throw new NotFoundException(`Período ${nextPeriod} del año ${year} no encontrado. No se puede cerrar el período actual.`);
                }

                // Actualizar el período a O 
                nextAccountingPeriod.accp_status = 'O'; // Closed
                nextAccountingPeriod.accp_updated_by = userId;

                await queryRunner.manager.save(nextAccountingPeriod);

                await this.executeMonthClosing(queryRunner, cmpy, year, period, userId);
            } else {
                // Si es el período 13, ejecutar cierre anual
                await this.executeYearClosing(queryRunner, cmpy, year, userId);
            }

            await queryRunner.commitTransaction();

            return accountingPeriod;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // Método para ejecutar cierre de mes
    private async executeMonthClosing(queryRunner: any, cmpy: string, year: number, period: number, userId: string): Promise<void> {
        // Obtener todas las cuentas con movimientos en el período actual
        const ledgerEntries = await queryRunner.manager.find(Ledger, {
            where: {
                accl_cmpy: cmpy,
                accl_year: year,
                accl_per: period,
            },
        });

        // Verificar si existe el período siguiente en el mismo año
        const nextPeriod = period + 1;

        // Verificar si el siguiente período existe y está abierto
        const nextAccountingPeriod = await queryRunner.manager.findOne(Period, {
            where: {
                accp_cmpy: cmpy,
                accp_year: year,
                accp_per: nextPeriod,
            }, 
        });

        if (!nextAccountingPeriod) {
            throw new NotFoundException(`Período ${nextPeriod} del año ${year} no encontrado. No se puede cerrar el período actual.`);
        }

        if (nextAccountingPeriod.accp_status !== 'O') {
            throw new BadRequestException(`El período ${nextPeriod} del año ${year} debe estar abierto para completar el cierre.`);
        }

        // Para cada cuenta, trasladar saldos finales al siguiente período
        for (const entry of ledgerEntries) {
            // Buscar si ya existe un registro para esta cuenta en el período siguiente
            let nextPeriodLedger = await queryRunner.manager.findOne(Ledger, {
                where: {
                    accl_cmpy: cmpy,
                    accl_ware: entry.accl_ware,
                    accl_year: year,
                    accl_per: nextPeriod,
                    accl_account: entry.accl_account,
                },
            });

            if (!nextPeriodLedger) {
                // Crear un nuevo registro para el siguiente período
                nextPeriodLedger = queryRunner.manager.create(Ledger, {
                    accl_cmpy: cmpy,
                    accl_ware: entry.accl_ware,
                    accl_year: year,
                    accl_per: nextPeriod,
                    accl_account: entry.accl_account,
                    accl_account_name: entry.accl_account_name,
                    accl_initial_debit: entry.accl_final_debit,
                    accl_initial_credit: entry.accl_final_credit,
                    accl_period_debit: 0,
                    accl_period_credit: 0,
                    accl_final_debit: entry.accl_final_debit,
                    accl_final_credit: entry.accl_final_credit,
                    accl_last_updated: new Date(),
                    accl_creation_by: userId,
                });
            } else {
                // Actualizar el registro existente si ya se habían creado movimientos en el período siguiente
                nextPeriodLedger.accl_initial_debit = entry.accl_final_debit;
                nextPeriodLedger.accl_initial_credit = entry.accl_final_credit;
                nextPeriodLedger.accl_final_debit = entry.accl_final_debit + nextPeriodLedger.accl_period_debit;
                nextPeriodLedger.accl_final_credit = entry.accl_final_credit + nextPeriodLedger.accl_period_credit;
                nextPeriodLedger.accl_last_updated = new Date();
                nextPeriodLedger.accl_updated_by = userId;
            }

            await queryRunner.manager.save(nextPeriodLedger);
        }
    }

    // Método para ejecutar cierre anual
    private async executeYearClosing(queryRunner: any, cmpy: string, year: number, userId: string): Promise<void> {
        // 1. Verificar que todos los períodos del 1 al 12 estén cerrados
        const openPeriods = await queryRunner.manager.find(Period, {
            where: {
                accp_cmpy: cmpy,
                accp_year: year,
                accp_per: LessThan(13), // Períodos 1-12
                accp_status: 'O', // Abierto
            },
        });

        if (openPeriods.length > 0) {
            throw new BadRequestException(`Existen períodos abiertos en el año ${year}. Cierre todos los períodos antes de cerrar el año.`);
        }

        // 2. Obtener todas las cuentas del mayor al final del período 12
        const ledgerEntries = await queryRunner.manager.find(Ledger, {
            where: {
                accl_cmpy: cmpy,
                accl_year: year,
                accl_per: 12, // Último período regular
            },
        });

        // 3. Crear automáticamente los períodos del año siguiente si no existen
        const nextYear = year + 1;

        // Verificar si ya existen períodos para el siguiente año
        const existingNextYearPeriods = await queryRunner.manager.find(Period, {
            where: {
                accp_cmpy: cmpy,
                accp_year: nextYear,
            },
        });

        // Si no existen períodos para el año siguiente, crearlos todos
        if (existingNextYearPeriods.length === 0) {
            await this.createNextYearPeriods(queryRunner, cmpy, nextYear, userId);
        }

        // 4. Trasladar saldos de las cuentas de balance (1, 2, 3) al año siguiente
        // Las cuentas de resultados (4, 5, 6, 7) se reinician 
        for (const entry of ledgerEntries) {
            const accountType = entry.accl_account.charAt(0);

            // Solo trasladamos las cuentas de balance (1, 2, 3)
            if (['1', '2', '3'].includes(accountType)) {
                // Buscar si ya existe un registro para esta cuenta en el primer período del año siguiente
                let nextYearLedger = await queryRunner.manager.findOne(Ledger, {
                    where: {
                        accl_cmpy: cmpy,
                        accl_ware: entry.accl_ware,
                        accl_year: nextYear,
                        accl_per: 1,
                        accl_account: entry.accl_account,
                    },
                });

                if (!nextYearLedger) {
                    // Crear un nuevo registro para el año siguiente
                    nextYearLedger = queryRunner.manager.create(Ledger, {
                        accl_cmpy: cmpy,
                        accl_ware: entry.accl_ware,
                        accl_year: nextYear,
                        accl_per: 1,
                        accl_account: entry.accl_account,
                        accl_account_name: entry.accl_account_name,
                        accl_initial_debit: entry.accl_final_debit,
                        accl_initial_credit: entry.accl_final_credit,
                        accl_period_debit: 0,
                        accl_period_credit: 0,
                        accl_final_debit: entry.accl_final_debit,
                        accl_final_credit: entry.accl_final_credit,
                        accl_last_updated: new Date(),
                        accl_creation_by: userId,
                    });
                } else {
                    // Actualizar el registro existente si ya se habían creado movimientos en el período siguiente
                    nextYearLedger.accl_initial_debit = entry.accl_final_debit;
                    nextYearLedger.accl_initial_credit = entry.accl_final_credit;
                    nextYearLedger.accl_final_debit = entry.accl_final_debit + nextYearLedger.accl_period_debit;
                    nextYearLedger.accl_final_credit = entry.accl_final_credit + nextYearLedger.accl_period_credit;
                    nextYearLedger.accl_last_updated = new Date();
                    nextYearLedger.accl_updated_by = userId;
                }

                await queryRunner.manager.save(nextYearLedger);
            }
        }

        // 5. Crear asiento de cierre en el período 13
        // Este proceso se realizaría aquí para cerrar cuentas de resultados
        // y trasladar el resultado a la cuenta de utilidad/pérdida del ejercicio
        // Implementación específica depende de las políticas contables
    }

    // Método para crear los períodos del siguiente año
    private async createNextYearPeriods(queryRunner: any, cmpy: string, nextYear: number, userId: string): Promise<Period[]> {
        const periods: Period[] = [];
        // Crear los 13 períodos para el siguiente año
        for (let i = 1; i <= 13; i++) {
            let startDate, endDate, description, isClosingPeriod;

            if (i <= 12) {
                // Períodos mensuales normales (1-12)  
                startDate = primerUltimoDia(i, nextYear);//new Date(nextYear, i - 1, 1);
                endDate = primerUltimoDia(i, nextYear, true); //new Date(nextYear, i, 0); // Último día del mes
                description = this.getMonthName(i) + ' ' + nextYear; //this.getMonthName(i);
                isClosingPeriod = false;
            } else {
                // Período 13 (cierre anual)
                startDate = primerUltimoDia(12, nextYear); //new Date(year, 11, 31); // 31 de diciembre 
                endDate = primerUltimoDia(12, nextYear, true); //new Date(year, 11, 31); // 31 de diciembre
                description = `Cierre Año ${nextYear}`;
                isClosingPeriod = false;
            }

            // El primer período está abierto (O), el resto bloqueados (B)
            const status = i === 1 ? 'O' : 'B';

            const period = queryRunner.manager.create(Period, {
                accp_cmpy: cmpy,
                accp_year: nextYear,
                accp_per: i,
                accp_description: description,
                accp_start_date: startDate,
                accp_end_date: endDate,
                accp_status: status,
                accp_is_closing_period: isClosingPeriod,
                accp_closed_date: null,
                accp_creation_by: userId,
            });

            await queryRunner.manager.save(period);
            periods.push(period);
        }

        return periods;
    }

    private getMonthName(month: number): string {
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return monthNames[month - 1];
    }
}