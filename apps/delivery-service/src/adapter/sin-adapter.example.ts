/**
 * ============================================================================
 * EJEMPLO COMPARATIVO: CÓDIGO SIN PATRÓN ADAPTER (Anti-patrón / Código Acoplado)
 * ============================================================================
 *
 * Este archivo demuestra cómo se resolvería el problema SIN usar el patrón GoF Adapter.
 * Como puedes observar, TODO termina mezclado en un único archivo ("God Class"):
 * 1. Coordenadas GPS de la ciudad.
 * 2. URLs y llamadas HTTP directas a una API externa (OpenStreetMap OSRM).
 * 3. Parseo de estructuras JSON propietarias de un tercero.
 * 4. Conversión de unidades físicas (metros a kilómetros).
 * 5. Lógica financiera de liquidación de tarifas y persistencia en base de datos.
 */

export interface CalculateFeeInput {
  zoneName: string;
  isRushHour?: boolean;
}

export interface DeliveryResult {
  fee: number;
  distanceKm: number;
  strategyUsed: string;
}

/**
 * ❌ CLASE MONOLÍTICA SIN ADAPTER
 * Viola el Principio de Responsabilidad Única (SRP) y Abierto/Cerrado (OCP).
 */
export class DeliveryServiceSinAdapter {

  // ❌ PROBLEMA 1: Coordenadas geográficas hardcodeadas dentro del servicio de negocio.
  // Si agregamos una zona o cambia una sede, hay que editar el servicio financiero/logístico.
  private readonly locationCoordinates: Record<string, [number, number]> = {
    RESTAURANTE: [-73.1198, 7.1193], // Sede Centro
    'ZONA NORTE': [-73.1250, 7.1450],
    'ZONA CENTRO': [-73.1220, 7.1250],
    'ZONA SUR': [-73.1150, 7.0950],
  };

  /**
   * Método de cálculo de tarifas SIN patrón.
   * Obsérvese cómo asume 5 responsabilidades totalmente ajenas al cobro de dinero.
   */
  async calculateDeliveryFee(input: CalculateFeeInput): Promise<DeliveryResult> {
    const baseFee = 5000;

    // ❌ PROBLEMA 2: Resolución manual de coordenadas acoplada al negocio.
    const originCoords = this.locationCoordinates['RESTAURANTE'];
    const destCoords = this.locationCoordinates[input.zoneName.toUpperCase()] ?? this.locationCoordinates['ZONA CENTRO'];

    // ❌ PROBLEMA 3: El servicio de negocio sabe armar la URL específica de OpenStreetMap (OSRM).
    // Si la API cambia su versión de v1 a v2 o sus parámetros, se rompe este archivo.
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originCoords[0]},${originCoords[1]};${destCoords[0]},${destCoords[1]}?overview=false`;

    console.log(`[SinAdapter] 🌐 Petición HTTP directa acoplada en la lógica de cobro: ${osrmUrl}`);

    // ❌ PROBLEMA 4: Llamada de red HTTP cruda incrustada en medio de la facturación.
    // Hace imposible testear este método sin conexión a internet activa.
    const response = await fetch(osrmUrl, {
      headers: { 'User-Agent': 'UTS-Patrones-DeliveryApp/1.0' },
    });

    if (!response.ok) {
      throw new Error(`Fallo de proveedor externo: HTTP ${response.status}`);
    }

    const data: any = await response.json();

    // ❌ PROBLEMA 5: El servicio de negocio conoce la estructura interna del JSON de OpenStreetMap.
    // 'data.routes[0].distance' viene expresado en METROS enteros (ej: 6167.2 metros).
    const rawMeters = data.routes?.[0]?.distance ?? 3000;

    // ❌ PROBLEMA 6: La conversión de unidades de medida (metros a km) está mezclada con las matemáticas del dinero.
    const distanceKm = Number((rawMeters / 1000).toFixed(1)); // 6.2 km

    // Cálculo final del cobro monetario
    const distanceCost = distanceKm * 1200;
    let finalFee = baseFee + distanceCost;
    let strategyUsed = 'DISTANCE';

    if (input.isRushHour) {
      finalFee = Math.round(finalFee * 1.25);
      strategyUsed = 'RUSH_HOUR';
    }

    return {
      fee: finalFee,
      distanceKm,
      strategyUsed,
    };
  }
}

/**
 * ============================================================================
 * TABLA COMPARATIVA:
 * ============================================================================
 *
 * | Criterio              | SIN Patrón Adapter (Este archivo)   | CON Patrón Adapter (En apps/delivery-service) |
 * |-----------------------|-------------------------------------|-----------------------------------------------|
 * | Archivos              | 1 solo archivo monolítico           | 4 piezas limpias (Target, Adaptee, Adapter, Client) |
 * | Responsabilidades     | 6 responsabilidades en una clase    | Cada clase tiene 1 sola responsabilidad (SRP) |
 * | ¿Cambio a Google Maps?| Toca reescribir este archivo        | Solo se crea GoogleMapsAdapter. El servicio no se toca (OCP) |
 * | Pruebas Unitarias     | Exige internet y API pública        | Se prueba inyectando un mock de DistanceCalculator |
 * ============================================================================
 */
