import { describe, it, expect } from 'vitest';
import {
  BaseOrderItem,
  ExtraCheeseDecorator,
  BaconDecorator,
  SpecialSauceDecorator,
  applyToppings,
} from '../src/patterns/decorator/index.js';

describe('Patrón Estructural: Decorator (Personalización de ítems)', () => {
  it('debe calcular el precio y descripción base de un producto sin decoradores', () => {
    const item = new BaseOrderItem(1, 'Hamburguesa Clásica', 18000, 2);

    expect(item.getPrice()).toBe(18000);
    expect(item.getDescription()).toBe('Hamburguesa Clásica');
    expect(item.getBaseProductId()).toBe(1);
    expect(item.getQuantity()).toBe(2);
    expect(item.getToppingCodes()).toEqual([]);
  });

  it('debe decorar con Extra Queso incrementando el precio y actualizando descripción', () => {
    const base = new BaseOrderItem(1, 'Hamburguesa Clásica', 18000, 1);
    const withCheese = new ExtraCheeseDecorator(base);

    expect(withCheese.getPrice()).toBe(21000); // 18000 + 3000
    expect(withCheese.getDescription()).toContain('Extra Queso');
    expect(withCheese.getToppingCodes()).toContain('CHEESE');
  });

  it('debe apilar múltiples decoradores dinámicamente en cualquier orden', () => {
    const base = new BaseOrderItem(1, 'Hamburguesa Clásica', 18000, 1);

    // Envolver con Queso (+3000) y luego Tocineta (+4500)
    const fullyLoaded = new BaconDecorator(new ExtraCheeseDecorator(base));

    expect(fullyLoaded.getPrice()).toBe(25500); // 18000 + 3000 + 4500
    expect(fullyLoaded.getDescription()).toContain('Extra Queso');
    expect(fullyLoaded.getDescription()).toContain('Tocineta Crispy');
    expect(fullyLoaded.getToppingCodes()).toEqual(['CHEESE', 'BACON']);
  });

  it('debe soportar la adición de los 3 decoradores simultáneamente', () => {
    const base = new BaseOrderItem(2, 'Hamburguesa Doble Carne', 24000, 1);
    const superBurger = new SpecialSauceDecorator(
      new BaconDecorator(new ExtraCheeseDecorator(base)),
    );

    // 24000 + 3000 + 4500 + 1500 = 33000
    expect(superBurger.getPrice()).toBe(33000);
    expect(superBurger.getDescription()).toContain('Extra Queso');
    expect(superBurger.getDescription()).toContain('Tocineta Crispy');
    expect(superBurger.getDescription()).toContain('Salsa Especial');
    expect(superBurger.getToppingCodes()).toEqual(['CHEESE', 'BACON', 'SAUCE']);
  });

  it('debe utilizar la función auxiliar applyToppings para componer decoradores a partir de un arreglo', () => {
    const base = new BaseOrderItem(1, 'Papas Medianas', 7000, 1);
    const decorated = applyToppings(base, ['CHEESE', 'SAUCE']);

    expect(decorated.getPrice()).toBe(11500); // 7000 + 3000 + 1500
    expect(decorated.getToppingCodes()).toEqual(['CHEESE', 'SAUCE']);
  });
});
