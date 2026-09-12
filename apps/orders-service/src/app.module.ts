import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { Product } from './entities/product.entity.js';
import { Order } from './entities/order.entity.js';
import { OrderItem } from './entities/order-item.entity.js';
import { EventBroker } from './broker/event-broker.js';
import { OrdersGateway } from './gateway/orders.gateway.js';
import { WebSocketNotifierSubscriber } from './broker/subscribers/websocket-notifier.subscriber.js';
import { DeliveryDispatcherSubscriber } from './broker/subscribers/delivery-dispatcher.subscriber.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'orders.sqlite',
      entities: [Product, Order, OrderItem],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Product, Order, OrderItem]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    EventBroker,
    OrdersGateway,
    WebSocketNotifierSubscriber,
    DeliveryDispatcherSubscriber,
  ],
})
export class AppModule {}
