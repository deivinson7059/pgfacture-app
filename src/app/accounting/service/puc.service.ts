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
     * Método principal para buscar cuentas auxiliares 
     * Determina automáticamente si se debe buscar por número o por descripción
     * @param cmpy Código de la compañía
     * @param account Texto de búsqueda (número o descripción)
     * @param limit Límite de resultados
     * @returns Lista de cuentas auxiliares que coinciden con la búsqueda
     */
    async searchAuxiliaryAccounts(cmpy: string, account?: string, limit: number = 100): Promise<Puc[]> {
        // Si no se proporciona parámetro de búsqueda, lanzar error
        if (!account || account.trim() === '') {
            throw new BadRequestException('Debe proporcionar un parámetro de búsqueda');
        }

        const searchTerm = account.trim();
        const isNumeric = /^\d+$/.test(searchTerm);

        // Determinar automáticamente el tipo de búsqueda y llamar al método correspondiente
        if (isNumeric) {
            // Si es numérico, buscar por número de cuenta
            return this.searchAccountsByNumber(cmpy, searchTerm, limit);
        } else {
            // Si no es numérico, buscar por descripción
            return this.searchAccountsByDescription(cmpy, searchTerm, limit);
        }
    }

    /**
    * Método para buscar cuentas auxiliares por número de cuenta
    * @param cmpy Código de la compañía
    * @param accountNumber Número de cuenta para búsqueda (debe ser numérico)
    * @param limit Límite de resultados (por defecto 100)
    * @returns Lista limitada de cuentas auxiliares que coinciden con el número
    */
    private async searchAccountsByNumber(cmpy: string, accountNumber: string, limit: number = 100): Promise<Puc[]> {
        // Crear consulta base para buscar cuentas auxiliares (6, 8 y 10 dígitos)
        const queryBuilder = this.accountPlanRepository
            .createQueryBuilder('puc')
            .where('puc.plcu_classification IN (:...classifications)', {
                classifications: ['SUBCUENTA', 'AUXILIAR', 'AUXILIAR2']
            })
            .andWhere('puc.plcu_active = :active', { active: 'Y' });
    
        // Aplicar filtro por compañía
        if (cmpy !== 'ALL') {
            queryBuilder.andWhere('(puc.plcu_cmpy = :cmpy OR puc.plcu_cmpy = :all)', {
                cmpy: cmpy,
                all: 'ALL'
            });
        }
    
        // Buscar cuentas que empiecen con el número proporcionado
        queryBuilder.andWhere('puc.plcu_id LIKE :account', {
            account: `${accountNumber}%` // Busca cuentas que EMPIECEN con el número
        });
    
        // Obtener y retornar resultados limitados
        return queryBuilder
            .orderBy('puc.plcu_id', 'ASC')
            .take(limit)
            .getMany();
    }

    /**
     * Método para buscar cuentas auxiliares por descripción
     * @param cmpy Código de la compañía
     * @param description Texto para buscar en la descripción de las cuentas
     * @param limit Límite de resultados (por defecto 100)
     * @returns Lista limitada de cuentas auxiliares que coinciden con la descripción
     */
    private async searchAccountsByDescription(cmpy: string, description: string, limit: number = 100): Promise<Puc[]> {
        // Crear consulta base para buscar cuentas auxiliares (8 y 10 dígitos)
        const queryBuilder = this.accountPlanRepository
        .createQueryBuilder('puc')
        .where('puc.plcu_classification IN (:...classifications)', {
            classifications: ['SUBCUENTA', 'AUXILIAR', 'AUXILIAR2']
        })
        .andWhere('puc.plcu_active = :active', { active: 'Y' });

        // Aplicar filtro por compañía
        if (cmpy !== 'ALL') {
            queryBuilder.andWhere('(puc.plcu_cmpy = :cmpy OR puc.plcu_cmpy = :all)', {
                cmpy: cmpy,
                all: 'ALL'
            });
        }

        // Dividir la descripción en palabras para búsqueda más precisa
        const searchWords = description.trim().split(/\s+/).filter(word => word.length > 0);

        if (searchWords.length > 0) {
            // Crear condiciones para cada palabra (deben coincidir todas las palabras)
            searchWords.forEach((word, index) => {
                queryBuilder.andWhere(`LOWER(puc.plcu_description) LIKE LOWER(:word${index})`, {
                    [`word${index}`]: `%${word}%`
                });
            });
        }

        // Obtener y retornar resultados limitados
        return queryBuilder
            .orderBy('puc.plcu_id', 'ASC')
            .take(limit)
            .getMany();
    }

    /**
     * Cargar todas las cuentas auxiliares según compañía, limitado a un número específico de resultados
     */
    async auxiliaryAccounts(cmpy: string, limit: number = 100): Promise<Puc[]> {
        // Crear consulta base para buscar cuentas auxiliares (8 y 10 dígitos)
        const queryBuilder = this.accountPlanRepository
        .createQueryBuilder('puc')
        .where('puc.plcu_classification IN (:...classifications)', {
            classifications: ['SUBCUENTA', 'AUXILIAR', 'AUXILIAR2']
        })
        .andWhere('puc.plcu_active = :active', { active: 'Y' });

        // Aplicar filtro por compañía
        if (cmpy !== 'ALL') {
            queryBuilder.andWhere('(puc.plcu_cmpy = :cmpy OR puc.plcu_cmpy = :all)', {
                cmpy: cmpy,
                all: 'ALL'
            });
        }

        // Obtener y retornar resultados limitados
        return queryBuilder
            .orderBy('puc.plcu_id', 'ASC')
            .take(limit) // Limitar resultados
            .getMany();
    }
}