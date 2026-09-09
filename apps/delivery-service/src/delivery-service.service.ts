import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery, CalculationStrategy } from './entities/delivery.entity.js';
import { DeliveryZone } from './entities/delivery-zone.entity.js';
import { CalculateDeliveryDto } from './dto/calculate-delivery.dto.js';
import { CreateDeliveryDto } from './dto/create-delivery.dto.js';

@Injectable()
export class DeliveryServiceService implements OnModuleInit {
  constructor(
    @InjectRepository(Delivery)
    private readonly deliveryRepo: Repository<Delivery>,
    @InjectRepository(DeliveryZone)
    private readonly zoneRepo: Repository<DeliveryZone>,
  ) {}

  async onModuleInit() {
    const count = await this.zoneRepo.count();
    if (count === 0) {
      await this.zoneRepo.save([
        { zoneName: 'Zona Norte', baseFee: 5000 },
        { zoneName: 'Zona Centro', baseFee: 4000 },
        { zoneName: 'Zona Sur', baseFee: 6000 },
      ]);
    }
  }

  getZones(): Promise<DeliveryZone[]> {
    return this.zoneRepo.find();
  }

  async calculateFee(dto: CalculateDeliveryDto): Promise<{ fee: number; strategy: CalculationStrategy }> {
    const zone = await this.zoneRepo.findOne({ where: { zoneName: dto.zoneName } });
    const baseFee = zone ? Number(zone.baseFee) : 4000;
    const distanceCost = Number(dto.distanceKm ?? 0) * 1200;
    let fee = baseFee + distanceCost;
    let strategy: CalculationStrategy = 'DISTANCE';

    if (dto.isRushHour) {
      fee = Math.round(fee * 1.25);
      strategy = 'RUSH_HOUR';
    } else if (Number(dto.distanceKm) === 0) {
      strategy = 'FLAT';
    }

    return { fee, strategy };
  }

  async createDelivery(dto: CreateDeliveryDto): Promise<Delivery> {
    const { fee, strategy } = await this.calculateFee({
      zoneName: dto.zoneName,
      distanceKm: dto.distanceKm,
      isRushHour: dto.isRushHour,
    });

    const delivery = this.deliveryRepo.create({
      orderId: dto.orderId,
      driverName: dto.driverName ?? 'Repartidor Asignado',
      distanceKm: dto.distanceKm,
      fee,
      calculationStrategy: strategy,
      status: 'ASIGNADO',
    });

    return this.deliveryRepo.save(delivery);
  }

  getDeliveries(): Promise<Delivery[]> {
    return this.deliveryRepo.find({ order: { createdAt: 'DESC' } });
  }

  async getDeliveryById(id: string): Promise<Delivery> {
    const delivery = await this.deliveryRepo.findOne({ where: { id } });
    if (!delivery) {
      throw new NotFoundException(`Domicilio ${id} no encontrado`);
    }
    return delivery;
  }
}
