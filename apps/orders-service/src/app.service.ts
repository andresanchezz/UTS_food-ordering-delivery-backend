import { Injectable, OnModuleInit, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity.js';
import { Order, OrderStatus } from './entities/order.entity.js';
import { OrderItem } from './entities/order-item.entity.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { EventBroker } from './broker/event-broker.js';
import { KitchenNotifierSubscriber } from './broker/subscribers/kitchen-notifier.subscriber.js';
import { DeliveryDispatcherSubscriber } from './broker/subscribers/delivery-dispatcher.subscriber.js';
import {
  OrderItemComponent,
  BaseOrderItem,
  applyToppings,
  AVAILABLE_TOPPINGS,
} from './patterns/decorator/index.js';
import { OrderBuilder } from './patterns/builder/index.js';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    private readonly eventBroker: EventBroker,
    private readonly kitchenNotifier: KitchenNotifierSubscriber,
    private readonly deliveryDispatcher: DeliveryDispatcherSubscriber,
  ) {}

  async onModuleInit() {
    // Suscribir observadores al EventBroker
    this.eventBroker.subscribe('order.created', this.kitchenNotifier);
    this.eventBroker.subscribe('order.ready', this.deliveryDispatcher);
    this.eventBroker.subscribe('order.status_updated', this.kitchenNotifier);

    // Datos iniciales del menu
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

  getAvailableToppings() {
    return Object.values(AVAILABLE_TOPPINGS);
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
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('El pedido debe incluir al menos un producto.');
    }

    // 1. PATRÓN CREACIONAL: BUILDER (OrderBuilder)
    // Instanciar el constructor fluido y alimentar datos del cliente
    const builder = new OrderBuilder();
    builder.setCustomerInfo(dto.customerName, dto.customerAddress);

    for (const itemDto of dto.items) {
      const product = await this.productRepo.findOne({ where: { id: itemDto.productId } });
      if (!product) {
        throw new NotFoundException(`Producto ${itemDto.productId} no existe`);
      }

      // 2. PATRÓN ESTRUCTURAL: DECORATOR (BaseOrderItem + Toppings)
      // Componente concreto base
      let itemComponent: OrderItemComponent = new BaseOrderItem(
        product.id,
        product.name,
        product.price,
        itemDto.quantity ?? 1,
      );

      // Si el cliente seleccionó adicionales/toppings, decorar dinámicamente
      if (itemDto.toppings && itemDto.toppings.length > 0) {
        itemComponent = applyToppings(itemComponent, itemDto.toppings);
      }

      // Builder incorpora el ítem decorado y acumula subtotales
      builder.addItem(itemComponent, itemDto.customizations);
    }

    // Builder aplica cupón y recalcula totales
    if (dto.couponCode) {
      builder.applyCoupon(dto.couponCode);
    }

    // Ensamblar la entidad Order con validación de invariantes
    const order = builder.build();

    const savedOrder = await this.orderRepo.save(order);

    // 3. PATRÓN OBSERVER (Intacto): Notificar eventos a suscriptores
    this.eventBroker.publish('order.created', savedOrder);

    return savedOrder;
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.getOrderById(id);

    // Idempotencia si ya está en el mismo estado
    if (order.status === status) {
      return order;
    }

    // Máquina de estados del pedido
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      RECIBIDO: ['EN_PREPARACION', 'CANCELADO'],
      EN_PREPARACION: ['LISTO', 'CANCELADO'],
      LISTO: ['EN_CAMINO', 'CANCELADO'],
      EN_CAMINO: ['ENTREGADO', 'CANCELADO'],
      ENTREGADO: [],
      CANCELADO: [],
    };

    const allowed = validTransitions[order.status] || [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Transición inválida: El pedido #${id.slice(0, 8)} está en '${order.status}' y no puede pasar a '${status}'. Debe seguir el flujo: [${allowed.join(', ')}].`,
      );
    }

    order.status = status;
    const updatedOrder = await this.orderRepo.save(order);

    // Publicar evento en el EventBroker
    this.eventBroker.publish('order.status_updated', updatedOrder);

    // Cuando la cocina termina el pedido, notificar para despacho a delivery-service
    if (status === 'LISTO') {
      this.eventBroker.publish('order.ready', updatedOrder);
    }

    return updatedOrder;
  }

  async resetOrdersData(): Promise<{ message: string; deletedOrders: number; deletedItems: number }> {
    const deletedItems = await this.orderItemRepo.count();
    await this.orderItemRepo.clear();
    const deletedOrders = await this.orderRepo.count();
    await this.orderRepo.clear();
    return {
      message: 'Base de datos de pedidos reseteada con éxito',
      deletedOrders,
      deletedItems,
    };
  }
}
