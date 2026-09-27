/**
 * Adaptee (Patrón GoF Adapter - Refactoring Guru).
 * Servicio externo que consume la API pública de OpenStreetMap (OSRM).
 * Su interfaz y modelo de datos son incompatibles con nuestro dominio:
 * - Exige coordenadas geográficas (longitud, latitud) en un formato de URL específico.
 * - Devuelve la distancia en metros dentro de una estructura de objetos anidados.
 */
export interface OsrmRouteResponse {
  code: string;
  routes: Array<{
    distance: number; // en metros
    duration: number; // en segundos
  }>;
}

export class OsrmRoutingService {
  private readonly baseUrl = 'https://router.project-osrm.org/route/v1/driving';

  /**
   * Método nativo del servicio externo (interfaz incompatible con nuestro sistema).
   */
  async fetchRoute(
    originCoords: [number, number],
    destCoords: [number, number],
  ): Promise<OsrmRouteResponse> {
    const coordsParam = `${originCoords[0]},${originCoords[1]};${destCoords[0]},${destCoords[1]}`;
    const url = `${this.baseUrl}/${coordsParam}?overview=false`;

    console.log(`[OsrmRoutingApi] 🌐 Enviando petición HTTP real a OpenStreetMap: ${url}`);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'UTS-Patrones-DeliveryApp/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`OSRM API respondió con código HTTP ${response.status}`);
      }

      const data = (await response.json()) as OsrmRouteResponse;
      return data;
    } catch (error: any) {
      console.warn(`[OsrmRoutingApi] ⚠️ Fallo al conectar con OSRM (${error.message}). Usando fallback de seguridad.`);
      return {
        code: 'Fallback',
        routes: [{ distance: 3500, duration: 600 }],
      };
    }
  }
}
