import { OrderItemComponent } from './order-item.component.js';

/**
 * Decorador Abstracto (Base Decorator - GoF).
 * Mantiene una referencia al componente envuelto (`wrappee`) e implementa
 * la misma interfaz `OrderItemComponent`, delegando todas las operaciones por defecto.
 */
export abstract class OrderItemDecorator implements OrderItemComponent {
  constructor(protected readonly wrappee: OrderItemComponent) {}

  getPrice(): number {
    return this.wrappee.getPrice();
  }

  getDescription(): string {
    return this.wrappee.getDescription();
  }

  getBaseProductId(): number {
    return this.wrappee.getBaseProductId();
  }

  getBaseProductName(): string {
    return this.wrappee.getBaseProductName();
  }

  getQuantity(): number {
    return this.wrappee.getQuantity();
  }

  getToppingCodes(): string[] {
    return this.wrappee.getToppingCodes();
  }
}
