import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Role, RoleScope, Scope } from '../entities';
import { apiResponse } from '@common/interfaces';
import { AssignRoleScopeDto, CreateRoleDto } from '@auth/dto';
import { formatRoleName } from '@common/utils/utils';

@Injectable()
export class RolesService {
    constructor(
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
        @InjectRepository(RoleScope)
        private readonly roleScopeRepository: Repository<RoleScope>,
        @InjectRepository(Scope)
        private readonly scopeRepository: Repository<Scope>,
        private readonly dataSource: DataSource
    ) { }

    /**
     * Crear un nuevo rol en el sistema
     */
    async createRole(createRoleDto: CreateRoleDto): Promise<apiResponse<Role>> {
        try {
            // Transformar el nombre del rol según las reglas
            const formattedName = formatRoleName(createRoleDto.name);

            // Verificar si el Role ya existe
            const existingRole = await this.roleRepository.findOne({
                where: { rol_name: formattedName }
            });

            if (existingRole) {
                throw new BadRequestException(`Ya existe un rol con el nombre: ${formattedName}`);
            }

            // Obtener el siguiente ID
            const maxResult = await this.roleRepository
                .createQueryBuilder('r')
                .select('COALESCE(MAX(r.rol_id), 0)', 'max')
                .getRawOne();

            const nextId = Number(maxResult.max) + 1;

            // Crear el nuevo rol
            const newRole = this.roleRepository.create({
                rol_id: nextId,
                rol_name: formattedName,
                rol_enabled: createRoleDto.enabled || 'Y',
                rol_path: createRoleDto.path || 'user'
            });

            const savedRole = await this.roleRepository.save(newRole);

            return {
                message: 'Rol creado exitosamente',
                data: savedRole
            };
        } catch (error) {
            throw new BadRequestException(`Error al crear el rol: ${error.message}`);
        }
    }

    // Método para asignar scopes a un rol por nombre
    async assignScopeToRoleByName(
        roleName: string,
        assignRoleScopeDto: AssignRoleScopeDto
    ): Promise<apiResponse<any>> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Verificar si el rol existe
            const role = await this.roleRepository.findOne({
                where: { rol_name: roleName }
            });

            if (!role) {
                throw new NotFoundException(`No se encontró el rol con nombre ${roleName}`);
            }

            // Obtener scopes existentes para este rol
            const existingScopes = await this.roleScopeRepository.find({
                where: { rs_role_id: role.rol_id }
            });

            const existingScopeIds = existingScopes.map(rs => rs.rs_scope_id);

            // Filtrar solo los nuevos scopes que no están asignados
            const newScopeIds = assignRoleScopeDto.scopes.filter(
                scopeId => !existingScopeIds.includes(scopeId)
            );

            // Verificar que los nuevos scopes existan y estén activos
            for (const scopeId of newScopeIds) {
                const scope = await this.scopeRepository.findOne({
                    where: {
                        s_id: scopeId,
                        s_active: 'Y'
                    }
                });

                if (!scope) {
                    throw new NotFoundException(`El scope ${scopeId} no existe o no está activo`);
                }
            }

            // Asignar los nuevos scopes
            const roleScopes = newScopeIds.map(scopeId => ({
                rs_role_id: role.rol_id,
                rs_scope_id: scopeId
            }));

            if (roleScopes.length > 0) {
                await queryRunner.manager.insert(RoleScope, roleScopes);
            }

            await queryRunner.commitTransaction();

            // Obtener todos los scopes asignados para devolver en la respuesta
            const allAssignedScopes = [...existingScopeIds, ...newScopeIds];

            return {
                message: 'Scopes asignados al rol exitosamente',
                data: {
                    role_name: roleName,
                    role_id: role.rol_id,
                    scopes: allAssignedScopes
                }
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();

            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException(`Error al asignar scopes al rol: ${error.message}`);
        } finally {
            await queryRunner.release();
        }
    }

    // Método para eliminar un scope específico de un rol
    async removeScopeFromRole(roleName: string, scopeId: string): Promise<apiResponse<any>> {
        try {
            // Verificar si el rol existe
            const role = await this.roleRepository.findOne({
                where: { rol_name: roleName }
            });

            if (!role) {
                throw new NotFoundException(`No se encontró el rol con nombre ${roleName}`);
            }

            // Eliminar el scope específico
            const result = await this.roleScopeRepository.delete({
                rs_role_id: role.rol_id,
                rs_scope_id: scopeId
            });

            if (result.affected === 0) {
                throw new NotFoundException(`El scope ${scopeId} no está asignado al rol ${roleName}`);
            }

            // Obtener los scopes restantes
            const remainingScopes = await this.roleScopeRepository.find({
                where: { rs_role_id: role.rol_id }
            });

            return {
                message: `Scope ${scopeId} eliminado del rol ${roleName} exitosamente`,
                data: {
                    role_name: roleName,
                    role_id: role.rol_id,
                    scopes: remainingScopes.map(rs => rs.rs_scope_id)
                }
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException(`Error al eliminar el scope del rol: ${error.message}`);
        }
    }

    // Método para obtener scopes por nombre de rol
    async getRoleScopesByName(roleName: string): Promise<apiResponse<string[]>> {
        try {
            // Verificar si el rol existe
            const role = await this.roleRepository.findOne({
                where: { rol_name: roleName }
            });

            if (!role) {
                throw new NotFoundException(`No se encontró el rol con nombre ${roleName}`);
            }

            // Obtener los scopes del rol
            const roleScopes = await this.roleScopeRepository.find({
                where: { rs_role_id: role.rol_id }
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

    /**
     * Obtener todos los roles disponibles
     */
    async findAllRoles(): Promise<apiResponse<Role[]>> {
        try {
            const roles = await this.roleRepository.find({
                where: { rol_enabled: 'Y' },
            });

            return {
                message: 'Roles obtenidos exitosamente',
                data: roles
            };
        } catch (error) {
            throw new BadRequestException(`Error al obtener los roles: ${error.message}`);
        }
    }

    /**
     * Obtener los scopes asignados a un rol
     */
    async getRoleScopes(roleId: number): Promise<apiResponse<string[]>> {
        try {
            // Verificar si el rol existe
            const role = await this.roleRepository.findOne({
                where: { rol_id: roleId }
            });

            if (!role) {
                throw new NotFoundException(`No se encontró el rol con ID ${roleId}`);
            }

            // Obtener los scopes del rol
            const roleScopes = await this.roleScopeRepository.find({
                where: { rs_role_id: roleId }
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

    /**
     * Asignar scopes a un rol
     */
    async assignScopeToRole(roleId: number, assignRoleScopeDto: AssignRoleScopeDto): Promise<apiResponse<any>> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Verificar si el rol existe
            const role = await this.roleRepository.findOne({
                where: { rol_id: roleId }
            });

            if (!role) {
                throw new NotFoundException(`No se encontró el rol con ID ${roleId}`);
            }

            // Eliminar los scopes existentes para este rol
            await queryRunner.manager.delete(RoleScope, { rs_role_id: roleId });

            // Asignar los nuevos scopes
            const roleScopes = assignRoleScopeDto.scopes.map(scopeId => ({
                rs_role_id: roleId,
                rs_scope_id: scopeId
            }));

            await queryRunner.manager.insert(RoleScope, roleScopes);
            await queryRunner.commitTransaction();

            return {
                message: 'Scopes asignados al rol exitosamente',
                data: {
                    role_id: roleId,
                    scopes: assignRoleScopeDto.scopes
                }
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();

            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException(`Error al asignar scopes al rol: ${error.message}`);
        } finally {
            await queryRunner.release();
        }
    }
}