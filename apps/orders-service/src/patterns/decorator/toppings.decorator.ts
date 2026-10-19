import { OrderItemComponent } from './order-item.component.js';
import { OrderItemDecorator } from './order-item.decorator.js';

/**
 * Catálogo formal de adicionales disponibles en el sistema.
 */
export interface ToppingDefinition {
  code: string;
  name: string;
  price: number;
  icon: string;
}

export const AVAILABLE_TOPPINGS: Record<string, ToppingDefinition> = {
  CHEESE: {
    code: 'CHEESE',
    name: 'Extra Queso Cheddar',
    price: 3000,
    icon: '🧀',
  },
  BACON: {
    code: 'BACON',
    name: 'Tocineta Crispy Ahumada',
    price: 4500,
    icon: '🥓',
  },
  SAUCE: {
    code: 'SAUCE',
    name: 'Salsa Especial Artesanal',
    price: 1500,
    icon: '🥫',
  },
};

/**
 * Decorador Concreto 1: Extra Queso
 * Agrega $3.000 al precio y anota la adición en la descripción.
 */
export class ExtraCheeseDecorator extends OrderItemDecorator {
  static readonly EXTRA_PRICE = 3000;
  static readonly LABEL = 'Extra Queso';

  override getPrice(): number {
    return this.wrappee.getPrice() + ExtraCheeseDecorator.EXTRA_PRICE;
  }

  override getDescription(): string {
    return `${this.wrappee.getDescription()} + ${ExtraCheeseDecorator.LABEL} (+$${ExtraCheeseDecorator.EXTRA_PRICE.toLocaleString('es-CO')})`;
  }

  override getToppingCodes(): string[] {
    return [...this.wrappee.getToppingCodes(), 'CHEESE'];
  }
}

/**
 * Decorador Concreto 2: Tocineta Crispy
 * Agrega $4.500 al precio y anota la adición en la descripción.
 */
export class BaconDecorator extends OrderItemDecorator {
  static readonly EXTRA_PRICE = 4500;
  static readonly LABEL = 'Tocineta Crispy';

  override getPrice(): number {
    return this.wrappee.getPrice() + BaconDecorator.EXTRA_PRICE;
  }

  override getDescription(): string {
    return `${this.wrappee.getDescription()} + ${BaconDecorator.LABEL} (+$${BaconDecorator.EXTRA_PRICE.toLocaleString('es-CO')})`;
  }

  override getToppingCodes(): string[] {
    return [...this.wrappee.getToppingCodes(), 'BACON'];
  }
}

/**
 * Decorador Concreto 3: Salsa Especial
 * Agrega $1.500 al precio y anota la adición en la descripción.
 */
export class SpecialSauceDecorator extends OrderItemDecorator {
  static readonly EXTRA_PRICE = 1500;
  static readonly LABEL = 'Salsa Especial';

  override getPrice(): number {
    return this.wrappee.getPrice() + SpecialSauceDecorator.EXTRA_PRICE;
  }

  override getDescription(): string {
    return `${this.wrappee.getDescription()} + ${SpecialSauceDecorator.LABEL} (+$${SpecialSauceDecorator.EXTRA_PRICE.toLocaleString('es-CO')})`;
  }

  override getToppingCodes(): string[] {
    return [...this.wrappee.getToppingCodes(), 'SAUCE'];
  }
}

/**
 * Función auxiliar para apilar decoradores dinámicamente según la lista de códigos solicitada.
 */
export function applyToppings(
  baseComponent: OrderItemComponent,
  toppingCodes: string[] = [],
): OrderItemComponent {
  let decorated = baseComponent;
  for (const code of toppingCodes) {
    const normalized = code.trim().toUpperCase();
    switch (normalized) {
      case 'CHEESE':
        decorated = new ExtraCheeseDecorator(decorated);
        break;
      case 'BACON':
        decorated = new BaconDecorator(decorated);
        break;
      case 'SAUCE':
        decorated = new SpecialSauceDecorator(decorated);
        break;
      default:
        // Código no reconocido: se omite sin romper el flujo
        break;
    }
  }
  return decorated;
}
