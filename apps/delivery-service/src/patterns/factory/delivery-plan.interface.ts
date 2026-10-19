/**
 * Tipos de entrega soportados por la logística de despachos.
 */
export type DeliveryType = 'STANDARD' | 'EXPRESS' | 'ECO';

/**
 * Interfaz de Producto del Patrón FACTORY METHOD (GoF / Refactoring Guru).
 * Define el contrato común para todos los planes de entrega generados
 * por las fábricas de despacho.
 */
export interface DeliveryPlan {
  /** Identificador de la modalidad de entrega */
  readonly type: DeliveryType;

  /** Título visible del plan */
  readonly title: string;

  /** Descripción detallada del plan logístico */
  readonly description: string;

  /** Icono representativo del vehículo */
  readonly vehicleIcon: string;

  /** Velocidad promedio de desplazamiento en km/h */
  readonly speedKmH: number;

  /** Factor multiplicador sobre la tarifa base de la zona */
  readonly baseFeeMultiplier: number;

  /** Costo por kilómetro recorrido */
  readonly perKmRate: number;

  /**
   * Calcula el costo total de envío según la distancia, tarifa base de zona y hora pico.
   */
  calculateCost(baseZoneFee: number, distanceKm: number, isRushHour: boolean): number;

  /**
   * Estima los minutos de entrega sumando tiempo de preparación y desplazamiento.
   */
  estimateDeliveryMinutes(distanceKm: number): number;

  /**
   * Retorna el nombre técnico de la estrategia de cálculo aplicada.
   */
  getStrategyName(isRushHour: boolean): string;
}
