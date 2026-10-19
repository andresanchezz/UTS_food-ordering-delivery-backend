import { OrderItemComponent } from './order-item.component.js';

/**
 * Componente Concreto del Patrón DECORATOR.
 * Representa el producto base tal como existe en el menú antes de cualquier personalización.
 */
export class BaseOrderItem implements OrderItemComponent {
  constructor(
    private readonly productId: number,
    private readonly productName: string,
    private readonly basePrice: number,
    private readonly quantity: number = 1,
  ) {}

  getPrice(): number {
    return Number(this.basePrice);
  }

  getDescription(): string {
    return this.productName;
  }

  getBaseProductId(): number {
    return this.productId;
  }

  getBaseProductName(): string {
    return this.productName;
  }

  getQuantity(): number {
    return this.quantity;
  }

  getToppingCodes(): string[] {
    return [];
  }
}
