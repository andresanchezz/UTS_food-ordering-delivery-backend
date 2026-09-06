import { Module } from '@nestjs/common';
import { DeliveryServiceController } from './delivery-service.controller.js';
import { DeliveryServiceService } from './delivery-service.service.js';

@Module({
  imports: [],
  controllers: [DeliveryServiceController],
  providers: [DeliveryServiceService],
})
export class DeliveryServiceModule {}
