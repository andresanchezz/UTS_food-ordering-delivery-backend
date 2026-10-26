import { Injectable, Inject, OnModuleInit, NotFoundException, BadRequestException } from '@nestjs/common';
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
  DishFlyweightFactory,
  measureOrderFlyweightComparison,
  runFlyweightComparisonBenchmark,
  type OrderFlyweightMetrics,
  type FlyweightComparisonItemInput,
} from './patterns/flyweight/index.js';
import { OrderBuilder } from './patterns/builder/index.js';

@Injectable()
export class AppService implements OnModuleInit {
  private useFlyweightMode: boolean = true;
  private lastOrderMetrics: OrderFlyweightMetrics | null = null;
  private lastOrderItemsInput: FlyweightComparisonItemInput[] | null = null;

  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @Inject(EventBroker)
    private readonly eventBroker: EventBroker,
    @Inject(KitchenNotifierSubscriber)
    private readonly kitchenNotifier: KitchenNotifierSubscriber,
    @Inject(DeliveryDispatcherSubscriber)
    private readonly deliveryDispatcher: DeliveryDispatcherSubscriber,
  ) {}

  async onModuleInit() {
    this.eventBroker.subscribe('order.created', this.kitchenNotifier);
    this.eventBroker.subscribe('order.ready', this.deliveryDispatcher);
    this.eventBroker.subscribe('order.status_updated', this.kitchenNotifier);

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
    return DishFlyweightFactory.getAllToppings();
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

  getFlyweightStatus(cartItemsInput?: FlyweightComparisonItemInput[]) {
    const input = cartItemsInput && cartItemsInput.length > 0
      ? cartItemsInput
      : this.lastOrderItemsInput && this.lastOrderItemsInput.length > 0
        ? this.lastOrderItemsInput
        : [{ dishKey: 1, quantity: 1, toppingCodes: [], notes: '' }];

    const currentMetrics = measureOrderFlyweightComparison(input, this.useFlyweightMode).metrics;

    return {
      useFlyweight: this.useFlyweightMode,
      mode: this.useFlyweightMode ? 'CON_FLYWEIGHT' : 'SIN_FLYWEIGHT',
      poolSize: DishFlyweightFactory.getPoolSize(),
      activeMetrics: currentMetrics,
    };
  }

  setFlyweightMode(useFlyweight: boolean, cartItemsInput?: FlyweightComparisonItemInput[]) {
    this.useFlyweightMode = Boolean(useFlyweight);
    return this.getFlyweightStatus(cartItemsInput);
  }

  runBenchmark(orderCount: number = 10000) {
    const safeCount = Math.min(50000, Math.max(1, Math.floor(Number(orderCount) || 10000)));
    return runFlyweightComparisonBenchmark(safeCount);
  }

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('El pedido debe incluir al menos un producto.');
    }

    const useFlyweight = dto.useFlyweight !== undefined ? Boolean(dto.useFlyweight) : this.useFlyweightMode;
    this.useFlyweightMode = useFlyweight;

    // 1. PATRÓN CREACIONAL: BUILDER (OrderBuilder)
    const builder = new OrderBuilder();
    builder.setCustomerInfo(dto.customerName, dto.customerAddress);
    builder.setDeliveryPreferences(dto.zoneName, dto.distanceKm, dto.deliveryType, dto.isRushHour);

    const resolvedItemsInput: FlyweightComparisonItemInput[] = [];

    for (const itemDto of dto.items) {
      const product = await this.productRepo.findOne({ where: { id: itemDto.productId } });
      if (!product) {
        throw new NotFoundException(`Producto ${itemDto.productId} no existe`);
      }

      resolvedItemsInput.push({
        dishKey: product.id,
        quantity: itemDto.quantity ?? 1,
        toppingCodes: itemDto.toppings ?? [],
        notes: itemDto.customizations,
        fallbackName: product.name,
        fallbackPrice: Number(product.price),
      });
    }

    // 2. PATRÓN ESTRUCTURAL: FLYWEIGHT (Switcheable CON vs SIN patrón con medición real V8)
    const { builtItems, metrics } = measureOrderFlyweightComparison(resolvedItemsInput, useFlyweight);
    this.lastOrderItemsInput = resolvedItemsInput;
    this.lastOrderMetrics = metrics;

    for (const itemContext of builtItems) {
      builder.addItem(itemContext);
    }

    if (dto.couponCode) {
      builder.applyCoupon(dto.couponCode);
    }

    const order = builder.build();
    const savedOrder = await this.orderRepo.save(order);
    savedOrder.flyweightMetrics = metrics;

    // 3. PATRÓN OBSERVER: Notificar eventos a suscriptores
    await this.eventBroker.publish('order.created', savedOrder);

    return savedOrder;
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.getOrderById(id);

    if (order.status === status) {
      return order;
    }

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

    await this.eventBroker.publish('order.status_updated', updatedOrder);

    if (status === 'LISTO') {
      await this.eventBroker.publish('order.ready', updatedOrder);
    }

    return updatedOrder;
  }

  async resetOrdersData(): Promise<{ message: string; deletedOrders: number; deletedItems: number }> {
    const deletedItems = await this.orderItemRepo.count();
    await this.orderItemRepo.clear();
    const deletedOrders = await this.orderRepo.count();
    await this.orderRepo.clear();
    this.lastOrderMetrics = null;
    this.lastOrderItemsInput = null;
    return {
      message: 'Base de datos de pedidos reseteada con éxito',
      deletedOrders,
      deletedItems,
    };
  }
}


