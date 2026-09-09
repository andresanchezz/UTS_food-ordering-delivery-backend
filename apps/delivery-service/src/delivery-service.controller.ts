import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { DeliveryServiceService } from './delivery-service.service.js';
import { CalculateDeliveryDto } from './dto/calculate-delivery.dto.js';
import { CreateDeliveryDto } from './dto/create-delivery.dto.js';

@Controller()
export class DeliveryServiceController {
  constructor(private readonly deliveryService: DeliveryServiceService) {}

  @Get('zones')
  getZones() {
    return this.deliveryService.getZones();
  }

  @Post('deliveries/calculate')
  calculateFee(@Body() dto: CalculateDeliveryDto) {
    return this.deliveryService.calculateFee(dto);
  }

  @Get('deliveries')
  getDeliveries() {
    return this.deliveryService.getDeliveries();
  }

  @Get('deliveries/:id')
  getDeliveryById(@Param('id') id: string) {
    return this.deliveryService.getDeliveryById(id);
  }

  @Post('deliveries')
  createDelivery(@Body() dto: CreateDeliveryDto) {
    return this.deliveryService.createDelivery(dto);
  }
}
