# Guía Concisa de Sustentación: Patrones Estructurales (Flyweight & Adapter)

**Proyecto**: Sistema de Pedidos y Domicilios (`orders-service :3001` | `delivery-service :3002` | `React :5173`)

---

## ⚡ 1. Demostración en Vivo en 3 Clics (Sin rodeos)

1. **En el Frontend (`1. Módulo Cliente`)**:
   - Haz clic en el botón **`🟢 Modo Back: CON Flyweight (clic para switchear)`** → Cambia en vivo a **`🔴 Modo Back: SIN Flyweight`** y muestra el peso en bytes/KB (`node:v8`) y tiempo en `ms` (`performance.now()`) devueltos por el backend.
   - Haz clic en **`⚡ Simular 10.000 Órdenes en Back`** → Ejecuta en el servidor 10.000 órdenes reales comparando **CON Flyweight** (~654.31 KB, 9 objetos en Pool) vs **SIN Flyweight** (~6.757.82 KB, 30.000 objetos clonados) → **90.3% menos RAM**.
   - Agrega una **Hamburguesa Clásica ($18.000)** + clic en **`🥩 Carne Extra +$6.000`** → Verás que sube a **$24.000** en el carrito y, al pulsar **Crear Pedido**, aparece **al instante en Cocina** (sin recargar página) con su `Total Comanda: $24.000`.
2. **En Terminal (Pruebas automatizadas unitarias y E2E + 10.000 órdenes)**:
   ```powershell
   cd back
   npm.cmd test
   npm.cmd run test:e2e
   ```

---

## 🎯 2. Preguntas del Profesor y Respuestas Exactas (Guion Corto)

### ❓ P1: "¿Por qué aplicó Flyweight ahí (`orders-service`) y NO en otro lado?"
> **Respuesta**: *"Profesor, porque Flyweight solo tiene sentido donde hay **alta cardinalidad con datos repetidos**. En `orders-service`, una orden tiene múltiples ítems (`N` renglones de comida + `M` toppings), pero todos provienen de un catálogo finito de **9 elementos** (5 platos y 4 adicionales). Si entran 10.000 pedidos con 1 hamburguesa y 2 toppings cada uno, se crean **30.000 objetos**. En cambio, en `delivery-service` solo existe **1 domicilio por orden** con coordenadas y tarifas únicas por viaje; aplicar Flyweight allá sería forzar el patrón donde no hay repetición masiva."*

### ❓ P2: "¿Cómo sabe que eso es lo más pesado de la app?"
> **Respuesta**: *"Porque en el dominio de restaurantes cada plato/topping arrastra metadatos invariantes que necesita cocina: receta paso a paso (`preparationGuide`), lista de alérgenos (`allergens`), calorías, categoría, ícono y tarifa base. Medido con el serializador nativo del motor V8 de Node (`v8.serialize`), clonar esa estructura por ítem cuesta **~702 bytes por renglón**, mientras que con Flyweight el contexto extrínseco (`OrderItemContext`) solo guarda punteros al pool y pesa **~77 bytes** (una reducción real del **89.0%** por pedido y **90.3%** en 10.000 pedidos)."*

### ❓ P3: "¿Cómo compara el rendimiento CON patrón vs SIN patrón? ¿Hay valores quemados?"
> **Respuesta**: *"Cero valores quemados en KB. En [`sin-flyweight.example.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/orders-service/src/patterns/flyweight/sin-flyweight.example.ts) tenemos el flujo switcheable real:*
> - ***CON Flyweight (`OrderItemContext`)***: *Reutiliza las 9 instancias únicas de [`DishFlyweightFactory`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/orders-service/src/patterns/flyweight/flyweight.factory.ts).*
> - ***SIN Flyweight (`DishOrderItemSinFlyweight`)***: *No toca el Pool del Flyweight; instancia objetos nuevos clonando arrays de alérgenos, strings de recetas y objetos de toppings por cada pedido.*
> *Medimos ambos en vivo con `v8.serialize([pool, items]).byteLength - basePoolBytes` y `performance.now()`."*

| Escenario Real (Motor V8 Node.js) | CON Flyweight (Pool compartido) | SIN Flyweight (Objetos clonados) | Ahorro Real |
| :--- | :--- | :--- | :--- |
| **1 Orden** (Hamburguesa + 2 Toppings) | **77 Bytes (0.08 KB)** / 9 en Pool | **702 Bytes (0.69 KB)** / 3 clonados | **-89.0% RAM** |
| **10.000 Órdenes** (`npm test` / Botón UI) | **654.31 KB (0.639 MB)** / 9 en Pool | **6.757.82 KB (6.599 MB)** / 30.000 clonados | **-90.3% RAM** |

### ❓ P4: "¿Cuál es el Estado Intrínseco y cuál el Extrínseco en su código?"
> **Respuesta**:
> - **Estado Intrínseco (Compartido e inmutable en [`DishFlyweight`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/orders-service/src/patterns/flyweight/dish-flyweight.ts))**: `id`, `code`, `name`, `basePrice`, `category`, `icon`, `calories`, `allergens`, `preparationGuide`.
> - **Estado Extrínseco (Único por cada pedido en [`OrderItemContext`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/orders-service/src/patterns/flyweight/order-item-context.ts))**: `quantity` (cantidad pedida), `notes` (ej. *"Sin cebolla"*), y el arreglo de referencias `toppings` seleccionados por ese cliente.

### ❓ P5: "¿Por qué Flyweight y no Singleton o caché de base de datos?"
> **Respuesta**: *"Singleton garantiza 1 sola instancia de una clase (ej. `EventBroker`), pero nosotros necesitamos un **Pool indexado de múltiples instancias** (9 platos/toppings distintos) que además operan recibiendo contexto externo (`calculatePrice(extrinsic)`, `formatDescription(extrinsic)`). Y una caché de BD solo evita el `SELECT` de SQLite, pero si al armar 10.000 órdenes en memoria mutamos o clonamos cada plato para sumarle toppings y notas, igual explotamos la RAM; Flyweight separa el estado extrínseco para no clonar el objeto base."*

---

## 🗺️ 3. Ruta de Archivos para Mostrar en 1 Minuto

1. **Flyweight (4 archivos cortos en `back/apps/orders-service/src/patterns/flyweight/`)**:
   - [`dish-flyweight.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/orders-service/src/patterns/flyweight/dish-flyweight.ts) (53 líneas): Estado intrínseco + cálculo de precio/descripción/ticket recibiendo el extrínseco.
   - [`order-item-context.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/orders-service/src/patterns/flyweight/order-item-context.ts) (48 líneas): Estado extrínseco liviano por ítem.
   - [`flyweight.factory.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/orders-service/src/patterns/flyweight/flyweight.factory.ts): `pool: Map` que retorna siempre la misma referencia en RAM.
   - [`sin-flyweight.example.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/orders-service/src/patterns/flyweight/sin-flyweight.example.ts): Clase sin patrón + medición real V8 (`v8.serialize` + `performance.now()`).
2. **Adapter (Estructural 2 en `back/apps/delivery-service/src/adapter/`)**:
   - [`osrm-distance.adapter.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/delivery-service/src/adapter/osrm-distance.adapter.ts): Traduce la API externa OpenStreetMap (`lon,lat` y metros) al contrato de negocio `DistanceCalculator` (en kilómetros).
3. **Secundarios de respaldo**:
   - **Builder**: [`order.builder.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/orders-service/src/patterns/builder/order.builder.ts) (ensambla la orden con ítems CON o SIN Flyweight, aplica cupón `DESCUENTO10` y valida invariantes).
   - **Factory Method**: [`delivery-plan.creators.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/delivery-service/src/patterns/factory/delivery-plan.creators.ts) (crea planes `STANDARD` 🏍️, `EXPRESS` ⚡ +35%, `ECO` 🚲 -15%).
   - **Observer**: [`event-broker.ts`](file:///C:/Users/me/Desktop/Code/UTS_Patrones/back/apps/orders-service/src/broker/event-broker.ts) (notifica a cocina y despacha a `delivery-service` cuando el pedido pasa a `LISTO`).


