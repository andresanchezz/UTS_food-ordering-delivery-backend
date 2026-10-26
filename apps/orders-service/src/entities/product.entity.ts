import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar')
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('boolean', { default: false })
  isCombo: boolean;
}

