import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
import { Ledger } from '../entities/ledger.entity';
import { apiResponse } from 'src/app/common/interfaces/common.interface';
import { toNumber } from 'src/app/common/utils/utils';

@Injectable()
export class LedgerService {
    constructor(
        @InjectRepository(Ledger)
        private ledgerRepository: Repository<Ledger>,
    ) { }

    // Buscar registros en el libro mayor según filtros
    async findByFilters(
        cmpy: string,
        year: number,
        per: number,
        account?: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<Ledger[]> {
        const queryBuilder = this.ledgerRepository
            .createQueryBuilder('ledger')
            .where('ledger.accl_cmpy = :cmpy', { cmpy })
            .andWhere('ledger.accl_year = :year', { year })
            .andWhere('ledger.accl_per = :per', { per });

        if (account) {
            queryBuilder.andWhere('ledger.accl_account = :account', { account });
        }

        // Filtrar por rango de fechas si se proporcionan
        if (startDate && endDate) {
            queryBuilder.andWhere('ledger.accl_date BETWEEN :startDate AND :endDate', { 
                startDate, 
                endDate 
            });
        } else if (startDate) {
            queryBuilder.andWhere('ledger.accl_date >= :startDate', { startDate });
        } else if (endDate) {
            queryBuilder.andWhere('ledger.accl_date <= :endDate', { endDate });
        }

        const ledgerEntries = await queryBuilder
            .orderBy('ledger.accl_date', 'ASC')
            .addOrderBy('ledger.accl_account', 'ASC')
            .getMany();

        if (ledgerEntries.length === 0) {
            throw new NotFoundException(`No se encontraron registros en el libro mayor para el período ${per} del año ${year}`);
        }

        return ledgerEntries;
    }

    // Nuevo método para obtener el mayor por fecha específica
    async findByDate(
        cmpy: string,
        date: Date,
        account?: string
    ): Promise<Ledger[]> {
        const queryBuilder = this.ledgerRepository
            .createQueryBuilder('ledger')
            .where('ledger.accl_cmpy = :cmpy', { cmpy })
            .andWhere('ledger.accl_date = :date', { date });

        if (account) {
            queryBuilder.andWhere('ledger.accl_account = :account', { account });
        }

        const ledgerEntries = await queryBuilder
            .orderBy('ledger.accl_account', 'ASC')
            .getMany();

        if (ledgerEntries.length === 0) {
            throw new NotFoundException(`No se encontraron registros en el libro mayor para la fecha ${date}`);
        }

        return ledgerEntries;
    }

    // Nuevo método para obtener el mayor por rango de fechas
    async findByDateRange(
        cmpy: string,
        startDate: Date,
        endDate: Date,
        account?: string
    ): Promise<Ledger[]> {
        const queryBuilder = this.ledgerRepository
            .createQueryBuilder('ledger')
            .where('ledger.accl_cmpy = :cmpy', { cmpy })
            .andWhere('ledger.accl_date BETWEEN :startDate AND :endDate', { 
                startDate, 
                endDate 
            });

        if (account) {
            queryBuilder.andWhere('ledger.accl_account = :account', { account });
        }

        const ledgerEntries = await queryBuilder
            .orderBy('ledger.accl_date', 'ASC')
            .addOrderBy('ledger.accl_account', 'ASC')
            .getMany();

        if (ledgerEntries.length === 0) {
            throw new NotFoundException(`No se encontraron registros en el libro mayor para el rango de fechas especificado`);
        }

        return ledgerEntries;
    }

    // Obtener historial de una cuenta específica
    async getAccountHistory(
        cmpy: string,
        ware: string,
        account: string,
        startDate: Date,
        endDate: Date
    ): Promise<Ledger[]> {
        let query = this.ledgerRepository
            .createQueryBuilder('ledger')
            .where('ledger.accl_cmpy = :cmpy', { cmpy })
            .andWhere('ledger.accl_ware = :ware', { ware })
            .andWhere('ledger.accl_account = :account', { account })
            .andWhere('ledger.accl_date BETWEEN :startDate AND :endDate', {
                startDate,
                endDate
            });

        const entries = await query
            .orderBy('ledger.accl_date', 'ASC')
            .getMany();

        if (entries.length === 0) {
            throw new NotFoundException(`No se encontraron registros para la cuenta ${account} en el período especificado`);
        }

        return entries;
    }

    // Obtener saldo acumulado de una cuenta hasta una fecha específica
    async getAccountBalance(
        cmpy: string,
        ware: string,
        account: string,
        date: Date
    ): Promise<{ balance: number, debit: number, credit: number }> {
        // Obtener el registro más reciente del libro mayor para esta cuenta hasta la fecha especificada
        const ledgerEntry = await this.ledgerRepository.findOne({
            where: {
                accl_cmpy: cmpy,
                accl_ware: ware,
                accl_account: account,
                accl_date: date
            }
        });

        if (!ledgerEntry) {
            // Si no hay registro para la fecha exacta, buscamos el registro más reciente antes de esa fecha
            const previousEntry = await this.ledgerRepository
                .createQueryBuilder('ledger')
                .where('ledger.accl_cmpy = :cmpy', { cmpy })
                .andWhere('ledger.accl_ware = :ware', { ware })
                .andWhere('ledger.accl_account = :account', { account })
                .andWhere('ledger.accl_date < :date', { date })
                .orderBy('ledger.accl_date', 'DESC')
                .limit(1)
                .getOne();

            if (!previousEntry) {
                return { balance: 0, debit: 0, credit: 0 };
            }

            // Usamos el saldo final del registro anterior
            const finalDebit = toNumber(previousEntry.accl_final_debit);
            const finalCredit = toNumber(previousEntry.accl_final_credit);
            
            // Determinar naturaleza de la cuenta
            const accountFirstDigit = account.charAt(0);
            const isDebitNature = ['1', '5', '6', '7'].includes(accountFirstDigit);
            
            const balance = isDebitNature 
                ? finalDebit - finalCredit 
                : finalCredit - finalDebit;

            return {
                balance: balance,
                debit: finalDebit,
                credit: finalCredit
            };
        }

        // Si hay un registro para la fecha exacta, usamos sus valores
        const finalDebit = toNumber(ledgerEntry.accl_final_debit);
        const finalCredit = toNumber(ledgerEntry.accl_final_credit);
        
        // Determinar naturaleza de la cuenta
        const accountFirstDigit = account.charAt(0);
        const isDebitNature = ['1', '5', '6', '7'].includes(accountFirstDigit);
        
        const balance = isDebitNature 
            ? finalDebit - finalCredit 
            : finalCredit - finalDebit;

        return {
            balance: balance,
            debit: finalDebit,
            credit: finalCredit
        };
    }

    // Obtener saldos de un grupo de cuentas para una fecha específica
    async getAccountsBalances(
        cmpy: string,
        ware: string,
        accounts: string[],
        date: Date
    ): Promise<Map<string, { balance: number, debit: number, credit: number }>> {
        // Obtener los registros del libro mayor para la fecha exacta
        const ledgerEntries = await this.ledgerRepository.find({
            where: {
                accl_cmpy: cmpy,
                accl_ware: ware,
                accl_account: In(accounts),
                accl_date: date
            }
        });

        const balancesMap = new Map<string, { balance: number, debit: number, credit: number }>();
        
        // Inicializar todas las cuentas solicitadas con saldo cero
        accounts.forEach(account => {
            balancesMap.set(account, { balance: 0, debit: 0, credit: 0 });
        });

        // Para las cuentas que no tienen registros en la fecha exacta, buscamos los registros anteriores
        const accountsWithoutEntries = accounts.filter(
            account => !ledgerEntries.some(entry => entry.accl_account === account)
        );

        if (accountsWithoutEntries.length > 0) {
            // Para cada cuenta sin registro, buscar el registro más reciente anterior a la fecha
            for (const account of accountsWithoutEntries) {
                const previousEntry = await this.ledgerRepository
                    .createQueryBuilder('ledger')
                    .where('ledger.accl_cmpy = :cmpy', { cmpy })
                    .andWhere('ledger.accl_ware = :ware', { ware })
                    .andWhere('ledger.accl_account = :account', { account })
                    .andWhere('ledger.accl_date < :date', { date })
                    .orderBy('ledger.accl_date', 'DESC')
                    .limit(1)
                    .getOne();

                if (previousEntry) {
                    const finalDebit = toNumber(previousEntry.accl_final_debit);
                    const finalCredit = toNumber(previousEntry.accl_final_credit);
                    
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
                }
            }
        }

        // Actualizar con los valores de las cuentas que tienen registros para la fecha exacta
        ledgerEntries.forEach(entry => {
            const account = entry.accl_account;
            const finalDebit = toNumber(entry.accl_final_debit);
            const finalCredit = toNumber(entry.accl_final_credit);
            
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

    // Auxiliar para análisis detallado de una cuenta por fecha
    async getAccountAnalysis(
        cmpy: string,
        ware: string,
        account: string,
        startDate: Date,
        endDate: Date
    ): Promise<any[]> {
        const ledgerEntries = await this.ledgerRepository.find({
            where: {
                accl_cmpy: cmpy,
                accl_ware: ware,
                accl_account: account,
                accl_date: Between(startDate, endDate)
            },
            order: {
                accl_date: 'ASC'
            }
        });

        if (ledgerEntries.length === 0) {
            throw new NotFoundException(`No se encontraron registros para la cuenta ${account} en el rango de fechas especificado`);
        }

        // Determinar naturaleza de la cuenta
        const accountFirstDigit = account.charAt(0);
        const isDebitNature = ['1', '5', '6', '7'].includes(accountFirstDigit);

        // Preparar análisis diario
        const analysis = ledgerEntries.map(entry => {
            const initialDebit = toNumber(entry.accl_initial_debit);
            const initialCredit = toNumber(entry.accl_initial_credit);
            const dayDebit = toNumber(entry.accl_day_debit);
            const dayCredit = toNumber(entry.accl_day_credit);
            const periodDebit = toNumber(entry.accl_period_debit);
            const periodCredit = toNumber(entry.accl_period_credit);
            const finalDebit = toNumber(entry.accl_final_debit);
            const finalCredit = toNumber(entry.accl_final_credit);
            
            const initialBalance = isDebitNature 
                ? initialDebit - initialCredit 
                : initialCredit - initialDebit;
                
            const dayMovement = isDebitNature 
                ? dayDebit - dayCredit 
                : dayCredit - dayDebit;
                
            const periodMovement = isDebitNature 
                ? periodDebit - periodCredit 
                : periodCredit - periodDebit;
                
            const finalBalance = isDebitNature 
                ? finalDebit - finalCredit 
                : finalCredit - finalDebit;
            
            return {
                date: entry.accl_date,
                initialBalance,
                dayMovement,
                periodMovement,
                finalBalance,
                initialDebit,
                initialCredit,
                dayDebit,
                dayCredit,
                periodDebit,
                periodCredit,
                finalDebit,
                finalCredit
            };
        });

        return analysis;
    }

    // Obtener mayores auxiliares (detalles de movimientos por cuenta y fecha)
    async getAuxiliaryLedger(
        cmpy: string,
        ware: string,
        account: string,
        date: Date
    ): Promise<any> {
        // Primero obtener el registro del mayor
        const ledgerEntry = await this.ledgerRepository.findOne({
            where: {
                accl_cmpy: cmpy,
                accl_ware: ware,
                accl_account: account,
                accl_date: date
            }
        });

        if (!ledgerEntry) {
            throw new NotFoundException(`No se encontró la cuenta ${account} para la fecha ${date}`);
        }

        // Este método requeriría acceso al repositorio de journal para obtener los movimientos detallados
        
        return {
            ledger: ledgerEntry,
            // Aquí irían los movimientos detallados
        };
    }
}