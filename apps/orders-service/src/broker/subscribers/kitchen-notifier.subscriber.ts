import { Injectable } from '@nestjs/common';
import { OrderSubscriber } from '../order-subscriber.interface.js';
import { Order } from '../../entities/order.entity.js';

@Injectable()
export class KitchenNotifierSubscriber implements OrderSubscriber {
  update(event: string, order: Order): void {
    if (event === 'order.created') {
      console.log(`[Cocina] 👨‍🍳 Pedido #${order.id} recibido (${order.items?.length ?? 0} ítems). Enviado a comanda de preparación.`);
    } else if (event === 'order.status_updated') {
      console.log(`[Cocina] 🔄 Estado de preparación del pedido #${order.id} actualizado a: ${order.status}`);
    }
  }
}
