# Guía de Sustentación Académica: Patrones de Diseño (GoF)

**Proyecto**: Sistema de Gestión de Pedidos y Domicilios  
**Universidad de Santander (UTS)** — Materia: Patrones de Diseño de Software  
**Arquitectura**: Monorrepo NestJS (Microservicios `:3001` y `:3002`) + SPA React TypeScript (`:5173`)  
**Enfoque de Exposición**: **Patrones Estructurales (Flyweight y Adapter)** como eje principal evaluado; Creacionales (Builder, Factory Method) y Comportamiento (Observer) como secundarios de respaldo.

---

## 🗺️ 1. Mapa de Navegación Rápido (Ruta de Explicación sin Pérdidas)

> **Regla de oro para sustentar**: No saltes entre carpetas aleatorias. Ve directo a los dos patrones estructurales:

```
UTS_Patrones/
│
├── 📁 back/apps/orders-service/src/patterns/flyweight/ ──> [PARADA 1: FLYWEIGHT (Estructural)]
│   ├── dish-flyweight.interface.ts  (Contratos de estado intrínseco y extrínseco)
│   ├── dish-flyweight.ts            (Estado Intrínseco inmutable + cálculo de precios/alérgenos)
│   ├── flyweight.factory.ts         (Fábrica y Pool de memoria compartida)
│   ├── order-item-context.ts        (Estado Extrínseco de cada renglón de orden)
│   └── sin-flyweight.example.ts     (Benchmark y prueba comparativa de memoria)
│
├── 📁 back/apps/delivery-service/src/adapter/ ──> [PARADA 2: ADAPTER (Estructural)]
│   ├── distance-calculator.interface.ts  (Target: Contrato de negocio en km)
│   ├── osrm-routing.service.ts          (Adaptee: API externa OpenStreetMap en metros)
│   ├── osrm-distance.adapter.ts         (Adapter: Traductor que desacopla el negocio)
│   └── sin-adapter.example.ts           (Anti-patrón comparativo monolítico)
│
├── 📁 frontend/src/ ──> [PARADA 3: DEMOSTRACIÓN VISUAL EN VIVO]
│   ├── patterns/flyweight/product-flyweight.ts (Pool en navegador y contexto de carrito)
│   ├── modules/client/client.service.ts        (Despacho íntegro con toppings a cocina)
│   └── views/ClientView.tsx + KitchenView.tsx  (Flujo en tiempo real sin descuadres de precio)
│
└── 📁 Secundarios de Apoyo:
    ├── back/apps/orders-service/src/patterns/builder/ (Builder - Creacional)
    ├── back/apps/delivery-service/src/patterns/factory/ (Factory Method - Creacional)
    └── back/apps/orders-service/src/broker/ (Observer - Comportamiento)
```

---

## 🎤 2. Guion para Explicar al Profesor (Directo, Línea por Línea)

---

### 🪶 PATRÓN ESTRUCTURAL 1: FLYWEIGHT (Peso Ligero)

#### ¿Qué le dices al profesor en 30 segundos?
> *"Profesor, en un restaurante digital con alta concurrencia (hora pico con miles de pedidos simultáneos), crear objetos pesados por cada renglón de comida satura la memoria RAM. Implementamos el patrón estructural **Flyweight** para separar el **Estado Intrínseco** (datos pesados e invariantes: recetas, alérgenos, calorías, precio base y guías técnicas de cocina) del **Estado Extrínseco** (datos que varían por cliente: cantidad, notas de cocción y adicionales seleccionados). Gracias a esto, no importa si hay 10 o 50.000 órdenes activas, en memoria solo existen 9 objetos Flyweight fijos."*

#### Recorrido de archivos para mostrar al profesor:
1. **[`dish-flyweight.interface.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/orders-service/src/patterns/flyweight/dish-flyweight.interface.ts)**:
   - *"Profe, aquí definimos los contratos: `IDishFlyweight` define el estado intrínseco compartido y las operaciones que reciben el estado extrínseco (`calculatePrice`, `formatDescription`, `renderKitchenTicket`)."*
2. **[`dish-flyweight.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/orders-service/src/patterns/flyweight/dish-flyweight.ts)**:
   - *"Este es el Flyweight concreto. En las líneas 11-23 almacena los campos intrínsecos inmutables (precio base, alérgenos, calorías, textura simulada de 512KB). En las líneas 30-36, su método `calculatePrice(extrinsic)` toma los adicionales del contexto y calcula el valor real."*
3. **[`flyweight.factory.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/orders-service/src/patterns/flyweight/flyweight.factory.ts)**:
   - *"Esta es la Fábrica Flyweight. En la línea 12 tiene el `pool: Map<string, DishFlyweight>`. En las líneas 138-160, el método `get(key)` busca si ya existe en el pool y retorna **la misma referencia en memoria**. Si se piden 1.000 hamburguesas, la fábrica retorna 1.000 veces el mismo puntero, sin duplicar memoria."*
4. **[`order-item-context.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/orders-service/src/patterns/flyweight/order-item-context.ts)**:
   - *"Este es el contexto extrínseco liviano. Solo guarda la cantidad (ej. 2), la nota ('término medio') y las referencias a los toppings. En la línea 24 delega el cálculo al Flyweight: `this.flyweight.calculatePrice(this)`."*
5. **[`app.service.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/orders-service/src/app.service.ts#L86-L110)**:
   - *"En el servicio de pedidos (líneas 92-108), cuando llega un pedido del frontend, `DishFlyweightFactory.get(product.id)` recupera la hamburguesa compartida ($18.000), `DishFlyweightFactory.getTopping(code)` recupera la Carne Extra ($6.000), se crea el `OrderItemContext` y el Builder lo ensambla con el total exacto ($24.000). Esto garantiza que a cocina y base de datos pase el precio íntegro con su desglose."*
6. **[`sin-flyweight.example.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/orders-service/src/patterns/flyweight/sin-flyweight.example.ts)**:
   - *"En este archivo dejamos la comparativa formal con benchmark: sin Flyweight cada ítem duplica 500KB consumiendo ~5 GB en 10.000 pedidos; con Flyweight el pool es fijo (~2.5 MB) y el consumo baja en más del 99%."*
7. **Pruebas unitarias**:
   - Corre en terminal: `npm test` en `back/`.
   - Se ejecutan 7 pruebas en [`flyweight.spec.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/orders-service/test/flyweight.spec.ts) verificando identidad referencial (`expect(burger1).toBe(burger2)`), pool constante, cálculo con adicionales y el benchmark.

---

### 🔌 PATRÓN ESTRUCTURAL 2: ADAPTER (Adaptador)

#### ¿Qué le dices al profesor en 30 segundos?
> *"Profesor, nuestro servicio de domicilios necesita calcular distancias en kilómetros entre sedes y clientes para cotizar la tarifa. En lugar de usar cálculos en línea recta artificiales, integramos un proveedor real de mapas: **OpenStreetMap (OSRM)**. Sin embargo, su API externa es incompatible con nuestro dominio: exige coordenadas en formato URL `lon,lat;lon,lat`, llamadas HTTP crudas y responde en metros dentro de un JSON anidado. Implementamos el patrón estructural **Adapter** para traducir esa interfaz externa al contrato limpio de nuestro dominio (`DistanceCalculator`). Si mañana cambiamos a Google Maps o Mapbox, el servicio de negocio no cambia en absoluto."*

#### Recorrido de archivos para mostrar al profesor:
1. **[`distance-calculator.interface.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/delivery-service/src/adapter/distance-calculator.interface.ts)**:
   - *"Este es el `Target`. Define la interfaz que nuestro sistema necesita: `calculateDistance(origin, destination): Promise<number>` en kilómetros limpios."*
2. **[`osrm-routing.service.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/delivery-service/src/adapter/osrm-routing.service.ts)**:
   - *"Este es el `Adaptee` (servicio externo incompatible). Conoce la URL pública de router.project-osrm.org, hace el fetch HTTP y parsea `data.routes[0].distance` que viene en metros."*
3. **[`osrm-distance.adapter.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/delivery-service/src/adapter/osrm-distance.adapter.ts)**:
   - *"Este es el `Adapter` concreto. Implementa `DistanceCalculator`, inyecta el `OsrmRoutingService`, resuelve coordenadas urbanas de Bucaramanga y convierte los metros a kilómetros redondeados (`meters / 1000`)."*
4. **[`delivery-service.service.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/delivery-service/src/delivery-service.service.ts#L48-L62)**:
   - *"Este es el `Client`. El servicio de logística solo interactúa con la interfaz inyectada `DistanceCalculator`. No sabe si detrás está OpenStreetMap, Google Maps o un simulador."*
5. **[`sin-adapter.example.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/delivery-service/src/adapter/sin-adapter.example.ts)**:
   - *"Aquí mostramos el anti-patrón sin Adapter: una 'God Class' monolítica donde las URLs de internet, las coordenadas GPS, el parseo de JSON y las fórmulas de dinero estaban acopladas en un solo archivo imposible de testear sin internet."*
6. **Frontend**:
   - En la vista de cliente (`ClientView.tsx`), al pulsar **'Ver mapa de ruta'**, el componente [`OsmRouteMap.tsx`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/frontend/src/components/OsmRouteMap.tsx) dibuja interactivamente en Leaflet la ruta real calculada sobre OpenStreetMap.

---

## 🛠️ 3. Patrones Secundarios de Apoyo (Por si el Profesor Pregunta)

| Patrón | Tipo | Archivo Principal | Rol Rápido |
|---|---|---|---|
| **Builder** | Creacional | `apps/orders-service/src/patterns/builder/order.builder.ts` | Construye paso a paso la orden validando invariantes (cliente, dirección, mínimo 1 ítem, totales no negativos) antes de persistir en SQLite. |
| **Factory Method** | Creacional | `apps/delivery-service/src/patterns/factory/delivery-plan.creators.ts` | Desacopla la creación de modalidades de transporte: Motocicleta Estándar, Express Prioritaria (+35%) y Bicicleta Eco (-15%). |
| **Observer** | Comportamiento | `apps/orders-service/src/broker/event-broker.ts` | Desacopla la creación del pedido de sus efectos colaterales (notificar comandas a cocina y solicitar despacho a domicilios). |
| **Singleton** | Creacional | `frontend/src/api/http-client.ts` | Instancia única centralizada del cliente HTTP Axios para serialización y manejo uniforme de errores. |

---

## 🧪 4. Comandos de Verificación en Vivo para la Exposición

Si el profesor pide correr pruebas o verificar la calidad del código en vivo:

```powershell
# 1. Ejecutar pruebas unitarias automatizadas (19 tests pasando al 100%)
cd back
npm test

# 2. Verificar linter sin errores ni warnings (oxlint en backend)
npm run lint

# 3. Compilar backend NestJS
npm run build

# 4. En frontend: Verificar linter y compilar Vite + React
cd ../frontend
npm run lint
npm run build
```
