# Estrategia de Sistema Offline para Contingencia

## 📋 Resumen del Problema

El sistema actual de venta de productos (`/productsSale`) depende completamente de:
- Conexión a internet
- Servidor remoto funcionando

Si el servidor se cae, aunque haya internet, **se paraliza la venta de bebidas**, lo cual es inviable durante la noche en un club.

## ✅ Entendimiento del Requerimiento

### Objetivo Principal
Tener un sistema de contingencia **100% offline** que permita:
1. Continuar vendiendo productos/servicios cuando el servidor remoto esté caído
2. Sincronizar automáticamente cuando vuelva la conexión
3. Mantener integridad de datos (sin duplicados, sin pérdidas)

### Datos Necesarios para Operar Offline

#### 1. **Partners (Socios)**
- **Frecuencia**: Copia diaria al encender la máquina
- **Estrategia**: Copia completa de todos los partners
- **Uso**: Validar que el visitante es socio válido

#### 2. **Products_Services (Productos/Servicios)**
- **Frecuencia**: Cada 15 minutos
- **Estrategia**: 
  - Primera vez: copia completa
  - Siguientes: solo si hubo cambios (comparar timestamps o checksums)
  - Si no hay cambios, mantener datos existentes
- **Uso**: Mostrar catálogo de productos disponibles para venta

#### 3. **Visits (Visitas)**
- **Frecuencia**: Cada 15 minutos (incremental)
- **Estrategia**: 
  - Copiar solo visitas de los **últimos 3 días** hasta el momento actual
  - Incremental: solo nuevas visitas desde la última sincronización
- **Uso**: Validar que el brazalete corresponde a una visita activa

### Datos a Sincronizar al Volver la Conexión

#### 1. **Tickets** (creados offline)
- Todos los tickets generados durante el modo offline
- Incluir: `id_visit`, `id_bracelet`, `ticket_date`, `ticket_amount`, `observations`

#### 2. **Ticket_Details** (detalles de tickets offline)
- Todos los detalles de productos vendidos offline
- Incluir: `id_ticket`, `id_product_service`, `quantity`, `unit_price`, `payed`, `state`

#### 3. **Actualizaciones de Visits**
- Actualizar `visit_amount_consumed` en las visitas que tuvieron consumos offline

#### 4. **Actualizaciones de Products_Services**
- Actualizar `available` (stock) de productos vendidos offline

---

## 🏗️ Alternativas de Arquitectura

### **ALTERNATIVA 1: SQLite Local + API Local + Sincronización** ✅ RECOMENDADA

#### Descripción
- **SQLite local** (archivo `.db` en disco) con estructura similar a la remota
- **API Express.js local** (puerto 3001) con mismos endpoints que la remota
- **Servicio Windows/Tarea Programada** para sincronización PULL automática
- **Botón manual** en interfaz para sincronización PUSH de tickets
- Frontend detecta automáticamente si servidor remoto está disponible

#### Ventajas
- ✅ **SQLite es GRATIS y no requiere servidor** (archivo único)
- ✅ Estructura de datos familiar (mismo esquema que MySQL remoto)
- ✅ Consultas SQL directas (rápido)
- ✅ Transacciones ACID garantizadas
- ✅ Puede usar Sequelize (ya lo usan, solo cambia el driver)
- ✅ Perfecto para una sola terminal
- ✅ API local idéntica a la remota (reutiliza código)
- ✅ Sincronización híbrida (automática pull + manual push)

#### Desventajas
- ⚠️ Requiere Node.js local (ya lo tienen)
- ⚠️ Requiere configurar servicio Windows o tarea programada

#### Componentes Necesarios
1. **SQLite local** (archivo `local.db` en carpeta del proyecto)
2. **API Express local** (puerto 3001, mismo código que backend remoto)
3. **Servicio Windows/Tarea Programada** (sincronización PULL automática)
4. **Frontend adaptativo** (detección automática offline/online)
5. **Interfaz de sincronización manual** (botón para PUSH de tickets)
6. **Tabla de control** (`sync_metadata` y `sync_queue` en SQLite)

---

### **ALTERNATIVA 2: Archivos JSON + IndexedDB (Browser Storage)** ❌ DESCARTADA

**Razón de descarte**: Aunque es más simple, SQLite ofrece mejor rendimiento y estructura de datos para este caso de uso. Además, requiere menos cambios en el código existente ya que pueden reutilizar los modelos de Sequelize.

---


## 🔄 Estrategia de Sincronización Detallada

### **Fase 1: Sincronización de Datos Maestros (Pull desde Remoto)**

#### Partners (Diario al encender)
```javascript
// Pseudocódigo
async function syncPartners() {
  const remotePartners = await fetch(`${REMOTE_API}/partners/list`);
  await dbLocal.Partners.bulkCreate(remotePartners, { 
    updateOnDuplicate: ['partner_name', 'partner_dni', ...] 
  });
}
```

#### Products_Services (Cada 15 minutos)
```javascript
async function syncProductsServices() {
  // Opción A: Comparar timestamps
  const lastSync = await getLastSyncTime('products_services');
  const remoteProducts = await fetch(
    `${REMOTE_API}/products_services?updated_after=${lastSync}`
  );
  
  // Opción B: Comparar checksums/hashes
  const localHash = await calculateHash('products_services');
  const remoteHash = await fetch(`${REMOTE_API}/products_services/hash`);
  
  if (localHash !== remoteHash) {
    // Hay cambios, copiar todo
    await dbLocal.ProductsServices.bulkCreate(remoteProducts, {
      updateOnDuplicate: ['description', 'price', 'available', ...]
    });
  }
}
```

#### Visits (Cada 15 minutos, incremental)
```javascript
async function syncVisits() {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  const remoteVisits = await fetch(
    `${REMOTE_API}/visits?since=${threeDaysAgo.toISOString()}&hour_exit=null`
  );
  
  await dbLocal.Visits.bulkCreate(remoteVisits, {
    updateOnDuplicate: ['visit_date', 'hour_entry', 'visit_amount_consumed', ...]
  });
}
```

### **Fase 2: Operación Offline (Escritura Local)**

#### Crear Ticket Offline
```javascript
async function createTicketOffline(cart, id_bracelet, observations) {
  // 1. Validar que la visita existe localmente
  const visit = await dbLocal.Visits.findOne({
    where: {
      [Op.or]: [
        { id_bracelet_1: id_bracelet },
        { id_bracelet_2: id_bracelet }
      ],
      hour_exit: null
    }
  });
  
  if (!visit) throw new Error('Visita no encontrada');
  
  // 2. Crear ticket en BD local
  const ticket = await dbLocal.Tickets.create({
    id_visit: visit.id_visit,
    id_bracelet: id_bracelet,
    ticket_date: new Date(),
    ticket_amount: total,
    observations: observations,
    sync_status: 'PENDING' // Marcar como pendiente de sincronizar
  });
  
  // 3. Crear ticket_details
  await dbLocal.TicketDetails.bulkCreate(
    cart.map(item => ({
      id_ticket: ticket.id_ticket,
      id_product_service: item.id_product_service,
      quantity: item.cantidad,
      unit_price: item.price,
      payed: false,
      state: 'NO PAGADO',
      sync_status: 'PENDING'
    }))
  );
  
  // 4. Actualizar visit local
  await dbLocal.Visits.update(
    { visit_amount_consumed: visit.visit_amount_consumed + total },
    { where: { id_visit: visit.id_visit } }
  );
  
  // 5. Actualizar stock local (si se implementa en el futuro)
  // NOTA: Por ahora no se maneja stock, pero se deja preparado para futuro
  // for (const item of cart) {
  //   await dbLocal.ProductsServices.decrement('available', {
  //     by: item.cantidad,
  //     where: { id_product_service: item.id_product_service }
  //   });
  // }
}
```

### **Fase 3: Sincronización de Tickets Offline (Push hacia Remoto) - ON DEMAND**

**IMPORTANTE**: Esta sincronización es **MANUAL** (on-demand), activada por el usuario mediante un botón en la interfaz.

```javascript
// Endpoint en API local para sincronizar tickets pendientes
async function syncPendingTickets() {
  // Validar que hay conexión al servidor remoto
  if (!await checkRemoteServerAvailable()) {
    throw new Error('Servidor remoto no disponible');
  }
  
  const pendingTickets = await dbLocal.Tickets.findAll({
    where: { sync_status: 'PENDING' },
    include: [{ model: TicketDetails }]
  });
  
  if (pendingTickets.length === 0) {
    return { message: 'No hay tickets pendientes', synced: 0 };
  }
  
  let synced = 0;
  let errors = [];
  
  for (const ticket of pendingTickets) {
    try {
      // Enviar ticket al servidor remoto
      const response = await fetch(`${REMOTE_API}/consumptions/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart: ticket.ticket_details.map(td => ({
            id_product_service: td.id_product_service,
            cantidad: td.quantity,
            price: td.unit_price
          })),
          total_consumed: ticket.ticket_amount,
          id_bracelet: ticket.id_bracelet,
          ticket_observations: ticket.observations
        })
      });
      
      if (response.ok) {
        const remoteData = await response.json();
        // Marcar como sincronizado
        await dbLocal.Tickets.update(
          { 
            sync_status: 'SYNCED', 
            remote_id_ticket: remoteData.data.id_ticket,
            synced_at: new Date()
          },
          { where: { id_ticket: ticket.id_ticket } }
        );
        synced++;
      } else {
        errors.push(`Ticket ${ticket.id_ticket}: ${response.statusText}`);
      }
    } catch (error) {
      errors.push(`Ticket ${ticket.id_ticket}: ${error.message}`);
      // Mantener como PENDING para reintentar después
    }
  }
  
  return {
    message: `Sincronizados ${synced} de ${pendingTickets.length} tickets`,
    synced,
    total: pendingTickets.length,
    errors: errors.length > 0 ? errors : undefined
  };
}
```

**Interfaz de Usuario para Sincronización Manual:**
- Botón "Sincronizar Tickets Pendientes" visible cuando hay tickets pendientes
- Indicador de cantidad de tickets pendientes
- Modal de progreso durante la sincronización
- Notificación de éxito/error al finalizar

---

## 🛠️ Implementación Técnica Recomendada

### **Stack Tecnológico**
- **Base de datos local**: SQLite (usando `sequelize` con dialect `sqlite`)
- **API local**: Express.js (mismo código que backend, pero apuntando a SQLite)
- **Sincronizador PULL**: Servicio Windows o Tarea Programada (Node.js con `node-cron`)
- **Sincronizador PUSH**: Endpoint en API local activado manualmente desde frontend
- **Frontend**: Detección automática de disponibilidad con fallback transparente

### **Dependencias Adicionales Necesarias**
```json
{
  "dependencies": {
    "sqlite3": "^5.1.6",           // Driver para SQLite
    "node-cron": "^3.0.3",         // Para tareas programadas (PULL)
    "node-windows": "^1.0.0-beta.8" // Para crear servicio Windows (opcional)
  }
}
```

### **Servicio Windows / Tarea Programada**

#### **Opción A: Servicio Windows (Recomendado)**
- Se ejecuta automáticamente al iniciar Windows
- Corre en background sin interfaz
- Se puede iniciar/detener desde "Servicios" de Windows
- Usa `node-windows` para crear el servicio

#### **Opción B: Tarea Programada**
- Configurada desde "Programador de tareas" de Windows
- Ejecuta script Node.js cada X minutos
- Más simple de configurar pero menos robusto

#### **Script del Servicio**
```javascript
// sync-service/index.ts
import cron from 'node-cron';
import { syncPartners } from './sync-partners';
import { syncProducts } from './sync-products';
import { syncVisits } from './sync-visits';

// Sincronizar Partners al iniciar (una vez al día)
syncPartners();

// Sincronizar Products cada 15 minutos
cron.schedule('*/15 * * * *', () => {
  syncProducts();
});

// Sincronizar Visits cada 15 minutos
cron.schedule('*/15 * * * *', () => {
  syncVisits();
});
```

### **Estructura de Archivos Propuesta**
```
MiClub/
├── backend/
│   ├── src/
│   │   ├── database/
│   │   │   ├── local/              # Nueva carpeta
│   │   │   │   ├── connection.ts   # Conexión a SQLite local
│   │   │   │   ├── models/         # Modelos para BD local (mismos que remotos)
│   │   │   │   └── sync/           # Lógica de sincronización
│   │   │   │       ├── sync-partners.ts
│   │   │   │       ├── sync-products.ts
│   │   │   │       ├── sync-visits.ts
│   │   │   │       └── sync-tickets.ts
│   │   │   └── remote/             # Existente (conexión remota)
│   │   └── api/
│   │       └── local/              # Nueva carpeta
│   │           └── server.ts       # API Express local (puerto 3001)
│   └── sync-service/               # Nueva carpeta (servicio Windows)
│       ├── index.ts                # Servicio principal (PULL automático)
│       ├── scheduler.ts             # Tareas programadas (Partners, Products, Visits)
│       └── sync-tickets.ts          # Sincronización PUSH manual (on-demand)
├── frontend/
│   └── src/
│       ├── services/
│       │   ├── api-client.ts       # Cliente que detecta offline/online
│       │   └── sync-service.ts     # Servicio para sincronización manual (PUSH)
│       └── views/
│           └── consumed/
│               └── sale/
│                   └── ProductsSale.vue  # Modificar para detectar modo offline
```

### **Flujo de Detección Offline/Online**

```javascript
// frontend/src/services/api-client.ts
class ApiClient {
  private remoteUrl = process.env.VUE_APP_DEGIRA;
  private localUrl = 'http://localhost:3001/api/v1';
  private isOfflineMode = false;
  
  async checkRemoteAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${this.remoteUrl}/health`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }
  
  async get(endpoint: string) {
    const isRemoteAvailable = await this.checkRemoteAvailable();
    this.isOfflineMode = !isRemoteAvailable;
    const baseUrl = isRemoteAvailable ? this.remoteUrl : this.localUrl;
    
    return fetch(`${baseUrl}${endpoint}`);
  }
  
  async post(endpoint: string, data: any) {
    const isRemoteAvailable = await this.checkRemoteAvailable();
    this.isOfflineMode = !isRemoteAvailable;
    const baseUrl = isRemoteAvailable ? this.remoteUrl : this.localUrl;
    
    return fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }
  
  // Método para sincronización manual de tickets (PUSH)
  async syncPendingTickets(): Promise<any> {
    const response = await fetch(`${this.localUrl}/sync/tickets`, {
      method: 'POST'
    });
    return response.json();
  }
  
  // Obtener estado de sincronización
  async getSyncStatus(): Promise<any> {
    const response = await fetch(`${this.localUrl}/sync/status`);
    return response.json();
  }
}
```

---

## ⚙️ Configuración de Sincronización

### **Cronograma de Sincronización**

| Recurso | Frecuencia | Tipo | Activación |
|---------|-----------|------|------------|
| Partners | Diario (al encender) | Pull (automático) | Servicio Windows / Tarea Programada |
| Products_Services | Cada 15 minutos | Pull (automático) | Servicio Windows / Tarea Programada |
| Visits | Cada 15 minutos | Pull (automático) | Servicio Windows / Tarea Programada |
| Tickets (push) | On-demand | Push (manual) | Botón en interfaz de usuario |

**Nota**: La sincronización PULL (obtener datos del servidor remoto) es automática y corre en background. La sincronización PUSH (enviar tickets al servidor remoto) es manual y requiere acción del usuario.

### **Tabla de Control de Sincronización**
```sql
CREATE TABLE sync_metadata (
  id INTEGER PRIMARY KEY,
  resource_name TEXT NOT NULL,  -- 'partners', 'products_services', 'visits'
  last_sync_date DATETIME,
  last_sync_hash TEXT,          -- Para detectar cambios
  sync_status TEXT,              -- 'SUCCESS', 'ERROR', 'PENDING'
  error_message TEXT
);
```

### **Tabla de Cola de Sincronización (Opcional)**
```sql
-- Esta tabla es opcional si se usa campo sync_status en Tickets
-- Se puede usar para tracking más detallado
CREATE TABLE sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,     -- 'ticket', 'ticket_detail'
  entity_id INTEGER,
  entity_data TEXT,              -- JSON con los datos
  sync_status TEXT DEFAULT 'PENDING',  -- 'PENDING', 'SYNCED', 'ERROR'
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  synced_at DATETIME
);
```

### **Modificación a Tabla Tickets (Agregar campos de sincronización)**
```sql
-- Agregar campos a tabla Tickets existente en SQLite
ALTER TABLE Tickets ADD COLUMN sync_status TEXT DEFAULT 'SYNCED';
ALTER TABLE Tickets ADD COLUMN remote_id_ticket INTEGER;
ALTER TABLE Tickets ADD COLUMN synced_at DATETIME;
ALTER TABLE Tickets ADD COLUMN created_offline BOOLEAN DEFAULT 0;
```

**Nota**: Los tickets creados offline tendrán `sync_status = 'PENDING'` y `created_offline = 1`. Los tickets sincronizados tendrán `sync_status = 'SYNCED'` y `remote_id_ticket` con el ID asignado por el servidor remoto.

---

## 🔒 Consideraciones de Seguridad e Integridad

### **Prevención de Duplicados**
- Usar `id_ticket` local temporal (negativo o UUID)
- Al sincronizar, el servidor remoto asigna `id_ticket` real
- Guardar mapeo `local_id → remote_id` para referencias

### **Manejo de Conflictos**
- Si un ticket ya existe en remoto (mismo `id_bracelet`, misma fecha/hora), no duplicar
- Validar antes de insertar en remoto

### **Validación de Datos**
- Antes de sincronizar, validar que:
  - La visita sigue activa en remoto
  - Los productos aún existen
  - **Nota**: No se valida stock por ahora (según requerimientos)

### **Rollback en Caso de Error**
- Si la sincronización falla, mantener ticket como `PENDING`
- Reintentar automáticamente cada X minutos
- Log de errores para revisión manual

---

## 📊 Métricas y Monitoreo

### **Dashboard de Estado de Sincronización**

Interfaz visual en el frontend que muestra:

#### **Indicadores en Tiempo Real**
- ✅ **Estado del servidor remoto**: Online / Offline (con indicador visual)
- 📊 **Tickets pendientes**: Cantidad de tickets esperando sincronización
- 🔄 **Última sincronización PULL**: 
  - Partners: fecha/hora última sincronización
  - Products: fecha/hora última sincronización
  - Visits: fecha/hora última sincronización
- ⚠️ **Errores de sincronización**: Si hubo errores en la última ejecución

#### **Componente Visual Propuesto**
```vue
<!-- Componente de estado de sincronización -->
<v-card>
  <v-card-title>
    <v-icon :color="isOnline ? 'green' : 'red'">
      {{ isOnline ? 'mdi-wifi' : 'mdi-wifi-off' }}
    </v-icon>
    Estado: {{ isOnline ? 'Online' : 'Offline' }}
  </v-card-title>
  
  <v-card-text>
    <v-row>
      <v-col>
        <div>Tickets Pendientes: <strong>{{ pendingTickets }}</strong></div>
        <v-btn 
          v-if="pendingTickets > 0" 
          color="orange" 
          @click="syncTickets"
          :loading="syncing">
          Sincronizar Tickets
        </v-btn>
      </v-col>
    </v-row>
    
    <v-divider class="my-3"></v-divider>
    
    <v-row>
      <v-col cols="4">
        <div class="text-caption">Partners</div>
        <div class="text-body-2">{{ lastSyncPartners || 'Nunca' }}</div>
      </v-col>
      <v-col cols="4">
        <div class="text-caption">Products</div>
        <div class="text-body-2">{{ lastSyncProducts || 'Nunca' }}</div>
      </v-col>
      <v-col cols="4">
        <div class="text-caption">Visits</div>
        <div class="text-body-2">{{ lastSyncVisits || 'Nunca' }}</div>
      </v-col>
    </v-row>
  </v-card-text>
</v-card>
```

### **Indicadores Clave**
- Cantidad de tickets pendientes de sincronizar
- Tiempo desde última sincronización exitosa (PULL)
- Estado de conexión al servidor remoto
- Errores de sincronización (si los hay)

### **Alertas Visuales**
- 🔴 Indicador rojo si hay más de 10 tickets pendientes
- ⚠️ Advertencia si no se sincronizó en más de 1 hora (PULL)
- ❌ Error si hay fallos repetidos de sincronización

---

## ✅ Respuestas y Decisiones Confirmadas

### **Contexto del Entorno**
1. **Cantidad de terminales**: **UNA SOLA** terminal
   - ✅ Simplifica mucho la implementación
   - ✅ No hay conflictos entre múltiples terminales
   - ✅ No se requieren mecanismos de resolución de conflictos complejos

2. **Manejo de stock**: **NO se maneja por ahora**
   - ✅ Simplifica la lógica de sincronización
   - ✅ No requiere validación de stock al sincronizar
   - ✅ Se puede agregar en el futuro si es necesario

3. **Base de datos local**: **SQLite** (gratis, sencillo, ligero)
   - ✅ No requiere servidor MySQL
   - ✅ Archivo único `.db` fácil de respaldar
   - ✅ Perfecto para una sola terminal
   - ✅ Compatible con Sequelize (ya lo usan)

4. **Estrategia de sincronización**:
   - **PULL (Obtener datos del servidor remoto)**: 
     - ✅ **Servicio de Windows o Tarea Programada** (automático)
     - ✅ Corre en background sin intervención del usuario
   - **PUSH (Enviar tickets offline al servidor remoto)**:
     - ✅ **On-demand por el usuario** (botón manual)
     - ✅ El usuario decide cuándo sincronizar los tickets pendientes
     - ✅ Interfaz clara para ver estado y cantidad de tickets pendientes

5. **Interfaz de monitoreo**: **SÍ, necesaria**
   - ✅ Dashboard para ver tickets pendientes
   - ✅ Estado de última sincronización (pull)
   - ✅ Indicadores visuales de modo offline/online

---

## 🎯 Recomendación Final: SQLite Local + API Local

### **Por qué esta es la mejor opción para su caso:**

1. ✅ **SQLite es GRATIS y SENCILLO**
   - No requiere instalación de servidor MySQL
   - Archivo único `.db` en disco local
   - Perfecto para una sola terminal

2. ✅ **Una sola terminal simplifica todo**
   - No hay conflictos de sincronización entre terminales
   - No se requieren mecanismos complejos de resolución
   - Lógica más simple y robusta

3. ✅ **Sincronización híbrida (automática + manual)**
   - Pull automático: datos siempre actualizados sin intervención
   - Push manual: control del usuario sobre cuándo enviar tickets

4. ✅ **Mismo stack tecnológico**
   - Sequelize funciona con SQLite
   - Express.js para API local
   - Mismo código, solo cambia la conexión de BD

5. ✅ **Sin validación de stock (por ahora)**
   - Simplifica la lógica de sincronización
   - Menos puntos de falla

### **Arquitectura Final Recomendada:**

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Vue.js)                     │
│  - Detecta automáticamente si servidor remoto está up  │
│  - Cambia entre API remota y local transparentemente    │
│  - Botón manual para sincronizar tickets pendientes    │
└─────────────────────────────────────────────────────────┘
                          │
                          │
        ┌─────────────────┴─────────────────┐
        │                                     │
        ▼                                     ▼
┌──────────────────┐              ┌──────────────────┐
│  API REMOTA      │              │   API LOCAL       │
│  (Servidor Web)  │              │  (localhost:3001) │
│                  │              │                   │
│  MySQL Remoto    │              │  SQLite Local     │
└──────────────────┘              └──────────────────┘
        ▲                                     │
        │                                     │
        └─────────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  SERVICIO WINDOWS     │
              │  (Sincronización)     │
              │                       │
              │  - Pull automático:   │
              │    * Partners (diario)│
              │    * Products (15 min) │
              │    * Visits (15 min)  │
              │                       │
              │  - Push manual:       │
              │    * Tickets (on-demand)│
              └───────────────────────┘
```

---

## 🚀 Próximos Pasos

Una vez autorizado, procederé a implementar:

1. ✅ Base de datos SQLite local con estructura similar a la remota
2. ✅ API Express local (puerto 3001) con mismos endpoints
3. ✅ Servicio de sincronización (pull automático)
4. ✅ Frontend adaptativo (detección offline/online)
5. ✅ Interfaz de sincronización manual (push on-demand)
6. ✅ Dashboard de monitoreo de estado

¿Autoriza proceder con esta implementación?

