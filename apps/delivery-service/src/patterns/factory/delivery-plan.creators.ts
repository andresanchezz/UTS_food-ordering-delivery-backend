import { DeliveryPlan } from './delivery-plan.interface.js';
import { DeliveryPlanCreator } from './delivery-plan.creator.js';
import {
  StandardDeliveryPlan,
  ExpressDeliveryPlan,
  EcoBicycleDeliveryPlan,
} from './delivery-plans.js';

/**
 * Creador Concreto 1 (Factory Method):
 * Sobrescribe el Factory Method para instanciar un StandardDeliveryPlan.
 */
export class StandardDeliveryCreator extends DeliveryPlanCreator {
  createDeliveryPlan(): DeliveryPlan {
    return new StandardDeliveryPlan();
  }
}

/**
 * Creador Concreto 2 (Factory Method):
 * Sobrescribe el Factory Method para instanciar un ExpressDeliveryPlan.
 */
export class ExpressDeliveryCreator extends DeliveryPlanCreator {
  createDeliveryPlan(): DeliveryPlan {
    return new ExpressDeliveryPlan();
  }
}

/**
 * Creador Concreto 3 (Factory Method):
 * Sobrescribe el Factory Method para instanciar un EcoBicycleDeliveryPlan.
 */
export class EcoBicycleDeliveryCreator extends DeliveryPlanCreator {
  createDeliveryPlan(): DeliveryPlan {
    return new EcoBicycleDeliveryPlan();
  }
}
