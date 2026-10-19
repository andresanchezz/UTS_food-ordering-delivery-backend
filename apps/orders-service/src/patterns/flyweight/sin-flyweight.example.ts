/**
 * ============================================================================
 * EJEMPLO COMPARATIVO: CÓDIGO SIN PATRÓN FLYWEIGHT (Anti-patrón / Desperdicio de RAM)
 * ============================================================================
 *
 * Este archivo demuestra cómo se estructuraría el sistema SIN usar el patrón GoF Flyweight.
 * En una arquitectura ingenua sin separación de estado intrínseco/extrínseco:
 *
 * 1. Cada vez que un usuario añade una hamburguesa o plato a su carrito o comanda,
 *    se crea un objeto completamente nuevo que duplica en memoria:
 *    - La receta completa y guía paso a paso de cocina (strings largos).
 *    - La matriz de alérgenos (arrays duplicados).
 *    - La tabla de calorías y macronutrientes.
 *    - Texturas gráficas vectoriales o imágenes en base64 de alta resolución (~512 KB por ítem).
 *
 * 2. Si un restaurante recibe 10.000 pedidos en hora pico con 3 ítems promedio:
 *    - SIN FLYWEIGHT: 30.000 objetos * ~512 KB = ~15 GB de memoria RAM consumida.
 *      Esto dispara pausas por Garbage Collector (GC pauses) y riesgo de Out-Of-Memory (OOM).
 *    - CON FLYWEIGHT: Solo existen 5 a 9 objetos Flyweight en memoria (~2.5 MB fijos).
 *      Los 30.000 pedidos solo instancian contextos extrínsecos ligeros (~120 bytes de punteros).
 */

import { DishFlyweightFactory } from './flyweight.factory.js';
import { OrderItemContext } from './order-item-context.js';

/**
 * ❌ CLASE MONOLÍTICA SIN FLYWEIGHT:
 * Mezcla datos intrínsecos (inmutables y compartibles) con datos extrínsecos (particulares del pedido).
 */
export class DishOrderItemSinFlyweight {
  // ❌ DATOS INTRÍNSECOS DUPLICADOS EN CADA INSTANCIA:
  public readonly id: number;
  public readonly code: string;
  public readonly name: string;
  public readonly basePrice: number;
  public readonly category: string;
  public readonly icon: string;
  public readonly calories: number;
  public readonly allergens: string[];
  public readonly preparationGuide: string;
  // Simulación de buffer o string pesado de textura/imagen vectorial (500 KB)
  public readonly heavyAssetData: string;

  // DATOS EXTRÍNSECOS (Específicos de este comensal):
  public readonly quantity: number;
  public readonly notes: string;
  public readonly extraToppings: { name: string; price: number }[];

  constructor(
    id: number,
    code: string,
    name: string,
    basePrice: number,
    category: string,
    icon: string,
    calories: number,
    allergens: string[],
    preparationGuide: string,
    quantity: number,
    notes: string = '',
    extraToppings: { name: string; price: number }[] = [],
  ) {
    this.id = id;
    this.code = code;
    this.name = name;
    this.basePrice = basePrice;
    this.category = category;
    this.icon = icon;
    this.calories = calories;
    this.allergens = [...allergens]; // Duplicación de arrays
    this.preparationGuide = preparationGuide;
    // Cadena pesada simulada de 500.000 caracteres (~500 KB) por cada comanda creada
    this.heavyAssetData = 'R'.repeat(500_000);
    this.quantity = quantity;
    this.notes = notes;
    this.extraToppings = extraToppings;
  }

  calculateTotal(): number {
    const toppingsTotal = this.extraToppings.reduce((acc, t) => acc + t.price, 0);
    return (this.basePrice + toppingsTotal) * this.quantity;
  }
}

/**
 * Benchmark comparativo ejecutable:
 * Mide el número de instancias físicas creadas y la memoria aproximada.
 */
export function runFlyweightComparisonBenchmark(orderCount: number = 1000) {
  // 1. Ejecución SIN Flyweight
  const sinFlyweightItems: DishOrderItemSinFlyweight[] = [];
  const startMemSin = process.memoryUsage().heapUsed;

  for (let i = 0; i < orderCount; i++) {
    sinFlyweightItems.push(
      new DishOrderItemSinFlyweight(
        1,
        'BURGER_CLASSIC',
        'Hamburguesa Clásica',
        18000,
        'BURGER',
        '🍔',
        650,
        ['Gluten', 'Sésamo', 'Lácteos'],
        'Carne 150g a la plancha término 3/4. Pan brioche sellado.',
        2,
        'Sin cebolla',
        [{ name: 'Carne Extra (150g)', price: 6000 }],
      ),
    );
  }
  const endMemSin = process.memoryUsage().heapUsed;
  const memUsedSinMb = Math.max(0, (endMemSin - startMemSin) / (1024 * 1024));

  // 2. Ejecución CON Flyweight
  const conFlyweightItems: OrderItemContext[] = [];
  const startMemCon = process.memoryUsage().heapUsed;

  const sharedFlyweight = DishFlyweightFactory.get('BURGER_CLASSIC');
  const sharedMeatTopping = DishFlyweightFactory.getTopping('MEAT');

  for (let i = 0; i < orderCount; i++) {
    conFlyweightItems.push(
      new OrderItemContext(sharedFlyweight, 2, [sharedMeatTopping], 'Sin cebolla'),
    );
  }
  const endMemCon = process.memoryUsage().heapUsed;
  const memUsedConMb = Math.max(0, (endMemCon - startMemCon) / (1024 * 1024));

  return {
    orderCount,
    sinFlyweight: {
      instanciasPesadasCreadas: sinFlyweightItems.length,
      memoriaEstimadaMb: Number(memUsedSinMb.toFixed(2)),
    },
    conFlyweight: {
      instanciasFlyweightEnPool: DishFlyweightFactory.getPoolSize(),
      contextosLigerosCreados: conFlyweightItems.length,
      memoriaEstimadaMb: Number(memUsedConMb.toFixed(2)),
    },
  };
}

/**
 * ============================================================================
 * TABLA COMPARATIVA:
 * ============================================================================
 *
 * | Criterio                  | SIN Patrón Flyweight                | CON Patrón Flyweight (DishFlyweight)         |
 * |---------------------------|-------------------------------------|----------------------------------------------|
 * | Asignación de Objetos     | 1 objeto pesado por cada ítem ordenado | 1 pool fijo de objetos compartidos           |
 * | Datos de Recetas/Alérgenos| Duplicados $N$ veces en heap RAM    | Único en memoria (Estado Intrínseco)         |
 * | Consumo de RAM en escala  | Escala lineal agresiva $O(N \times S)$ | Escala casi plana $O(K) + O(N \times c)$       |
 * | Integridad de Recetas     | Si cambia una receta, toca mutar $N$ | Se actualiza en el Flyweight central         |
 * | Garbage Collector (GC)    | Alta presión de recolección y jitter| Punteros livianos, recolección instantánea   |
 * ============================================================================
 */
