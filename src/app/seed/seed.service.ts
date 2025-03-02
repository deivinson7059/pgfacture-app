import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Puc } from 'src/app/accounting/entities/puc.entity';
import { In, Repository } from 'typeorm';
import { initialData } from './data/seed-data';
import { PucSeed } from './interfaces/seed.interface';

@Injectable()
export class SeedService {
    constructor(
        @InjectRepository(Puc)
        private accountPlanRepository: Repository<Puc>,
    ) { }
    async runSeed() {
        await this.insertAccountPlan();
    }

    private async insertAccountPlan() {
        const seedAccountPlan: PucSeed[] = initialData.accounts;

        for (const { account: code, name: description } of seedAccountPlan) {
            // Buscar la cuenta existente
            const accountExists: Puc | null = await this.accountPlanRepository.findOne({
                where: { plcu_id: code, plcu_cmpy: In(['ALL']) },
            });

            // Solo se insertan las cuentas que no existan
            if (!accountExists) {
                // Crear la entidad con los datos proporcionados
                const accountPlan = this.accountPlanRepository.create({
                    plcu_id: code,
                    plcu_cmpy: 'ALL',
                    plcu_description: description.charAt(0).toUpperCase() + description.slice(1).toLowerCase() ,
                    plcu_creation_by: 'admin',
                });
                await this.accountPlanRepository.save(accountPlan); // Insertar cada cuenta
            }
        }
        return;
    }
}
  