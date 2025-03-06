import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
    Seat,
    Journal,
    Ledger,
    Puc,
    Period
} from 'src/app/accounting/entities';
import { SEAT_MODULE } from 'src/app/common/enums';

@Injectable()
export class AccountingSeedService {
    constructor(
        private dataSource: DataSource,
        @InjectRepository(Seat)
        private seatRepository: Repository<Seat>,
        @InjectRepository(Journal)
        private journalRepository: Repository<Journal>,
        @InjectRepository(Ledger)
        private ledgerRepository: Repository<Ledger>,
        @InjectRepository(Puc)
        private pucRepository: Repository<Puc>,
        @InjectRepository(Period)
        private periodRepository: Repository<Period>
    ) { }

    /**
     * Ejecuta el proceso de seed para contabilidad
     */
    async runSeed(companyId: string, warehouseId: string): Promise<{ message: string }> {
        console.log(`🔄 Iniciando seed de contabilidad para compañía ${companyId} y sucursal ${warehouseId}...`);

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Verificar que existan períodos contables para la compañía
            const periods = await this.periodRepository.find({
                where: { accp_cmpy: companyId }
            });

            if (periods.length === 0) {
                throw new Error(`No hay períodos contables configurados para la compañía ${companyId}`);
            }

            // Obtenemos las cuentas contables por clase para tener variedad
            const accounts = await this.getCuentasPorClase();

            // Generamos asientos (seats) para varios períodos
            let totalAsientos = 0;

            for (const period of periods) {
                //const numAsientos = this.getRandomNumber(1, 3); // Entre 15 y 30 asientos por período
                const numAsientos = this.getRandomNumber(15, 30); // Entre 15 y 30 asientos por período

                console.log(`📝 Generando ${numAsientos} asientos para el período ${period.accp_year}-${period.accp_per}`);

                for (let i = 0; i < numAsientos; i++) {
                    await this.crearAsientoAleatorio(
                        queryRunner,
                        companyId,
                        warehouseId,
                        period.accp_year,
                        period.accp_per,
                        accounts
                    );
                    totalAsientos++;
                }
            }

            await queryRunner.commitTransaction();

            return {
                message: `Se han generado ${totalAsientos} asientos contables, junto con sus entradas en el libro diario y mayor para la compañía ${companyId}`
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Obtiene las cuentas del PUC organizadas por clase
     */
    private async getCuentasPorClase(): Promise<Record<number, Puc[]>> {
        const allAccounts = await this.pucRepository.find({
            where: { plcu_cmpy: 'ALL' }
        });

        // Organizamos las cuentas por clase (primer dígito del código)
        const accountsByClass: Record<number, Puc[]> = {};

        for (let i = 1; i <= 9; i++) {
            // Filtramos cuentas que empiezan con el dígito de clase y tienen 6 dígitos (subcuentas)
            accountsByClass[i] = allAccounts.filter(acc =>
                acc.plcu_id.startsWith(i.toString()) &&
                acc.plcu_id.length === 6
            );
        }

        return accountsByClass;
    }

    /**
     * Crea un asiento contable aleatorio para un período específico
     */
    private async crearAsientoAleatorio(
        queryRunner: any,
        companyId: string,
        warehouseId: string,
        year: number,
        period: number,
        accountsByClass: Record<number, Puc[]>
    ): Promise<void> {
        // Generamos un código único para el asiento
        const codigo = await this.generateRandomCode(6);

        // Determinamos fecha dentro del período
        const periodData = await this.periodRepository.findOne({
            where: {
                accp_cmpy: companyId,
                accp_year: year,
                accp_per: period
            }
        });

        if (!periodData || !periodData.accp_start_date || !periodData.accp_end_date) {
            throw new Error(`Período ${year}-${period} no encontrado o sin fechas definidas`);
        }



        const startDate = new Date(periodData.accp_start_date);
        const endDate = new Date(periodData.accp_end_date);
        //const transactionDate = this.getRandomDate(startDate, endDate);
        // Generar una fecha aleatoria dentro del período
        const transactionDate = this.getRandomDate(new Date(periodData.accp_start_date), new Date(periodData.accp_end_date));


        // Determinamos si es asiento de ingreso, gasto, o movimiento patrimonial
        const tipoAsiento = this.getRandomFromArray(['ingreso', 'gasto', 'activo-pasivo']);

        // Determinamos el módulo del asiento
        const modulo = this.getRandomFromArray([
            SEAT_MODULE.NOTA,
            SEAT_MODULE.FACTURA,
            SEAT_MODULE.MANUAL,
            SEAT_MODULE.BANCO,
            SEAT_MODULE.SISTEMA,
            SEAT_MODULE.NOMINA
        ]);

        // Montos aleatorios para el asiento (entre 100.000 y 10.000.000 COP)
        const monto = this.getRandomNumber(100000, 10000000);

        // Creamos la estructura del asiento según el tipo
        let movimientos: any[] = [];
        let descripcion = '';

        if (tipoAsiento === 'ingreso') {
            // Ingreso: Débito a Activo (1) / Crédito a Ingreso (4)
            const cuentaActivo = this.getRandomFromArray(accountsByClass[1]);
            const cuentaIngreso = this.getRandomFromArray(accountsByClass[4]);

            movimientos = [
                { account: cuentaActivo.plcu_id, accountName: cuentaActivo.plcu_description, debit: monto, credit: 0 },
                { account: cuentaIngreso.plcu_id, accountName: cuentaIngreso.plcu_description, debit: 0, credit: monto }
            ];

            descripcion = `Registro de ingreso por ${this.formatCurrency(monto)}`;
        }
        else if (tipoAsiento === 'gasto') {
            // Gasto: Débito a Gasto (5) / Crédito a Activo (1)
            const cuentaGasto = this.getRandomFromArray(accountsByClass[5]);
            const cuentaActivo = this.getRandomFromArray(accountsByClass[1]);

            movimientos = [
                { account: cuentaGasto.plcu_id, accountName: cuentaGasto.plcu_description, debit: monto, credit: 0 },
                { account: cuentaActivo.plcu_id, accountName: cuentaActivo.plcu_description, debit: 0, credit: monto }
            ];

            descripcion = `Registro de gasto por ${this.formatCurrency(monto)}`;
        }
        else {
            // Activo-Pasivo: Débito a Activo (1) / Crédito a Pasivo (2)
            const cuentaActivo = this.getRandomFromArray(accountsByClass[1]);
            const cuentaPasivo = this.getRandomFromArray(accountsByClass[2]);

            movimientos = [
                { account: cuentaActivo.plcu_id, accountName: cuentaActivo.plcu_description, debit: monto, credit: 0 },
                { account: cuentaPasivo.plcu_id, accountName: cuentaPasivo.plcu_description, debit: 0, credit: monto }
            ];

            descripcion = `Movimiento patrimonial por ${this.formatCurrency(monto)}`;
        }



        // Crear asientos
        for (const movimiento of movimientos) {
            // ID del asiento
            const asientoId = await this.getNextSeatId(queryRunner, companyId);
            // Crear asiento
            const nuevoAsiento = this.seatRepository.create({
                acch_id: asientoId,
                acch_cmpy: companyId,
                acch_ware: warehouseId,
                acch_year: year,
                acch_per: period,
                acch_date: transactionDate,
                acch_code: codigo,
                acch_account: movimiento.account,
                acch_account_name: movimiento.accountName,
                acch_debit: movimiento.debit,
                acch_credit: movimiento.credit,
                acch_customers: 'CLIENTE-GENERICO',
                acch_customers_name: 'Cliente Genérico S.A.',
                acch_detbin: descripcion,
                acch_creation_by: 'SEED',
                acch_module: modulo,
                acch_ref: 'SEED-' + asientoId
            });

            await queryRunner.manager.save(nuevoAsiento);

            // Crear entrada en el diario
            const entradaDiario = this.journalRepository.create({
                accj_id: asientoId,
                accj_cmpy: companyId,
                accj_line_number: movimientos.indexOf(movimiento) + 1,
                accj_date: transactionDate,
                accj_ware: warehouseId,
                accj_year: year,
                accj_per: period,
                accj_code: codigo,
                accj_account: movimiento.account,
                accj_account_name: movimiento.accountName,
                accj_debit: movimiento.debit,
                accj_credit: movimiento.credit,
                accj_detbin: descripcion,
                accj_customers: 'CLIENTE-GENERICO',
                accj_customers_name: 'Cliente Genérico S.A.',
                accj_creation_by: 'SEED',
                accj_is_closing_entry: false
            });

            await queryRunner.manager.save(entradaDiario);

            // Actualizar o crear entrada en el libro mayor
            await this.actualizarLibroMayor(
                queryRunner,
                companyId,
                warehouseId,
                year,
                period,
                movimiento.account,
                movimiento.accountName,
                movimiento.debit,
                movimiento.credit,
                transactionDate
            );
        }
    }

    /**
     * Actualiza el libro mayor con un movimiento
     */
    private async actualizarLibroMayor(
        queryRunner: any,
        cmpy: string,
        ware: string,
        year: number,
        per: number,
        account: string,
        accountName: string,
        debit: number,
        credit: number,
        transactionDate: Date
    ): Promise<void> {
        // Buscar si ya existe una entrada en el libro mayor para esta cuenta en este período
        let ledgerEntry = await queryRunner.manager.findOne(Ledger, {
            where: {
                accl_cmpy: cmpy,
                accl_ware: ware,
                accl_year: year,
                accl_per: per,
                accl_account: account,
            },
        });

         const currentDate = new Date();

        if (!ledgerEntry) {
            // Si no existe, crear un nuevo registro con saldos iniciales en cero
            ledgerEntry = queryRunner.manager.create(Ledger, {
                accl_cmpy: cmpy,
                accl_ware: ware,
                accl_year: year,
                accl_per: per,
                accl_account: account,
                accl_account_name: accountName,
                accl_date: transactionDate,
                accl_initial_debit: 0,
                accl_initial_credit: 0,
                accl_day_debit: debit,
                accl_day_credit: credit,
                accl_period_debit: debit,
                accl_period_credit: credit,
                accl_final_debit: debit,
                accl_final_credit: credit,
                accl_last_updated: currentDate,
                accl_creation_by: 'SEED',
            });
        } else {
            // Actualizar registro existente sumando los nuevos movimientos
            ledgerEntry.accl_day_debit += debit;
            ledgerEntry.accl_day_credit += credit;
            ledgerEntry.accl_period_debit += debit;
            ledgerEntry.accl_period_credit += credit;
            ledgerEntry.accl_final_debit += debit;
            ledgerEntry.accl_final_credit += credit;
            ledgerEntry.accl_last_updated = currentDate;
            ledgerEntry.accl_updated_by = 'SEED';
        }

        await queryRunner.manager.save(ledgerEntry);
    }

    /**
     * Genera un código aleatorio para asientos
     */
    private async generateRandomCode(length: number): Promise<string> {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let code = '';

        for (let i = 0; i < length; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        // Verificar que no exista otro asiento con el mismo código
        const existingAsiento = await this.seatRepository.findOne({
            where: { acch_code: code }
        });

        if (existingAsiento) {
            // Si existe, generar otro código
            return this.generateRandomCode(length);
        }

        return code;
    }

    /**
     * Obtiene el próximo ID para asientos
     */
    private async getNextSeatId(queryRunner: any, cmpy: string): Promise<number> {
        const result = await queryRunner.manager
            .createQueryBuilder(Seat, 'seat')
            .select('COALESCE(MAX(seat.acch_id), 0)', 'max')
            .where('seat.acch_cmpy = :companyCode', { companyCode: cmpy })
            .getRawOne();

        return Number(result.max) + 1;
    }

    // Utilidades
    private getRandomNumber(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private getRandomFromArray<T>(array: T[]): T {
        return array[Math.floor(Math.random() * array.length)];
    }

    private getRandomDate(start: Date, end: Date): Date {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }

    private formatCurrency(amount: number): string {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    }
}