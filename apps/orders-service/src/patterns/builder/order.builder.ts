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

  addItem(context: OrderItemContext | IOrderItemInput, notes?: string): this {
    if (!context) {
      throw new BadRequestException('OrderBuilder: El ítem a agregar no puede ser nulo.');
    }

    const quantity = typeof (context as any).getQuantity === 'function'
      ? (context as IOrderItemInput).getQuantity()
      : (context as OrderItemContext).quantity;

    if (quantity <= 0) {
      throw new BadRequestException('OrderBuilder: La cantidad del ítem debe ser mayor a 0.');
    }

    const unitPrice = context.getUnitPrice();
    const itemSubtotal = unitPrice * quantity;

    // Combinar la descripción del Flyweight con notas adicionales si las hay
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

    // Regla de negocio de cupones
    if (normalized === 'DESCUENTO10') {
      this.discount = Math.round(this.subtotal * 0.1);
    } else {
      this.discount = 0;
    }

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
    order.status = 'RECIBIDO';
    order.subtotal = this.subtotal;
    order.discount = this.discount;
    order.total = this.total;
    order.couponCode = this.couponCode;
    order.items = this.items;

    // Vincular relación bidireccional en memoria
    for (const item of this.items) {
      item.order = order;
    }

    return order;
  }
}
