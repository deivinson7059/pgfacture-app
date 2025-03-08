import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { PUC } from '../interfaces/puc.interface';
import { CreatePucDto, UpdatePucDto } from '../dto';
import { Puc } from '../entities';

@Injectable()
export class PucService {
    constructor(
        @InjectRepository(Puc)
        private accountPlanRepository: Repository<Puc>,
    ) { }

    // Crear una nueva cuenta
    async create(accountPlanDto: CreatePucDto): Promise<Puc> {
        const { code, cmpy, description, creation_by } = accountPlanDto;

        // Validar que solo los administradores puedan crear cuentas de 1, 2 o 4 dígitos
        const isAdmin = creation_by === 'admin'; // Simulación de validación de rol
        if (!isAdmin && [1, 2, 4].includes(code.length)) {
            throw new ForbiddenException('Solo los administradores pueden crear cuentas de 1, 2 o 4 dígitos.');
        }

        // Buscar la cuenta existente
        const accountPlanE = await this.accountPlanRepository.findOne({
            where: { plcu_id: code, plcu_cmpy: In(['ALL', cmpy]) },
        });

        if (accountPlanE) {
            throw new BadRequestException(`La cuenta ${code} ya existe.`);
        }

        // Crear la entidad con los datos proporcionados
        const accountPlan = this.accountPlanRepository.create({
            plcu_id: code,
            plcu_cmpy: cmpy,
            plcu_description: description,
            plcu_creation_by: creation_by,
        });

        /* // Guardar la nueva cuenta

        const save_accountPlan = await this.accountPlanRepository.save(accountPlan);

        return {
            code: save_accountPlan.PLCU_ID,
            cmpy: save_accountPlan.PLCU_CMPY.trim(),
            description: save_accountPlan.PLCU_DESCRIPTION,
            nature: save_accountPlan.PLCU_NATURE,
            classification: save_accountPlan.PLCU_CLASSIFICATION!,
            parent_account: save_accountPlan.PLCU_PARENT_ACCOUNT,
            active: save_accountPlan.PLCU_ACTIVE,
            creation_by: save_accountPlan.PLCU_CREATION_BY,
            creation_date: save_accountPlan.PLCU_CREATION_DATE,
            updated_by: save_accountPlan.PLCU_UPDATED_BY,
            updated_date: save_accountPlan.PLCU_UPDATED_DATE,
        } */

        return this.accountPlanRepository.save(accountPlan);
    }

    // Actualizar una cuenta
    async update(accountPucDto: UpdatePucDto): Promise<Puc> {
        const { code, cmpy, description, active, updated_by } = accountPucDto;

        // Buscar la cuenta existente
        const accountPlan = await this.accountPlanRepository.findOne({
            where: { plcu_id: code, plcu_cmpy: In(['ALL', cmpy]) },
        });

        if (!accountPlan) {
            throw new BadRequestException('La cuenta no existe.');
        }

        //accountPlan.PLCU_CMPY = accountPlan.PLCU_CMPY.trim();
        // Actualizar los campos permitidos
        if (description !== undefined) {
            accountPlan.plcu_description = description;
        }
        if (active !== undefined) {
            accountPlan.plcu_active = active;
        }
        if (updated_by !== undefined) {
            accountPlan.plcu_updated_by = updated_by;
        }


        /*  
        // Guardar los cambios
         //const save_accountPlan = await this.accountPlanRepository.save(accountPlan);
        return {
             code: save_accountPlan.PLCU_ID,
             cmpy: save_accountPlan.PLCU_CMPY.trim(),
             description: save_accountPlan.PLCU_DESCRIPTION,
             nature: save_accountPlan.PLCU_NATURE,
             classification: save_accountPlan.PLCU_CLASSIFICATION!,
             parent_account: save_accountPlan.PLCU_PARENT_ACCOUNT,
             active: save_accountPlan.PLCU_ACTIVE,
             creation_by: save_accountPlan.PLCU_CREATION_BY,
             creation_date: save_accountPlan.PLCU_CREATION_DATE,
             updated_by: save_accountPlan.PLCU_UPDATED_BY,
             updated_date: save_accountPlan.PLCU_UPDATED_DATE,
         } */

        // Guardar los cambios
        return this.accountPlanRepository.save(accountPlan);
    }

    // Listar el catálogo de cuentas de manera jerárquica
    async listCatalog(cmpy: string): Promise<PUC[]> {
        let accounts: Puc[] = [];

        // Si cmpy es 'ALL', solo buscamos con 'ALL'
        if (cmpy === 'ALL') {
            accounts = await this.accountPlanRepository.find({
                where: { plcu_cmpy: 'ALL' }, // Solo 'ALL'
                order: { plcu_id: 'ASC' },
            });
        } else {
            // Si cmpy no es 'ALL', buscamos con In(['ALL', cmpy])
            accounts = await this.accountPlanRepository.find({
                where: {
                    plcu_cmpy: In(['ALL', cmpy]), // 'ALL' o el valor de cmpy
                },
                order: { plcu_id: 'ASC' },
            });
        }
        //accounts = await this.accountPlanRepository.find({ order: { PLCU_ID: 'ASC' } });
        return this.buildHierarchy(accounts);
    }

    // Método auxiliar para construir la jerarquía y convertir los campos
    private buildHierarchy(accounts: Puc[]): PUC[] {
        const map = new Map<string, PUC>();
        const roots: PUC[] = [];

        // Crear un mapa de cuentas y convertir el campo `code` a `cmpy`
        accounts.forEach((account) => {
            const transformedAccount: PUC = {
                code: account.plcu_id,
                cmpy: account.plcu_cmpy.trim(), // trim() para eliminar espacios en blanco,
                description: account.plcu_description,
                nature: account.plcu_nature,
                classification: account.plcu_classification!,
                parent_account: account.plcu_parent_account,
                active: account.plcu_active,
                //creation_by: account.plcu_creation_by,
                //  creation_date: account.plcu_creation_date, // convertir la fecha a string
                // updated_by: account.plcu_updated_by,
                // updated_date: account.plcu_updated_date, // Convertir la fecha a string
                children: [], // Inicializar el arreglo de hijos
            };
            map.set(account.plcu_id, transformedAccount);
        });

        // Construir la jerarquía
        accounts.forEach((account) => {
            if (account.plcu_parent_account) {
                const parent = map.get(account.plcu_parent_account);
                if (parent) {
                    const child = map.get(account.plcu_id);
                    if (child) {
                        parent.children?.push(child);
                    }
                }
            } else {
                const rootAccount = map.get(account.plcu_id);
                if (rootAccount) {
                    roots.push(rootAccount);
                }
            }
        });

        return roots;
    }

    async getAccountHierarchy(cmpy: string, accountId: string): Promise<PUC | null> {
        // Obtener todas las cuentas según el criterio de compañía
        let accounts: Puc[] = [];
        if (cmpy === 'ALL') {
            accounts = await this.accountPlanRepository.find({
                where: { plcu_cmpy: 'ALL' },
                order: { plcu_id: 'ASC' },
            });
        } else {
            accounts = await this.accountPlanRepository.find({
                where: { plcu_cmpy: In(['ALL', cmpy]) },
                order: { plcu_id: 'ASC' },
            });
        }

        // Construir el árbol completo
        const accountsMap = new Map<string, PUC>();

        // Transformar y mapear todas las cuentas
        accounts.forEach((account) => {
            const transformedAccount: PUC = {
                code: account.plcu_id,
                cmpy: account.plcu_cmpy.trim(),
                description: account.plcu_description,
                nature: account.plcu_nature,
                classification: account.plcu_classification!,
                parent_account: account.plcu_parent_account,
                active: account.plcu_active,
                //creation_by: account.plcu_creation_by,
                //creation_date: account.plcu_creation_date,
                //updated_by: account.plcu_updated_by,
                //updated_date: account.plcu_updated_date,
                children: [],
            };
            accountsMap.set(account.plcu_id, transformedAccount);
        });

        // Construir las relaciones padre-hijo
        accounts.forEach((account) => {
            if (account.plcu_parent_account) {
                const parent = accountsMap.get(account.plcu_parent_account);
                const child = accountsMap.get(account.plcu_id);
                if (parent && child) {
                    parent.children?.push(child);
                }
            }
        });

        // Buscar la cuenta específica y su jerarquía
        const accountHierarchy = accountsMap.get(accountId);
        if (!accountHierarchy) {
            throw new NotFoundException(`La cuenta ${accountId} no existe.`);
        }

        return accountHierarchy;
    }

/**
 * Busca cuentas auxiliares según criterios específicos con un límite de resultados
 * @param cmpy Código de la compañía
 * @param account Número de cuenta o descripcion para búsqueda exacta o parcial 
 * @param limit Límite de resultados (por defecto 10)
 * @returns Lista limitada de cuentas auxiliares que coinciden con los criterios
 */
    async searchAuxiliaryAccounts(cmpy: string, account?: string, limit: number = 100): Promise<Puc[]> {
        // Crear consulta base para buscar cuentas auxiliares (8 y 10 dígitos)
        const queryBuilder = this.accountPlanRepository
            .createQueryBuilder('puc')
            .where('(puc.plcu_classification = :aux1 OR puc.plcu_classification = :aux2)', {
                aux1: 'AUXILIAR',
                aux2: 'AUXILIAR2'
            })
            .andWhere('puc.plcu_active = :active', { active: 'Y' });
    
        // Aplicar filtro por compañía
        if (cmpy !== 'ALL') {
            queryBuilder.andWhere('(puc.plcu_cmpy = :cmpy OR puc.plcu_cmpy = :all)', {
                cmpy: cmpy,
                all: 'ALL'
            });
        }
    
        // Aplicar filtro por número de cuenta o nombre de cuenta si existe
        if (account && account.trim() !== '') {
            const searchTerm = account.trim();
            const isNumeric = /^\d+$/.test(searchTerm);
            
            if (isNumeric) {
                // Búsqueda por número de cuenta
                queryBuilder.andWhere('puc.plcu_id LIKE :account', {
                    account: `%${searchTerm}%`
                });
            } else {
                // Búsqueda por palabras en el nombre/descripción de cuenta
                // Dividimos el término de búsqueda en palabras individuales
                const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0);
                
                if (searchWords.length > 0) {
                    // Crear condiciones para cada palabra
                    searchWords.forEach((word, index) => {
                        queryBuilder.andWhere(`LOWER(puc.plcu_description) LIKE LOWER(:word${index})`, {
                            [`word${index}`]: `%${word}%`
                        });
                    });
                }
            }
        }
    
        // Obtener y retornar resultados limitados
        return queryBuilder
            .orderBy('puc.plcu_id', 'ASC')
            .take(limit) // Limitar resultados
            .getMany();
    }
}
