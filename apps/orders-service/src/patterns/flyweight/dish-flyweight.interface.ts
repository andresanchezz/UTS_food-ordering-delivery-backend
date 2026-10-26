/**
 * Patrón Estructural: FLYWEIGHT (GoF)
 * Contratos para separar el Estado Intrínseco (compartido en RAM) del Extrínseco (contexto por pedido).
 */

export interface IOrderItemExtrinsic {
  readonly quantity: number;
  readonly notes?: string;
  readonly toppings?: readonly IDishFlyweight[];
}

export interface KitchenTicketLine {
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  toppings: string[];
  allergens: string[];
  calories: number;
  cookingNotes?: string;
  guide: string;
}

export interface IDishFlyweight {
  readonly id: number;
  readonly code: string;
  readonly name: string;
  readonly basePrice: number;
  readonly category: string;
  readonly icon: string;
  readonly calories: number;
  readonly allergens: readonly string[];
  readonly preparationGuide: string;

  calculatePrice(extrinsic: IOrderItemExtrinsic): number;
  formatDescription(extrinsic: IOrderItemExtrinsic): string;
  renderKitchenTicket(extrinsic: IOrderItemExtrinsic): KitchenTicketLine;
}

