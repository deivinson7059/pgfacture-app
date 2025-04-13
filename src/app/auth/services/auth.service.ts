import { LoginDto, AutenticateDto, AutenticateTokenDto } from "@auth/dto";
import { Role, RoleScope, User, UserCompany } from "@auth/entities";
import { apiResponse } from "@common/interfaces";
import { BadRequestException, Injectable, NotFoundException, UnauthorizedException, Inject } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';

import * as bcrypt from 'bcrypt';

import { generateRandomToken } from "@common/utils/utils";
import { PlatformService } from "./platform.service";
import { SessionService } from "./session.service";

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly authRepository: Repository<User>,
        @InjectRepository(UserCompany)
        private readonly userCompanyRepository: Repository<UserCompany>,
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
        @InjectRepository(RoleScope)
        private readonly roleScopeRepository: Repository<RoleScope>,
        private readonly jwtService: JwtService,
        private readonly dataSource: DataSource,
        private readonly platformService: PlatformService,
        private readonly sessionService: SessionService,
        @Inject(REQUEST) private readonly request: Request
    ) { }
    /**
     * Primer paso del login: Autenticación con número de identificación y contraseña
     * Devuelve las compañías y sucursales disponibles para el usuario
     */
    async login(loginDto: LoginDto): Promise<apiResponse<any>> {
        try {
            // Buscar el usuario por número de identificación
            const user = await this.authRepository.findOne({
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


            // Usar bcrypt en lugar de MD5 para el hash de contraseña
            const isPasswordValid = await bcrypt.compare(loginDto.password, user.u_pass);

            if (!isPasswordValid) {
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

            userCompanies.forEach(cmpy => {
                if (!companiesMap.has(cmpy.uc_cmpy)) {
                    companiesMap.set(cmpy.uc_cmpy, {
                        cmpy: cmpy.uc_cmpy,
                        wares: []
                    });
                }

                const companyData = companiesMap.get(cmpy.uc_cmpy);
                companyData.wares.push({
                    ware: cmpy.uc_ware,
                    role_id: cmpy.uc_role_id,
                    role_name: cmpy.uc_ware_rol,
                    list: cmpy.uc_ware_lista
                });
            });

            const userCompaniesAndwares = Array.from(companiesMap.values());

            return {
                message: 'Primer paso de autenticación exitoso',
                data: {
                    user: {
                        id: user.u_id,
                        name: user.u_person_name,
                        identification_number: user.u_person_identification_number,
                        email: user.u_person_email
                    },
                    cmpy: userCompaniesAndwares
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
    async autenticate(autenticateDto: AutenticateDto): Promise<apiResponse<any>> {
        try {
            // Extraer información del dispositivo desde los headers
            const userAgent = this.request.headers['user-agent'] || 'Unknown';
            const platformIdHeader = this.request.headers['platform-id'];
            const deviceInfo = this.request.headers['device-info'] || null;
            const ipAddress = this.request.ip || this.request.connection.remoteAddress || 'Unknown';

            // Determinar la plataforma
            let platformId: number;
            if (platformIdHeader && !isNaN(Number(platformIdHeader))) {
                platformId = Number(platformIdHeader);
            } else {
                // Autodetectar plataforma si no se envía
                platformId = await this.platformService.identifyPlatform(userAgent);
            }

            // Validar el usuario primero
            const user = await this.authRepository.findOne({
                where: { u_person_identification_number: autenticateDto.identification_number }
            });

            if (!user) {
                throw new UnauthorizedException('Credenciales inválidas');
            }

            // Verificar si el usuario está activo y no bloqueado
            if (user.u_active !== 1 || user.u_locked === 1) {
                throw new UnauthorizedException('Usuario inactivo o bloqueado');
            }

            // Usar bcrypt en lugar de MD5 para el hash de contraseña
            const isPasswordValid = await bcrypt.compare(autenticateDto.password, user.u_pass);

            if (!isPasswordValid) {
                throw new UnauthorizedException('Credenciales inválidas');
            }

            // Verificar que el usuario tenga acceso a la compañía y sucursal seleccionadas
            const userCompany = await this.userCompanyRepository.findOne({
                where: {
                    uc_person_identification_number: autenticateDto.identification_number,
                    uc_cmpy: autenticateDto.cmpy,
                    uc_ware: autenticateDto.ware,
                    uc_enabled: 1
                }
            });

            if (!userCompany) {
                throw new UnauthorizedException('No tiene acceso a esta compañía o sucursal');
            }

            // Obtener el rol del usuario
            const role = await this.roleRepository.findOne({
                where: { rol_id: userCompany.uc_role_id }
            });

            if (!role) {
                throw new UnauthorizedException('Rol no encontrado');
            }

            // Obtener los scopes asignados al rol del usuario
            const roleScopes = await this.roleScopeRepository.find({
                where: { rs_role_id: userCompany.uc_role_id }
            });

            const scopes = roleScopes.map(rs => rs.rs_scope_id);

            // Generar token de sesión JWT
            const payload = {
                sub: user.u_id,
                ident: user.u_person_identification_number,
                cmpy: autenticateDto.cmpy,
                ware: autenticateDto.ware,
                role_id: userCompany.uc_role_id,
                role: role.rol_name,
                path: role.rol_path,
                scopes: scopes,
                platform_id: platformId
            };

            const accessToken = this.jwtService.sign(payload);


            // Crear la sesión en la base de datos
            await this.sessionService.createSession(
                user.u_id,
                platformId,
                accessToken,
                ipAddress,
                userAgent,
                deviceInfo ? String(deviceInfo) : null,
                autenticateDto.cmpy,
                autenticateDto.ware
            );

            await this.authRepository.save(user);

            return {
                message: 'Inicio de sesión exitoso',
                data: {
                    user: {
                        id: user.u_id,
                        name: user.u_person_name,
                        identification_number: user.u_person_identification_number,
                        email: user.u_person_email
                    },
                    cmpy: {
                        id: autenticateDto.cmpy,
                        ware: autenticateDto.ware,
                        role_id: userCompany.uc_role_id,
                        role: role.rol_name,
                        path: role.rol_path,
                        list: userCompany.uc_ware_lista,
                        platform_id: platformId,
                        scopes: scopes
                    },
                    token: userCompany.uc_token,
                    access_token: accessToken
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
     * Login mediante token persistente
     */
    async autenticateToken(autenticateTokenDto: AutenticateTokenDto): Promise<apiResponse<any>> {
        try {
            // Extraer información del dispositivo desde los headers
            const userAgent = this.request.headers['user-agent'] || 'Unknown';
            const platformIdHeader = this.request.headers['platform-id'];
            const deviceInfo = this.request.headers['device-info'] || null;
            const ipAddress = this.request.ip || this.request.connection.remoteAddress || 'Unknown';

            // Determinar la plataforma
            let platformId: number;
            if (platformIdHeader && !isNaN(Number(platformIdHeader))) {
                platformId = Number(platformIdHeader);
            } else {
                // Autodetectar plataforma si no se envía
                platformId = await this.platformService.identifyPlatform(userAgent);
            }

            // Buscar el token en UserCompany en lugar de User
            const userCompany = await this.userCompanyRepository.findOne({
                where: { uc_token: autenticateTokenDto.token, uc_enabled: 1 }
            });

            if (!userCompany) {
                throw new UnauthorizedException('Token inválido o expirado');
            }

            // Verificar que el usuario exista y esté activo
            const user = await this.authRepository.findOne({
                where: {
                    u_person_identification_number: userCompany.uc_person_identification_number,
                    u_active: 1
                }
            });

            if (!user || user.u_locked === 1) {
                throw new UnauthorizedException('Usuario inactivo o bloqueado');
            }

            // Obtener el rol del usuario
            const role = await this.roleRepository.findOne({
                where: { rol_id: userCompany.uc_role_id }
            });

            if (!role) {
                throw new UnauthorizedException('Rol no encontrado');
            }

            // Obtener los scopes asignados al rol del usuario
            const roleScopes = await this.roleScopeRepository.find({
                where: { rs_role_id: userCompany.uc_role_id }
            });

            const scopes = roleScopes.map(rs => rs.rs_scope_id);

            // Generar token de sesión JWT
            const payload = {
                sub: user.u_id,
                ident: user.u_person_identification_number,
                cmpy: userCompany.uc_cmpy,
                ware: userCompany.uc_ware,
                role_id: userCompany.uc_role_id,
                role: role.rol_name,
                path: role.rol_path,
                scopes: scopes,
                platform_id: platformId
            };

            const accessToken = this.jwtService.sign(payload);

            await this.sessionService.createSession(
                user.u_id,
                platformId,
                accessToken,
                ipAddress,
                userAgent,
                deviceInfo ? String(deviceInfo) : null,
                userCompany.uc_cmpy,
                userCompany.uc_ware
            );

            return {
                message: 'Autenticación con token exitosa',
                data: {
                    user: {
                        id: user.u_id,
                        name: user.u_person_name,
                        identification_number: user.u_person_identification_number,
                        email: user.u_person_email
                    },
                    cmpy: {
                        id: userCompany.uc_cmpy,
                        ware: userCompany.uc_ware,
                        role_id: userCompany.uc_role_id,
                        role: role.rol_name,
                        path: role.rol_path,
                        list: userCompany.uc_ware_lista,
                        platform_id: platformId,
                        scopes: scopes,
                    },
                    token: userCompany.uc_token,
                    access_token: accessToken,

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
     * Cerrar sesión de usuario
     */
    async logout(token: string): Promise<apiResponse<any>> {
        try {
            // Cerrar la sesión en la base de datos
            await this.sessionService.closeSession(token);

            return {
                message: 'Sesión cerrada exitosamente',
                data: { success: true }
            };
        } catch (error) {
            throw new BadRequestException(`Error al cerrar sesión: ${error.message}`);
        }
    }
}