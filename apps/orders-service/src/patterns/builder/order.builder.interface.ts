import { Order } from '../../entities/order.entity.js';
import { OrderItemContext } from '../flyweight/order-item-context.js';

export interface IOrderItemInput {
  getProductId(): number;
  getProductName(): string;
  getQuantity(): number;
  getUnitPrice(): number;
  getDescription(): string;
}

/**
 * Interfaz del Patrón Creacional BUILDER (GoF / Refactoring Guru).
 */
export interface IOrderBuilder {
  reset(): this;
  setCustomerInfo(customerName: string, customerAddress: string): this;
  setDeliveryPreferences(zoneName?: string, distanceKm?: number, deliveryType?: string, isRushHour?: boolean): this;
  addItem(item: OrderItemContext | IOrderItemInput, notes?: string): this;
  applyCoupon(couponCode?: string): this;
  validate(): void;
  build(): Order;
}

