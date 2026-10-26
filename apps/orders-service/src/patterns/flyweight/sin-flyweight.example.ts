import v8 from 'node:v8';
import { performance } from 'node:perf_hooks';
import { DishFlyweightFactory, getRawDishData, type DishRecipeData } from './flyweight.factory.js';
import { OrderItemContext } from './order-item-context.js';
import { IOrderItemInput } from '../builder/order.builder.interface.js';

export interface OrderFlyweightMetrics {
  mode: 'CON_FLYWEIGHT' | 'SIN_FLYWEIGHT';
  useFlyweight: boolean;
  itemsProcessed: number;
  executionTimeMs: number;
  memoryBytes: number;
  memoryKb: number;
  sharedPoolInstances: number;
  duplicatedInstancesCreated: number;
  comparison: {
    withFlyweightBytes: number;
    withoutFlyweightBytes: number;
    withFlyweightTimeMs: number;
    withoutFlyweightTimeMs: number;
    savedBytes: number;
    savedPercentage: number;
  };
}

/**
 * CLASE SIN FLYWEIGHT (Flujo alternativo switcheable en el backend):
 * No utiliza el Pool compartido. Cada ítem clona en memoria todos los datos
 * de la receta, alérgenos, calorías, guía de preparación y objetos de toppings.
 */
export class DishOrderItemSinFlyweight implements IOrderItemInput {
  public readonly id: number;
  public readonly code: string;
  public readonly name: string;
  public readonly basePrice: number;
  public readonly category: string;
  public readonly icon: string;
  public readonly calories: number;
  public readonly allergens: string[];
  public readonly preparationGuide: string;
  public readonly quantity: number;
  public readonly notes: string;
  public readonly extraToppings: DishRecipeData[];

  constructor(
    dishKey: string | number,
    quantity: number = 1,
    toppingCodes: string[] = [],
    notes: string = '',
    fallbackName?: string,
    fallbackPrice: number = 0,
  ) {
    const raw = getRawDishData(dishKey, fallbackName, fallbackPrice);
    this.id = raw.id;
    this.code = raw.code;
    this.name = raw.name;
    this.basePrice = raw.basePrice;
    this.category = raw.category;
    this.icon = raw.icon;
    this.calories = raw.calories;
    this.allergens = [...raw.allergens];
    this.preparationGuide = raw.preparationGuide;
    this.quantity = quantity;
    this.notes = notes;
    this.extraToppings = toppingCodes.map((code) => {
      const top = getRawDishData(code.toUpperCase());
      return { ...top, allergens: [...top.allergens] };
    });
  }

  getProductId(): number { return this.id; }
  getProductName(): string { return this.name; }
  getQuantity(): number { return this.quantity; }

  getUnitPrice(): number {
    return this.basePrice + this.extraToppings.reduce((acc, t) => acc + t.basePrice, 0);
  }

  getSubtotal(): number {
    return this.getUnitPrice() * this.quantity;
  }

  getDescription(): string {
    const extras = this.extraToppings
      .map((t) => `${t.name} (+$${t.basePrice.toLocaleString('es-CO')})`)
      .join(' + ');
    const note = this.notes?.trim() ? ` | Nota: ${this.notes.trim()}` : '';
    return `${this.name}${extras ? ` + ${extras}` : ''}${note}`;
  }

  calculateTotal(): number {
    return this.getSubtotal();
  }
}

export interface FlyweightComparisonItemInput {
  dishKey: string | number;
  quantity: number;
  toppingCodes: string[];
  notes?: string;
  fallbackName?: string;
  fallbackPrice?: number;
}

/**
 * Mide en tiempo real (con el serializador nativo V8 de Node y performance.now())
 * el peso en bytes/KB y tiempo de crear los ítems CON patrón vs SIN patrón.
 */
export function measureOrderFlyweightComparison(
  itemsInput: FlyweightComparisonItemInput[],
  useFlyweight: boolean = true,
): { builtItems: IOrderItemInput[]; metrics: OrderFlyweightMetrics } {
  // 1. Medir flujo CON Flyweight (reutilizando referencias del pool)
  const t0Con = performance.now();
  const conItems = itemsInput.map((it) => {
    const dishFw = DishFlyweightFactory.get(it.dishKey, it.fallbackName, it.fallbackPrice);
    const toppingFws = it.toppingCodes.map((c) => DishFlyweightFactory.getTopping(c));
    return new OrderItemContext(dishFw, it.quantity, toppingFws, it.notes);
  });
  const timeConMs = Number((performance.now() - t0Con).toFixed(4));

  const poolSnapshot = DishFlyweightFactory.getUniquePool();
  const basePoolBytes = v8.serialize(poolSnapshot).byteLength;
  const bytesCon = Math.max(1, v8.serialize([poolSnapshot, conItems]).byteLength - basePoolBytes);

  // 2. Medir flujo SIN Flyweight (clonando receta y toppings en cada instancia)
  const t0Sin = performance.now();
  const sinItems = itemsInput.map(
    (it) => new DishOrderItemSinFlyweight(it.dishKey, it.quantity, it.toppingCodes, it.notes ?? '', it.fallbackName, it.fallbackPrice),
  );
  const timeSinMs = Number((performance.now() - t0Sin).toFixed(4));
  const bytesSin = Math.max(1, v8.serialize([poolSnapshot, sinItems]).byteLength - basePoolBytes);

  const duplicatedObjectsSin = itemsInput.reduce((acc, it) => acc + 1 + it.toppingCodes.length, 0);
  const activeBytes = useFlyweight ? bytesCon : bytesSin;
  const savedBytes = Math.max(0, bytesSin - bytesCon);
  const savedPercentage = Number(((savedBytes / bytesSin) * 100).toFixed(1));

  return {
    builtItems: useFlyweight ? conItems : sinItems,
    metrics: {
      mode: useFlyweight ? 'CON_FLYWEIGHT' : 'SIN_FLYWEIGHT',
      useFlyweight,
      itemsProcessed: itemsInput.length,
      executionTimeMs: useFlyweight ? timeConMs : timeSinMs,
      memoryBytes: activeBytes,
      memoryKb: Number((activeBytes / 1024).toFixed(2)),
      sharedPoolInstances: useFlyweight ? DishFlyweightFactory.getPoolSize() : 0,
      duplicatedInstancesCreated: useFlyweight ? 0 : duplicatedObjectsSin,
      comparison: {
        withFlyweightBytes: bytesCon,
        withoutFlyweightBytes: bytesSin,
        withFlyweightTimeMs: timeConMs,
        withoutFlyweightTimeMs: timeSinMs,
        savedBytes,
        savedPercentage,
      },
    },
  };
}

/**
 * Benchmark comparativo real para N órdenes (ej. 10.000 órdenes):
 * Sin valores quemados; mide bytes reales en el grafo de memoria de V8 y tiempo de CPU.
 */
export function runFlyweightComparisonBenchmark(orderCount: number = 10000) {
  const poolSnapshot = DishFlyweightFactory.getUniquePool();
  const basePoolBytes = v8.serialize(poolSnapshot).byteLength;

  const startSin = performance.now();
  const sinFlyweightItems: DishOrderItemSinFlyweight[] = [];
  for (let i = 0; i < orderCount; i++) {
    sinFlyweightItems.push(new DishOrderItemSinFlyweight(1, 2, ['MEAT', 'CHEESE'], 'Sin cebolla'));
  }
  const tiempoSinMs = Number((performance.now() - startSin).toFixed(3));
  const bytesSin = Math.max(1, v8.serialize([poolSnapshot, sinFlyweightItems]).byteLength - basePoolBytes);

  const startCon = performance.now();
  const conFlyweightItems: OrderItemContext[] = [];
  const sharedBurger = DishFlyweightFactory.get('BURGER_CLASSIC');
  const sharedMeat = DishFlyweightFactory.getTopping('MEAT');
  const sharedCheese = DishFlyweightFactory.getTopping('CHEESE');
  for (let i = 0; i < orderCount; i++) {
    conFlyweightItems.push(new OrderItemContext(sharedBurger, 2, [sharedMeat, sharedCheese], 'Sin cebolla'));
  }
  const tiempoConMs = Number((performance.now() - startCon).toFixed(3));
  const bytesCon = Math.max(1, v8.serialize([poolSnapshot, conFlyweightItems]).byteLength - basePoolBytes);

  const savedBytes = Math.max(0, bytesSin - bytesCon);
  return {
    orderCount,
    sinFlyweight: {
      instanciasPesadasCreadas: sinFlyweightItems.length,
      objetosTotalesClonados: sinFlyweightItems.length * 3,
      memoriaBytes: bytesSin,
      memoriaKb: Number((bytesSin / 1024).toFixed(2)),
      memoriaEstimadaMb: Number((bytesSin / (1024 * 1024)).toFixed(3)),
      tiempoMs: tiempoSinMs,
    },
    conFlyweight: {
      instanciasFlyweightEnPool: DishFlyweightFactory.getPoolSize(),
      contextosLigerosCreados: conFlyweightItems.length,
      memoriaBytes: bytesCon,
      memoriaKb: Number((bytesCon / 1024).toFixed(2)),
      memoriaEstimadaMb: Number((bytesCon / (1024 * 1024)).toFixed(3)),
      tiempoMs: tiempoConMs,
    },
    ahorro: {
      bytesAhorrados: savedBytes,
      kbAhorrados: Number((savedBytes / 1024).toFixed(2)),
      porcentajeAhorroMemoria: Number(((savedBytes / bytesSin) * 100).toFixed(1)),
    },
  };
}


