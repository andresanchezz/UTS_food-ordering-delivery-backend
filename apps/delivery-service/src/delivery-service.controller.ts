import { Controller, Inject, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { DeliveryServiceService } from './delivery-service.service.js';
import { CalculateDeliveryDto } from './dto/calculate-delivery.dto.js';
import { CreateDeliveryDto } from './dto/create-delivery.dto.js';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto.js';

@Controller()
export class DeliveryServiceController {
  constructor(@Inject(DeliveryServiceService) private readonly deliveryService: DeliveryServiceService) {}


  @Get('zones')
  getZones() {
    return this.deliveryService.getZones();
  }

  @Post('deliveries/calculate')
  calculateFee(@Body() dto: CalculateDeliveryDto) {
    return this.deliveryService.calculateFee(dto);
  }

  @Get('deliveries/plans')
  getDeliveryPlans(
    @Param('zoneName') _z?: string,
    @Body() _b?: any,
  ) {
    // Permite consultar los planes usando los métodos del servicio
    return this.deliveryService.getAvailablePlans();
  }

  @Get('deliveries')
  getDeliveries() {
    return this.deliveryService.getDeliveries();
  }

  @Post('deliveries/reset')
  resetDeliveriesData() {
    return this.deliveryService.resetDeliveriesData();
  }

  @Get('deliveries/:id')
  getDeliveryById(@Param('id') id: string) {
    return this.deliveryService.getDeliveryById(id);
  }

  @Post('deliveries')
  createDelivery(@Body() dto: CreateDeliveryDto) {
    return this.deliveryService.createDelivery(dto);
  }

  @Patch('deliveries/:id/status')
  updateDeliveryStatus(
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryStatusDto,
  ) {
    return this.deliveryService.updateDeliveryStatus(id, dto.status);
  }
}
