import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AppService } from './app.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('products')
  getProducts() {
    return this.appService.getProducts();
  }

  @Post('products')
  createProduct(@Body() dto: CreateProductDto) {
    return this.appService.createProduct(dto);
  }

  @Get('orders')
  getOrders() {
    return this.appService.getOrders();
  }

  @Get('orders/:id')
  getOrderById(@Param('id') id: string) {
    return this.appService.getOrderById(id);
  }

  @Post('orders')
  createOrder(@Body() dto: CreateOrderDto) {
    return this.appService.createOrder(dto);
  }
}
