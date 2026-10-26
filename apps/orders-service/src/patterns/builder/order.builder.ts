import { BadRequestException } from '@nestjs/common';
import { Order } from '../../entities/order.entity.js';
import { OrderItem } from '../../entities/order-item.entity.js';
import { IOrderBuilder, IOrderItemInput } from './order.builder.interface.js';
import { OrderItemContext } from '../flyweight/order-item-context.js';

/**
 * Constructor Concreto del Patrón Creacional BUILDER (GoF).
 * Permite ensamblar una orden paso a paso validando invariantes antes
 * de generar el objeto final persistible.
 */
export class OrderBuilder implements IOrderBuilder {
  private customerName = '';
  private customerAddress = '';
  private zoneName = 'Zona Centro';
  private distanceKm = 3.5;
  private deliveryType = 'STANDARD';
  private isRushHour = false;
  private items: OrderItem[] = [];
  private couponCode?: string;
  private subtotal = 0;
  private discount = 0;
  private total = 0;

  constructor() {
    this.reset();
  }

  reset(): this {
    this.customerName = '';
    this.customerAddress = '';
    this.zoneName = 'Zona Centro';
    this.distanceKm = 3.5;
    this.deliveryType = 'STANDARD';
    this.isRushHour = false;
    this.items = [];
    this.couponCode = undefined;
    this.subtotal = 0;
    this.discount = 0;
    this.total = 0;
    return this;
  }

  setCustomerInfo(customerName: string, customerAddress: string): this {
    if (!customerName || customerName.trim() === '') {
      throw new BadRequestException('OrderBuilder: El nombre del cliente no puede estar vacío.');
    }
    if (!customerAddress || customerAddress.trim() === '') {
      throw new BadRequestException('OrderBuilder: La dirección del cliente no puede estar vacía.');
    }
    this.customerName = customerName.trim();
    this.customerAddress = customerAddress.trim();
    return this;
  }

  setDeliveryPreferences(
    zoneName?: string,
    distanceKm?: number,
    deliveryType?: string,
    isRushHour?: boolean,
  ): this {
    if (zoneName?.trim()) this.zoneName = zoneName.trim();
    if (distanceKm !== undefined && distanceKm >= 0) this.distanceKm = Number(distanceKm);
    if (deliveryType?.trim()) this.deliveryType = deliveryType.trim().toUpperCase();
    if (isRushHour !== undefined) this.isRushHour = Boolean(isRushHour);
    return this;
  }

  addItem(context: OrderItemContext | IOrderItemInput, notes?: string): this {
    if (!context) {
      throw new BadRequestException('OrderBuilder: El ítem a agregar no puede ser nulo.');
    }

    const quantity = typeof (context as IOrderItemInput).getQuantity === 'function'
      ? (context as IOrderItemInput).getQuantity()
      : (context as OrderItemContext).quantity;

    if (quantity <= 0) {
      throw new BadRequestException('OrderBuilder: La cantidad del ítem debe ser mayor a 0.');
    }

    const unitPrice = context.getUnitPrice();
    const itemSubtotal = unitPrice * quantity;

    const description = context.getDescription();
    const combinedCustomizations =
      notes && notes.trim().length > 0 && !description.includes(notes.trim())
        ? `${description} | Nota: ${notes.trim()}`
        : description;

    const item = new OrderItem();
    item.productId = context.getProductId();
    item.productName = context.getProductName();
    item.quantity = quantity;
    item.unitPrice = unitPrice;
    item.customizations = combinedCustomizations;

    this.items.push(item);
    this.subtotal += itemSubtotal;
    this.recalculateTotal();
    return this;
  }

  applyCoupon(couponCode?: string): this {
    if (!couponCode || couponCode.trim() === '') {
      this.couponCode = undefined;
      this.discount = 0;
      this.recalculateTotal();
      return this;
    }

    const normalized = couponCode.trim().toUpperCase();
    this.couponCode = normalized;
    this.discount = normalized === 'DESCUENTO10' ? Math.round(this.subtotal * 0.1) : 0;
    this.recalculateTotal();
    return this;
  }

  private recalculateTotal(): void {
    this.total = Math.max(0, this.subtotal - this.discount);
  }

  validate(): void {
    if (!this.customerName || this.customerName.trim().length === 0) {
      throw new BadRequestException('Invariante violada: El pedido requiere el nombre del cliente.');
    }
    if (!this.customerAddress || this.customerAddress.trim().length === 0) {
      throw new BadRequestException('Invariante violada: El pedido requiere la dirección del cliente.');
    }
    if (this.items.length === 0) {
      throw new BadRequestException('Invariante violada: El pedido debe contener al menos un ítem.');
    }
    if (this.subtotal <= 0) {
      throw new BadRequestException('Invariante violada: El subtotal del pedido debe ser superior a 0.');
    }
    if (this.total < 0) {
      throw new BadRequestException('Invariante violada: El total del pedido no puede ser negativo.');
    }
  }

  build(): Order {
    this.validate();

    const order = new Order();
    order.customerName = this.customerName;
    order.customerAddress = this.customerAddress;
    order.zoneName = this.zoneName;
    order.distanceKm = this.distanceKm;
    order.deliveryType = this.deliveryType;
    order.isRushHour = this.isRushHour;
    order.status = 'RECIBIDO';
    order.subtotal = this.subtotal;
    order.discount = this.discount;
    order.total = this.total;
    order.couponCode = this.couponCode;
    order.items = this.items;

    return order;
  }
}

