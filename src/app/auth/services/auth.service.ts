import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { LoginStep1Dto, LoginStep2Dto, LoginTokenDto, CreateUserLoginDto } from '../dto';
import * as crypto from 'crypto';
import { apiResponse } from '@common/interfaces';
import { UserCompany, UserLogin } from '../entities';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(UserLogin)
        private readonly userLoginRepository: Repository<UserLogin>,
        @InjectRepository(UserCompany)
        private readonly userCompanyRepository: Repository<UserCompany>,
        private readonly jwtService: JwtService,
        private readonly dataSource: DataSource
    ) { }

    /**
     * Primer paso del login: Autenticación con número de identificación y contraseña
     * Devuelve las compañías y sucursales disponibles para el usuario
     */
    async loginStep1(loginDto: LoginStep1Dto): Promise<apiResponse<any>> {
        try {
            // Buscar el usuario por número de identificación
            const user = await this.userLoginRepository.findOne({
                where: { u_person_identification_number: loginDto.identification_number }
            });

            if (!user) {
                throw new UnauthorizedException('Credenciales inválidas');
            }

            // Verificar si el usuario está activo
            if (user.u_active !== 1) {
                throw new UnauthorizedException('Usuario inactivo');
            }

            // Verificar si el usuario está bloqueado
            if (user.u_locked === 1) {
                throw new UnauthorizedException(`Usuario bloqueado: ${user.u_reason_locked || 'Contacte al administrador'}`);
            }

            // Verificar la contraseña (en este caso asumimos que está en MD5)
            const md5Password = crypto.createHash('md5').update(loginDto.password).digest('hex');
            if (user.u_pass !== md5Password) {
                throw new UnauthorizedException('Credenciales inválidas');
            }

            // Obtener las compañías y sucursales del usuario
            const userCompanies = await this.userCompanyRepository.find({
                where: {
                    uc_person_identification_number: user.u_person_identification_number,
                    uc_enabled: 1
                }
            });

            if (userCompanies.length === 0) {
                throw new UnauthorizedException('El usuario no tiene compañías asignadas');
            }

            // Organizar las compañías y sucursales
            const companiesMap = new Map();

            userCompanies.forEach(company => {
                if (!companiesMap.has(company.uc_cmpy)) {
                    companiesMap.set(company.uc_cmpy, {
                        company_id: company.uc_cmpy,
                        branches: []
                    });
                }

                const companyData = companiesMap.get(company.uc_cmpy);
                companyData.branches.push({
                    branch_name: company.uc_ware,
                    role: company.uc_ware_rol,
                    list: company.uc_ware_lista
                });
            });

            const userCompaniesAndBranches = Array.from(companiesMap.values());

            return {
                message: 'Primer paso de autenticación exitoso',
                data: {
                    user: {
                        id: user.u_id,
                        name: user.u_person_name,
                        identification_number: user.u_person_identification_number,
                        email: user.u_person_email
                    },
                    companies: userCompaniesAndBranches
                }
            };
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new BadRequestException(`Error en la autenticación: ${error.message}`);
        }
    }

    /**
     * Segundo paso del login: Selección de compañía y sucursal
     * Genera un token de sesión
     */
    async loginStep2(loginDto: LoginStep2Dto): Promise<apiResponse<any>> {
        try {
            // Validar el usuario primero
            const user = await this.userLoginRepository.findOne({
                where: { u_person_identification_number: loginDto.identification_number }
            });

            if (!user) {
                throw new UnauthorizedException('Credenciales inválidas');
            }

            // Verificar si el usuario está activo y no bloqueado
            if (user.u_active !== 1 || user.u_locked === 1) {
                throw new UnauthorizedException('Usuario inactivo o bloqueado');
            }

            // Verificar la contraseña
            const md5Password = crypto.createHash('md5').update(loginDto.password).digest('hex');
            if (user.u_pass !== md5Password) {
                throw new UnauthorizedException('Credenciales inválidas');
            }

            // Verificar que el usuario tenga acceso a la compañía y sucursal seleccionadas
            const userCompany = await this.userCompanyRepository.findOne({
                where: {
                    uc_person_identification_number: loginDto.identification_number,
                    uc_cmpy: loginDto.company_id,
                    uc_ware: loginDto.branch_name,
                    uc_enabled: 1
                }
            });

            if (!userCompany) {
                throw new UnauthorizedException('No tiene acceso a esta compañía o sucursal');
            }

            // Generar token de sesión JWT
            const payload = {
                sub: user.u_id,
                ident: user.u_person_identification_number,
                company: loginDto.company_id,
                branch: loginDto.branch_name,
                role: userCompany.uc_ware_rol
            };

            const accessToken = this.jwtService.sign(payload);

            // Generar token alfanumérico entre 15-35 caracteres para acceso directo (persistente)
            const persistentToken = this.generateRandomToken(25); // 25 caracteres

            // Actualizar el token en la base de datos
            user.u_token = persistentToken;
            await this.userLoginRepository.save(user);

            return {
                message: 'Inicio de sesión exitoso',
                data: {
                    user: {
                        id: user.u_id,
                        name: user.u_person_name,
                        identification_number: user.u_person_identification_number,
                        email: user.u_person_email
                    },
                    company: {
                        id: loginDto.company_id,
                        branch: loginDto.branch_name,
                        role: userCompany.uc_ware_rol,
                        list: userCompany.uc_ware_lista
                    },
                    token: persistentToken,
                    access_token: accessToken
                }
            };
        } catch (error) {
            if (error instanceof UnauthorizedException || error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException(`Error en la autenticación: ${error.message}`);
        }
    }

    /**
     * Login mediante token persistente
     */
    async loginWithToken(loginTokenDto: LoginTokenDto): Promise<apiResponse<any>> {
        try {
            const user = await this.userLoginRepository.findOne({
                where: { u_token: loginTokenDto.token }
            });

            if (!user) {
                throw new UnauthorizedException('Token inválido o expirado');
            }

            // Verificar que el usuario esté activo y no bloqueado
            if (user.u_active !== 1 || user.u_locked === 1) {
                throw new UnauthorizedException('Usuario inactivo o bloqueado');
            }

            // Obtener las compañías y sucursales del usuario
            const userCompanies = await this.userCompanyRepository.find({
                where: {
                    uc_person_identification_number: user.u_person_identification_number,
                    uc_enabled: 1
                }
            });

            if (userCompanies.length === 0) {
                throw new UnauthorizedException('El usuario no tiene compañías asignadas');
            }

            // Organizar las compañías y sucursales
            const companiesMap = new Map();

            userCompanies.forEach(company => {
                if (!companiesMap.has(company.uc_cmpy)) {
                    companiesMap.set(company.uc_cmpy, {
                        company_id: company.uc_cmpy,
                        branches: []
                    });
                }

                const companyData = companiesMap.get(company.uc_cmpy);
                companyData.branches.push({
                    branch_name: company.uc_ware,
                    role: company.uc_ware_rol,
                    list: company.uc_ware_lista
                });
            });

            const userCompaniesAndBranches = Array.from(companiesMap.values());

            return {
                message: 'Autenticación con token exitosa',
                data: {
                    user: {
                        id: user.u_id,
                        name: user.u_person_name,
                        identification_number: user.u_person_identification_number,
                        email: user.u_person_email
                    },
                    companies: userCompaniesAndBranches,
                    token: user.u_token
                }
            };
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new BadRequestException(`Error en la autenticación: ${error.message}`);
        }
    }

    /**
     * Crear un nuevo usuario
     */
    async createUser(createUserDto: CreateUserLoginDto): Promise<apiResponse<UserLogin>> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Verificar si el usuario ya existe
            const existingUser = await this.userLoginRepository.findOne({
                where: { u_person_identification_number: createUserDto.identification_number }
            });

            if (existingUser) {
                throw new BadRequestException('Ya existe un usuario con este número de identificación');
            }

            // Obtener el siguiente ID
            const maxResult = await queryRunner.manager
                .createQueryBuilder()
                .select('COALESCE(MAX(u.u_id), 0)', 'max')
                .from(UserLogin, 'u')
                .getRawOne();

            const nextId = Number(maxResult.max) + 1;

            // Generar contraseña MD5 (usando identificación como contraseña por defecto)
            const defaultPassword = createUserDto.identification_number;
            const md5Password = crypto.createHash('md5').update(createUserDto.password || defaultPassword).digest('hex');

            // Generar token alfanumérico
            const token = this.generateRandomToken(25);

            // Crear el nuevo usuario
            const newUser = this.userLoginRepository.create({
                u_id: nextId,
                u_person_email: createUserDto.email,
                u_person_identification_number: createUserDto.identification_number,
                u_person_name: createUserDto.name,
                u_pass: md5Password,
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

    // Método auxiliar para generar token aleatorio
    private generateRandomToken(length: number): string {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';

        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            token += characters.charAt(randomIndex);
        }

        return token;
    }
}