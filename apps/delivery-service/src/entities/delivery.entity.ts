import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type DeliveryStatus = 'ASIGNADO' | 'EN_RUTA' | 'ENTREGADO';
export type CalculationStrategy = 'FLAT' | 'DISTANCE' | 'RUSH_HOUR' | string;

@Entity('deliveries')
export class Delivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  orderId: string;

  @Column('varchar', { default: 'Repartidor Pendiente' })
  driverName: string;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  distanceKm: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  fee: number;

  @Column('varchar', { default: 'FLAT' })
  calculationStrategy: CalculationStrategy;

  @Column('varchar', { default: 'STANDARD' })
  deliveryType: string;

  @Column('varchar', { default: '🏍️' })
  vehicleIcon: string;

  @Column('int', { nullable: true })
  estimatedMinutes?: number;

  @Column('varchar', { default: 'ASIGNADO' })
  status: DeliveryStatus;

  @CreateDateColumn()
  createdAt: Date;
}

