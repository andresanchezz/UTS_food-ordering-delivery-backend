import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Delivery } from '../entities/delivery.entity.js';

@WebSocketGateway({ cors: { origin: '*' } })
export class DeliveryGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`[DeliverySocket] 🟢 Repartidor conectado al panel: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[DeliverySocket] 🔴 Repartidor desconectado: ${client.id}`);
  }

  emitNewDelivery(delivery: Delivery): void {
    if (this.server) {
      console.log(`[DeliverySocket] 📡 Empujando 'delivery.new' al panel de repartidores para domicilio #${delivery.id}`);
      this.server.emit('delivery.new', delivery);
    }
  }

  emitDeliveryStatusChanged(delivery: Delivery): void {
    if (this.server) {
      console.log(`[DeliverySocket] 📡 Empujando 'delivery.status_changed' (${delivery.status}) para domicilio #${delivery.id}`);
      this.server.emit('delivery.status_changed', delivery);
    }
  }
}
