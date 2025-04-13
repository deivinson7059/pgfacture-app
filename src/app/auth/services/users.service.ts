import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { CreateUserLoginDto, AssignUserWareDto } from '../dto';

import { apiResponse } from '@common/interfaces';
import { UserCompany, User, Role, RoleScope } from '../entities';

import * as bcrypt from 'bcrypt';
import { generateRandomToken } from '@common/utils/utils';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(UserCompany)
        private readonly userCompanyRepository: Repository<UserCompany>,
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
        @InjectRepository(RoleScope)
        private readonly roleScopeRepository: Repository<RoleScope>,
        private readonly jwtService: JwtService,
        private readonly dataSource: DataSource
    ) { }


    /**
     * Crear un nuevo usuario
     */
    async createUser(createUserDto: CreateUserLoginDto): Promise<apiResponse<User>> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Verificar si el usuario ya existe
            const existingUser = await this.userRepository.findOne({
                where: { u_person_identification_number: createUserDto.identification_number }
            });

            if (existingUser) {
                throw new BadRequestException('Ya existe un usuario con este número de identificación');
            }

            // Obtener el siguiente ID
            const maxResult = await queryRunner.manager
                .createQueryBuilder()
                .select('COALESCE(MAX(u.u_id), 0)', 'max')
                .from(User, 'u')
                .getRawOne();

            const nextId = Number(maxResult.max) + 1;

            // Usar la identificación como contraseña por defecto si no se proporciona
            const defaultPassword = createUserDto.password || createUserDto.identification_number;

            // Usar bcrypt en lugar de MD5 para el hash de contraseña
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

            // Crear el nuevo usuario
            const newUser = this.userRepository.create({
                u_id: nextId,
                u_person_email: createUserDto.email,
                u_person_identification_number: createUserDto.identification_number,
                u_person_name: createUserDto.name,
                u_pass: hashedPassword, // Usado bcrypt en lugar de MD5
                u_active: 1,
                u_locked: 0,
                u_notes: createUserDto.notes || null
            });

            const savedUser = await queryRunner.manager.save(newUser);
            await queryRunner.commitTransaction();

            return {
                message: 'Usuario creado exitosamente',
                data: savedUser
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();

            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(`Error al crear el usuario: ${error.message}`);
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Asignar una sucursal a un usuario
     */
    async assignWareToUser(assignUserWareDto: AssignUserWareDto): Promise<apiResponse<UserCompany>> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Verificar si el usuario existe
            const user = await this.userRepository.findOne({
                where: { u_person_identification_number: assignUserWareDto.identification_number }
            });

            if (!user) {
                throw new NotFoundException(`Usuario con identificación ${assignUserWareDto.identification_number} no encontrado`);
            }

            // Verificar si la asignación ya existe
            const existingAssignment = await this.userCompanyRepository.findOne({
                where: {
                    uc_person_identification_number: assignUserWareDto.identification_number,
                    uc_cmpy: assignUserWareDto.cmpy,
                    uc_ware: assignUserWareDto.ware
                }
            });

            // Obtener el rol
            const role = await this.roleRepository.findOne({
                where: { rol_name: assignUserWareDto.role }
            });

            if (!role) {
                throw new NotFoundException(`Rol ${assignUserWareDto.role} no encontrado`);
            }

            // Generar token para la asignación de sucursal
            const token = generateRandomToken(25);

            if (existingAssignment) {
                // Actualizar asignación existente
                existingAssignment.uc_role_id = role.rol_id;
                existingAssignment.uc_ware_rol = role.rol_name;
                existingAssignment.uc_ware_lista = assignUserWareDto.list;
                existingAssignment.uc_ware_com_1 = assignUserWareDto.commission_1 || existingAssignment.uc_ware_com_1;
                existingAssignment.uc_ware_com_2 = assignUserWareDto.commission_2 || existingAssignment.uc_ware_com_2;
                existingAssignment.uc_ware_com_3 = assignUserWareDto.commission_3 || existingAssignment.uc_ware_com_3;
                existingAssignment.uc_ware_dev = assignUserWareDto.can_return || existingAssignment.uc_ware_dev;
                existingAssignment.uc_enabled = 1; // Asegurarse de que esté habilitado
                existingAssignment.uc_token = token; // Actualizar el token

                if (assignUserWareDto.person_name) {
                    existingAssignment.uc_person_name = assignUserWareDto.person_name;
                }

                if (assignUserWareDto.nick) {
                    existingAssignment.uc_person_nick = assignUserWareDto.nick;
                }

                await queryRunner.manager.save(existingAssignment);

                await queryRunner.commitTransaction();

                return {
                    message: "Sucursal actualizada para el usuario exitosamente",
                    data: existingAssignment
                };
            }

            // Obtener el siguiente ID
            const maxResult = await queryRunner.manager
                .createQueryBuilder()
                .select('COALESCE(MAX(uc.uc_id), 0)', 'max')
                .from(UserCompany, 'uc')
                .getRawOne();

            const nextId = Number(maxResult.max) + 1;

            // Crear nueva asignación
            const newAssignment = this.userCompanyRepository.create({
                uc_id: nextId,
                uc_person_identification_number: assignUserWareDto.identification_number,
                uc_person_name: assignUserWareDto.person_name || user.u_person_name,
                uc_person_nick: assignUserWareDto.nick || null,
                uc_cmpy: assignUserWareDto.cmpy,
                uc_ware: assignUserWareDto.ware,
                uc_enabled: 1,
                uc_role_id: role.rol_id,
                uc_ware_rol: role.rol_name,
                uc_ware_lista: assignUserWareDto.list,
                uc_ware_com_1: assignUserWareDto.commission_1 || 0,
                uc_ware_com_2: assignUserWareDto.commission_2 || 0,
                uc_ware_com_3: assignUserWareDto.commission_3 || 0,
                uc_ware_dev: assignUserWareDto.can_return || 'Y',
                uc_token: token, // Guardar el token en la nueva asignación
                uc_now: new Date()
            });

            const savedAssignment = await queryRunner.manager.save(newAssignment);

            await queryRunner.commitTransaction();

            return {
                message: "Sucursal asignada al usuario exitosamente",
                data: savedAssignment
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();

            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException(`Error al asignar sucursal al usuario: ${error.message}`);
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Obtener todas las asignaciones de sucursales de un usuario
     */
    async getUserWareAssignments(identificationNumber: string): Promise<apiResponse<UserCompany[]>> {
        try {
            // Verificar si el usuario existe
            const user = await this.userRepository.findOne({
                where: { u_person_identification_number: identificationNumber }
            });

            if (!user) {
                throw new NotFoundException(`Usuario con identificación ${identificationNumber} no encontrado`);
            }

            // Obtener todas las asignaciones de sucursales para el usuario
            const assignments = await this.userCompanyRepository.find({
                where: {
                    uc_person_identification_number: identificationNumber,
                    uc_enabled: 1
                }
            });

            return {
                message: "Sucursales asignadas al usuario",
                data: assignments
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException(`Error al obtener sucursales del usuario: ${error.message}`);
        }
    }

    /**
     * Eliminar una asignación de sucursal de un usuario
     */
    async removeUserWareAssignment(identificationNumber: string, cmpy: string, ware: string): Promise<apiResponse<void>> {
        try {
            // Verificar si la asignación existe
            const assignment = await this.userCompanyRepository.findOne({
                where: {
                    uc_person_identification_number: identificationNumber,
                    uc_cmpy: cmpy,
                    uc_ware: ware,
                    uc_enabled: 1
                }
            });

            if (!assignment) {
                throw new NotFoundException(`Asignación no encontrada para el usuario ${identificationNumber} en la sucursal ${ware} de la compañía ${cmpy}`);
            }

            // Desactivar la asignación en lugar de eliminarla
            assignment.uc_enabled = 0;
            assignment.uc_token = null; // Eliminar el token al desactivar la asignación
            await this.userCompanyRepository.save(assignment);

            return {
                message: "Asignación de sucursal eliminada exitosamente"
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException(`Error al eliminar asignación de sucursal: ${error.message}`);
        }
    }
}