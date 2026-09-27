/**
 * Target (Patrón GoF Adapter - Refactoring Guru).
 * Define la interfaz de dominio específica que el código cliente (DeliveryService) espera utilizar.
 */
export interface DistanceCalculator {
  calculateDistanceKm(originAddress: string, destinationAddress: string): Promise<number>;
}
