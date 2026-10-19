export class CreateOrderItemDto {
  productId: number;
  quantity: number;
  customizations?: string;
  toppings?: string[];
}

export class CreateOrderDto {
  customerName: string;
  customerAddress: string;
  items: CreateOrderItemDto[];
  couponCode?: string;
}
