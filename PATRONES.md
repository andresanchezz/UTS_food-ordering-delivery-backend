# Patrones de Diseño del Proyecto (GoF / Refactoring Guru)

Este documento recopila la totalidad de los patrones de diseño aplicados en la solución, clasificados según su jerarquía pedagógica (Enfoque Primario en **Patrones Estructurales**, seguido de Patrones Creacionales y de Comportamiento secundarios) con sus rutas exactas y justificación técnica.

---

## 1. Patrones del Framework (NestJS / TypeORM)

* **Decoradores (TypeScript / NestJS)**: Metadatos declarativos `@Controller`, `@Injectable`, `@Entity`, `@Column`, `@Get`, `@Post`, `@Patch`.
  - Archivos: `apps/orders-service/src/app.controller.ts`, `apps/orders-service/src/entities/*.ts`, `apps/delivery-service/src/delivery-service.controller.ts`, `apps/delivery-service/src/entities/*.ts`
* **Singleton (NestJS Providers)**: Ciclo de vida por defecto de servicios inyectables.
  - Archivos: `apps/orders-service/src/app.service.ts`, `apps/delivery-service/src/delivery-service.service.ts`
* **Dependency Injection**: Inversión de control en constructores de módulos NestJS.
* **Repository (TypeORM)**: Abstracción de acceso a datos SQLite sobre `Repository<Order>`, `Repository<Delivery>`, etc.
* **Broker / Gateway**: WebSockets bidireccionales en `main.ts` y `delivery.gateway.ts`.

---

## 2. PATRONES ESTRUCTURALES (ENFOQUE PRINCIPAL)

Los patrones estructurales explican cómo ensamblar objetos y clases en estructuras más grandes a la vez que se mantiene la flexibilidad, la eficiencia y el desacoplamiento.

---

### 🪶 A. FLYWEIGHT / Peso Ligero (Estructural — GoF)

* **Propósito**: Comparte eficientemente el **Estado Intrínseco** inmutable (especificación de recetas, guías de preparación para cocina, calorías, matriz de alérgenos y precios base) mediante una fábrica con pool en memoria (`DishFlyweightFactory`), evitando que miles de comandas y pedidos simultáneos dupliquen información idéntica en memoria RAM. El **Estado Extrínseco** (cantidad solicitada, notas del comensal como "término 3/4" o "sin cebolla", y la lista de adicionales/toppings) se mantiene aislado en contextos ligeros (`OrderItemContext` en backend y `CartItemContext` en frontend).
* **Prueba de remoción (Litmus Test)**: Si se quita el patrón Flyweight (`DishOrderItemSinFlyweight`), cada renglón de pedido clona toda la guía de cocina, matriz de alérgenos y objetos de toppings. En la prueba real de 10.000 pedidos medida con el serializador nativo de V8 (`node:v8`), sin Flyweight se clonan 30.000 objetos (~6.757.82 KB / 6.60 MB), mientras que con Flyweight el pool permanece constante en 9 instancias únicas (~654.31 KB / 0.64 MB de contextos ligeros), reduciendo un **90.3%** el consumo de memoria RAM.
* **Archivos Backend (`orders-service`)**:
  - Contrato de interfaz: [`back/apps/orders-service/src/patterns/flyweight/dish-flyweight.interface.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/orders-service/src/patterns/flyweight/dish-flyweight.interface.ts)
  - Flyweight Concreto (Estado Intrínseco): [`back/apps/orders-service/src/patterns/flyweight/dish-flyweight.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/orders-service/src/patterns/flyweight/dish-flyweight.ts)
  - Fábrica y Pool en Memoria: [`back/apps/orders-service/src/patterns/flyweight/flyweight.factory.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/orders-service/src/patterns/flyweight/flyweight.factory.ts)
  - Contexto de Pedido (Estado Extrínseco): [`back/apps/orders-service/src/patterns/flyweight/order-item-context.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/orders-service/src/patterns/flyweight/order-item-context.ts)
  - Demostración y Benchmark Comparativo: [`back/apps/orders-service/src/patterns/flyweight/sin-flyweight.example.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/orders-service/src/patterns/flyweight/sin-flyweight.example.ts)
  - Pruebas unitarias automatizadas: [`back/apps/orders-service/test/flyweight.spec.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/orders-service/test/flyweight.spec.ts)
* **Archivos Frontend (`React`)**:
  - Implementación Flyweight y Pool: [`frontend/src/patterns/flyweight/product-flyweight.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/frontend/src/patterns/flyweight/product-flyweight.ts)
  - Consumo en vista de cliente y carrito: [`frontend/src/views/ClientView.tsx`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/frontend/src/views/ClientView.tsx)

---

### 🔌 B. ADAPTER / Adaptador (Estructural — GoF)

* **Propósito**: Convierte la interfaz incompatible y compleja del servicio externo de OpenStreetMap / OSRM (que exige coordenadas en formato URL `lng,lat;lng,lat` y responde distancias en metros dentro de un JSON anidado) a la interfaz simple de dominio (`DistanceCalculator`) que requiere el servicio de domicilios en kilómetros, aislando por completo la capa de negocio de cambios de terceros.
* **Prueba de remoción (Litmus Test)**: Si se quita el Adapter, el servicio de despacho logístico (`DeliveryServiceService`) tendría que concatenar URLs de OSRM, ejecutar peticiones HTTP crudas, desempaquetar JSON de terceros y convertir metros a kilómetros en medio del cálculo de tarifas monetarias. Cualquier cambio de API externa o migración (ej. a Google Maps o Mapbox) rompería la lógica financiera del negocio.
* **Archivos Backend (`delivery-service`)**:
  - Interfaz con el cliente (`Target`): [`back/apps/delivery-service/src/adapter/distance-calculator.interface.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/delivery-service/src/adapter/distance-calculator.interface.ts)
  - Servicio externo incompatible (`Adaptee`): [`back/apps/delivery-service/src/adapter/osrm-routing.service.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/delivery-service/src/adapter/osrm-routing.service.ts)
  - Adaptador concreto (`Adapter`): [`back/apps/delivery-service/src/adapter/osrm-distance.adapter.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/delivery-service/src/adapter/osrm-distance.adapter.ts)
  - Demostración comparativa sin patrón: [`back/apps/delivery-service/src/adapter/sin-adapter.example.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/delivery-service/src/adapter/sin-adapter.example.ts)
  - Código cliente (`Client`): [`back/apps/delivery-service/src/delivery-service.service.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/delivery-service/src/delivery-service.service.ts)
* **Visualización Frontend (`React`)**:
  - Visor interactivo de ruta Leaflet con OpenStreetMap: [`frontend/src/components/OsmRouteMap.tsx`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/frontend/src/components/OsmRouteMap.tsx)

---

## 3. PATRONES CREACIONALES Y DE COMPORTAMIENTO (SECUNDARIOS)

Patrones complementarios implementados para garantizar la completitud del ciclo de vida del software:

---

### 🔨 C. BUILDER (Creacional — GoF)
* **Propósito**: Construye paso a paso la entidad de dominio `Order` validando exhaustivamente sus invariantes (cliente, dirección, ítems no vacíos, cálculo de descuentos y totales no negativos) antes de la persistencia.
* **Archivos**:
  - Interfaz: [`back/apps/orders-service/src/patterns/builder/order.builder.interface.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/orders-service/src/patterns/builder/order.builder.interface.ts)
  - Implementación Concreta: [`back/apps/orders-service/src/patterns/builder/order.builder.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/orders-service/src/patterns/builder/order.builder.ts)
  - Pruebas unitarias: [`back/apps/orders-service/test/builder.spec.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/orders-service/test/builder.spec.ts)
  - Frontend: [`frontend/src/patterns/builder/order-request.builder.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/frontend/src/patterns/builder/order-request.builder.ts)

---

### 🏭 D. FACTORY METHOD (Creacional — GoF)
* **Propósito**: Define una jerarquía de creadores logísticos (`StandardDeliveryCreator`, `ExpressDeliveryCreator`, `EcoBicycleDeliveryCreator`) para instanciar planes de transporte (`DeliveryPlan`) desacoplando el cálculo de recargos y tiempos de llegada.
* **Archivos**:
  - Interfaz y Productos: [`back/apps/delivery-service/src/patterns/factory/delivery-plan.interface.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/delivery-service/src/patterns/factory/delivery-plan.interface.ts) y [`delivery-plans.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/delivery-service/src/patterns/factory/delivery-plans.ts)
  - Creadores: [`back/apps/delivery-service/src/patterns/factory/delivery-plan.creator.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/delivery-service/src/patterns/factory/delivery-plan.creator.ts) y [`delivery-plan.creators.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/delivery-service/src/patterns/factory/delivery-plan.creators.ts)
  - Registro / Dispatcher: [`back/apps/delivery-service/src/patterns/factory/delivery-plan.registry.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/delivery-service/src/patterns/factory/delivery-plan.registry.ts)
  - Pruebas unitarias: [`back/apps/delivery-service/test/factory.spec.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/delivery-service/test/factory.spec.ts)

---

### 📢 E. OBSERVER / EventBroker (Comportamiento — GoF)
* **Propósito**: Desacopla la persistencia del pedido de sus efectos colaterales (impresión/comanda para cocina y orden de despacho para domicilios).
* **Archivos**:
  - `back/apps/orders-service/src/broker/event-broker.ts`
  - `back/apps/orders-service/src/broker/subscribers/kitchen-notifier.subscriber.ts`
  - `back/apps/orders-service/src/broker/subscribers/delivery-dispatcher.subscriber.ts`

---

### 🌐 F. SINGLETON (Creacional — GoF — Frontend)
* **Propósito**: Garantiza una única instancia centralizada de Axios para serialización y control uniforme de errores HTTP hacia los microservicios.
* **Archivos**:
  - `frontend/src/api/http-client.ts`
