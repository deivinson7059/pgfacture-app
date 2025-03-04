// src/app/accounting/service/balance.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { Balance, BalanceDetail, Ledger, Period, Puc } from "../entities";
import { DataSource, QueryRunner, Repository, Between, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { toNumber } from "src/app/common/utils/utils";

@Injectable()
export class BalanceService {
    constructor(
        private dataSource: DataSource,
        @InjectRepository(Period)
        private periodRepository: Repository<Period>,
        @InjectRepository(Balance)
        private balanceRepository: Repository<Balance>,
        @InjectRepository(Puc)
        private pucRepository: Repository<Puc>,
        @InjectRepository(Ledger)
        private ledgerRepository: Repository<Ledger>,
        @InjectRepository(BalanceDetail)
        private balanceDetailRepository: Repository<BalanceDetail>,
    ) { }

    // Generar balance para un período y fecha específica
    async generarBalance(
        cmpy: string,
        ware: string,
        year: number,
        per: number,
        type: string,
        date: Date,
        userId: string
    ): Promise<Balance> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Eliminar cualquier balance existente con el tipo, período, compañía y fecha
            await queryRunner.manager.delete(BalanceDetail, {
                acbd_cmpy: cmpy,
                acbd_year: year,
                acbd_per: per,
                acbd_type: type,
                acbd_date: date,
            });

            // Buscar o crear el balance principal
            let balance = await this.balanceRepository.findOne({
                where: {
                    accb_cmpy: cmpy,
                    accb_year: year,
                    accb_per: per,
                    accb_type: type,
                    accb_date: date,
                },
            });

            if (!balance) {
                balance = this.balanceRepository.create({
                    accb_cmpy: cmpy,
                    accb_year: year,
                    accb_per: per,
                    accb_type: type,
                    accb_date: date,
                    accb_date_generated: new Date(),
                    accb_generated_by: userId,
                    accb_is_closing_balance: per === 13,
                    accb_status: 'A',
                });
            } else {
                balance.accb_date_generated = new Date();
                balance.accb_generated_by = userId;
            }

            await queryRunner.manager.save(balance);

            // 2. Obtener todas las cuentas del plan contable para referencia
            const allAccounts = await this.pucRepository.find({
                where: [
                    { plcu_cmpy: cmpy },
                    { plcu_cmpy: 'ALL' }
                ]
            });

            const accountMap = new Map<string, Puc>();
            allAccounts.forEach(account => {
                accountMap.set(account.plcu_id, account);
            });

            // 3. Obtener todas las cuentas de clase (un dígito)
            const classAccounts = allAccounts.filter(account => account.plcu_classification === 'CLASE');

            // 4. Obtener movimientos del libro mayor para la fecha específica
            const ledgerEntries = await this.ledgerRepository.find({
                where: {
                    accl_cmpy: cmpy,
                    accl_ware: ware,
                    accl_year: year,
                    accl_per: per,
                    accl_date: date,
                },
            });

            // También necesitamos obtener los saldos iniciales desde el principio del período hasta la fecha
            const period = await this.periodRepository.findOne({
                where: {
                    accp_cmpy: cmpy,
                    accp_year: year,
                    accp_per: per
                }
            });

            if (!period) {
                throw new NotFoundException(`Período ${per} del año ${year} no encontrado`);
            }

            const periodStartDate = period.accp_start_date;

            // Obtener todos los movimientos del período hasta la fecha (para saldos acumulados)
            const allPeriodEntries = await this.ledgerRepository.find({
                where: {
                    accl_cmpy: cmpy,
                    accl_ware: ware,
                    accl_year: year,
                    accl_per: per,
                    accl_date: Between(periodStartDate as Date, date as Date)
                }
            });

            // Mapa para acumular saldos de todas las cuentas
            const accountBalances = new Map<string, {
                initialDebit: number;
                initialCredit: number;
                periodDebit: number;
                periodCredit: number;
                finalDebit: number;
                finalCredit: number;
            }>();

            // Inicializar todas las cuentas de la jerarquía con saldos en cero
            for (const account of allAccounts) {
                accountBalances.set(account.plcu_id, {
                    initialDebit: 0,
                    initialCredit: 0,
                    periodDebit: 0,
                    periodCredit: 0,
                    finalDebit: 0,
                    finalCredit: 0,
                });
            }

            // 5. Distribuir los saldos del libro mayor a las cuentas directas para la fecha dada
            for (const entry of ledgerEntries) {
                const accountId = entry.accl_account;

                // Si la cuenta no está en el mapa, saltarla
                if (!accountBalances.has(accountId)) continue;

                const balance = accountBalances.get(accountId);

                // Actualizar saldos de la cuenta directa
                balance!.initialDebit += toNumber(entry.accl_initial_debit);
                balance!.initialCredit += toNumber(entry.accl_initial_credit);
                balance!.periodDebit += toNumber(entry.accl_day_debit); // Usamos el movimiento del día
                balance!.periodCredit += toNumber(entry.accl_day_credit); // Usamos el movimiento del día
                balance!.finalDebit += toNumber(entry.accl_final_debit);
                balance!.finalCredit += toNumber(entry.accl_final_credit);
            }

            // Para el acumulado del período, usamos todos los movimientos del período hasta la fecha
            for (const entry of allPeriodEntries) {
                const accountId = entry.accl_account;

                // Si la cuenta no está en el mapa, saltarla
                if (!accountBalances.has(accountId)) continue;

                const balance = accountBalances.get(accountId);

                // Actualizar el acumulado del período
                balance!.periodDebit += toNumber(entry.accl_day_debit);
                balance!.periodCredit += toNumber(entry.accl_day_credit);
            }

            // 6. Propagar los saldos hacia arriba en la jerarquía
            // Ordenar las cuentas por longitud descendente (de más específicas a más generales)
            const sortedAccounts = [...allAccounts].sort((a, b) =>
                b.plcu_id.length - a.plcu_id.length
            );

            for (const account of sortedAccounts) {
                const accountId = account.plcu_id;
                const parentId = account.plcu_parent_account;

                // Si no tiene padre, continuar
                if (!parentId || !accountBalances.has(parentId)) continue;

                const accountBalance = accountBalances.get(accountId);
                const parentBalance = accountBalances.get(parentId);

                // Propagar saldos de hijo a padre
                parentBalance!.initialDebit += accountBalance!.initialDebit;
                parentBalance!.initialCredit += accountBalance!.initialCredit;
                parentBalance!.periodDebit += accountBalance!.periodDebit;
                parentBalance!.periodCredit += accountBalance!.periodCredit;
                parentBalance!.finalDebit += accountBalance!.finalDebit;
                parentBalance!.finalCredit += accountBalance!.finalCredit;
            }

            // 7. Crear/actualizar los detalles del balance para todas las cuentas
            for (const account of allAccounts) {
                const accountId = account.plcu_id;
                const balanceData = accountBalances.get(accountId);

                if (!balanceData) continue;

                // Determinar el nivel según la clasificación
                let level;
                const idLength = accountId.length;

                if (idLength === 1) {
                    level = 1; // CLASE
                } else if (idLength === 2) {
                    level = 2; // GRUPO
                } else if (idLength === 4) {
                    level = 3; // CUENTA
                } else if (idLength === 6) {
                    level = 4; // SUBCUENTA
                } else if (idLength === 8) {
                    level = 5; // AUXILIAR
                } else if (idLength === 10) {
                    level = 6; // AUXILIAR2
                } else {
                    level = 7; // Otro nivel no definido
                }

                // Calcular balance según naturaleza de la cuenta
                const firstDigit = accountId.charAt(0);
                let accountBalance = 0;

                if (['1', '5', '6', '7'].includes(firstDigit)) {
                    accountBalance = balanceData.finalDebit - balanceData.finalCredit;
                } else {
                    accountBalance = balanceData.finalCredit - balanceData.finalDebit;
                }

                // Solo crear detalles para:
                // 1. Cuentas de CLASE (1 dígito)
                // 2. Cuentas que son padre de alguna cuenta con movimientos
                // 3. Cuentas con saldos distintos de cero
                const hasMovements =
                    balanceData.finalDebit !== 0 ||
                    balanceData.finalCredit !== 0 ||
                    balanceData.periodDebit !== 0 ||
                    balanceData.periodCredit !== 0 ||
                    balanceData.initialDebit !== 0 ||
                    balanceData.initialCredit !== 0;

                const isClass = idLength === 1;

                // Verificar si es padre de alguna cuenta en el mapa
                let isParent = false;
                for (const acc of allAccounts) {
                    if (acc.plcu_parent_account === accountId) {
                        const childBalance = accountBalances.get(acc.plcu_id);
                        if (childBalance && (
                            childBalance.finalDebit !== 0 ||
                            childBalance.finalCredit !== 0
                        )) {
                            isParent = true;
                            break;
                        }
                    }
                }

                if (isClass || isParent || hasMovements) {
                    // Crear detalle de balance
                    const balanceDetail = queryRunner.manager.create(BalanceDetail, {
                        acbd_cmpy: cmpy,
                        acbd_year: year,
                        acbd_per: per,
                        acbd_type: type,
                        acbd_date: date,
                        acbd_account: accountId,
                        acbd_account_name: account.plcu_description,
                        acbd_level: level,
                        acbd_parent_account: account.plcu_parent_account,
                        acbd_is_total_row: isClass,
                        acbd_order: parseInt(accountId) || 0,
                        acbd_initial_debit: balanceData.initialDebit,
                        acbd_initial_credit: balanceData.initialCredit,
                        acbd_period_debit: balanceData.periodDebit,
                        acbd_period_credit: balanceData.periodCredit,
                        acbd_final_debit: balanceData.finalDebit,
                        acbd_final_credit: balanceData.finalCredit,
                        acbd_balance: accountBalance,
                    });

                    await queryRunner.manager.save(balanceDetail);
                }
            }

            // 8. Calcular los totales finales para el balance usando los detalles ya guardados
            const classDetailsQueryResult = await queryRunner.manager.find(BalanceDetail, {
                where: {
                    acbd_cmpy: cmpy,
                    acbd_year: year,
                    acbd_per: per,
                    acbd_type: type,
                    acbd_date: date,
                    acbd_level: 1  // Solo las cuentas de clase (nivel 1)
                }
            });

            let totalActivo = 0;
            let totalPasivo = 0;
            let totalPatrimonio = 0;
            let totalIngresos = 0;
            let totalGastos = 0;
            let totalCostos = 0;

            for (const detail of classDetailsQueryResult) {
                const firstDigit = detail.acbd_account.charAt(0);
                const balance = toNumber(detail.acbd_balance);

                if (firstDigit === '1') {
                    totalActivo += balance;
                } else if (firstDigit === '2') {
                    totalPasivo += balance;
                } else if (firstDigit === '3') {
                    totalPatrimonio += balance;
                } else if (firstDigit === '4') {
                    totalIngresos += balance;
                } else if (firstDigit === '5') {
                    totalGastos += balance;
                } else if (firstDigit === '6' || firstDigit === '7') {
                    totalCostos += balance;
                }
            }

            const utilidadPerdida = totalIngresos - totalGastos - totalCostos;

            // Actualizar el balance con los totales calculados
            balance.accb_activo_total = totalActivo;
            balance.accb_pasivo_total = totalPasivo;
            balance.accb_patrimonio_total = totalPatrimonio;
            balance.accb_ingresos_total = totalIngresos;
            balance.accb_gastos_total = totalGastos;
            balance.accb_costos_total = totalCostos;
            balance.accb_utilidad_perdida = utilidadPerdida;

            await queryRunner.manager.save(balance);

            await queryRunner.commitTransaction();
            return balance;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // Obtener balance con estructura jerárquica para una fecha específica
    async obtenerBalance(
        cmpy: string,
        year: number,
        per: number,
        type: string,
        date: Date
    ): Promise<{ balance: Balance, details: any[] }> {
        const balance = await this.balanceRepository.findOne({
            where: {
                accb_cmpy: cmpy,
                accb_year: year,
                accb_per: per,
                accb_type: type,
                accb_date: date,
            },
        });

        if (!balance) {
            throw new NotFoundException(`Balance no encontrado para el período ${per} del año ${year} y fecha ${date}`);
        }

        // Obtener todos los detalles
        const allDetails = await this.balanceDetailRepository.find({
            where: {
                acbd_cmpy: cmpy,
                acbd_year: year,
                acbd_per: per,
                acbd_type: type,
                acbd_date: date,
            },
        });

        // Crear un mapa para facilitar la búsqueda por ID de cuenta
        const detailsMap = new Map<string, any>();

        // Formatear cada detalle y prepararlo para la estructura jerárquica
        allDetails.forEach(detail => {
            detailsMap.set(detail.acbd_account, {
                account: detail.acbd_account,
                account_name: detail.acbd_account_name,
                level: detail.acbd_level,
                parent_account: detail.acbd_parent_account,
                is_total_row: detail.acbd_is_total_row,
                initial_debit: toNumber(detail.acbd_initial_debit),
                initial_credit: toNumber(detail.acbd_initial_credit),
                period_debit: toNumber(detail.acbd_period_debit),
                period_credit: toNumber(detail.acbd_period_credit),
                final_debit: toNumber(detail.acbd_final_debit),
                final_credit: toNumber(detail.acbd_final_credit),
                balance: toNumber(detail.acbd_balance),
                children: []
            });
        });

        // Construir la estructura jerárquica
        const rootAccounts: any[] = [];

        // Asignar cada cuenta a su padre correspondiente
        detailsMap.forEach((detail, accountId) => {
            if (detail.parent_account && detailsMap.has(detail.parent_account)) {
                // Si tiene padre y el padre existe en el mapa, añadirlo como hijo
                const parent = detailsMap.get(detail.parent_account);
                parent.children.push(detail);
            } else {
                // Si no tiene padre o el padre no está en el mapa, es una cuenta raíz
                rootAccounts.push(detail);
            }
        });

        // Función para ordenar los nodos (por nivel y luego por código de cuenta)
        const sortNodes = (nodes: any[]) => {
            // Ordenar primero por nivel y luego por código de cuenta
            nodes.sort((a, b) => {
                if (a.level !== b.level) {
                    return a.level - b.level;
                }
                return a.account.localeCompare(b.account);
            });

            // Ordenar recursivamente los hijos
            nodes.forEach(node => {
                if (node.children && node.children.length > 0) {
                    sortNodes(node.children);
                }
            });

            return nodes;
        };

        // Retornar el balance y los detalles ordenados jerárquicamente
        return {
            balance,
            details: sortNodes(rootAccounts)
        };
    }

    // Generar balance para un rango de fechas
    async generarBalancePorRangoFechas(
        cmpy: string,
        ware: string,
        type: string,
        startDate: Date,
        endDate: Date,
        userId: string
    ): Promise<Balance> {
        // Identificar el período y año correspondientes a las fechas
        const startPeriod = await this.periodRepository.findOne({
            where: [
                { accp_cmpy: cmpy, accp_start_date: MoreThanOrEqual(startDate) },
                { accp_cmpy: cmpy, accp_end_date: MoreThanOrEqual(startDate) }
            ],
            order: { accp_year: 'ASC', accp_per: 'ASC' }
        });


        const endPeriod = await this.periodRepository.findOne({
            where: [
                { accp_cmpy: cmpy, accp_start_date: LessThanOrEqual(endDate) },
                { accp_cmpy: cmpy, accp_end_date: LessThanOrEqual(endDate) }
            ],
            order: { accp_year: 'DESC', accp_per: 'DESC' }
        });

        if (!startPeriod || !endPeriod) {
            throw new NotFoundException(`No se encontraron períodos para el rango de fechas especificado`);
        }

        // Usar el último día del período para el balance
        const balanceDate = endDate;
        
        return this.generarBalance(
            cmpy,
            ware,
            endPeriod.accp_year,
            endPeriod.accp_per,
            type,
            balanceDate,
            userId
        );
    }
}