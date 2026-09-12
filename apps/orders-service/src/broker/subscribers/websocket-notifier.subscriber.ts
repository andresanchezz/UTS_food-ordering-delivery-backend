import { Injectable } from '@nestjs/common';
import { OrderSubscriber } from '../order-subscriber.interface.js';
import { OrdersGateway } from '../../gateway/orders.gateway.js';
import { Order } from '../../entities/order.entity.js';

@Injectable()
export class WebSocketNotifierSubscriber implements OrderSubscriber {
  constructor(private readonly gateway: OrdersGateway) {}

  update(event: string, order: Order): void {
    console.log(`[WebSocketNotifier] 📡 Emitiendo socket '${event}' al frontend para pedido #${order.id}`);
    this.gateway.emitOrderEvent(event, order);
  }
}
