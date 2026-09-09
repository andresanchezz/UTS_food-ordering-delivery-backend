import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import type { Order } from './order.entity.js';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productId: number;

  @Column()
  productName: string;

  @Column('int', { default: 1 })
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ default: '' })
  customizations: string;

  @ManyToOne('Order', 'items', { onDelete: 'CASCADE' })
  order: Order;
}
