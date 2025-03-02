import { Injectable, NotFoundException } from "@nestjs/common";
import { Balance, BalanceDetail, Ledger, Period, Puc } from "../entities";
import { DataSource, QueryRunner, Repository } from "typeorm";
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
    async generarBalance(
        cmpy: string,
        ware: string,
        year: number,
        per: number,
        type: string,
        userId: string
    ): Promise<Balance> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Eliminar cualquier balance existente con el tipo, período y compañía
            await queryRunner.manager.delete(BalanceDetail, {
                acbd_cmpy: cmpy,
                acbd_year: year,
                acbd_per: per,
                acbd_type: type,
            });

            // Buscar o crear el balance principal
            let balance = await this.balanceRepository.findOne({
                where: {
                    accb_cmpy: cmpy,
                    accb_year: year,
                    accb_per: per,
                    accb_type: type,
                },
            });

            if (!balance) {
                balance = this.balanceRepository.create({
                    accb_cmpy: cmpy,
                    accb_year: year,
                    accb_per: per,
                    accb_type: type,
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

            // 4. Obtener movimientos del libro mayor
            const ledgerEntries = await this.ledgerRepository.find({
                where: {
                    accl_cmpy: cmpy,
                    accl_ware: ware,
                    accl_year: year,
                    accl_per: per,
                },
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

            // 5. Distribuir los saldos del libro mayor a las cuentas directas
            for (const entry of ledgerEntries) {
                const accountId = entry.accl_account;

                // Si la cuenta no está en el mapa, saltarla
                if (!accountBalances.has(accountId)) continue;

                const balance = accountBalances.get(accountId);

                // Actualizar saldos de la cuenta directa
                balance!.initialDebit += toNumber(entry.accl_initial_debit);
                balance!.initialCredit += toNumber(entry.accl_initial_credit);
                balance!.periodDebit += toNumber(entry.accl_period_debit);
                balance!.periodCredit += toNumber(entry.accl_period_credit);
                balance!.finalDebit += toNumber(entry.accl_final_debit);
                balance!.finalCredit += toNumber(entry.accl_final_credit);
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


            // 8. Calcular los totales finales para el balance
            let totalActivo_ = 0;
            let totalPasivo_ = 0;
            let totalPatrimonio_ = 0;
            let totalIngresos_ = 0;
            let totalGastos_ = 0;
            let totalCostos_ = 0;

            for (const account of classAccounts) {
                const balanceData = accountBalances.get(account.plcu_id);
                if (!balanceData) continue;

                const firstDigit = account.plcu_id.charAt(0);
                let accountBalance = 0;

                if (['1', '5', '6', '7'].includes(firstDigit)) {
                    accountBalance = balanceData.finalDebit - balanceData.finalCredit;
                } else {
                    accountBalance = balanceData.finalCredit - balanceData.finalDebit;
                }

                if (firstDigit === '1') {
                    totalActivo_ += accountBalance;
                } else if (firstDigit === '2') {
                    totalPasivo_ += accountBalance;
                } else if (firstDigit === '3') {
                    totalPatrimonio_ += accountBalance;
                } else if (firstDigit === '4') {
                    totalIngresos_ += accountBalance;
                } else if (firstDigit === '5') {
                    totalGastos_ += accountBalance;
                } else if (firstDigit === '6' || firstDigit === '7') {
                    totalCostos_ += accountBalance;
                }
            }
            

            await queryRunner.commitTransaction();
            return balance;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }


    // Generar balance
    async generarBalanceOnly(
        cmpy: string,
        ware: string,
        year: number,
        per: number,
        type: string,
        userId: string
    ): Promise<Balance> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Verificar que el período exista
            const period = await this.periodRepository.findOne({
                where: {
                    accp_cmpy: cmpy,
                    accp_year: year,
                    accp_per: per,
                },
            });

            if (!period) {
                throw new NotFoundException(`Período ${per} del año ${year} no encontrado`);
            }

            // Buscar si ya existe un balance para este período y tipo
            let balance = await this.balanceRepository.findOne({
                where: {
                    accb_cmpy: cmpy,
                    accb_year: year,
                    accb_per: per,
                    accb_type: type,
                },
            });

            // Crear o actualizar el balance
            if (!balance) {
                balance = this.balanceRepository.create({
                    accb_cmpy: cmpy,
                    accb_year: year,
                    accb_per: per,
                    accb_type: type,
                    accb_date_generated: new Date(),
                    accb_generated_by: userId,
                    accb_is_closing_balance: per === 13,
                    accb_status: 'A', // Active
                });
            } else {
                // Si ya existe, actualizar la fecha y usuario
                balance.accb_date_generated = new Date();
                balance.accb_generated_by = userId;

                // Eliminar los detalles existentes para recrearlos
                await queryRunner.manager.delete(BalanceDetail, {
                    acbd_cmpy: cmpy,
                    acbd_year: year,
                    acbd_per: per,
                    acbd_type: type,
                });
            }

            await queryRunner.manager.save(balance);

            // Obtener todas las cuentas del plan contable
            const accounts = await this.pucRepository.find({
                where: [
                    { plcu_cmpy: cmpy },
                    { plcu_cmpy: 'ALL' }, // Cuentas globales
                ],
                order: {
                    plcu_id: 'ASC',
                },
            });

            // Obtener saldos del libro mayor para este período
            const ledgerEntries = await this.ledgerRepository.find({
                where: {
                    accl_cmpy: cmpy,
                    accl_ware: ware,
                    accl_year: year,
                    accl_per: per,
                },
            });

            // Mapear saldos por cuenta
            const balanceMap = new Map<string, {
                debit: number;
                credit: number;
                initialDebit: number;
                initialCredit: number;
                periodDebit: number;
                periodCredit: number;
            }>();

            ledgerEntries.forEach(entry => {
                balanceMap.set(entry.accl_account, {
                    debit: toNumber(entry.accl_final_debit),
                    credit: toNumber(entry.accl_final_credit),
                    initialDebit: toNumber(entry.accl_initial_debit),
                    initialCredit: toNumber(entry.accl_initial_credit),
                    periodDebit: toNumber(entry.accl_period_debit),
                    periodCredit: toNumber(entry.accl_period_credit),
                });
            });

            // Totales por categoría
            let totalActivo = 0;
            let totalPasivo = 0;
            let totalPatrimonio = 0;
            let totalIngresos = 0;
            let totalGastos = 0;
            let totalCostos = 0;

            // Crear detalles del balance para cada cuenta relevante
            for (const account of accounts) {
                const balanceData = balanceMap.get(account.plcu_id);

                // Saltar cuentas sin movimientos excepto cuentas de grupo (1 dígito)
                if (!balanceData && account.plcu_id.length > 1) {
                    continue;
                }

                // Determinar nivel de la cuenta por su longitud
                const level = account.plcu_id.length === 1 ? 1 :
                    account.plcu_id.length === 2 ? 2 :
                        account.plcu_id.length <= 4 ? 3 :
                            account.plcu_id.length <= 6 ? 4 : 5;

                // Determinar cuenta padre
                const parentAccount = account.plcu_id.length > 1 ?
                    account.plcu_id.substring(0, account.plcu_id.length > 2 ?
                        (account.plcu_id.length === 4 ? 2 :
                            account.plcu_id.length === 6 ? 4 :
                                account.plcu_id.length === 8 ? 6 :
                                    account.plcu_id.length - 2) : 1) : null;

                // Calcular saldo según la naturaleza de la cuenta
                const firstDigit = account.plcu_id.charAt(0);
                let accountBalance = 0;

                if (balanceData) {
                    if (['1', '5', '6', '7'].includes(firstDigit)) {
                        // Cuentas de naturaleza débito (activos, gastos, costos)
                        accountBalance = balanceData.debit - balanceData.credit;
                    } else {
                        // Cuentas de naturaleza crédito (pasivos, patrimonio, ingresos)
                        accountBalance = balanceData.credit - balanceData.debit;
                    }
                }

                // Crear detalle de balance
                const balanceDetail = queryRunner.manager.create(BalanceDetail, {
                    acbd_cmpy: cmpy,
                    acbd_year: year,
                    acbd_per: per,
                    acbd_type: type,
                    acbd_account: account.plcu_id,
                    acbd_account_name: account.plcu_description,
                    acbd_level: level,
                    acbd_parent_account: parentAccount,
                    acbd_is_total_row: account.plcu_id.length === 1,
                    acbd_order: parseInt(account.plcu_id) || 0,
                    acbd_initial_debit: balanceData?.initialDebit || 0,
                    acbd_initial_credit: balanceData?.initialCredit || 0,
                    acbd_period_debit: balanceData?.periodDebit || 0,
                    acbd_period_credit: balanceData?.periodCredit || 0,
                    acbd_final_debit: balanceData?.debit || 0,
                    acbd_final_credit: balanceData?.credit || 0,
                    acbd_balance: accountBalance,
                });

                await queryRunner.manager.save(balanceDetail);

                // Actualizar totales según la categoría de la cuenta
                if (firstDigit === '1' && account.plcu_id.length >= 2) {
                    totalActivo += accountBalance > 0 ? accountBalance : 0;
                } else if (firstDigit === '2' && account.plcu_id.length >= 2) {
                    totalPasivo += accountBalance > 0 ? accountBalance : 0;
                } else if (firstDigit === '3' && account.plcu_id.length >= 2) {
                    totalPatrimonio += accountBalance > 0 ? accountBalance : 0;
                } else if (firstDigit === '4' && account.plcu_id.length >= 2) {
                    totalIngresos += accountBalance > 0 ? accountBalance : 0;
                } else if (firstDigit === '5' && account.plcu_id.length >= 2) {
                    totalGastos += accountBalance > 0 ? accountBalance : 0;
                } else if ((firstDigit === '6' || firstDigit === '7') && account.plcu_id.length >= 2) {
                    totalCostos += accountBalance > 0 ? accountBalance : 0;
                }
            }

            // Calcular utilidad o pérdida
            const utilidadPerdida = totalIngresos - totalGastos - totalCostos;

            // Actualizar totales en el balance
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
    

    // Obtener balance con estructura jerárquica
    async obtenerBalance(
        cmpy: string,
        year: number,
        per: number,
        type: string
    ): Promise<{ balance: Balance, details: any[] }> {
        const balance = await this.balanceRepository.findOne({
            where: {
                accb_cmpy: cmpy,
                accb_year: year,
                accb_per: per,
                accb_type: type,
            },
        });

        if (!balance) {
            throw new NotFoundException(`Balance no encontrado para el período ${per} del año ${year}`);
        }

        // Obtener todos los detalles
        const allDetails = await this.balanceDetailRepository.find({
            where: {
                acbd_cmpy: cmpy,
                acbd_year: year,
                acbd_per: per,
                acbd_type: type,
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
    // Obtener balance
    async obtenerBalanceOnly(
        cmpy: string,
        year: number,
        per: number,
        type: string
    ): Promise<{ balance: Balance, details: BalanceDetail[] }> {
        const balance = await this.balanceRepository.findOne({
            where: {
                accb_cmpy: cmpy,
                accb_year: year,
                accb_per: per,
                accb_type: type,
            },
        });

        if (!balance) {
            throw new NotFoundException(`Balance no encontrado para el período ${per} del año ${year}`);
        }

        const details = await this.balanceDetailRepository.find({
            where: {
                acbd_cmpy: cmpy,
                acbd_year: year,
                acbd_per: per,
                acbd_type: type,
            },
            order: {
                acbd_order: 'ASC',
            },
        });

        return { balance, details };
    }
}