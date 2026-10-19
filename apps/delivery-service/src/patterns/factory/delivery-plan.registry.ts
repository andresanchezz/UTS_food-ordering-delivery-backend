import { DeliveryType } from './delivery-plan.interface.js';
import { DeliveryPlanCreator, DeliveryQuoteResult } from './delivery-plan.creator.js';
import {
  StandardDeliveryCreator,
  ExpressDeliveryCreator,
  EcoBicycleDeliveryCreator,
} from './delivery-plan.creators.js';

/**
 * Registro y despachador de Creadores del Patrón Factory Method.
 * Permite resolver el Creador adecuado dinámicamente según la modalidad de despacho
 * seleccionada por el cliente.
 */
export class DeliveryPlanRegistry {
  private static creators: Map<DeliveryType, DeliveryPlanCreator> = new Map([
    ['STANDARD', new StandardDeliveryCreator()],
    ['EXPRESS', new ExpressDeliveryCreator()],
    ['ECO', new EcoBicycleDeliveryCreator()],
  ]);

  /**
   * Obtiene el Creador de Factory Method para el tipo solicitado.
   * Si no se especifica o no existe, usa 'STANDARD' por defecto (retrocompatibilidad).
   */
  static getCreator(type?: DeliveryType | string): DeliveryPlanCreator {
    const normalized = (type ?? 'STANDARD').trim().toUpperCase() as DeliveryType;
    const creator = this.creators.get(normalized);
    if (!creator) {
      return this.creators.get('STANDARD')!;
    }
    return creator;
  }

  /**
   * Genera las cotizaciones de todas las modalidades disponibles usando sus respectivos Creadores.
   */
  static getQuotesForAllPlans(
    baseZoneFee: number,
    distanceKm: number,
    isRushHour: boolean,
  ): DeliveryQuoteResult[] {
    return Array.from(this.creators.values()).map((creator) =>
      creator.getDispatchQuote(baseZoneFee, distanceKm, isRushHour),
    );
  }
}
