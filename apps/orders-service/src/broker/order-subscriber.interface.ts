import { Order } from '../entities/order.entity.js';

export interface OrderSubscriber {
  update(event: string, order: Order): void | Promise<void>;
}
