import { DeliveryPlan, DeliveryType } from './delivery-plan.interface.js';

/**
 * Producto Concreto 1: Entrega Estándar en Motocicleta
 * Equilibrio clásico entre velocidad y costo de operación.
 */
export class StandardDeliveryPlan implements DeliveryPlan {
  readonly type: DeliveryType = 'STANDARD';
  readonly title = 'Entrega Estándar (Motocicleta)';
  readonly description = 'Reparto estándar confiable con motociclista asignado en ruta balanceada.';
  readonly vehicleIcon = '🏍️';
  readonly speedKmH = 25;
  readonly baseFeeMultiplier = 1.0;
  readonly perKmRate = 1200;

  calculateCost(baseZoneFee: number, distanceKm: number, isRushHour: boolean): number {
    const base = baseZoneFee * this.baseFeeMultiplier + distanceKm * this.perKmRate;
    return isRushHour ? Math.round(base * 1.25) : Math.round(base);
  }

  estimateDeliveryMinutes(distanceKm: number): number {
    const travelMinutes = (distanceKm / this.speedKmH) * 60;
    const prepMinutes = 15;
    return Math.round(prepMinutes + travelMinutes);
  }

  getStrategyName(isRushHour: boolean): string {
    return isRushHour ? 'RUSH_HOUR_STANDARD' : 'STANDARD_DISTANCE';
  }
}

/**
 * Producto Concreto 2: Entrega Express Prioritaria
 * Despacho urgente directo, sin paradas intermedias, mayor velocidad, recargo prioritario.
 */
export class ExpressDeliveryPlan implements DeliveryPlan {
  readonly type: DeliveryType = 'EXPRESS';
  readonly title = 'Entrega Express Prioritaria (Ruta Directa)';
  readonly description = 'Despacho prioritario exclusivo con asignación inmediata sin esperas.';
  readonly vehicleIcon = '⚡';
  readonly speedKmH = 35;
  readonly baseFeeMultiplier = 1.35; // +35% sobre tarifa de zona
  readonly perKmRate = 1800;

  calculateCost(baseZoneFee: number, distanceKm: number, isRushHour: boolean): number {
    const base = baseZoneFee * this.baseFeeMultiplier + distanceKm * this.perKmRate;
    return isRushHour ? Math.round(base * 1.30) : Math.round(base);
  }

  estimateDeliveryMinutes(distanceKm: number): number {
    const travelMinutes = (distanceKm / this.speedKmH) * 60;
    const prepMinutes = 10; // Prioridad en empaque
    return Math.round(prepMinutes + travelMinutes);
  }

  getStrategyName(isRushHour: boolean): string {
    return isRushHour ? 'RUSH_HOUR_EXPRESS' : 'EXPRESS_PRIORITY';
  }
}

/**
 * Producto Concreto 3: Entrega Eco en Bicicleta
 * Despacho urbano ecológico con 0 emisiones. Tarifa reducida, apto para distancias cortas.
 */
export class EcoBicycleDeliveryPlan implements DeliveryPlan {
  readonly type: DeliveryType = 'ECO';
  readonly title = 'Entrega Eco (Bicicleta Urbana)';
  readonly description = 'Despacho ecológico con 0 huella de carbono y tarifa preferencial para distancias cortas.';
  readonly vehicleIcon = '🚲';
  readonly speedKmH = 16;
  readonly baseFeeMultiplier = 0.85; // 15% descuento ecológico en tarifa base
  readonly perKmRate = 900;

  calculateCost(baseZoneFee: number, distanceKm: number, isRushHour: boolean): number {
    const base = baseZoneFee * this.baseFeeMultiplier + distanceKm * this.perKmRate;
    // En hora pico en bicicleta el tráfico vehicular no retrasa tanto
    return isRushHour ? Math.round(base * 1.10) : Math.round(base);
  }

  estimateDeliveryMinutes(distanceKm: number): number {
    const travelMinutes = (distanceKm / this.speedKmH) * 60;
    const prepMinutes = 15;
    return Math.round(prepMinutes + travelMinutes);
  }

  getStrategyName(isRushHour: boolean): string {
    return isRushHour ? 'ECO_RUSH_HOUR' : 'ECO_FRIENDLY';
  }
}
