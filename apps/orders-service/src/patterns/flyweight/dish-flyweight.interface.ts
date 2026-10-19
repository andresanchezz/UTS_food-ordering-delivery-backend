/**
 * UTS - Patrones de Diseño de Software
 * Patrón Estructural: FLYWEIGHT (GoF / Refactoring Guru)
 *
 * Contratos de interfaces para el Estado Intrínseco (Compartido)
 * y el Estado Extrínseco (Contexto de cada pedido en tiempo de ejecución).
 */

export interface IOrderItemExtrinsic {
  /** Cantidad solicitada en este pedido específico */
  readonly quantity: number;
  /** Notas personalizadas del comensal (ej: 'Término medio', 'Sin cebolla') */
  readonly notes?: string;
  /** Lista de adicionales/toppings seleccionados para este ítem específico */
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

/**
 * Interfaz del Flyweight:
 * Declara las operaciones de negocio que reciben el estado extrínseco por parámetro
 * operando sobre los datos intrínsecos inmutables que residen en memoria compartida.
 */
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
  readonly assetTexture: string;

  /**
   * Calcula el precio unitario combinando la tarifa base intrínseca
   * con los adicionales extrínsecos seleccionados por el cliente.
   */
  calculatePrice(extrinsic: IOrderItemExtrinsic): number;

  /**
   * Genera la descripción detallada del producto con sus adicionales y notas.
   */
  formatDescription(extrinsic: IOrderItemExtrinsic): string;

  /**
   * Genera la comanda detallada para el monitor de la cocina con alertas de alérgenos y guía técnica.
   */
  renderKitchenTicket(extrinsic: IOrderItemExtrinsic): KitchenTicketLine;
}
