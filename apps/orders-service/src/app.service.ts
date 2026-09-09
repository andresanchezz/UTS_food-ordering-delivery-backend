import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity.js';
import { Order } from './entities/order.entity.js';
import { OrderItem } from './entities/order-item.entity.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
  ) {}

  async onModuleInit() {
    const count = await this.productRepo.count();
    if (count === 0) {
      await this.productRepo.save([
        { name: 'Hamburguesa Clásica', price: 18000, isCombo: false },
        { name: 'Hamburguesa Doble Carne', price: 24000, isCombo: false },
        { name: 'Papas Fritas Medianas', price: 7000, isCombo: false },
        { name: 'Gaseosa 400ml', price: 5000, isCombo: false },
        { name: 'Combo Clásico (Hamburguesa + Papas + Gaseosa)', price: 26000, isCombo: true },
      ]);
    }
  }

  getProducts(): Promise<Product[]> {
    return this.productRepo.find();
  }

  createProduct(dto: CreateProductDto): Promise<Product> {
    const product = this.productRepo.create(dto);
    return this.productRepo.save(product);
  }

  getOrders(): Promise<Order[]> {
    return this.orderRepo.find({ order: { createdAt: 'DESC' } });
  }

  async getOrderById(id: string): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Pedido ${id} no encontrado`);
    }
    return order;
  }

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    for (const itemDto of dto.items) {
      const product = await this.productRepo.findOne({ where: { id: itemDto.productId } });
      if (!product) {
        throw new NotFoundException(`Producto ${itemDto.productId} no existe`);
      }

      const item = this.orderItemRepo.create({
        productId: product.id,
        productName: product.name,
        quantity: itemDto.quantity ?? 1,
        unitPrice: product.price,
        customizations: itemDto.customizations ?? '',
      });

      subtotal += Number(product.price) * (itemDto.quantity ?? 1);
      orderItems.push(item);
    }

    const discount = dto.couponCode === 'DESCUENTO10' ? subtotal * 0.1 : 0;
    const total = subtotal - discount;

    const order = this.orderRepo.create({
      customerName: dto.customerName,
      customerAddress: dto.customerAddress,
      status: 'RECIBIDO',
      subtotal,
      discount,
      total,
      couponCode: dto.couponCode ?? undefined,
      items: orderItems,
    });

    return this.orderRepo.save(order);
  }
}
