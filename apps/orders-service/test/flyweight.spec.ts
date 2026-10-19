import { describe, it, expect, beforeEach } from 'vitest';
import {
  DishFlyweightFactory,
  OrderItemContext,
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

    // Identidad referencial estricta en el heap
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
    expect(burger.assetTexture).toBeDefined();
  });

  it('debe calcular precios y descripciones combinando estado intrínseco con extrínseco (Toppings)', () => {
    const burger = DishFlyweightFactory.get('BURGER_CLASSIC');
    const meat = DishFlyweightFactory.getTopping('MEAT'); // +6000
    const cheese = DishFlyweightFactory.getTopping('CHEESE'); // +3000

    // Contexto de orden: 2 hamburguesas con carne extra y queso
    const context = new OrderItemContext(burger, 2, [meat, cheese], 'Término 3/4');

    // 18000 + 6000 + 3000 = 27000 unitario
    expect(context.getUnitPrice()).toBe(27000);
    // 27000 * 2 = 54000 subtotal
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

  it('debe demostrar que el benchmark de simulación ahorra instancias y memoria', () => {
    const result = runFlyweightComparisonBenchmark(100);

    expect(result.orderCount).toBe(100);
    expect(result.sinFlyweight.instanciasPesadasCreadas).toBe(100);
    // En Flyweight, el pool es constante independientemente de los cientos de pedidos
    expect(result.conFlyweight.instanciasFlyweightEnPool).toBeLessThanOrEqual(15);
    expect(result.conFlyweight.contextosLigerosCreados).toBe(100);
  });
});
