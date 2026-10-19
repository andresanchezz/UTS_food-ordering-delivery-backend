import { DishFlyweight } from './dish-flyweight.js';

/**
 * Patrón Estructural: FÁBRICA FLYWEIGHT (GoF / Refactoring Guru)
 *
 * Administra el pool de objetos Flyweight compartidos en memoria.
 * Garantiza que para cada plato, ingrediente o adición del menú exista
 * UNA ÚNICA INSTANCIA en toda la memoria del proceso servidor.
 */
export class DishFlyweightFactory {
  private static readonly pool: Map<string, DishFlyweight> = new Map();

  // Catálogo canónico con recetas pesadas y especificaciones intrínsecas
  private static readonly RECIPES_DATA = [
    {
      id: 1,
      code: 'BURGER_CLASSIC',
      name: 'Hamburguesa Clásica',
      basePrice: 18000,
      category: 'BURGER',
      icon: '🍔',
      calories: 650,
      allergens: ['Gluten', 'Sésamo', 'Lácteos'],
      preparationGuide: 'Carne de res 150g a la plancha término 3/4. Pan brioche sellado.',
    },
    {
      id: 2,
      code: 'BURGER_DOUBLE',
      name: 'Hamburguesa Doble Carne',
      basePrice: 24000,
      category: 'BURGER',
      icon: '🍔',
      calories: 920,
      allergens: ['Gluten', 'Sésamo', 'Lácteos'],
      preparationGuide: 'Doble carne 150g (300g total), doble queso cheddar fundido al vapor.',
    },
    {
      id: 3,
      code: 'FRIES_MED',
      name: 'Papas Fritas Medianas',
      basePrice: 7000,
      category: 'SIDE',
      icon: '🍟',
      calories: 380,
      allergens: [],
      preparationGuide: 'Freír a 180°C durante 3.5 minutos hasta dorado crujiente.',
    },
    {
      id: 4,
      code: 'SODA_400',
      name: 'Gaseosa 400ml',
      basePrice: 5000,
      category: 'BEVERAGE',
      icon: '🥤',
      calories: 140,
      allergens: [],
      preparationGuide: 'Servir fría a 4°C con hielo en vaso biodegradable.',
    },
    {
      id: 5,
      code: 'COMBO_CLASSIC',
      name: 'Combo Clásico (Hamburguesa + Papas + Gaseosa)',
      basePrice: 26000,
      category: 'COMBO',
      icon: '🍔🍟🥤',
      calories: 1170,
      allergens: ['Gluten', 'Sésamo', 'Lácteos'],
      preparationGuide: 'Ensamblar hamburguesa clásica + papas fritas medianas + gaseosa 400ml.',
    },
  ];

  private static readonly TOPPINGS_DATA = [
    {
      id: 101,
      code: 'MEAT',
      name: 'Carne Extra (150g)',
      basePrice: 6000,
      category: 'TOPPING',
      icon: '🥩',
      calories: 250,
      allergens: [],
      preparationGuide: 'Parrilla directa a 220°C con sal marina gruesa.',
    },
    {
      id: 102,
      code: 'CHEESE',
      name: 'Extra Queso Cheddar',
      basePrice: 3000,
      category: 'TOPPING',
      icon: '🧀',
      calories: 110,
      allergens: ['Lácteos'],
      preparationGuide: 'Fundir sobre la carne 30 segundos con campana de vapor.',
    },
    {
      id: 103,
      code: 'BACON',
      name: 'Tocineta Crispy',
      basePrice: 4500,
      category: 'TOPPING',
      icon: '🥓',
      calories: 160,
      allergens: [],
      preparationGuide: 'Tostar a la plancha hasta punto crocante sin quemar grasa.',
    },
    {
      id: 104,
      code: 'SAUCE',
      name: 'Salsa Especial Artesanal',
      basePrice: 1500,
      category: 'TOPPING',
      icon: '🥫',
      calories: 75,
      allergens: ['Huevo', 'Mostaza'],
      preparationGuide: 'Dispensar 25ml con boquilla sobre la base del pan.',
    },
  ];

  static {
    DishFlyweightFactory.initializePool();
  }

  public static initializePool(): void {
    DishFlyweightFactory.pool.clear();

    for (const r of DishFlyweightFactory.RECIPES_DATA) {
      const flyweight = new DishFlyweight(
        r.id,
        r.code,
        r.name,
        r.basePrice,
        r.category,
        r.icon,
        r.calories,
        r.allergens,
        r.preparationGuide,
      );
      DishFlyweightFactory.registerInPool(flyweight);
    }

    for (const t of DishFlyweightFactory.TOPPINGS_DATA) {
      const flyweight = new DishFlyweight(
        t.id,
        t.code,
        t.name,
        t.basePrice,
        t.category,
        t.icon,
        t.calories,
        t.allergens,
        t.preparationGuide,
      );
      DishFlyweightFactory.registerInPool(flyweight);
    }
  }

  private static registerInPool(flyweight: DishFlyweight): void {
    DishFlyweightFactory.pool.set(flyweight.code.toUpperCase(), flyweight);
    DishFlyweightFactory.pool.set(String(flyweight.id), flyweight);
    DishFlyweightFactory.pool.set(flyweight.name.toLowerCase(), flyweight);
  }

  /**
   * Obtiene la instancia compartida (Flyweight) desde el pool por código, ID o nombre.
   * Si no existe, genera una nueva instancia compartible y la preserva en el pool.
   */
  static get(key: string | number): DishFlyweight {
    const rawKey = String(key).trim();
    const existing =
      DishFlyweightFactory.pool.get(rawKey.toUpperCase()) ||
      DishFlyweightFactory.pool.get(rawKey) ||
      DishFlyweightFactory.pool.get(rawKey.toLowerCase());

    if (existing) {
      return existing;
    }

    // Creación dinámica de rescate para productos no catalogados previamente
    const fallback = new DishFlyweight(
      typeof key === 'number' ? key : 999,
      rawKey.toUpperCase(),
      rawKey,
      0,
      'CUSTOM',
      '🍽️',
      0,
      [],
      'Preparación estándar de cocina',
    );
    DishFlyweightFactory.registerInPool(fallback);
    return fallback;
  }

  /**
   * Obtiene el Flyweight compartido de un adicional o topping por su código.
   */
  static getTopping(code: string): DishFlyweight {
    return DishFlyweightFactory.get(code.toUpperCase());
  }

  /**
   * Retorna la lista de todos los platos base del catálogo compartidos en el pool.
   */
  static getAllDishes(): DishFlyweight[] {
    const unique = new Set<DishFlyweight>();
    for (const r of DishFlyweightFactory.RECIPES_DATA) {
      const f = DishFlyweightFactory.pool.get(r.code);
      if (f) unique.add(f);
    }
    return Array.from(unique);
  }

  /**
   * Retorna la lista de toppings disponibles con sus tarifas y descripciones.
   */
  static getAllToppings(): { code: string; name: string; price: number; icon: string }[] {
    return DishFlyweightFactory.TOPPINGS_DATA.map((t) => ({
      code: t.code,
      name: t.name,
      price: t.basePrice,
      icon: t.icon,
    }));
  }

  /**
   * Retorna la cantidad de instancias Flyweight únicas que residen físicamente en memoria.
   */
  static getPoolSize(): number {
    return new Set(DishFlyweightFactory.pool.values()).size;
  }

  /**
   * Limpia el pool (útil para restablecer estados en pruebas unitarias).
   */
  static clearPool(): void {
    DishFlyweightFactory.pool.clear();
  }
}
