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
     * Crear un nuevo rol en el sistema o reactivar uno existente que esté desactivado
     */
    async createRole(createRoleDto: CreateRoleDto): Promise<apiResponse<Role>> {
        try {
            // Transformar el nombre del rol según las reglas
            const formattedName = formatRoleName(createRoleDto.name);

            // Verificar si el rol ya existe (sin importar si está activo o no)
            const existingRole = await this.roleRepository.findOne({
                where: { rol_name: formattedName }
            });

            // Si el rol existe
            if (existingRole) {
                // Si está activo, no permitir crear otro igual
                if (existingRole.rol_enabled === 'Y') {
                    throw new BadRequestException(`Ya existe un rol con el nombre: ${formattedName}`);
                }

                // Si está inactivo, reactivarlo
                existingRole.rol_enabled = 'Y';
                // Permitir actualizar la descripción y el path
                if (createRoleDto.description) {
                    existingRole.rol_description = createRoleDto.description;
                }
                if (createRoleDto.path) {
                    existingRole.rol_path = createRoleDto.path;
                }

                const reactivatedRole = await this.roleRepository.save(existingRole);

                return {
                    message: `Rol ${formattedName} reactivado exitosamente`,
                    data: reactivatedRole
                };
            }

            // Si el rol no existe, crear uno nuevo
            // Obtener un sufijo alfanumérico único para el ID
            const suffix = await this.generateUniqueRoleIdSuffix();
            const roleId = `rol_${suffix}`;

            // Crear el nuevo rol
            const newRole = this.roleRepository.create({
                rol_id: roleId,
                rol_name: formattedName,
                rol_description: createRoleDto.description || formattedName,
                rol_enabled: 'Y', // Siempre se crea con enabled='Y'
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

    /**
     * Actualiza la descripción y/o el path de un rol existente
     */
    async updateRole(roleId: string, updateData: { description?: string; path?: string }): Promise<apiResponse<Role>> {
        try {
            // Verificar si el rol existe y está activo
            const role = await this.roleRepository.findOne({
                where: { rol_id: roleId, rol_enabled: 'Y' }
            });

            if (!role) {
                throw new NotFoundException(`No se encontró el rol con ID ${roleId} o está desactivado`);
            }

            // Solo permitir actualizar la descripción y el path
            if (updateData.description !== undefined) {
                role.rol_description = updateData.description;
            }
            if (updateData.path !== undefined) {
                role.rol_path = updateData.path;
            }

            const updatedRole = await this.roleRepository.save(role);

            return {
                message: 'Rol actualizado exitosamente',
                data: updatedRole
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException(`Error al actualizar el rol: ${error.message}`);
        }
    }

    /**
     * Genera un sufijo alfanumérico único para el ID del rol
     */
    private async generateUniqueRoleIdSuffix(): Promise<string> {
        // Generar un código alfanumérico de 16 caracteres (como en el ejemplo rol_1NSr5JcZOzXX1WFl)
        const generateCode = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let result = '';
            for (let i = 0; i < 16; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        };

        // Intentar hasta encontrar un código único
        let idSuffix = generateCode();
        let existingRole = await this.roleRepository.findOne({
            where: { rol_id: `rol_${idSuffix}` }
        });

        // Si ya existe, seguir generando hasta encontrar uno único
        while (existingRole) {
            idSuffix = generateCode();
            existingRole = await this.roleRepository.findOne({
                where: { rol_id: `rol_${idSuffix}` }
            });
        }

        return idSuffix;
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
                where: { rol_name: roleName, rol_enabled: 'Y' }
            });

            if (!role) {
                throw new NotFoundException(`No se encontró el rol con nombre ${roleName}`);
            }

            // Obtener scopes existentes para este rol
            const existingScopes = await this.roleScopeRepository.find({
                where: { rs_role_id: Number(role.rol_id) }
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
                rs_role_id: Number(role.rol_id),
                rs_scope_id: scopeId
            }));

            if (roleScopes.length > 0) {
                await queryRunner.manager.insert(RoleScope, roleScopes.map(roleScope => ({
                    rs_role_id: Number(roleScope.rs_role_id),
                    rs_scope_id: roleScope.rs_scope_id
                })));
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
                where: { rol_name: roleName, rol_enabled: 'Y' }
            });

            if (!role) {
                throw new NotFoundException(`No se encontró el rol con nombre ${roleName}`);
            }

            // Eliminar el scope específico
            const result = await this.roleScopeRepository.delete({
                rs_role_id: Number(role.rol_id),
                rs_scope_id: scopeId
            });

            if (result.affected === 0) {
                throw new NotFoundException(`El scope ${scopeId} no está asignado al rol ${roleName}`);
            }

            // Obtener los scopes restantes
            const remainingScopes = await this.roleScopeRepository.find({
                where: { rs_role_id: Number(role.rol_id) }
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
                where: { rol_name: roleName, rol_enabled: 'Y' }
            });

            if (!role) {
                throw new NotFoundException(`No se encontró el rol con nombre ${roleName}`);
            }

            // Obtener los scopes del rol
            const roleScopes = await this.roleScopeRepository.find({
                where: { rs_role_id: Number(role.rol_id) }
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
     * Eliminar un rol (cambiar estado a inactivo)
     */
    async deleteRole(roleId: string): Promise<apiResponse<void>> {
        try {
            // Verificar si el rol existe
            const role = await this.roleRepository.findOne({
                where: { rol_id: roleId }
            });

            if (!role) {
                throw new NotFoundException(`No se encontró el rol con ID ${roleId}`);
            }

            // Actualizar el estado a inactivo
            role.rol_enabled = 'N';
            await this.roleRepository.save(role);

            return {
                message: `Rol ${role.rol_name} desactivado exitosamente`,
                data: undefined
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException(`Error al eliminar el rol: ${error.message}`);
        }
    }

    /**
     * Obtener los scopes asignados a un rol
     */
    async getRoleScopes(roleId: string): Promise<apiResponse<string[]>> {
        try {
            // Verificar si el rol existe
            const role = await this.roleRepository.findOne({
                where: { rol_id: roleId, rol_enabled: 'Y' }
            });

            if (!role) {
                throw new NotFoundException(`No se encontró el rol con ID ${roleId}`);
            }

            // Obtener los scopes del rol
            const roleScopes = await this.roleScopeRepository.find({
                where: { rs_role_id: Number(roleId) }
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
    async assignScopeToRole(roleId: string, assignRoleScopeDto: AssignRoleScopeDto): Promise<apiResponse<any>> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Verificar si el rol existe
            const role = await this.roleRepository.findOne({
                where: { rol_id: roleId, rol_enabled: 'Y' }
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


            await queryRunner.manager.insert(RoleScope, roleScopes.map(roleScope => ({
                rs_role_id: Number(roleScope.rs_role_id),
                rs_scope_id: roleScope.rs_scope_id
            })));
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