import { describe, it, expect } from 'vitest';
import {
  StandardDeliveryCreator,
  ExpressDeliveryCreator,
  EcoBicycleDeliveryCreator,
  DeliveryPlanRegistry,
  StandardDeliveryPlan,
  ExpressDeliveryPlan,
  EcoBicycleDeliveryPlan,
} from '../src/patterns/factory/index.js';

describe('Patrón Creacional: Factory Method (Modalidades de Despacho Logístico)', () => {
  it('StandardDeliveryCreator debe instanciar StandardDeliveryPlan y cotizar correctamente', () => {
    const creator = new StandardDeliveryCreator();
    const plan = creator.createDeliveryPlan();

    expect(plan).toBeInstanceOf(StandardDeliveryPlan);
    expect(plan.type).toBe('STANDARD');
    expect(plan.vehicleIcon).toBe('🏍️');

    // Base fee 4000, 3 km -> 4000 + 3*1200 = 7600
    const quote = creator.getDispatchQuote(4000, 3, false);
    expect(quote.fee).toBe(7600);
    expect(quote.strategy).toBe('STANDARD_DISTANCE');
    expect(quote.estimatedMinutes).toBeGreaterThan(15);
  });

  it('ExpressDeliveryCreator debe instanciar ExpressDeliveryPlan con recargo prioritario y menor tiempo', () => {
    const creator = new ExpressDeliveryCreator();
    const plan = creator.createDeliveryPlan();

    expect(plan).toBeInstanceOf(ExpressDeliveryPlan);
    expect(plan.type).toBe('EXPRESS');
    expect(plan.vehicleIcon).toBe('⚡');

    // Base fee 4000 * 1.35 = 5400 + 3 * 1800 = 5400 + 5400 = 10800
    const quote = creator.getDispatchQuote(4000, 3, false);
    expect(quote.fee).toBe(10800);
    expect(quote.strategy).toBe('EXPRESS_PRIORITY');

    // Tiempo express debe ser menor que tiempo estándar
    const standardQuote = new StandardDeliveryCreator().getDispatchQuote(4000, 3, false);
    expect(quote.estimatedMinutes).toBeLessThan(standardQuote.estimatedMinutes);
  });

  it('EcoBicycleDeliveryCreator debe instanciar EcoBicycleDeliveryPlan con descuento ecológico', () => {
    const creator = new EcoBicycleDeliveryCreator();
    const plan = creator.createDeliveryPlan();

    expect(plan).toBeInstanceOf(EcoBicycleDeliveryPlan);
    expect(plan.type).toBe('ECO');
    expect(plan.vehicleIcon).toBe('🚲');

    // Base fee 4000 * 0.85 = 3400 + 3 * 900 = 3400 + 2700 = 6100
    const quote = creator.getDispatchQuote(4000, 3, false);
    expect(quote.fee).toBe(6100);
    expect(quote.strategy).toBe('ECO_FRIENDLY');
    expect(quote.fee).toBeLessThan(new StandardDeliveryCreator().getDispatchQuote(4000, 3, false).fee);
  });

  it('debe ajustar tarifas cuando aplica recargo por hora pico', () => {
    const standardCreator = new StandardDeliveryCreator();
    const normal = standardCreator.getDispatchQuote(4000, 2, false);
    const rush = standardCreator.getDispatchQuote(4000, 2, true);

    expect(rush.fee).toBeGreaterThan(normal.fee);
    expect(rush.strategy).toContain('RUSH_HOUR');
  });

  it('DeliveryPlanRegistry debe resolver el Creador adecuado y usar STANDARD como fallback seguro', () => {
    const standard = DeliveryPlanRegistry.getCreator('STANDARD');
    expect(standard).toBeInstanceOf(StandardDeliveryCreator);

    const express = DeliveryPlanRegistry.getCreator('EXPRESS');
    expect(express).toBeInstanceOf(ExpressDeliveryCreator);

    const eco = DeliveryPlanRegistry.getCreator('ECO');
    expect(eco).toBeInstanceOf(EcoBicycleDeliveryCreator);

    // Fallback con valor inválido o vacío
    const fallback = DeliveryPlanRegistry.getCreator('UNKNOWN_TYPE');
    expect(fallback).toBeInstanceOf(StandardDeliveryCreator);
  });

  it('DeliveryPlanRegistry.getQuotesForAllPlans debe generar cotizaciones para los 3 planes a la vez', () => {
    const quotes = DeliveryPlanRegistry.getQuotesForAllPlans(4000, 3.5, false);

    expect(quotes.length).toBe(3);
    const types = quotes.map((q) => q.deliveryType);
    expect(types).toContain('STANDARD');
    expect(types).toContain('EXPRESS');
    expect(types).toContain('ECO');
  });
});
