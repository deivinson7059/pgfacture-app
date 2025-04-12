import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { CreateUserLoginDto } from '../dto';

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

            // Generar token alfanumérico
            const token = generateRandomToken(25);

            // Crear el nuevo usuario
            const newUser = this.userRepository.create({
                u_id: nextId,
                u_person_email: createUserDto.email,
                u_person_identification_number: createUserDto.identification_number,
                u_person_name: createUserDto.name,
                u_pass: hashedPassword, // Usado bcrypt en lugar de MD5
                u_token: token,
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


}