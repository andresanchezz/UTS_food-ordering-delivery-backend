import { Injectable } from '@nestjs/common';
import { Order } from '../entities/order.entity.js';
import { OrderSubscriber } from './order-subscriber.interface.js';

@Injectable()
export class EventBroker {
  private subscribers: Map<string, OrderSubscriber[]> = new Map();

  subscribe(event: string, subscriber: OrderSubscriber): void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    this.subscribers.get(event)!.push(subscriber);
  }

  async publish(event: string, order: Order): Promise<void> {
    console.log(`\n[EventBroker] 📢 Evento publicado: '${event}' para pedido #${order.id}`);
    const listeners = this.subscribers.get(event) || [];
    for (const sub of listeners) {
      try {
        await sub.update(event, order);
      } catch (err: any) {
        console.error(`[EventBroker] ❌ Error en suscriptor:`, err.message);
      }
    }
  }
}

