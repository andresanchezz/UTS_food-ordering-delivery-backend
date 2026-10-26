import { IDishFlyweight, IOrderItemExtrinsic, KitchenTicketLine } from './dish-flyweight.interface.js';

/**
 * FLYWEIGHT CONCRETO (Estado Intrínseco):
 * Almacena datos invariantes del catálogo que se comparten entre miles de pedidos
 * (receta técnica, alérgenos, calorías y tarifa base).
 */
export class DishFlyweight implements IDishFlyweight {
  constructor(
    public readonly id: number,
    public readonly code: string,
    public readonly name: string,
    public readonly basePrice: number,
    public readonly category: string,
    public readonly icon: string,
    public readonly calories: number,
    public readonly allergens: readonly string[],
    public readonly preparationGuide: string,
  ) {}

  calculatePrice(extrinsic: IOrderItemExtrinsic): number {
    const toppingsCost = (extrinsic.toppings ?? []).reduce((sum, top) => sum + top.basePrice, 0);
    return this.basePrice + toppingsCost;
  }

  formatDescription(extrinsic: IOrderItemExtrinsic): string {
    const extras = (extrinsic.toppings ?? [])
      .map((t) => `${t.name} (+$${t.basePrice.toLocaleString('es-CO')})`)
      .join(' + ');
    const note = extrinsic.notes?.trim() ? ` | Nota: ${extrinsic.notes.trim()}` : '';
    return `${this.name}${extras ? ` + ${extras}` : ''}${note}`;
  }

  renderKitchenTicket(extrinsic: IOrderItemExtrinsic): KitchenTicketLine {
    const toppings = extrinsic.toppings ?? [];
    const unitPrice = this.calculatePrice(extrinsic);
    const allergens = Array.from(new Set([...this.allergens, ...toppings.flatMap((t) => t.allergens)]));
    const calories = (this.calories + toppings.reduce((acc, t) => acc + t.calories, 0)) * extrinsic.quantity;

    return {
      productName: this.name,
      quantity: extrinsic.quantity,
      unitPrice,
      subtotal: unitPrice * extrinsic.quantity,
      toppings: toppings.map((t) => `${t.icon} ${t.name}`),
      allergens,
      calories,
      cookingNotes: extrinsic.notes,
      guide: this.preparationGuide,
    };
  }
}

