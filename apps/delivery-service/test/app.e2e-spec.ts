import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DeliveryServiceModule } from './../src/delivery-service.module.js';

describe('DeliveryServiceController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [DeliveryServiceModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /zones y POST /deliveries/calculate (Factory Method + Adapter)', async () => {
    const zonesRes = await request(app.getHttpServer()).get('/zones').expect(200);
    expect(Array.isArray(zonesRes.body)).toBe(true);
    expect(zonesRes.body.length).toBeGreaterThanOrEqual(3);

    const quoteRes = await request(app.getHttpServer())
      .post('/deliveries/calculate')
      .send({
        zoneName: 'Zona Centro',
        distanceKm: 2.5,
        deliveryType: 'EXPRESS',
        isRushHour: true,
      })
      .expect(201);

    expect(quoteRes.body.deliveryType).toBe('EXPRESS');
    expect(quoteRes.body.fee).toBeGreaterThan(0);
  });
});

