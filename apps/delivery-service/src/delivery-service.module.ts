import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryServiceController } from './delivery-service.controller.js';
import { DeliveryServiceService } from './delivery-service.service.js';
import { Delivery } from './entities/delivery.entity.js';
import { DeliveryZone } from './entities/delivery-zone.entity.js';
import { DeliveryGateway } from './gateway/delivery.gateway.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'delivery.sqlite',
      entities: [Delivery, DeliveryZone],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Delivery, DeliveryZone]),
  ],
  controllers: [DeliveryServiceController],
  providers: [DeliveryServiceService, DeliveryGateway],
})
export class DeliveryServiceModule {}
