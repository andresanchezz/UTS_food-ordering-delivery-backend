import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryServiceController } from './delivery-service.controller.js';
import { DeliveryServiceService } from './delivery-service.service.js';

describe('DeliveryServiceController', () => {
  let deliveryServiceController: DeliveryServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [DeliveryServiceController],
      providers: [DeliveryServiceService],
    }).compile();

    deliveryServiceController = app.get<DeliveryServiceController>(DeliveryServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(deliveryServiceController.getHello()).toBe('Hello World!');
    });
  });
});
