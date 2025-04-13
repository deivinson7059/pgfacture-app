import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan } from 'typeorm';
import { Session } from '../entities';
import { apiResponse } from '@common/interfaces';
import { WebsocketGateway } from '../gateways/websocket.gateway';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SessionService {
    private readonly sessionExpirationTime: number; // en horas

    constructor(
        @InjectRepository(Session)
        private readonly sessionRepository: Repository<Session>,
        private readonly dataSource: DataSource,
        private readonly websocketGateway: WebsocketGateway,
        private readonly configService: ConfigService
    ) {
        // Obtener el tiempo de expiración de sesión desde las variables de entorno
        this.sessionExpirationTime = parseInt(
            this.configService.get<string>('SESSION_EXPIRATION_TIME', '1')
        );
    }

    // Crear una nueva sesión
    async createSession(
        userId: number,
        platformId: number,
        token: string,
        ipAddress: string,
        userAgent: string,
        deviceInfo: string | null,
        cmpy: string,
        ware: string
    ): Promise<Session> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Generar un nuevo UUID para la sesión
            const sessionId = uuidv4();

            // Calcular fecha de expiración (por defecto, 1 hora desde ahora)
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + this.sessionExpirationTime);

            // Desactivar sesiones existentes para este usuario en la misma plataforma y compañía
            const existingSessions = await queryRunner.manager.find(Session, {
                where: {
                    se_user_id: userId,
                    se_platform_id: platformId,
                    se_cmpy: cmpy
                }
            });

            if (existingSessions.length > 0) {
                // Eliminar sesiones anteriores
                for (const session of existingSessions) {
                    await queryRunner.manager.delete(Session, { se_id: session.se_id });

                    // Notificar al cliente sobre la nueva sesión
                    this.websocketGateway.notifySessionExpired(session.se_token, userId);
                }
            }

            // Crear la nueva sesión
            const newSession = this.sessionRepository.create({
                se_id: sessionId,
                se_user_id: userId || 0,
                se_platform_id: platformId || 1, // Por defecto, plataforma Web si no se especifica
                se_token: token,
                se_ip_address: ipAddress || '0.0.0.0',
                se_user_agent: userAgent || 'Unknown',
                se_device_info: deviceInfo || undefined,
                se_cmpy: cmpy || '00',
                se_ware: ware || 'default',
                se_created_at: new Date(),
                se_expires: expiresAt
            });

            const savedSession = await queryRunner.manager.save(newSession);
            await queryRunner.commitTransaction();

            return savedSession;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // Verificar si una sesión es válida
    async validateSession(token: string): Promise<Session> {
        const session = await this.sessionRepository.findOne({
            where: {
                se_token: token
            }
        });

        if (!session) {
            throw new UnauthorizedException('Sesión inválida o no existe');
        }

        // Verificar si la sesión ha expirado
        if (new Date() > session.se_expires) {
            await this.sessionRepository.delete({ se_id: session.se_id });
            throw new UnauthorizedException('Sesión expirada');
        }

        return session;
    }

    // Cerrar una sesión
    async closeSession(token: string): Promise<apiResponse<void>> {
        const session = await this.sessionRepository.findOne({
            where: { se_token: token }
        });

        if (session) {
            await this.sessionRepository.delete({ se_id: session.se_id });
        }

        return {
            message: 'Sesión cerrada correctamente'
        };
    }

    // Refrescar un token de sesión
    async refreshSession(token: string): Promise<apiResponse<{ token: string }>> {
        const session = await this.sessionRepository.findOne({
            where: { se_token: token }
        });

        if (!session) {
            throw new UnauthorizedException('Sesión inválida o no existe');
        }

        // Verificar si la sesión ha expirado
        if (new Date() > session.se_expires) {
            await this.sessionRepository.delete({ se_id: session.se_id });
            throw new UnauthorizedException('Sesión expirada');
        }

        // Calcular nueva fecha de expiración
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + this.sessionExpirationTime);

        // Actualizar la fecha de expiración
        session.se_expires = expiresAt;
        await this.sessionRepository.save(session);

        return {
            message: 'Sesión refrescada correctamente',
            data: { token: session.se_token }
        };
    }

    // Cerrar todas las sesiones de un usuario
    async closeAllUserSessions(userId: number): Promise<apiResponse<void>> {
        const sessions = await this.sessionRepository.find({
            where: {
                se_user_id: userId
            }
        });

        for (const session of sessions) {
            await this.sessionRepository.delete({ se_id: session.se_id });

            // Notificar al cliente sobre el cierre de sesión
            this.websocketGateway.notifySessionExpired(session.se_token, userId);
        }

        return {
            message: 'Todas las sesiones han sido cerradas'
        };
    }

    // Obtener todas las sesiones activas de un usuario
    async getUserActiveSessions(userId: number): Promise<apiResponse<Session[]>> {
        const now = new Date();

        const sessions = await this.sessionRepository.find({
            where: {
                se_user_id: userId,
                se_expires: LessThan(now)
            }
        });

        return {
            message: 'Sesiones activas del usuario',
            data: sessions
        };
    }

    // Limpiar sesiones expiradas (puede ejecutarse como tarea programada)
    async cleanupExpiredSessions(): Promise<apiResponse<void>> {
        const now = new Date();

        // Usar createQueryBuilder para eliminar sesiones expiradas
        await this.sessionRepository.createQueryBuilder()
            .delete()
            .from(Session)
            .where('se_expires < :now', { now })
            .execute();

        return {
            message: 'Sesiones expiradas han sido eliminadas'
        };
    }
}