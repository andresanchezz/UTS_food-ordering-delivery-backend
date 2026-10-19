/**
 * UTS - Patrones de Diseño de Software
 * Módulo de Patrones GoF implementados en orders-service:
 *
 * 1. DECORATOR (Estructural):
 *    Personalización dinámica y acumulativa de productos (ingredientes/toppings)
 *    sin explosión de subclases.
 *
 * 2. BUILDER (Creacional):
 *    Construcción paso a paso y validación de invariantes de la entidad Order
 *    antes de su persistencia.
 *
 * (Nota: El patrón Observer se mantiene intacto en src/broker/event-broker.ts)
 */
export * from './decorator/index.js';
export * from './builder/index.js';
