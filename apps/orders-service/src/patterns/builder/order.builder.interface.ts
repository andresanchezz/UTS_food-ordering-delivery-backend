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
 * Define los pasos necesarios para construir una entidad `Order` paso a paso
 * asegurando la consistencia de sus invariantes de negocio.
 */
export interface IOrderBuilder {
  /** Reinicia el estado interno del constructor */
  reset(): this;

  /** Configura los datos obligatorios del cliente y su dirección de entrega */
  setCustomerInfo(customerName: string, customerAddress: string): this;

  /** Agrega un ítem basado en su contexto Flyweight y calcula subtotales */
  addItem(item: OrderItemContext | IOrderItemInput, notes?: string): this;

  /** Aplica un cupón promocional si cumple las condiciones del negocio */
  applyCoupon(couponCode?: string): this;

  /** Valida las invariantes del pedido antes de ensamblarlo */
  validate(): void;

  /** Ensambla y retorna la entidad Order completamente estructurada y válida */
  build(): Order;
}
