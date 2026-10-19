import { DeliveryPlan, DeliveryType } from './delivery-plan.interface.js';

export interface DeliveryQuoteResult {
  fee: number;
  strategy: string;
  distanceKm: number;
  deliveryType: DeliveryType;
  title: string;
  vehicleIcon: string;
  estimatedMinutes: number;
  description: string;
}

/**
 * Creador Base del Patrón Creacional FACTORY METHOD (GoF / Refactoring Guru).
 * Declara el método de fábrica abstracto `createDeliveryPlan()` que las subclases
 * deben implementar para instanciar su producto concreto correspondiente.
 *
 * Contiene además la lógica de negocio central que opera sobre el producto
 * creado por el Factory Method sin acoplarse a su clase concreta.
 */
export abstract class DeliveryPlanCreator {
  /**
   * FACTORY METHOD (GoF):
   * Cada creador concreto implementa este método para devolver una instancia
   * del producto concreto que le corresponde (StandardDeliveryPlan, ExpressDeliveryPlan, etc.).
   */
  abstract createDeliveryPlan(): DeliveryPlan;

  /**
   * Operación de negocio del Creador:
   * Invoca el Factory Method para obtener el plan y calcula la cotización
   * de despacho de forma desacoplada.
   */
  getDispatchQuote(
    baseZoneFee: number,
    distanceKm: number,
    isRushHour: boolean,
  ): DeliveryQuoteResult {
    // Llamada al Factory Method
    const plan = this.createDeliveryPlan();

    const fee = plan.calculateCost(baseZoneFee, distanceKm, isRushHour);
    const estimatedMinutes = plan.estimateDeliveryMinutes(distanceKm);
    const strategy = plan.getStrategyName(isRushHour);

    return {
      fee,
      strategy,
      distanceKm,
      deliveryType: plan.type,
      title: plan.title,
      vehicleIcon: plan.vehicleIcon,
      estimatedMinutes,
      description: plan.description,
    };
  }
}
