import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Order } from '../entities/order.entity.js';

@WebSocketGateway({ cors: { origin: '*' } })
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`[WebSocket] 🟢 Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[WebSocket] 🔴 Cliente desconectado: ${client.id}`);
  }

  emitOrderEvent(event: string, order: Order): void {
    if (this.server) {
      this.server.emit(event, order);
    }
  }
}
