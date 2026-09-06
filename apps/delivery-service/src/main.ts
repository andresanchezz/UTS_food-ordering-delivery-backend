import { NestFactory } from '@nestjs/core';
import { DeliveryServiceModule } from './delivery-service.module.js';

async function bootstrap() {
  const app = await NestFactory.create(DeliveryServiceModule);
  const port = process.env.PORT ?? 3002;
  await app.listen(port);
  console.log(`[DeliveryService] Running on port ${port}`);
}
await bootstrap();
