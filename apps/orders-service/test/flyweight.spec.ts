import { describe, it, expect, beforeEach } from 'vitest';
import {
  DishFlyweightFactory,
  OrderItemContext,
  DishOrderItemSinFlyweight,
  measureOrderFlyweightComparison,
  runFlyweightComparisonBenchmark,
} from '../src/patterns/flyweight/index.js';

describe('Patrón Estructural: Flyweight (Optimización de Memoria y Estado Intrínseco/Extrínseco)', () => {
  beforeEach(() => {
    DishFlyweightFactory.initializePool();
  });

  it('debe retornar exactamente la misma referencia en memoria para solicitudes del mismo plato (Pool)', () => {
    const burger1 = DishFlyweightFactory.get('BURGER_CLASSIC');
    const burger2 = DishFlyweightFactory.get('BURGER_CLASSIC');
    const burgerById = DishFlyweightFactory.get(1);

    expect(burger1).toBe(burger2);
    expect(burger1).toBe(burgerById);
  });

  it('no debe incrementar el tamaño del pool cuando se consultan platos o toppings existentes', () => {
    const initialPoolSize = DishFlyweightFactory.getPoolSize();

    DishFlyweightFactory.get('BURGER_CLASSIC');
    DishFlyweightFactory.get('BURGER_DOUBLE');
    DishFlyweightFactory.getTopping('MEAT');
    DishFlyweightFactory.getTopping('CHEESE');

    expect(DishFlyweightFactory.getPoolSize()).toBe(initialPoolSize);
  });

  it('debe encapsular correctamente el estado intrínseco (inmutable y compartido)', () => {
    const burger = DishFlyweightFactory.get('BURGER_CLASSIC');

    expect(burger.name).toBe('Hamburguesa Clásica');
    expect(burger.basePrice).toBe(18000);
    expect(burger.category).toBe('BURGER');
    expect(burger.icon).toBe('🍔');
    expect(burger.calories).toBe(650);
    expect(burger.allergens).toContain('Gluten');
    expect(burger.allergens).toContain('Lácteos');
    expect(burger.preparationGuide).toContain('Pan brioche');
  });

  it('debe calcular precios y descripciones combinando estado intrínseco con extrínseco (Toppings)', () => {
    const burger = DishFlyweightFactory.get('BURGER_CLASSIC');
    const meat = DishFlyweightFactory.getTopping('MEAT'); // +6000
    const cheese = DishFlyweightFactory.getTopping('CHEESE'); // +3000

    const context = new OrderItemContext(burger, 2, [meat, cheese], 'Término 3/4');

    expect(context.getUnitPrice()).toBe(27000);
    expect(context.getSubtotal()).toBe(54000);
    expect(context.getDescription()).toContain('Hamburguesa Clásica');
    expect(context.getDescription()).toContain('Carne Extra');
    expect(context.getDescription()).toContain('Extra Queso');
    expect(context.getDescription()).toContain('Término 3/4');
  });

  it('debe generar la comanda técnica para cocina consolidando alérgenos y calorías del Flyweight', () => {
    const burger = DishFlyweightFactory.get('BURGER_CLASSIC');
    const cheese = DishFlyweightFactory.getTopping('CHEESE');
    const context = new OrderItemContext(burger, 1, [cheese], 'Bien asada');

    const ticket = context.renderKitchenTicket();

    expect(ticket.productName).toBe('Hamburguesa Clásica');
    expect(ticket.unitPrice).toBe(21000);
    expect(ticket.toppings).toContain('🧀 Extra Queso Cheddar');
    expect(ticket.allergens).toContain('Gluten');
    expect(ticket.allergens).toContain('Lácteos');
    expect(ticket.calories).toBe(650 + 110);
    expect(ticket.cookingNotes).toBe('Bien asada');
    expect(ticket.guide).toContain('término 3/4');
  });

  it('debe registrar y reutilizar flyweights dinámicos para productos personalizados', () => {
    const custom = DishFlyweightFactory.get('PIZZA_ARTESANAL');
    const customAgain = DishFlyweightFactory.get('PIZZA_ARTESANAL');

    expect(custom).toBe(customAgain);
    expect(custom.name).toBe('PIZZA_ARTESANAL');
    expect(custom.category).toBe('CUSTOM');
  });

  it('debe permitir alternar (switch) entre flujo CON Flyweight y SIN Flyweight con el mismo resultado de negocio', () => {
    const input = [{ dishKey: 1, quantity: 2, toppingCodes: ['MEAT', 'CHEESE'], notes: 'Sin cebolla' }];

    const conPatron = measureOrderFlyweightComparison(input, true);
    const sinPatron = measureOrderFlyweightComparison(input, false);

    expect(conPatron.builtItems[0]).toBeInstanceOf(OrderItemContext);
    expect(sinPatron.builtItems[0]).toBeInstanceOf(DishOrderItemSinFlyweight);

    // Ambos flujos calculan exactamente el mismo precio ($18000 + $6000 + $3000 = $27000)
    expect(conPatron.builtItems[0].getUnitPrice()).toBe(27000);
    expect(sinPatron.builtItems[0].getUnitPrice()).toBe(27000);

    // Con Flyweight pesa considerablemente menos en el grafo de V8 que Sin Flyweight
    expect(conPatron.metrics.memoryBytes).toBeLessThan(sinPatron.metrics.memoryBytes);
    expect(conPatron.metrics.comparison.savedPercentage).toBeGreaterThan(80);
  });

  it('DishOrderItemSinFlyweight no debe utilizar ni mutar el pool de DishFlyweightFactory', () => {
    const initialPoolSize = DishFlyweightFactory.getPoolSize();
    const itemSin1 = new DishOrderItemSinFlyweight('PLATO_SIN_POOL', 1, ['MEAT'], '', 'Plato Especial', 22000);
    const itemSin2 = new DishOrderItemSinFlyweight('PLATO_SIN_POOL', 1, ['MEAT'], '', 'Plato Especial', 22000);

    expect(DishFlyweightFactory.getPoolSize()).toBe(initialPoolSize);
    expect(itemSin1).not.toBe(itemSin2);
    expect(itemSin1.extraToppings[0]).not.toBe(itemSin2.extraToppings[0]);
    expect(itemSin1.getUnitPrice()).toBe(28000);
  });

  it('debe ejecutar el benchmark real de 10.000 órdenes demostrando ahorro >80% en memoria V8 sin valores quemados', () => {
    const result = runFlyweightComparisonBenchmark(10000);

    expect(result.orderCount).toBe(10000);
    expect(result.sinFlyweight.instanciasPesadasCreadas).toBe(10000);
    expect(result.conFlyweight.instanciasFlyweightEnPool).toBe(9);
    expect(result.conFlyweight.contextosLigerosCreados).toBe(10000);
    expect(result.conFlyweight.memoriaBytes).toBeLessThan(result.sinFlyweight.memoriaBytes);
    expect(result.ahorro.porcentajeAhorroMemoria).toBeGreaterThan(80);
  });
});


