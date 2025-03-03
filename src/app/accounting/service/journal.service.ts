import { Repository } from "typeorm";
import { Journal } from "../entities";
import { InjectRepository } from "@nestjs/typeorm";
import { Injectable, NotFoundException } from "@nestjs/common";

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
            ware:string,
            year: number,
            per: number,
            account?: string
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
    
            const ledgerEntries = await queryBuilder
                .orderBy('journal.accj_account', 'ASC')
                .getMany();
    
            if (ledgerEntries.length === 0) {
                throw new NotFoundException(`No se encontraron registros en el libro diario para el período ${per} del año ${year}`);
            }
    
            return ledgerEntries;
        }
}