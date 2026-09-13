import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery, DeliveryStatus, CalculationStrategy } from './entities/delivery.entity.js';
import { DeliveryZone } from './entities/delivery-zone.entity.js';
import { CalculateDeliveryDto } from './dto/calculate-delivery.dto.js';
import { CreateDeliveryDto } from './dto/create-delivery.dto.js';
import { DeliveryGateway } from './gateway/delivery.gateway.js';

@Injectable()
export class DeliveryServiceService implements OnModuleInit {
  constructor(
    @InjectRepository(Delivery)
    private readonly deliveryRepo: Repository<Delivery>,
    @InjectRepository(DeliveryZone)
    private readonly zoneRepo: Repository<DeliveryZone>,
    private readonly deliveryGateway: DeliveryGateway,
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

    const savedDelivery = await this.deliveryRepo.save(delivery);

    // Empujar evento por WebSocket al panel de repartidores
    this.deliveryGateway.emitNewDelivery(savedDelivery);

    return savedDelivery;
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

  async updateDeliveryStatus(id: string, status: DeliveryStatus): Promise<Delivery> {
    const delivery = await this.getDeliveryById(id);
    delivery.status = status;
    const updatedDelivery = await this.deliveryRepo.save(delivery);

    // Empujar cambio de estado por WebSocket al panel de repartidores
    this.deliveryGateway.emitDeliveryStatusChanged(updatedDelivery);

    // Si el domicilio fue entregado, sincronizar de vuelta con orders-service
    if (status === 'ENTREGADO' && delivery.orderId) {
      try {
        console.log(`[DeliveryService] 📦 Notificando entrega a orders-service para pedido #${delivery.orderId}`);
        await fetch(`http://localhost:3001/orders/${delivery.orderId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ENTREGADO' }),
        });
      } catch (err: any) {
        console.warn(`[DeliveryService] ⚠️ No se pudo sincronizar entrega con orders-service: ${err.message}`);
      }
    }

    return updatedDelivery;
  }
}
