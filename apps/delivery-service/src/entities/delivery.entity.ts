import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type DeliveryStatus = 'ASIGNADO' | 'EN_RUTA' | 'ENTREGADO';
export type CalculationStrategy = 'FLAT' | 'DISTANCE' | 'RUSH_HOUR';

@Entity('deliveries')
export class Delivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @Column({ default: 'Repartidor Pendiente' })
  driverName: string;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  distanceKm: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  fee: number;

  @Column({ default: 'FLAT' })
  calculationStrategy: CalculationStrategy;

  @Column({ default: 'ASIGNADO' })
  status: DeliveryStatus;

  @CreateDateColumn()
  createdAt: Date;
}
