export class CreateDeliveryDto {
  orderId: string;
  zoneName: string;
  distanceKm: number;
  driverName?: string;
  isRushHour?: boolean;
  deliveryType?: string;
}
