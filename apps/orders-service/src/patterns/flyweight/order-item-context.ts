import { IDishFlyweight, IOrderItemExtrinsic, KitchenTicketLine } from './dish-flyweight.interface.js';
import { IOrderItemInput } from '../builder/order.builder.interface.js';

/**
 * CONTEXTO EXTRÍNSECO: Guarda solo los datos variables del cliente (cantidad, notas
 * y referencias a los Flyweights del pool), evitando clonar recetas o alérgenos.
 */
export class OrderItemContext implements IOrderItemExtrinsic, IOrderItemInput {
  constructor(
    public readonly flyweight: IDishFlyweight,
    public readonly quantity: number = 1,
    public readonly toppings: readonly IDishFlyweight[] = [],
    public readonly notes?: string,
  ) {
    if (quantity <= 0) {
      throw new Error('OrderItemContext: La cantidad solicitada debe ser superior a 0.');
    }
  }

  getProductId(): number {
    return this.flyweight.id;
  }

  getProductName(): string {
    return this.flyweight.name;
  }

  getQuantity(): number {
    return this.quantity;
  }

  getUnitPrice(): number {
    return this.flyweight.calculatePrice(this);
  }

  getSubtotal(): number {
    return this.getUnitPrice() * this.quantity;
  }

  getDescription(): string {
    return this.flyweight.formatDescription(this);
  }

  renderKitchenTicket(): KitchenTicketLine {
    return this.flyweight.renderKitchenTicket(this);
  }
}

