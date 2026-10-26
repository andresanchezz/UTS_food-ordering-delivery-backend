import { Controller, Inject, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { AppService } from './app.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';

@Controller()
export class AppController {
  constructor(@Inject(AppService) private readonly appService: AppService) {}


  @Get('products')
  getProducts() {
    return this.appService.getProducts();
  }

  @Get('toppings')
  getToppings() {
    return this.appService.getAvailableToppings();
  }

  @Post('products')
  createProduct(@Body() dto: CreateProductDto) {
    return this.appService.createProduct(dto);
  }

  @Get('orders')
  getOrders() {
    return this.appService.getOrders();
  }

  @Get('orders/flyweight-status')
  getFlyweightStatus() {
    return this.appService.getFlyweightStatus();
  }

  @Post('orders/flyweight-mode')
  setFlyweightMode(@Body() body: { useFlyweight: boolean }) {
    return this.appService.setFlyweightMode(body.useFlyweight);
  }

  @Get('orders/benchmark')
  runBenchmark(@Query('count') count?: string) {
    return this.appService.runBenchmark(count ? Number(count) : 10000);
  }

  @Post('orders/reset')
  resetOrdersData() {
    return this.appService.resetOrdersData();
  }

  @Get('orders/:id')
  getOrderById(@Param('id') id: string) {
    return this.appService.getOrderById(id);
  }

  @Post('orders')
  createOrder(@Body() dto: CreateOrderDto) {
    return this.appService.createOrder(dto);
  }

  @Patch('orders/:id/status')
  updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.appService.updateOrderStatus(id, dto.status);
  }
}

