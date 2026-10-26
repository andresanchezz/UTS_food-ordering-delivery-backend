import { Injectable } from '@nestjs/common';
import { OrderSubscriber } from '../order-subscriber.interface.js';
import { Order } from '../../entities/order.entity.js';

@Injectable()
export class DeliveryDispatcherSubscriber implements OrderSubscriber {
  async update(event: string, order: Order): Promise<void> {
    if (event === 'order.ready') {
      console.log(`[DeliveryDispatcher] 🛵 Pedido #${order.id} LISTO en cocina: Solicitando asignacion en delivery-service`);
      try {
        const response = await fetch('http://localhost:3002/deliveries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            zoneName: order.zoneName || 'Zona Centro',
            distanceKm: Number(order.distanceKm ?? 3.5),
            deliveryType: order.deliveryType || 'STANDARD',
            isRushHour: Boolean(order.isRushHour),
          }),
        });

        if (response.ok) {
          const delivery = (await response.json()) as { id: string; fee: number };
          console.log(`[DeliveryDispatcher] ✅ Domicilio #${delivery.id} asignado con tarifa $${delivery.fee}`);
        } else {
          console.warn(`[DeliveryDispatcher] ⚠️ delivery-service respondió con status ${response.status}`);
        }
      } catch (err: any) {
        console.warn(`[DeliveryDispatcher] ⚠️ delivery-service no disponible en este momento (${err.message}). El pedido quedó creado.`);
      }
    }
  }
}

