import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Scope, CompanyRole, RoleScope } from '../entities';
import { CreateScopeDto } from '../dto/create-scope.dto';
import { CreateCompanyRoleDto } from '../dto/create-company-role.dto';
import { apiResponse } from '@common/interfaces';

@Injectable()
export class ScopesService {
    constructor(
        @InjectRepository(Scope)
        private readonly scopeRepository: Repository<Scope>,
        @InjectRepository(CompanyRole)
        private readonly companyRoleRepository: Repository<CompanyRole>,
        @InjectRepository(RoleScope)
        private readonly roleScopeRepository: Repository<RoleScope>,
        private readonly dataSource: DataSource
    ) { }

    /**
     * Crear un nuevo scope en el sistema
     */
    async createScope(createScopeDto: CreateScopeDto): Promise<apiResponse<Scope>> {
        try {
            // Verificar si el scope ya existe
            const existingScope = await this.scopeRepository.findOne({
                where: { s_id: createScopeDto.id }
            });

            if (existingScope) {
                throw new BadRequestException(`Ya existe un scope con el ID: ${createScopeDto.id}`);
            }

            // Crear el nuevo scope
            const newScope = this.scopeRepository.create({
                s_id: createScopeDto.id,
                s_description: createScopeDto.description,
                s_active: createScopeDto.active || 1
            });

            const savedScope = await this.scopeRepository.save(newScope);

            return {
                message: 'Scope creado exitosamente',
                data: savedScope
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(`Error al crear el scope: ${error.message}`);
        }
    }

    /**
     * Obtener todos los scopes disponibles
     */
    async findAllScopes(): Promise<apiResponse<Scope[]>> {
        try {
            const scopes = await this.scopeRepository.find({
                where: { s_active: 1 }
            });

            return {
                message: 'Scopes obtenidos exitosamente',
                data: scopes
            };
        } catch (error) {
            throw new BadRequestException(`Error al obtener los scopes: ${error.message}`);
        }
    }

    /**
     * Crear un nuevo rol en una compañía con sus scopes asignados
     */
    async createCompanyRole(createRoleDto: CreateCompanyRoleDto): Promise<apiResponse<any>> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Verificar si el rol ya existe en esa compañía
            const existingRole = await this.companyRoleRepository.findOne({
                where: {
                    cr_id: createRoleDto.id,
                    cr_cmpy: createRoleDto.company_id
                }
            });

            if (existingRole) {
                throw new BadRequestException(`Ya existe un rol con el ID ${createRoleDto.id} en la compañía ${createRoleDto.company_id}`);
            }

            // Verificar si todos los scopes existen
            const scopesExist = await Promise.all(
                createRoleDto.scopes.map(scopeId =>
                    this.scopeRepository.findOne({
                        where: { s_id: scopeId, s_active: 1 }
                    })
                )
            );

            const invalidScopes = createRoleDto.scopes.filter((_, index) => !scopesExist[index]);
            if (invalidScopes.length > 0) {
                throw new BadRequestException(`Los siguientes scopes no existen o no están activos: ${invalidScopes.join(', ')}`);
            }

            // Crear el nuevo rol
            const newRole = this.companyRoleRepository.create({
                cr_id: createRoleDto.id,
                cr_cmpy: createRoleDto.company_id,
                cr_name: createRoleDto.name,
                cr_description: createRoleDto.description,
                cr_active: createRoleDto.active || 1
            });

            const savedRole = await queryRunner.manager.save(newRole);

            // Asignar los scopes al rol
            const roleScopes = createRoleDto.scopes.map(scopeId => ({
                rs_role_id: createRoleDto.id,
                rs_cmpy: createRoleDto.company_id,
                rs_scope_id: scopeId
            }));

            await queryRunner.manager.insert(RoleScope, roleScopes);
            await queryRunner.commitTransaction();

            return {
                message: 'Rol de compañía creado exitosamente',
                data: {
                    role: savedRole,
                    scopes: createRoleDto.scopes
                }
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();

            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(`Error al crear el rol de compañía: ${error.message}`);
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Obtener los roles disponibles para una compañía
     */
    async getCompanyRoles(companyId: string): Promise<apiResponse<any[]>> {
        try {
            const roles = await this.companyRoleRepository.find({
                where: {
                    cr_cmpy: companyId,
                    cr_active: 1
                }
            });

            // Para cada rol, obtener sus scopes
            const rolesWithScopes = await Promise.all(
                roles.map(async (role) => {
                    const roleScopes = await this.roleScopeRepository.find({
                        where: {
                            rs_role_id: role.cr_id,
                            rs_cmpy: companyId
                        }
                    });

                    const scopeIds = roleScopes.map(rs => rs.rs_scope_id);
                    const scopes = await this.scopeRepository.findByIds(scopeIds);

                    return {
                        ...role,
                        scopes: scopes
                    };
                })
            );

            return {
                message: 'Roles de compañía obtenidos exitosamente',
                data: rolesWithScopes
            };
        } catch (error) {
            throw new BadRequestException(`Error al obtener los roles de la compañía: ${error.message}`);
        }
    }

    /**
     * Obtener los scopes asignados a un rol de una compañía
     */
    async getRoleScopes(roleId: string, companyId: string): Promise<apiResponse<string[]>> {
        try {
            // Verificar si el rol existe
            const role = await this.companyRoleRepository.findOne({
                where: {
                    cr_id: roleId,
                    cr_cmpy: companyId
                }
            });

            if (!role) {
                throw new NotFoundException(`No se encontró el rol ${roleId} en la compañía ${companyId}`);
            }

            // Obtener los scopes del rol
            const roleScopes = await this.roleScopeRepository.find({
                where: {
                    rs_role_id: roleId,
                    rs_cmpy: companyId
                }
            });

            const scopeIds = roleScopes.map(rs => rs.rs_scope_id);

            return {
                message: 'Scopes del rol obtenidos exitosamente',
                data: scopeIds
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException(`Error al obtener los scopes del rol: ${error.message}`);
        }
    }
}