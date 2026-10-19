import { describe, it, expect } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { OrderBuilder } from '../src/patterns/builder/index.js';
import { BaseOrderItem, ExtraCheeseDecorator } from '../src/patterns/decorator/index.js';

describe('Patrón Creacional: Builder (Construcción de pedidos OrderBuilder)', () => {
  it('debe construir un pedido válido con cliente, ítems decorados y subtotales correctos', () => {
    const burger = new ExtraCheeseDecorator(
      new BaseOrderItem(1, 'Hamburguesa Clásica', 18000, 2),
    ); // (18000 + 3000) * 2 = 42000

    const order = new OrderBuilder()
      .setCustomerInfo('Carlos Mendoza', 'Cra 27 # 45-12')
      .addItem(burger, 'Sin cebolla')
      .build();

    expect(order.customerName).toBe('Carlos Mendoza');
    expect(order.customerAddress).toBe('Cra 27 # 45-12');
    expect(order.status).toBe('RECIBIDO');
    expect(order.items.length).toBe(1);
    expect(order.items[0].productName).toBe('Hamburguesa Clásica');
    expect(order.items[0].unitPrice).toBe(21000);
    expect(order.items[0].quantity).toBe(2);
    expect(order.items[0].customizations).toContain('Extra Queso');
    expect(order.items[0].customizations).toContain('Sin cebolla');
    expect(order.subtotal).toBe(42000);
    expect(order.discount).toBe(0);
    expect(order.total).toBe(42000);
  });

  it('debe aplicar descuento del 10% cuando se ingresa el cupón DESCUENTO10', () => {
    const item = new BaseOrderItem(2, 'Combo Clásico', 26000, 1);

    const order = new OrderBuilder()
      .setCustomerInfo('Laura Gómez', 'Calle 36 # 15-20')
      .addItem(item)
      .applyCoupon('DESCUENTO10')
      .build();

    expect(order.subtotal).toBe(26000);
    expect(order.discount).toBe(2600); // 10%
    expect(order.total).toBe(23400); // 26000 - 2600
    expect(order.couponCode).toBe('DESCUENTO10');
  });

  it('no debe aplicar descuento para cupones no reconocidos', () => {
    const item = new BaseOrderItem(1, 'Gaseosa', 5000, 2);

    const order = new OrderBuilder()
      .setCustomerInfo('Mario Bros', 'Mushroom Kingdom')
      .addItem(item)
      .applyCoupon('INVALID_COUPON')
      .build();

    expect(order.subtotal).toBe(10000);
    expect(order.discount).toBe(0);
    expect(order.total).toBe(10000);
  });

  it('debe lanzar BadRequestException si el nombre del cliente está vacío (invariante)', () => {
    const builder = new OrderBuilder();

    expect(() => {
      builder.setCustomerInfo('', 'Calle 10 # 5-20');
    }).toThrow(BadRequestException);
  });

  it('debe lanzar BadRequestException si se intenta construir un pedido sin ítems (invariante)', () => {
    const builder = new OrderBuilder().setCustomerInfo('Carlos', 'Calle 10 # 5-20');

    expect(() => {
      builder.build();
    }).toThrow(BadRequestException);
  });

  it('debe permitir resetear el builder para reutilizarlo en una nueva construcción', () => {
    const builder = new OrderBuilder();
    builder.setCustomerInfo('Cliente 1', 'Dirección 1');
    builder.addItem(new BaseOrderItem(1, 'Producto 1', 10000, 1));

    builder.reset();

    expect(() => {
      builder.build();
    }).toThrow(BadRequestException); // Faltan cliente e ítems tras reset
  });
});
