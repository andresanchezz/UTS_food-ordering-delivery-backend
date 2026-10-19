import { IDishFlyweight, IOrderItemExtrinsic, KitchenTicketLine } from './dish-flyweight.interface.js';

/**
 * Contexto del Patrón Flyweight (Estado Extrínseco).
 *
 * Contiene únicamente las variables mutables o particulares de cada renglón de pedido:
 * - Cantidad solicitada
 * - Referencias ligeras a los toppings seleccionados
 * - Notas particulares del cliente ("Término medio", "Sin cebolla")
 *
 * En lugar de duplicar los 512KB de receta, textura e información nutricional,
 * mantiene un puntero en memoria hacia el Flyweight compartido correspondiente.
 */
export class OrderItemContext implements IOrderItemExtrinsic {
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

  /**
   * Delega en el Flyweight el cómputo del precio unitario pasando este contexto.
   */
  getUnitPrice(): number {
    return this.flyweight.calculatePrice(this);
  }

  /**
   * Subtotal del renglón (precio unitario acumulado * cantidad).
   */
  getSubtotal(): number {
    return this.getUnitPrice() * this.quantity;
  }

  /**
   * Delega en el Flyweight el formato de descripción legible.
   */
  getDescription(): string {
    return this.flyweight.formatDescription(this);
  }

  /**
   * ID del producto base.
   */
  getProductId(): number {
    return this.flyweight.id;
  }

  /**
   * Nombre del producto base.
   */
  getProductName(): string {
    return this.flyweight.name;
  }

  /**
   * Genera el desglose para cocina usando la operación del Flyweight.
   */
  renderKitchenTicket(): KitchenTicketLine {
    return this.flyweight.renderKitchenTicket(this);
  }
}
