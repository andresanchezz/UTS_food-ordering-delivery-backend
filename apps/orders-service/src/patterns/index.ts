/**
 * UTS - Patrones de Diseño de Software
 * Módulo de Patrones GoF implementados en orders-service:
 *
 * 1. FLYWEIGHT (Estructural - GoF):
 *    Separación de Estado Intrínseco compartido en memoria (DishFlyweight / DishFlyweightFactory)
 *    frente al Estado Extrínseco contextual por orden (OrderItemContext), eliminando duplicación
 *    de recetas pesadas, guías de cocina y alérgenos.
 *
 * 2. BUILDER (Creacional - GoF):
 *    Construcción paso a paso y validación de invariantes de la entidad Order
 *    antes de su persistencia.
 *
 * (Nota: El patrón Observer se mantiene intacto en src/broker/event-broker.ts)
 */
export * from './flyweight/index.js';
export * from './builder/index.js';
