import { LoginDto, AutenticateDto, AutenticateTokenDto } from "@auth/dto";
import { Role, RoleScope, User, UserCompany, MenuRole, Menu, MenuOption } from "@auth/entities";
import { apiResponse } from "@common/interfaces";
import { BadRequestException, Injectable, NotFoundException, UnauthorizedException, Inject, HttpException, HttpStatus } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository, In } from "typeorm";
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import * as bcrypt from 'bcrypt';

interface MenuStructure {
    path: string;
    title: string;
    icon: string;
    class: string;
    groupTitle: boolean;
    submenu: MenuStructure[];
    level?: number;
}

import { generateRandomToken } from "@common/utils/utils";
import { PlatformService } from "./platform.service";
import { SessionService } from "./session.service";
import { WebsocketGateway } from "@auth/gateways/websocket.gateway";
import { Sucursal } from "@settings/entities";

@Injectable()
export class AuthService {
    private readonly jwtExpirationTime: string;

    constructor(
        @InjectRepository(User)
        private readonly authRepository: Repository<User>,
        @InjectRepository(UserCompany)
        private readonly userCompanyRepository: Repository<UserCompany>,
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
        @InjectRepository(RoleScope)
        private readonly roleScopeRepository: Repository<RoleScope>,
        @InjectRepository(MenuRole)
        private readonly menuRoleRepository: Repository<MenuRole>,
        @InjectRepository(Menu)
        private readonly menuRepository: Repository<Menu>,
        @InjectRepository(MenuOption)
        private readonly menuOptionRepository: Repository<MenuOption>,
        @InjectRepository(Sucursal)
        private readonly sucursalRepository: Repository<Sucursal>,
        private readonly jwtService: JwtService,
        private readonly dataSource: DataSource,
        private readonly platformService: PlatformService,
        private readonly sessionService: SessionService,
        private readonly configService: ConfigService,
        private readonly websocketGateway: WebsocketGateway,
        @Inject(REQUEST) private readonly request: Request
    ) {
        this.jwtExpirationTime = this.configService.get<string>('JWT_EXPIRATION_TIME', '1h');
    }
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
                throw new HttpException({
                    success: false,
                    messages: {
                        error: 'Credenciales inválidas'
                    }
                }, HttpStatus.PAYMENT_REQUIRED);
            }

            // Verificar si el usuario está activo
            if (user.u_active !== 1) {
                throw new HttpException({
                    success: false,
                    messages: {
                        error: 'Usuario inactivo'
                    }
                }, HttpStatus.PAYMENT_REQUIRED);
            }

            // Verificar si el usuario está bloqueado
            if (user.u_locked === 1) {
                throw new HttpException({
                    success: false,
                    messages: {
                        error: `Usuario bloqueado: ${user.u_reason_locked || 'Contacte al administrador'}`
                    }
                }, HttpStatus.FORBIDDEN);
            }


            // Usar bcrypt en lugar de MD5 para el hash de contraseña
            const isPasswordValid = await bcrypt.compare(loginDto.password, user.u_pass);

            if (!isPasswordValid) {
                throw new HttpException({
                    success: false,
                    messages: {
                        error: 'Credenciales inválidas'
                    }
                }, HttpStatus.PAYMENT_REQUIRED);
            }

            // Obtener las compañías y sucursales del usuario
            const userCompanies = await this.userCompanyRepository.find({
                where: {
                    uc_person_identification_number: user.u_person_identification_number,
                    uc_enabled: 1
                }
            });

            if (userCompanies.length === 0) {
                throw new HttpException({
                    success: false,
                    messages: {
                        error: 'El usuario no tiene compañías asignadas'
                    }
                }, HttpStatus.FORBIDDEN);
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
            if (error instanceof HttpException) {
                throw error;
            }
            // Para cualquier otro tipo de error, usar un código 400
            throw new HttpException({
                success: false,
                messages: {
                    error: `Error en la autenticación: ${error.message}`
                }
            }, HttpStatus.BAD_REQUEST);
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
                throw new HttpException({
                    success: false,
                    messages: {
                        error: 'Credenciales inválidas'
                    }
                }, HttpStatus.PAYMENT_REQUIRED); // 402 en lugar de 401
            }

            // Verificar si el usuario está activo y no bloqueado
            if (user.u_active !== 1 || user.u_locked === 1) {
                throw new HttpException({
                    success: false,
                    messages: {
                        error: 'Usuario inactivo o bloqueado'
                    }
                }, HttpStatus.PAYMENT_REQUIRED); // 402 en lugar de 401
            }

            // Usar bcrypt en lugar de MD5 para el hash de contraseña
            const isPasswordValid = await bcrypt.compare(autenticateDto.password, user.u_pass);

            if (!isPasswordValid) {
                throw new HttpException({
                    success: false,
                    messages: {
                        error: 'Credenciales inválidas'
                    }
                }, HttpStatus.PAYMENT_REQUIRED); // 402 en lugar de 401
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
                throw new HttpException({
                    success: false,
                    messages: {
                        error: 'No tiene acceso a esta compañía o sucursal'
                    }
                }, HttpStatus.FORBIDDEN); // 403 - más apropiado para permisos
            }

            // Obtener el rol del usuario
            const role = await this.roleRepository.findOne({
                where: { rol_id: userCompany.uc_role_id }
            });

            if (!role) {
                throw new HttpException({
                    success: false,
                    messages: {
                        error: 'Rol no encontrado'
                    }
                }, HttpStatus.FORBIDDEN); // 403
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

            const accessToken = this.jwtService.sign(payload, {
                expiresIn: this.jwtExpirationTime
            });

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

            // Determinar qué compañía usar para el menú basado en el rol
            const menuCompany = role.rol_name === 'DEVELOPER' ? 'ALL' : autenticateDto.cmpy;

            // Obtener la estructura del menú para el rol
            const menuData = await this.getMenuStructureForRole(
                menuCompany,
                role.rol_name,
                role.rol_path,
                autenticateDto.cmpy
            );

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
                    access_token: accessToken,
                    menu: menuData
                }
            };
        } catch (error) {
            // Si ya es un HttpException, relanzarlo
            if (error instanceof HttpException) {
                throw error;
            }
            // Para otros errores, usar BAD_REQUEST
            throw new HttpException({
                success: false,
                messages: {
                    error: `Error en la autenticación: ${error.message}`
                }
            }, HttpStatus.BAD_REQUEST);
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
                throw new HttpException({
                    success: false,
                    messages: {
                        error: 'Token inválido o expirado'
                    }
                }, HttpStatus.PAYMENT_REQUIRED); // 402 en lugar de 401
            }

            // Verificar que el usuario exista y esté activo
            const user = await this.authRepository.findOne({
                where: {
                    u_person_identification_number: userCompany.uc_person_identification_number,
                    u_active: 1
                }
            });

            if (!user || user.u_locked === 1) {
                throw new HttpException({
                    success: false,
                    messages: {
                        error: 'Usuario inactivo o bloqueado'
                    }
                }, HttpStatus.PAYMENT_REQUIRED); // 402 en lugar de 401
            }

            // Obtener el rol del usuario
            const role = await this.roleRepository.findOne({
                where: { rol_id: userCompany.uc_role_id }
            });

            if (!role) {
                throw new HttpException({
                    success: false,
                    messages: {
                        error: 'Rol no encontrado'
                    }
                }, HttpStatus.FORBIDDEN); // 403
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

            const accessToken = this.jwtService.sign(payload, {
                expiresIn: this.jwtExpirationTime
            });

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

            // Determinar qué compañía usar para el menú basado en el rol
            const menuCompany = role.rol_name === 'DEVELOPER' ? 'ALL' : userCompany.uc_cmpy;

            // Obtener la estructura del menú para el rol
            const menuData = await this.getMenuStructureForRole(
                menuCompany,
                role.rol_name,
                role.rol_path,
                userCompany.uc_cmpy
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
                    menu: menuData
                }
            };
        } catch (error) {
            // Si ya es un HttpException, relanzarlo
            if (error instanceof HttpException) {
                throw error;
            }
            // Para otros errores, usar BAD_REQUEST
            throw new HttpException({
                success: false,
                messages: {
                    error: `Error en la autenticación: ${error.message}`
                }
            }, HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Método para obtener la estructura del menú para un rol específico
     */
    async getMenuStructureForRole(cmpy: string, roleId: string, rolePath: string, cmpy_: string): Promise<MenuStructure[]> {
        // Obtener todos los menús asignados al rol
        const menuRoles = await this.menuRoleRepository.find({
            where: {
                mr_cmpy: cmpy,
                mr_rol_id: roleId
            }
        });

        if (menuRoles.length === 0) {
            return [];
        }

        // Agrupar por ID de menú
        const menuIds = [...new Set(menuRoles.map(mr => mr.mr_menu_id))];

        // Obtener la información de los menús
        const menus = await this.menuRepository.find({
            where: { m_id: In(menuIds), m_enabled: 'Y' },
            order: { m_order: 'ASC' }
        });

        // Buscar la sucursal para obtener la razón social
        let companyName = "EMPRESA";
        try {
            // Si estamos en la compañía ALL, usamos un valor por defecto
            const sucursal = await this.sucursalRepository.findOne({
                where: {
                    suc_cmpy: cmpy_
                }
            });

            if (sucursal && sucursal.suc_razon) {
                companyName = sucursal.suc_razon;
            }
        } catch (error) {
            // En caso de error, mantenemos el valor por defecto
            console.error("Error al obtener razón social:", error);
        }

        // Construir la estructura jerárquica
        const result: MenuStructure[] = [
            // Agregar encabezado con el nombre de la empresa
            {
                path: "",
                title: companyName,
                icon: "",
                class: "",
                groupTitle: true,
                submenu: []
            },
            // Agregar dashboard
            {
                path: `${rolePath}/dashboard`,
                title: "Dashboards",
                icon: "monitor",
                class: "",
                groupTitle: false,
                submenu: []
            }
        ];

        for (const menu of menus) {
            // Obtener las opciones de primer nivel para este menú y rol
            const menuRolesForThisMenu = menuRoles.filter(mr => mr.mr_menu_id === menu.m_id);
            const optionIds = menuRolesForThisMenu.map(mr => mr.mr_menu_options_id);

            // Obtener las opciones de menú correspondientes
            const menuOptions = await this.menuOptionRepository.find({
                where: { mo_id: In(optionIds), mo_enabled: 'Y' }
            });

            // Filtrar opciones de primer nivel (sin padre o padre fuera de las opciones permitidas)
            const firstLevelOptions = menuOptions.filter(
                option => !option.mo_parent_id || !optionIds.includes(option.mo_parent_id)
            );

            // Ordenar por orden
            firstLevelOptions.sort((a, b) => a.mo_order - b.mo_order);

            //console.log('firstLevelOptions', firstLevelOptions);

            const menuWithOptions: MenuStructure = {
                path: '/' + menu.m_path,
                title: menu.m_title,
                icon: menu.m_icon,
                class: menu.m_class,
                groupTitle: false,
                submenu: [],
            };

            // Agregar las opciones de primer nivel con sus subopciones
            for (const option of firstLevelOptions) {
                const optionWithSuboptions = await this.buildRoleOptionHierarchy(option, menuOptions, optionIds, rolePath);
                menuWithOptions.submenu.push(optionWithSuboptions);
            }

            result.push(menuWithOptions);
        }

        return result;
    }

    /**
     * Método auxiliar para construir la jerarquía de opciones para un rol
     */
    private async buildRoleOptionHierarchy(option: MenuOption, allOptions: MenuOption[], allowedOptionIds: number[], rolePath: string): Promise<any> {
        // Filtrar las opciones hijas permitidas
        const children = allOptions.filter(opt =>
            opt.mo_parent_id === option.mo_id &&
            allowedOptionIds.includes(opt.mo_id)
        );

        // Ordenar por orden
        children.sort((a, b) => a.mo_order - b.mo_order);

        // Preparar el path modificado con el rolePath
        let modifiedPath = option.mo_path;
        if (modifiedPath && !modifiedPath.startsWith('/')) {
            modifiedPath = `${rolePath}/${modifiedPath}`;
        }

        const result: MenuStructure = {
            path: (modifiedPath === '' ? '' : '/' + modifiedPath),
            title: option.mo_title,
            icon: option.mo_icon || '',
            class: option.mo_class || '',
            groupTitle: option.mo_is_group_title || false,
            submenu: [],
            level: option.mo_level,
        };

        if (children.length > 0) {
            for (const child of children) {
                const childWithSuboptions = await this.buildRoleOptionHierarchy(child, allOptions, allowedOptionIds, rolePath);
                result.submenu.push(childWithSuboptions);
            }
        }

        return result;
    }

    /**
     * Refrescar token
     */
    async refreshToken(token: string): Promise<apiResponse<any>> {
        try {
            // Verificar que la sesión existe
            const currentSession = await this.sessionService.validateSession(token);

            if (!currentSession) {
                throw new HttpException({
                    success: false,
                    messages: {
                        error: 'Token inválido o expirado'
                    }
                }, HttpStatus.PAYMENT_REQUIRED); // 402 en lugar de 401
            }

            // Extraer información del token
            const decodedToken = this.jwtService.decode(token);
            if (!decodedToken) {
                throw new HttpException({
                    success: false,
                    messages: {
                        error: 'Token inválido'
                    }
                }, HttpStatus.PAYMENT_REQUIRED); // 402 en lugar de 401
            }

            // Crear un nuevo payload sin el campo exp
            const { exp, iat, ...payloadWithoutExp } = decodedToken as any;

            // Generar un nuevo token con la misma información pero nueva expiración
            const newToken = this.jwtService.sign(payloadWithoutExp, {
                expiresIn: this.jwtExpirationTime
            });

            // Extraer información relevante para guardar en la sesión
            const { userAgent, deviceInfo, ipAddress } = this.extractRequestInfo();

            // Eliminar la sesión antigua y crear una nueva con el nuevo token
            await this.sessionService.closeSession(token);
            await this.sessionService.createSession(
                currentSession.se_user_id,
                currentSession.se_platform_id,
                newToken,
                ipAddress || currentSession.se_ip_address,
                userAgent || currentSession.se_user_agent,
                deviceInfo ? String(deviceInfo) : currentSession.se_device_info,
                currentSession.se_cmpy,
                currentSession.se_ware
            );

            // Notificar al WebSocket sobre el refresco de token (no es un nuevo inicio de sesión)
            this.websocketGateway.notifyTokenRefresh(
                token,
                newToken,
                currentSession.se_user_id,
                currentSession.se_platform_id,
                currentSession.se_cmpy
            );

            return {
                message: 'Token refrescado exitosamente',
                data: { access_token: newToken }
            };
        } catch (error) {
            // Si ya es un HttpException, relanzarlo
            if (error instanceof HttpException) {
                throw error;
            }
            // Para otros errores, usar BAD_REQUEST
            throw new HttpException({
                success: false,
                messages: {
                    error: `Error al refrescar el token: ${error.message}`
                }
            }, HttpStatus.BAD_REQUEST);
        }
    }

    private extractRequestInfo() {
        const userAgent = this.request.headers['user-agent'] || 'Unknown';
        const deviceInfo = this.request.headers['device-info'] || null;
        const ipAddress = this.request.ip || this.request.connection.remoteAddress || 'Unknown';

        return { userAgent, deviceInfo, ipAddress };
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
            throw new HttpException({
                success: false,
                messages: {
                    error: `Error al cerrar sesión: ${error.message}`
                }
            }, HttpStatus.BAD_REQUEST);
        }
    }
}