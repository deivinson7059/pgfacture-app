import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private logger: Logger = new Logger('WebsocketGateway');
    private connectedClients: Map<string, { userId: number, socketId: string, cmpy: string, platform: number }> = new Map();

    handleConnection(client: Socket) {
        this.logger.log(`Cliente intentando conectar: ${client.id}`);

    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Cliente desconectado: ${client.id}`);

        // Eliminar cliente de la lista de conectados
        for (const [token, data] of this.connectedClients.entries()) {
            if (data.socketId === client.id) {
                this.connectedClients.delete(token);
                break;
            }
        }
    }

    @SubscribeMessage('register')
    handleRegister(client: Socket, payload: { token: string, userId: number, cmpy: string, platform: number }): void {
        if (!payload.token || !payload.userId) {
            client.emit('error', { message: 'Token y userId son requeridos para registrarse' });
            return;
        }

        this.logger.log(`Cliente registrado: ${client.id} para usuario ${payload.userId} en compañía ${payload.cmpy}`);

        // Registrar cliente con su token, userId, compañía y plataforma
        this.connectedClients.set(payload.token, {
            userId: payload.userId,
            socketId: client.id,
            cmpy: payload.cmpy || '00',
            platform: payload.platform || 1
        });
    }

    // Notificar al cliente que su sesión ha expirado
    notifySessionExpired(token: string, userId: number): void {
        try {
            // Buscar todos los clientes del usuario
            for (const [clientToken, data] of this.connectedClients.entries()) {
                if (data.userId === userId && clientToken !== token) {
                    this.server.to(data.socketId).emit('session_expired', {
                        message: 'Tu sesión ha expirado porque se inició una nueva sesión en otro dispositivo.'
                    });

                    this.logger.log(`Notificación de sesión expirada enviada a ${data.socketId}`);
                }
            }
        } catch (error) {
            this.logger.error(`Error al notificar sesión expirada: ${error.message}`);
        }
    }

    // Notificar a un usuario específico en una compañía y plataforma específica
    notifyUserInCompanyAndPlatform(userId: number, cmpy: string, platform: number, event: string, data: any): void {
        try {
            // Enviar a todos los sockets conectados de este usuario en esta compañía y plataforma
            for (const [_, clientData] of this.connectedClients.entries()) {
                if (clientData.userId === userId && clientData.cmpy === cmpy && clientData.platform === platform) {
                    this.server.to(clientData.socketId).emit(event, data);
                }
            }
        } catch (error) {
            this.logger.error(`Error al notificar al usuario ${userId} en compañía ${cmpy}: ${error.message}`);
        }
    }

    // Notificar a un usuario específico
    notifyUser(userId: number, event: string, data: any): void {
        try {
            // Enviar a todos los sockets conectados de este usuario
            for (const [_, clientData] of this.connectedClients.entries()) {
                if (clientData.userId === userId) {
                    this.server.to(clientData.socketId).emit(event, data);
                }
            }
        } catch (error) {
            this.logger.error(`Error al notificar al usuario ${userId}: ${error.message}`);
        }
    }

    // Notificar sobre el refresco de token (sin cerrar la sesión del usuario)
    notifyTokenRefresh(oldToken: string, newToken: string, userId: number, platformId: number, cmpy: string): void {
        try {
            // Buscar todos los clientes del usuario en esta plataforma y compañía
            for (const [clientToken, data] of this.connectedClients.entries()) {
                // Si es el cliente cuyo token fue refrescado
                if (clientToken === oldToken && data.userId === userId &&
                    data.platform === platformId && data.cmpy === cmpy) {

                    // Enviar evento de refresco de token
                    this.server.to(data.socketId).emit('token_refreshed', {
                        message: 'Tu token ha sido refrescado',
                        newToken: newToken
                    });

                    // Actualizar el token en el mapa de clientes conectados
                    // Primero eliminamos la entrada antigua
                    this.connectedClients.delete(oldToken);

                    // Luego añadimos una nueva con el token actualizado
                    this.connectedClients.set(newToken, {
                        userId: data.userId,
                        socketId: data.socketId,
                        cmpy: data.cmpy,
                        platform: data.platform
                    });

                    this.logger.log(`Notificación de token refrescado enviada a ${data.socketId}`);
                }
            }
        } catch (error) {
            this.logger.error(`Error al notificar refresco de token: ${error.message}`);
        }
    }
}