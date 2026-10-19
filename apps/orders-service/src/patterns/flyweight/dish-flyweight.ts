import { IDishFlyweight, IOrderItemExtrinsic, KitchenTicketLine } from './dish-flyweight.interface.js';

/**
 * Patrón Estructural: FLYWEIGHT CONCRETO (GoF / Refactoring Guru)
 *
 * Almacena el Estado Intrínseco: datos inmutables y compartidos universalmente
 * entre miles de comandas y pedidos simultáneos (receta, alérgenos, calorías,
 * precio base, textura/imagen pesada simulada de 512KB).
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
    public readonly assetTexture: string = 'TEXTURE_DATA_512KB_INTRINSIC_SPEC',
  ) {}

  /**
   * Operación Flyweight con Estado Extrínseco:
   * Calcula el precio unitario exacto sumando la tarifa base intrínseca
   * y los adicionales pasados en el contexto del pedido.
   */
  calculatePrice(extrinsic: IOrderItemExtrinsic): number {
    const toppingsPrice = extrinsic.toppings && extrinsic.toppings.length > 0
      ? extrinsic.toppings.reduce((sum, top) => sum + top.basePrice, 0)
      : 0;
    return this.basePrice + toppingsPrice;
  }

  /**
   * Da formato a la descripción textual agregando los adicionales y notas.
   */
  formatDescription(extrinsic: IOrderItemExtrinsic): string {
    const toppingDescriptions = extrinsic.toppings && extrinsic.toppings.length > 0
      ? ` + ${extrinsic.toppings.map((t) => `${t.name} (+$${t.basePrice.toLocaleString('es-CO')})`).join(' + ')}`
      : '';
    const notePart = extrinsic.notes && extrinsic.notes.trim().length > 0
      ? ` | Nota: ${extrinsic.notes.trim()}`
      : '';
    return `${this.name}${toppingDescriptions}${notePart}`;
  }

  /**
   * Genera el desglose técnico para la cocina combinando información intrínseca
   * de recetas y alérgenos con los modificadores particulares del comensal.
   */
  renderKitchenTicket(extrinsic: IOrderItemExtrinsic): KitchenTicketLine {
    const unitPrice = this.calculatePrice(extrinsic);
    const subtotal = unitPrice * extrinsic.quantity;
    const toppingNames = extrinsic.toppings
      ? extrinsic.toppings.map((t) => `${t.icon} ${t.name}`)
      : [];

    const allAllergens = Array.from(
      new Set([
        ...this.allergens,
        ...(extrinsic.toppings ? extrinsic.toppings.flatMap((t) => t.allergens) : []),
      ]),
    );

    const totalCalories = (
      this.calories +
      (extrinsic.toppings ? extrinsic.toppings.reduce((acc, t) => acc + t.calories, 0) : 0)
    ) * extrinsic.quantity;

    return {
      productName: this.name,
      quantity: extrinsic.quantity,
      unitPrice,
      subtotal,
      toppings: toppingNames,
      allergens: allAllergens,
      calories: totalCalories,
      cookingNotes: extrinsic.notes,
      guide: this.preparationGuide,
    };
  }
}
