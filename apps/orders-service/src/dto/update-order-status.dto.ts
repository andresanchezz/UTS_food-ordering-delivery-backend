import { OrderStatus } from '../entities/order.entity.js';

export class UpdateOrderStatusDto {
  status: OrderStatus;
}
