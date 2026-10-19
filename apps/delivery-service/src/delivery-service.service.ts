import { Injectable, OnModuleInit, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery, DeliveryStatus } from './entities/delivery.entity.js';
import { DeliveryZone } from './entities/delivery-zone.entity.js';
import { CalculateDeliveryDto } from './dto/calculate-delivery.dto.js';
import { CreateDeliveryDto } from './dto/create-delivery.dto.js';
import { DeliveryGateway } from './gateway/delivery.gateway.js';
import { OsrmDistanceAdapter } from './adapter/osrm-distance.adapter.js';
import { DeliveryPlanRegistry, DeliveryQuoteResult } from './patterns/factory/index.js';

@Injectable()
export class DeliveryServiceService implements OnModuleInit {
  constructor(
    @InjectRepository(Delivery)
    private readonly deliveryRepo: Repository<Delivery>,
    @InjectRepository(DeliveryZone)
    private readonly zoneRepo: Repository<DeliveryZone>,
    private readonly deliveryGateway: DeliveryGateway,
    private readonly distanceCalculator: OsrmDistanceAdapter,
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

  async getAvailablePlans(): Promise<{ type: string; title: string; vehicleIcon: string; speedKmH: number; description: string }[]> {
    const defaultCreatorStandard = DeliveryPlanRegistry.getCreator('STANDARD').createDeliveryPlan();
    const defaultCreatorExpress = DeliveryPlanRegistry.getCreator('EXPRESS').createDeliveryPlan();
    const defaultCreatorEco = DeliveryPlanRegistry.getCreator('ECO').createDeliveryPlan();

    return [
      {
        type: defaultCreatorStandard.type,
        title: defaultCreatorStandard.title,
        vehicleIcon: defaultCreatorStandard.vehicleIcon,
        speedKmH: defaultCreatorStandard.speedKmH,
        description: defaultCreatorStandard.description,
      },
      {
        type: defaultCreatorExpress.type,
        title: defaultCreatorExpress.title,
        vehicleIcon: defaultCreatorExpress.vehicleIcon,
        speedKmH: defaultCreatorExpress.speedKmH,
        description: defaultCreatorExpress.description,
      },
      {
        type: defaultCreatorEco.type,
        title: defaultCreatorEco.title,
        vehicleIcon: defaultCreatorEco.vehicleIcon,
        speedKmH: defaultCreatorEco.speedKmH,
        description: defaultCreatorEco.description,
      },
    ];
  }

  async calculateFee(dto: CalculateDeliveryDto): Promise<DeliveryQuoteResult> {
    const zone = await this.zoneRepo.findOne({ where: { zoneName: dto.zoneName } });
    const baseFee = zone ? Number(zone.baseFee) : 4000;

    // PATRÓN ESTRUCTURAL: ADAPTER (Intacto)
    // Si no se envía una distancia explícita, se calcula mediante el Adapter de OpenStreetMap
    let resolvedDistance = dto.distanceKm;
    if (resolvedDistance === undefined || resolvedDistance === null) {
      resolvedDistance = await this.distanceCalculator.calculateDistanceKm('Restaurante', dto.zoneName);
    }

    // PATRÓN CREACIONAL: FACTORY METHOD
    // 1. Obtener el Creador adecuado (StandardDeliveryCreator, ExpressDeliveryCreator o EcoBicycleDeliveryCreator)
    const creator = DeliveryPlanRegistry.getCreator(dto.deliveryType);

    // 2. Ejecutar la operación de despacho delegada en el Creador y su Producto concreto
    return creator.getDispatchQuote(baseFee, resolvedDistance, !!dto.isRushHour);
  }

  async createDelivery(dto: CreateDeliveryDto): Promise<Delivery> {
    // Validar con orders-service que el pedido esté realmente LISTO antes de generar el domicilio
    if (dto.orderId) {
      try {
        const orderRes = await fetch(`http://localhost:3001/orders/${dto.orderId}`);
        if (orderRes.ok) {
          const order = (await orderRes.json()) as { status: string };
          if (order.status !== 'LISTO') {
            throw new BadRequestException(
              `Bloqueo de despacho: El pedido #${dto.orderId.slice(0, 8)} tiene estado '${order.status}'. La cocina debe marcarlo en 'LISTO' antes de poder despacharlo al repartidor.`,
            );
          }
        }
      } catch (err: any) {
        if (err instanceof BadRequestException) throw err;
        console.warn(`[DeliveryService] ⚠️ No se pudo verificar estado previo en orders-service: ${err.message}`);
      }
    }

    // Si la distancia no viene fijada, se calcula mediante el Adapter
    let distanceKm = dto.distanceKm;
    if (distanceKm === undefined || distanceKm === null) {
      distanceKm = await this.distanceCalculator.calculateDistanceKm('Restaurante', dto.zoneName);
    }

    // Cotizar mediante el Creador del Factory Method correspondiente
    const quote = await this.calculateFee({
      zoneName: dto.zoneName,
      distanceKm,
      isRushHour: dto.isRushHour,
      deliveryType: dto.deliveryType,
    });

    const defaultDriver =
      quote.deliveryType === 'ECO'
        ? 'Ciclista Eco — Reparto Urbano'
        : quote.deliveryType === 'EXPRESS'
        ? 'Motociclista Express Prioritario'
        : 'Motociclista Estándar Asignado';

    const delivery = this.deliveryRepo.create({
      orderId: dto.orderId,
      driverName: dto.driverName ?? defaultDriver,
      distanceKm: quote.distanceKm,
      fee: quote.fee,
      calculationStrategy: quote.strategy,
      deliveryType: quote.deliveryType,
      vehicleIcon: quote.vehicleIcon,
      estimatedMinutes: quote.estimatedMinutes,
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

    if (delivery.status === status) {
      return delivery;
    }

    // Validar transición en delivery
    const validTransitions: Record<DeliveryStatus, DeliveryStatus[]> = {
      ASIGNADO: ['EN_RUTA'],
      EN_RUTA: ['ENTREGADO'],
      ENTREGADO: [],
    };

    const allowed = validTransitions[delivery.status] || [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Transición inválida de domicilio: No se puede pasar de '${delivery.status}' a '${status}'.`,
      );
    }

    delivery.status = status;
    const updatedDelivery = await this.deliveryRepo.save(delivery);

    // Empujar cambio de estado por WebSocket al panel de repartidores
    this.deliveryGateway.emitDeliveryStatusChanged(updatedDelivery);

    // Sincronizar de vuelta con orders-service según el avance de la entrega
    if (delivery.orderId) {
      const orderTargetStatus = status === 'EN_RUTA' ? 'EN_CAMINO' : status === 'ENTREGADO' ? 'ENTREGADO' : null;
      if (orderTargetStatus) {
        try {
          console.log(`[DeliveryService] 📦 Sincronizando estado ${orderTargetStatus} a orders-service para pedido #${delivery.orderId}`);
          await fetch(`http://localhost:3001/orders/${delivery.orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: orderTargetStatus }),
          });
        } catch (err: any) {
          console.warn(`[DeliveryService] ⚠️ No se pudo sincronizar ${orderTargetStatus} con orders-service: ${err.message}`);
        }
      }
    }

    return updatedDelivery;
  }

  async resetDeliveriesData(): Promise<{ message: string; deletedDeliveries: number }> {
    const deletedDeliveries = await this.deliveryRepo.count();
    await this.deliveryRepo.clear();
    return {
      message: 'Base de datos de despachos reseteada con éxito',
      deletedDeliveries,
    };
  }
}
