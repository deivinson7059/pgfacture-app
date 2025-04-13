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
    private connectedClients: Map<string, { userId: number, socketId: string }> = new Map();

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);

        // Eliminar cliente de la lista de conectados
        for (const [token, data] of this.connectedClients.entries()) {
            if (data.socketId === client.id) {
                this.connectedClients.delete(token);
                break;
            }
        }
    }

    @SubscribeMessage('register')
    handleRegister(client: Socket, payload: { token: string, userId: number }): void {
        this.logger.log(`Client registered: ${client.id} for user ${payload.userId}`);

        // Registrar cliente con su token y userId
        this.connectedClients.set(payload.token, {
            userId: payload.userId,
            socketId: client.id
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
}