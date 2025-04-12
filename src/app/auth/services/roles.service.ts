import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Role, RoleScope } from '../entities';
import { apiResponse } from '@common/interfaces';
import { AssignRoleScopeDto, CreateRoleDto } from '@auth/dto';

@Injectable()
export class RolesService {
    constructor(
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
        @InjectRepository(RoleScope)
        private readonly roleScopeRepository: Repository<RoleScope>,
        private readonly dataSource: DataSource
    ) { }

    /**
     * Crear un nuevo rol en el sistema
     */
    async createRole(createRoleDto: CreateRoleDto): Promise<apiResponse<Role>> {
        try {
            // Obtener el siguiente ID
            const maxResult = await this.roleRepository
                .createQueryBuilder('r')
                .select('COALESCE(MAX(r.rol_id), 0)', 'max')
                .getRawOne();

            const nextId = Number(maxResult.max) + 1;

            // Crear el nuevo rol
            const newRole = this.roleRepository.create({
                rol_id: nextId,
                rol_name: createRoleDto.name,
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