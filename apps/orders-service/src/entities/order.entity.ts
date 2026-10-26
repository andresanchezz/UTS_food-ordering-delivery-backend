import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { OrderItem } from './order-item.entity.js';
import type { OrderFlyweightMetrics } from '../patterns/flyweight/sin-flyweight.example.js';

export type OrderStatus = 'RECIBIDO' | 'EN_PREPARACION' | 'LISTO' | 'EN_CAMINO' | 'ENTREGADO' | 'CANCELADO';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  customerName: string;

  @Column('varchar')
  customerAddress: string;

  @Column('varchar', { default: 'RECIBIDO' })
  status: OrderStatus;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  total: number;

  @Column('varchar', { nullable: true })
  couponCode?: string;

  @Column('varchar', { default: 'Zona Centro' })
  zoneName?: string;

  @Column('decimal', { precision: 5, scale: 2, default: 3.5 })
  distanceKm?: number;

  @Column('varchar', { default: 'STANDARD' })
  deliveryType?: string;

  @Column('boolean', { default: false })
  isRushHour?: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true, eager: true })
  items: OrderItem[];

  flyweightMetrics?: OrderFlyweightMetrics;
}


