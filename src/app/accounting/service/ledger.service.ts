// src/app/accounting/service/ledger.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
import { Ledger } from '../entities/ledger.entity';
import { apiResponse } from 'src/app/common/interfaces/common.interface';

@Injectable()
export class LedgerService {
    constructor(
        @InjectRepository(Ledger)
        private ledgerRepository: Repository<Ledger>,
    ) { }

    // Buscar registros en el libro mayor según filtros
    async findByFilters(
        cmpy: string,
        ware: string,
        year: number,
        per: number,
        account?: string
    ): Promise<Ledger[]> {
        const queryBuilder = this.ledgerRepository
            .createQueryBuilder('ledger')
            .where('ledger.accl_cmpy = :cmpy', { cmpy })
            .andWhere('ledger.accl_ware = :ware', { ware })
            .andWhere('ledger.accl_year = :year', { year })
            .andWhere('ledger.accl_per = :per', { per });

        if (account) {
            queryBuilder.andWhere('ledger.accl_account = :account', { account });
        }

        const ledgerEntries = await queryBuilder
            .orderBy('ledger.accl_account', 'ASC')
            .getMany();

        if (ledgerEntries.length === 0) {
            throw new NotFoundException(`No se encontraron registros en el libro mayor para el período ${per} del año ${year}`);
        }

        return ledgerEntries;
    }

    // Obtener historial de una cuenta específica
    async getAccountHistory(
        cmpy: string,
        ware: string,
        account: string,
        startYear: number,
        startPer: number,
        endYear: number,
        endPer: number
    ): Promise<Ledger[]> {
        let query = this.ledgerRepository
            .createQueryBuilder('ledger')
            .where('ledger.accl_cmpy = :cmpy', { cmpy })
            .andWhere('ledger.accl_ware = :ware', { ware })
            .andWhere('ledger.accl_account = :account', { account });

        // Manejar condiciones para el rango de fechas
        if (startYear === endYear) {
            // Mismo año, filtrar por períodos
            query = query
                .andWhere('ledger.accl_year = :year', { year: startYear })
                .andWhere('ledger.accl_per >= :startPer', { startPer })
                .andWhere('ledger.accl_per <= :endPer', { endPer });
        } else {
            // Años diferentes, condiciones más complejas
            query = query.andWhere(`(
                (ledger.accl_year = :startYear AND ledger.accl_per >= :startPer) OR
                (ledger.accl_year > :startYear AND ledger.accl_year < :endYear) OR
                (ledger.accl_year = :endYear AND ledger.accl_per <= :endPer)
            )`, { startYear, startPer, endYear, endPer });
        }

        const entries = await query
            .orderBy('ledger.accl_year', 'ASC')
            .addOrderBy('ledger.accl_per', 'ASC')
            .getMany();

        if (entries.length === 0) {
            throw new NotFoundException(`No se encontraron registros para la cuenta ${account} en el período especificado`);
        }

        return entries;
    }

    // Obtener saldo acumulado de una cuenta hasta un período específico
    async getAccountBalance(
        cmpy: string,
        ware: string,
        account: string,
        year: number,
        per: number
    ): Promise<{ balance: number, debit: number, credit: number }> {
        // Obtener el registro más reciente del libro mayor para esta cuenta
        const ledgerEntry = await this.ledgerRepository.findOne({
            where: {
                accl_cmpy: cmpy,
                accl_ware: ware,
                accl_account: account,
                accl_year: year,
                accl_per: per
            }
        });

        if (!ledgerEntry) {
            return { balance: 0, debit: 0, credit: 0 };
        }

        // Determinar naturaleza de la cuenta
        const accountFirstDigit = account.charAt(0);
        const isDebitNature = ['1', '5', '6', '7'].includes(accountFirstDigit);

        // Calcular balance según la naturaleza de la cuenta
        const finalDebit = this.toNumber(ledgerEntry.accl_final_debit);
        const finalCredit = this.toNumber(ledgerEntry.accl_final_credit);
        
        const balance = isDebitNature 
            ? finalDebit - finalCredit 
            : finalCredit - finalDebit;

        return {
            balance: balance,
            debit: finalDebit,
            credit: finalCredit
        };
    }

    // Obtener saldos de un grupo de cuentas
    async getAccountsBalances(
        cmpy: string,
        ware: string,
        accounts: string[],
        year: number,
        per: number
    ): Promise<Map<string, { balance: number, debit: number, credit: number }>> {
        const ledgerEntries = await this.ledgerRepository.find({
            where: {
                accl_cmpy: cmpy,
                accl_ware: ware,
                accl_account: In(accounts),
                accl_year: year,
                accl_per: per
            }
        });

        const balancesMap = new Map<string, { balance: number, debit: number, credit: number }>();
        
        // Inicializar todas las cuentas solicitadas con saldo cero
        accounts.forEach(account => {
            balancesMap.set(account, { balance: 0, debit: 0, credit: 0 });
        });

        // Actualizar con los valores reales
        ledgerEntries.forEach(entry => {
            const account = entry.accl_account;
            const finalDebit = this.toNumber(entry.accl_final_debit);
            const finalCredit = this.toNumber(entry.accl_final_credit);
            
            const accountFirstDigit = account.charAt(0);
            const isDebitNature = ['1', '5', '6', '7'].includes(accountFirstDigit);
            
            const balance = isDebitNature 
                ? finalDebit - finalCredit 
                : finalCredit - finalDebit;
            
            balancesMap.set(account, {
                balance: balance,
                debit: finalDebit,
                credit: finalCredit
            });
        });

        return balancesMap;
    }

    // Auxiliar para análisis detallado de una cuenta por período
    async getAccountAnalysis(
        cmpy: string,
        ware: string,
        account: string,
        year: number
    ): Promise<any[]> {
        const ledgerEntries = await this.ledgerRepository.find({
            where: {
                accl_cmpy: cmpy,
                accl_ware: ware,
                accl_account: account,
                accl_year: year
            },
            order: {
                accl_per: 'ASC'
            }
        });

        if (ledgerEntries.length === 0) {
            throw new NotFoundException(`No se encontraron registros para la cuenta ${account} en el año ${year}`);
        }

        // Determinar naturaleza de la cuenta
        const accountFirstDigit = account.charAt(0);
        const isDebitNature = ['1', '5', '6', '7'].includes(accountFirstDigit);

        // Preparar análisis mensual
        const analysis = ledgerEntries.map(entry => {
            const initialDebit = this.toNumber(entry.accl_initial_debit);
            const initialCredit = this.toNumber(entry.accl_initial_credit);
            const periodDebit = this.toNumber(entry.accl_period_debit);
            const periodCredit = this.toNumber(entry.accl_period_credit);
            const finalDebit = this.toNumber(entry.accl_final_debit);
            const finalCredit = this.toNumber(entry.accl_final_credit);
            
            const initialBalance = isDebitNature 
                ? initialDebit - initialCredit 
                : initialCredit - initialDebit;
                
            const periodMovement = isDebitNature 
                ? periodDebit - periodCredit 
                : periodCredit - periodDebit;
                
            const finalBalance = isDebitNature 
                ? finalDebit - finalCredit 
                : finalCredit - finalDebit;
            
            return {
                period: entry.accl_per,
                initialBalance,
                periodMovement,
                finalBalance,
                initialDebit,
                initialCredit,
                periodDebit,
                periodCredit,
                finalDebit,
                finalCredit
            };
        });

        return analysis;
    }

    // Obtener mayores auxiliares (detalles de movimientos por cuenta)
    async getAuxiliaryLedger(
        cmpy: string,
        ware: string,
        account: string,
        year: number,
        per: number
    ): Promise<any> {
        // Este método requeriría consultar la tabla de asientos (journal) para obtener los movimientos detallados
        // Esta implementación dependería de tu estructura específica
        
        // Primero obtener el registro del mayor
        const ledgerEntry = await this.ledgerRepository.findOne({
            where: {
                accl_cmpy: cmpy,
                accl_ware: ware,
                accl_account: account,
                accl_year: year,
                accl_per: per
            }
        });

        if (!ledgerEntry) {
            throw new NotFoundException(`No se encontró la cuenta ${account} en el período ${per} del año ${year}`);
        }

        // Luego obtendríamos los movimientos detallados desde el journal
        // Esta parte necesitaría acceso al repositorio de journal
        
        return {
            ledger: ledgerEntry,
            // Aquí irían los movimientos detallados
        };
    }

    // Utilidad para convertir a número cualquier valor
    private toNumber(value: any): number {
        if (value === null || value === undefined) return 0;
        if (typeof value === 'number') return value;
        if (typeof value === 'string') return Number(value);
        return 0;
    }
}