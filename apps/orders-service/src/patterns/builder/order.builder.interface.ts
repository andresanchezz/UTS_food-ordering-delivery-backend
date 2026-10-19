import { Order } from '../../entities/order.entity.js';
import { OrderItemComponent } from '../decorator/order-item.component.js';

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

  /** Agrega un ítem (posiblemente decorado) y calcula subtotales */
  addItem(item: OrderItemComponent, notes?: string): this;

  /** Aplica un cupón promocional si cumple las condiciones del negocio */
  applyCoupon(couponCode?: string): this;

  /** Valida las invariantes del pedido antes de ensamblarlo */
  validate(): void;

  /** Ensambla y retorna la entidad Order completamente estructurada y válida */
  build(): Order;
}
