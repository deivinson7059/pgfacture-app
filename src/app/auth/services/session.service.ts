import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Session } from '../entities';
import { apiResponse } from '@common/interfaces';
import { WebsocketGateway } from '../gateways/websocket.gateway';

@Injectable()
export class SessionService {
    constructor(
        @InjectRepository(Session)
        private readonly sessionRepository: Repository<Session>,
        private readonly dataSource: DataSource,
        private readonly websocketGateway: WebsocketGateway
    ) { }

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
            // Obtener el siguiente ID
            const maxResult = await queryRunner.manager
                .createQueryBuilder()
                .select('COALESCE(MAX(s.s_id), 0)', 'max')
                .from(Session, 's')
                .getRawOne();

            // Asegurar que nextId sea un número válido
            let nextId = 1;
            if (maxResult && maxResult.max !== null && !isNaN(Number(maxResult.max))) {
                nextId = Number(maxResult.max) + 1;
            }

            // Desactivar sesiones existentes para este usuario en la misma plataforma
            const existingSessions = await queryRunner.manager.find(Session, {
                where: {
                    s_user_id: userId,
                    s_platform_id: platformId,
                    s_active: 'Y'
                }
            });

            if (existingSessions.length > 0) {
                // Desactivar sesiones anteriores
                for (const session of existingSessions) {
                    session.s_active = 'N';
                    await queryRunner.manager.save(session);

                    // Notificar al cliente sobre la nueva sesión
                    this.websocketGateway.notifySessionExpired(session.s_token, userId);
                }
            }

            // Crear la nueva sesión asegurando que todos los campos requeridos tengan valores válidos
            const newSession = this.sessionRepository.create({
                s_id: nextId,
                s_user_id: userId || 0,
                s_platform_id: platformId || 1, // Por defecto, plataforma Web si no se especifica
                s_token: token,
                s_ip_address: ipAddress || '0.0.0.0',
                s_user_agent: userAgent || 'Unknown',
                s_device_info: deviceInfo || undefined,
                s_cmpy: cmpy || '00',
                s_ware: ware || 'default',
                s_created_at: new Date(),
                s_last_activity: new Date(),
                s_active: 'Y'
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
                s_token: token,
                s_active: 'Y'
            }
        });

        if (!session) {
            throw new UnauthorizedException('Sesión inválida o expirada');
        }

        // Actualizar última actividad
        session.s_last_activity = new Date();
        await this.sessionRepository.save(session);

        return session;
    }

    // Cerrar una sesión
    async closeSession(token: string): Promise<apiResponse<void>> {
        const session = await this.sessionRepository.findOne({
            where: { s_token: token }
        });

        if (session) {
            session.s_active = 'N';
            await this.sessionRepository.save(session);
        }

        return {
            message: 'Sesión cerrada correctamente'
        };
    }

    // Cerrar todas las sesiones de un usuario
    async closeAllUserSessions(userId: number): Promise<apiResponse<void>> {
        const sessions = await this.sessionRepository.find({
            where: {
                s_user_id: userId,
                s_active: 'Y'
            }
        });

        for (const session of sessions) {
            session.s_active = 'N';
            await this.sessionRepository.save(session);

            // Notificar al cliente sobre el cierre de sesión
            this.websocketGateway.notifySessionExpired(session.s_token, userId);
        }

        return {
            message: 'Todas las sesiones han sido cerradas'
        };
    }

    // Obtener todas las sesiones activas de un usuario
    async getUserActiveSessions(userId: number): Promise<apiResponse<Session[]>> {
        const sessions = await this.sessionRepository.find({
            where: {
                s_user_id: userId,
                s_active: 'Y'
            }
        });

        return {
            message: 'Sesiones activas del usuario',
            data: sessions
        };
    }

    // Limpiar sesiones antiguas inactivas (puede ejecutarse como tarea programada)
    async cleanupInactiveSessions(daysOld: number = 30): Promise<apiResponse<void>> {
        const date = new Date();
        date.setDate(date.getDate() - daysOld);

        // Usar createQueryBuilder en lugar de delete con condición compleja
        await this.sessionRepository.createQueryBuilder()
            .delete()
            .from(Session)
            .where('s_last_activity < :date', { date })
            .execute();

        return {
            message: `Sesiones inactivas de más de ${daysOld} días han sido eliminadas`
        };
    }
}