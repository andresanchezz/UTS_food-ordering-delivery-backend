import { Injectable } from '@nestjs/common';
import { DistanceCalculator } from './distance-calculator.interface.js';
import { OsrmRoutingService } from './osrm-routing.service.js';

/**
 * Adapter (Patrón GoF Adapter - Refactoring Guru).
 * Hace compatible la interfaz de OpenStreetMap (OsrmRoutingService) con
 * la interfaz de nuestro dominio (DistanceCalculator).
 *
 * Responsabilidades del adaptador:
 * 1. Traducir direcciones o nombres de zona a coordenadas geográficas (longitud, latitud).
 * 2. Invocar el método del servicio externo (fetchRoute).
 * 3. Convertir la respuesta del tercero (metros) al formato de nuestro sistema (kilómetros limpios).
 */
@Injectable()
export class OsrmDistanceAdapter implements DistanceCalculator {
  private readonly adaptee: OsrmRoutingService;

  // Coordenadas de referencia para la sede del restaurante y zonas de reparto (Bucaramanga)
  private readonly locationCoordinates: Record<string, [number, number]> = {
    RESTAURANTE: [-73.1198, 7.1193], // Sede principal / Centro
    'ZONA NORTE': [-73.125, 7.145], // Zona Norte
    'ZONA CENTRO': [-73.122, 7.125], // Zona Centro
    'ZONA SUR': [-73.115, 7.095], // Zona Sur
  };

  constructor(adaptee?: OsrmRoutingService) {
    this.adaptee = adaptee ?? new OsrmRoutingService();
  }

  async calculateDistanceKm(originAddress: string, destinationAddress: string): Promise<number> {
    console.log(
      `[OsrmDistanceAdapter] 🔄 Adaptando llamada: Origen '${originAddress}' -> Destino '${destinationAddress}'`,
    );

    const originCoords = this.resolveCoordinates(originAddress, this.locationCoordinates['RESTAURANTE']);
    const destCoords = this.resolveCoordinates(destinationAddress, this.locationCoordinates['ZONA CENTRO']);

    // 1. Invocar el método del Adaptee externo
    const osrmResult = await this.adaptee.fetchRoute(originCoords, destCoords);

    // 2. Extraer los metros de la respuesta del servicio externo
    const meters = osrmResult.routes?.[0]?.distance ?? 3000;

    // 3. Adaptar la unidad de medida: metros -> kilómetros con un decimal
    const km = Number((meters / 1000).toFixed(1));

    console.log(
      `[OsrmDistanceAdapter] ✅ Traducción completada: ${meters} metros de OpenStreetMap convertidos a ${km} km para el dominio.`,
    );

    return km;
  }

  /**
   * Helper del adaptador para mapear nombres de zonas/direcciones a coordenadas que entienda OSRM
   */
  private resolveCoordinates(query: string, fallback: [number, number]): [number, number] {
    const normalized = query.trim().toUpperCase();
    for (const [key, coords] of Object.entries(this.locationCoordinates)) {
      if (normalized.includes(key)) {
        return coords;
      }
    }
    return fallback;
  }
}
