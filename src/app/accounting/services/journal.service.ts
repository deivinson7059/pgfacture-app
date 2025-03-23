import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Injectable, NotFoundException } from "@nestjs/common";

import { Journal } from "@accounting/entities";

@Injectable()
export class JournalService {
    constructor(
        @InjectRepository(Journal)
        private journalRepository: Repository<Journal>,
    ) {

    }

    // Buscar registros en el libro diario según filtros
    async findByFilters(
        cmpy: string,
        ware: string,
        year: number,
        per: number,
        account?: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<Journal[]> {
        const queryBuilder = this.journalRepository
            .createQueryBuilder('journal')
            .where('journal.accj_cmpy = :cmpy', { cmpy })
            .andWhere('journal.accj_ware = :ware', { ware })
            .andWhere('journal.accj_year = :year', { year })
            .andWhere('journal.accj_per = :per', { per });

        if (account) {
            queryBuilder.andWhere('journal.accj_account = :account', { account });
        }

        // Filtrar por rango de fechas si se proporcionan
        if (startDate && endDate) {
            queryBuilder.andWhere('journal.accj_date BETWEEN :startDate AND :endDate', {
                startDate,
                endDate
            });
        } else if (startDate) {
            queryBuilder.andWhere('journal.accj_date >= :startDate', { startDate });
        } else if (endDate) {
            queryBuilder.andWhere('journal.accj_date <= :endDate', { endDate });
        }

        const ledgerEntries = await queryBuilder
            .orderBy('journal.accj_date', 'ASC')
            .addOrderBy('journal.accj_account', 'ASC')
            .getMany();

        if (ledgerEntries.length === 0) {
            throw new NotFoundException(`No se encontraron registros en el libro diario para el período ${per} del año ${year}`);
        }

        return ledgerEntries;
    }

    // Nuevo método para obtener el diario por fecha específica
    async findByDate(
        cmpy: string,
        date: Date,
        account?: string
    ): Promise<Journal[]> {
        const queryBuilder = this.journalRepository
            .createQueryBuilder('journal')
            .where('journal.accj_cmpy = :cmpy', { cmpy })
            .andWhere('journal.accj_date = :date', { date });

        if (account) {
            queryBuilder.andWhere('journal.accj_account = :account', { account });
        }

        const journalEntries = await queryBuilder
            .orderBy('journal.accj_account', 'ASC')
            .addOrderBy('journal.accj_code', 'ASC')
            .getMany();

        if (journalEntries.length === 0) {
            throw new NotFoundException(`No se encontraron registros en el libro diario para la fecha ${date}`);
        }

        return journalEntries;
    }

    // Nuevo método para obtener el diario por rango de fechas
    async findByDateRange(
        cmpy: string,
        startDate: Date,
        endDate: Date,
        account?: string
    ): Promise<Journal[]> {
        const queryBuilder = this.journalRepository
            .createQueryBuilder('journal')
            .where('journal.accj_cmpy = :cmpy', { cmpy })
            .andWhere('journal.accj_date BETWEEN :startDate AND :endDate', {
                startDate,
                endDate
            });

        if (account) {
            queryBuilder.andWhere('journal.accj_account = :account', { account });
        }

        const journalEntries = await queryBuilder
            .orderBy('journal.accj_date', 'ASC')
            .addOrderBy('journal.accj_account', 'ASC')
            .addOrderBy('journal.accj_code', 'ASC')
            .getMany();

        if (journalEntries.length === 0) {
            throw new NotFoundException(`No se encontraron registros en el libro diario para el rango de fechas especificado`);
        }

        return journalEntries;
    }
}