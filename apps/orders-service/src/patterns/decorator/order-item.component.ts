/**
 * Componente base del Patrón Estructural DECORATOR (GoF / Refactoring Guru).
 * Define la interfaz común tanto para el producto base como para los decoradores
 * de ingredientes/adicionales.
 */
export interface OrderItemComponent {
  /** Precio acumulado del ítem incluyendo sus decoradores */
  getPrice(): number;

  /** Descripción legible acumulada (ej: "Hamburguesa Clásica + Extra Queso + Tocineta") */
  getDescription(): string;

  /** ID del producto base del menú */
  getBaseProductId(): number;

  /** Nombre base del producto del menú */
  getBaseProductName(): string;

  /** Cantidad solicitada */
  getQuantity(): number;

  /** Lista de códigos de adicionales aplicados (ej: ['CHEESE', 'BACON']) */
  getToppingCodes(): string[];
}
