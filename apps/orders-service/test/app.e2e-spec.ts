import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

describe('OrdersService (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /products y switch CON/SIN Flyweight + POST /orders con Carne Extra (+$6.000)', async () => {
    const productsRes = await request(app.getHttpServer()).get('/products').expect(200);
    expect(Array.isArray(productsRes.body)).toBe(true);
    expect(productsRes.body.length).toBeGreaterThanOrEqual(5);

    // Crear orden CON Flyweight y Carne Extra (+$6000 -> $24000)
    const orderRes = await request(app.getHttpServer())
      .post('/orders')
      .send({
        customerName: 'Carlos Mendoza',
        customerAddress: 'Cra 27 # 45-12',
        useFlyweight: true,
        items: [{ productId: 1, quantity: 1, toppings: ['MEAT'], customizations: 'Sin cebolla' }],
      })
      .expect(201);

    expect(orderRes.body.total).toBe(24000);
    expect(orderRes.body.items[0].unitPrice).toBe(24000);
    expect(orderRes.body.flyweightMetrics.mode).toBe('CON_FLYWEIGHT');

    // Alternar switch a SIN_FLYWEIGHT y verificar que activeMetrics se actualiza
    const modeRes = await request(app.getHttpServer())
      .post('/orders/flyweight-mode')
      .send({ useFlyweight: false })
      .expect(201);

    expect(modeRes.body.mode).toBe('SIN_FLYWEIGHT');
    expect(modeRes.body.activeMetrics.mode).toBe('SIN_FLYWEIGHT');
    expect(modeRes.body.activeMetrics.useFlyweight).toBe(false);
    expect(modeRes.body.activeMetrics.duplicatedInstancesCreated).toBeGreaterThan(0);

    // Ejecutar benchmark en vivo
    const benchRes = await request(app.getHttpServer())
      .get('/orders/benchmark?count=1000')
      .expect(200);

    expect(benchRes.body.orderCount).toBe(1000);
    expect(benchRes.body.ahorro.porcentajeAhorroMemoria).toBeGreaterThan(80);
  });
});

