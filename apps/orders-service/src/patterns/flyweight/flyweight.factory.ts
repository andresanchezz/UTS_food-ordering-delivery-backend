import { DishFlyweight } from './dish-flyweight.js';

export interface DishRecipeData {
  id: number;
  code: string;
  name: string;
  basePrice: number;
  category: string;
  icon: string;
  calories: number;
  allergens: string[];
  preparationGuide: string;
}

export const RECIPES_DATA: DishRecipeData[] = [
  { id: 1, code: 'BURGER_CLASSIC', name: 'Hamburguesa Clásica', basePrice: 18000, category: 'BURGER', icon: '🍔', calories: 650, allergens: ['Gluten', 'Sésamo', 'Lácteos'], preparationGuide: 'Carne de res 150g a la plancha término 3/4. Pan brioche sellado.' },
  { id: 2, code: 'BURGER_DOUBLE', name: 'Hamburguesa Doble Carne', basePrice: 24000, category: 'BURGER', icon: '🍔', calories: 920, allergens: ['Gluten', 'Sésamo', 'Lácteos'], preparationGuide: 'Doble carne 150g (300g total), doble queso cheddar fundido al vapor.' },
  { id: 3, code: 'FRIES_MED', name: 'Papas Fritas Medianas', basePrice: 7000, category: 'SIDE', icon: '🍟', calories: 380, allergens: [], preparationGuide: 'Freír a 180°C durante 3.5 minutos hasta dorado crujiente.' },
  { id: 4, code: 'SODA_400', name: 'Gaseosa 400ml', basePrice: 5000, category: 'BEVERAGE', icon: '🥤', calories: 140, allergens: [], preparationGuide: 'Servir fría a 4°C con hielo en vaso biodegradable.' },
  { id: 5, code: 'COMBO_CLASSIC', name: 'Combo Clásico (Hamburguesa + Papas + Gaseosa)', basePrice: 26000, category: 'COMBO', icon: '🍔🍟🥤', calories: 1170, allergens: ['Gluten', 'Sésamo', 'Lácteos'], preparationGuide: 'Ensamblar hamburguesa clásica + papas fritas medianas + gaseosa 400ml.' },
];

export const TOPPINGS_DATA: DishRecipeData[] = [
  { id: 101, code: 'MEAT', name: 'Carne Extra (150g)', basePrice: 6000, category: 'TOPPING', icon: '🥩', calories: 250, allergens: [], preparationGuide: 'Parrilla directa a 220°C con sal marina gruesa.' },
  { id: 102, code: 'CHEESE', name: 'Extra Queso Cheddar', basePrice: 3000, category: 'TOPPING', icon: '🧀', calories: 110, allergens: ['Lácteos'], preparationGuide: 'Fundir sobre la carne 30 segundos con campana de vapor.' },
  { id: 103, code: 'BACON', name: 'Tocineta Crispy', basePrice: 4500, category: 'TOPPING', icon: '🥓', calories: 160, allergens: [], preparationGuide: 'Tostar a la plancha hasta punto crocante sin quemar grasa.' },
  { id: 104, code: 'SAUCE', name: 'Salsa Especial Artesanal', basePrice: 1500, category: 'TOPPING', icon: '🥫', calories: 75, allergens: ['Huevo', 'Mostaza'], preparationGuide: 'Dispensar 25ml con boquilla sobre la base del pan.' },
];

export function getRawDishData(key: string | number, fallbackName?: string, fallbackPrice: number = 0): DishRecipeData {
  const rawKey = String(key).trim();
  const all = [...RECIPES_DATA, ...TOPPINGS_DATA];
  const found = all.find(
    (d) =>
      String(d.id) === rawKey ||
      d.code.toUpperCase() === rawKey.toUpperCase() ||
      d.name.toLowerCase() === rawKey.toLowerCase() ||
      (fallbackName && d.name.toLowerCase() === fallbackName.trim().toLowerCase()),
  );
  if (found) return found;
  return {
    id: typeof key === 'number' ? key : 999,
    code: rawKey.toUpperCase(),
    name: fallbackName ?? rawKey,
    basePrice: Number(fallbackPrice) || 0,
    category: 'CUSTOM',
    icon: '🍽️',
    calories: 0,
    allergens: [],
    preparationGuide: 'Preparación estándar de cocina',
  };
}

/**
 * FÁBRICA FLYWEIGHT: Administra el pool de instancias únicas compartidas en RAM.
 */
export class DishFlyweightFactory {
  private static readonly pool: Map<string, DishFlyweight> = new Map();

  static {
    DishFlyweightFactory.initializePool();
  }

  public static initializePool(): void {
    DishFlyweightFactory.pool.clear();
    for (const item of [...RECIPES_DATA, ...TOPPINGS_DATA]) {
      DishFlyweightFactory.registerInPool(
        new DishFlyweight(
          item.id, item.code, item.name, item.basePrice, item.category,
          item.icon, item.calories, item.allergens, item.preparationGuide,
        ),
      );
    }
  }

  private static registerInPool(fw: DishFlyweight): void {
    DishFlyweightFactory.pool.set(fw.code.toUpperCase(), fw);
    DishFlyweightFactory.pool.set(String(fw.id), fw);
    DishFlyweightFactory.pool.set(fw.name.toLowerCase(), fw);
  }

  static get(key: string | number, fallbackName?: string, fallbackPrice: number = 0): DishFlyweight {
    const rawKey = String(key).trim();
    const existing =
      DishFlyweightFactory.pool.get(rawKey.toUpperCase()) ||
      DishFlyweightFactory.pool.get(rawKey) ||
      DishFlyweightFactory.pool.get(rawKey.toLowerCase()) ||
      (fallbackName ? DishFlyweightFactory.pool.get(fallbackName.trim().toLowerCase()) : undefined);

    if (existing) return existing;

    const raw = getRawDishData(key, fallbackName, fallbackPrice);
    const created = new DishFlyweight(
      raw.id, raw.code, raw.name, raw.basePrice, raw.category,
      raw.icon, raw.calories, raw.allergens, raw.preparationGuide,
    );
    DishFlyweightFactory.registerInPool(created);
    return created;
  }

  static getTopping(code: string): DishFlyweight {
    return DishFlyweightFactory.get(code.toUpperCase());
  }

  static getAllDishes(): DishFlyweight[] {
    return RECIPES_DATA.map((r) => DishFlyweightFactory.get(r.code));
  }

  static getAllToppings(): { code: string; name: string; price: number; icon: string }[] {
    return TOPPINGS_DATA.map((t) => ({ code: t.code, name: t.name, price: t.basePrice, icon: t.icon }));
  }

  static getUniquePool(): DishFlyweight[] {
    return Array.from(new Set(DishFlyweightFactory.pool.values()));
  }

  static getPoolSize(): number {
    return DishFlyweightFactory.getUniquePool().length;
  }

  static clearPool(): void {
    DishFlyweightFactory.pool.clear();
  }
}


