# 📋 PLAN DE IMPLEMENTACIÓN DETALLADO - Sistema Offline

## 🎯 RESUMEN EJECUTIVO

Voy a construir un **sistema de contingencia offline** que permita seguir vendiendo productos cuando el servidor remoto esté caído, usando:
- **SQLite** como base de datos local (archivo `.db` en disco)
- **API Express local** en puerto 3001 (mismo código que el backend remoto)
- **Servicio Windows** que sincroniza datos automáticamente
- **Frontend adaptativo** que detecta si el servidor está online/offline

---

## 📦 QUÉ DEPENDENCIAS VOY A INSTALAR

### Backend (`backend/package.json`)
```json
{
  "dependencies": {
    "sqlite3": "^5.1.6"  // NUEVA - Driver para SQLite
  }
}
```

**Nota**: Ya tienen `node-cron` instalado, así que no necesito agregarlo.

---

## 🗂️ QUÉ ARCHIVOS Y CARPETAS VOY A CREAR

### 1. BASE DE DATOS LOCAL (SQLite)

#### `backend/src/database/local/connection.ts`
- **Qué hace**: Crea conexión a SQLite local
- **Usa**: Sequelize con dialect `sqlite`
- **Archivo BD**: `backend/data/local.db` (se crea automáticamente)

#### `backend/src/database/local/models/` (carpeta)
- **Qué hace**: Modelos Sequelize para SQLite (mismos que los remotos)
- **Archivos que creo**:
  - `partner.model.ts` - Modelo de Partners
  - `product_service.model.ts` - Modelo de Products_Services
  - `visit.model.ts` - Modelo de Visits
  - `ticket.model.ts` - Modelo de Tickets
  - `ticket_details.model.ts` - Modelo de Ticket_Details
  - `sync_metadata.model.ts` - Modelo para control de sincronización

**Nota**: Estos modelos son copias de los remotos pero apuntando a SQLite.

---

### 2. LÓGICA DE SINCRONIZACIÓN (PULL - Automático)

#### `backend/src/database/local/sync/sync-partners.ts`
- **Qué hace**: Copia todos los Partners del servidor remoto a SQLite local
- **Cuándo se ejecuta**: Diario, al iniciar el servicio Windows
- **Usa**: API remota `/partners/list` → Guarda en SQLite local

#### `backend/src/database/local/sync/sync-products.ts`
- **Qué hace**: Copia Products_Services del servidor remoto a SQLite local
- **Cuándo se ejecuta**: Cada 15 minutos (automático)
- **Usa**: API remota `/products_services/` → Guarda en SQLite local
- **Inteligente**: Compara si hubo cambios antes de copiar

#### `backend/src/database/local/sync/sync-visits.ts`
- **Qué hace**: Copia Visits de los últimos 3 días del servidor remoto a SQLite local
- **Cuándo se ejecuta**: Cada 15 minutos (automático)
- **Usa**: API remota `/visits/` con filtro de fecha → Guarda en SQLite local
- **Incremental**: Solo copia visitas nuevas desde la última sincronización

#### `backend/src/database/local/sync/sync-tickets.ts`
- **Qué hace**: Envía tickets creados offline al servidor remoto (PUSH)
- **Cuándo se ejecuta**: Manual, cuando el usuario presiona el botón
- **Usa**: Lee tickets con `sync_status = 'PENDING'` de SQLite → Envía a API remota `/consumptions/create`

---

### 3. API LOCAL (Express en puerto 3001)

#### `backend/src/api/local/server.ts`
- **Qué hace**: Servidor Express que corre en `localhost:3001`
- **Usa**: Mismos endpoints que el backend remoto pero apunta a SQLite
- **Endpoints que creo**:
  - `GET /api/v1/consumptions/get/featured` - Obtener productos destacados
  - `POST /api/v1/consumptions/create` - Crear ticket (offline)
  - `GET /api/v1/partners/inside` - Obtener socios en el club
  - `GET /api/v1/sync/status` - Estado de sincronización
  - `POST /api/v1/sync/tickets` - Sincronizar tickets pendientes (manual)

#### `backend/src/api/local/routes.ts`
- **Qué hace**: Define las rutas de la API local
- **Usa**: Mismos controladores que el backend remoto pero con BD local

#### `backend/src/api/local/controllers/` (carpeta)
- **Qué hace**: Controladores que usan SQLite en lugar de MySQL remoto
- **Archivos**: Copias adaptadas de los controladores remotos

---

### 4. SERVICIO DE SINCRONIZACIÓN (Windows)

#### `backend/sync-service/index.ts`
- **Qué hace**: Servicio principal que corre en background
- **Usa**: `node-cron` para tareas programadas
- **Funciones**:
  - Al iniciar: Sincroniza Partners (una vez al día)
  - Cada 15 min: Sincroniza Products
  - Cada 15 min: Sincroniza Visits

#### `backend/sync-service/scheduler.ts`
- **Qué hace**: Configura las tareas programadas (cron jobs)
- **Usa**: `node-cron` con expresiones cron

#### `backend/sync-service/install-service.ts` (opcional)
- **Qué hace**: Script para instalar como servicio de Windows
- **Usa**: `node-windows` (opcional, puede usar Tarea Programada en su lugar)

---

### 5. FRONTEND (Vue.js)

#### `frontend/src/services/api-client.ts` (NUEVO)
- **Qué hace**: Cliente HTTP que detecta automáticamente si el servidor remoto está disponible
- **Lógica**:
  - Intenta conectar al servidor remoto
  - Si está disponible → usa API remota
  - Si NO está disponible → usa API local (`localhost:3001`)
- **Usa**: `fetch` con timeout de 3 segundos

#### `frontend/src/services/sync-service.ts` (NUEVO)
- **Qué hace**: Servicio para sincronización manual de tickets
- **Funciones**:
  - `syncPendingTickets()` - Envía tickets pendientes al servidor remoto
  - `getSyncStatus()` - Obtiene estado de sincronización

#### `frontend/src/components/SyncStatus.vue` (NUEVO)
- **Qué hace**: Componente visual que muestra:
  - Estado online/offline del servidor remoto
  - Cantidad de tickets pendientes
  - Última sincronización de cada recurso
  - Botón para sincronizar tickets manualmente

#### `frontend/src/plugins/offline-interceptor.js` (NUEVO)
- **Qué hace**: Plugin Vue que intercepta automáticamente `this.$http` (axios)
- **Cómo funciona**: 
  - Intercepta todas las llamadas HTTP antes de enviarlas
  - Detecta si servidor remoto está disponible
  - Si está offline, redirige automáticamente a API local
  - **NO MODIFICA** archivos existentes, solo intercepta las llamadas
- **Ventaja**: Funciona automáticamente con todos los componentes existentes

#### `frontend/src/views/consumed/sale/ProductsSaleOffline.vue` (NUEVO - Opcional)
- **Qué hace**: Versión alternativa de ProductsSale con mejoras offline
- **Cuándo usar**: Si quieren una versión mejorada, pero NO es necesario
- **Nota**: El interceptor hace que ProductsSale.vue existente funcione offline automáticamente

---

## 🔧 QUÉ MODIFICACIONES VOY A HACER A ARCHIVOS EXISTENTES

### Backend

#### `backend/src/database/connection.ts` (NO MODIFICO)
- **Razón**: Ya existe conexión a MySQL remoto, no la toco
- **Creo**: Nueva conexión en `backend/src/database/local/connection.ts`

#### `backend/src/api/v1/entities/consumptions/helpers.ts` (NO MODIFICO)
- **Razón**: Lógica remota se mantiene igual
- **Creo**: Copia adaptada en `backend/src/api/local/controllers/` que usa SQLite

### Frontend

#### `frontend/src/middlewares/offline-interceptor.js` (NUEVO)
- **Qué hace**: Interceptor de axios que se ejecuta automáticamente
- **Cómo se usa**: Se importa en `frontend/src/middlewares/index.js` (donde ya configuran axios)
- **Ventaja**: NO necesito tocar `main.js`, solo agrego 1 línea en `middlewares/index.js`

#### `frontend/src/views/consumed/sale/ProductsSale.vue` (MODIFICAR)
- **Qué cambio**:
  - Línea 267: `this.$http.get()` → `this.$apiClient.get()`
  - Agrego detección de modo offline
  - Agrego componente `SyncStatus` en la vista

---

## 🗄️ QUÉ TABLAS VOY A CREAR EN SQLite

### Tablas de Datos (iguales a MySQL remoto)
1. **Partners** - Socios
2. **Products_Services** - Productos y servicios
3. **Visits** - Visitas activas
4. **Tickets** - Tickets creados offline (con campo `sync_status`)
5. **Ticket_Details** - Detalles de tickets offline

### Tablas de Control
6. **sync_metadata** - Control de sincronización
   - `resource_name` (partners, products, visits)
   - `last_sync_date`
   - `sync_status`
   - `error_message`

---

## ⚙️ CÓMO FUNCIONARÁ TODO

### Flujo Normal (Servidor Remoto Online)
1. Usuario abre `/productsSale`
2. Frontend detecta que servidor remoto está disponible
3. Usa API remota (como siempre)
4. Todo funciona igual que ahora

### Flujo Offline (Servidor Remoto Caído)
1. Usuario abre `/productsSale`
2. Frontend detecta que servidor remoto NO está disponible (timeout de 3 seg)
3. **Automáticamente** cambia a API local (`localhost:3001`)
4. API local lee de SQLite (datos sincronizados previamente)
5. Usuario puede vender productos normalmente
6. Tickets se guardan en SQLite con `sync_status = 'PENDING'`
7. Cuando vuelve la conexión, usuario presiona botón "Sincronizar"
8. Tickets se envían al servidor remoto

### Sincronización Automática (PULL)
1. Servicio Windows corre en background
2. Cada 15 minutos:
   - Consulta API remota `/products_services/`
   - Compara con datos locales
   - Si hay cambios, actualiza SQLite
   - Hace lo mismo con Visits
3. Diario (al iniciar):
   - Consulta API remota `/partners/list`
   - Actualiza todos los Partners en SQLite

### Sincronización Manual (PUSH)
1. Usuario ve que hay tickets pendientes (indicador en pantalla)
2. Presiona botón "Sincronizar Tickets Pendientes"
3. Frontend llama a `POST /api/v1/sync/tickets` (API local)
4. API local:
   - Lee tickets con `sync_status = 'PENDING'` de SQLite
   - Por cada ticket, llama a API remota `/consumptions/create`
   - Si éxito: marca ticket como `sync_status = 'SYNCED'`
   - Si error: mantiene como `PENDING` para reintentar

---

## 📁 ESTRUCTURA FINAL DE ARCHIVOS

```
MiClub/
├── backend/
│   ├── data/
│   │   └── local.db                    # NUEVO - Archivo SQLite
│   ├── src/
│   │   ├── database/
│   │   │   ├── local/                   # NUEVA CARPETA
│   │   │   │   ├── connection.ts        # NUEVO
│   │   │   │   ├── models/              # NUEVA CARPETA
│   │   │   │   │   ├── partner.model.ts
│   │   │   │   │   ├── product_service.model.ts
│   │   │   │   │   ├── visit.model.ts
│   │   │   │   │   ├── ticket.model.ts
│   │   │   │   │   ├── ticket_details.model.ts
│   │   │   │   │   └── sync_metadata.model.ts
│   │   │   │   └── sync/                # NUEVA CARPETA
│   │   │   │       ├── sync-partners.ts
│   │   │   │       ├── sync-products.ts
│   │   │   │       ├── sync-visits.ts
│   │   │   │       └── sync-tickets.ts
│   │   │   └── connection.ts            # EXISTENTE (no modifico)
│   │   └── api/
│   │       ├── local/                    # NUEVA CARPETA
│   │       │   ├── server.ts            # NUEVO
│   │       │   ├── routes.ts            # NUEVO
│   │       │   └── controllers/        # NUEVA CARPETA
│   │       │       └── consumptions.controller.ts
│   │       └── v1/                      # EXISTENTE (no modifico)
│   └── sync-service/                    # NUEVA CARPETA
│       ├── index.ts                     # NUEVO
│       ├── scheduler.ts                # NUEVO
│       └── install-service.ts           # NUEVO (opcional)
├── frontend/
│   └── src/
│       ├── services/
│       │   ├── api-client.ts           # NUEVO
│       │   └── sync-service.ts          # NUEVO
│       ├── components/
│       │   └── SyncStatus.vue          # NUEVO
│       ├── middlewares/
│       │   └── offline-interceptor.js    # NUEVO (intercepta HTTP automáticamente)
│       └── views/
│           └── consumed/
│               └── sale/
│                   ├── ProductsSale.vue    # NO MODIFICO (funciona automáticamente)
│                   └── DetailConsumed.vue  # NO MODIFICO (funciona automáticamente)
└── package.json (backend)               # SOLO agregar sqlite3 (1 línea)
```

---

## 🚀 CÓMO SE EJECUTARÁ TODO

### 1. API Local (puerto 3001)
```bash
# Comando para iniciar API local
npm run start:local
# o
node dist/api/local/server.js
```
- Corre en `localhost:3001`
- Solo se usa cuando servidor remoto está caído

### 2. Servicio de Sincronización
```bash
# Comando para iniciar servicio
npm run sync:start
# o
node dist/sync-service/index.js
```
- Corre en background
- Sincroniza automáticamente cada 15 minutos
- Se puede instalar como servicio de Windows

### 3. Frontend
- No cambia nada en cómo se ejecuta
- Solo internamente usa `api-client` que detecta automáticamente

---

## 🔐 SEGURIDAD Y VALIDACIONES

### Validaciones que implemento:
1. **Antes de crear ticket offline**:
   - Verificar que la visita existe en SQLite local
   - Verificar que el brazalete es válido

2. **Al sincronizar tickets**:
   - Verificar que servidor remoto está disponible
   - Validar que la visita sigue activa en remoto
   - Manejar errores y mantener tickets como PENDING si falla

3. **Prevención de duplicados**:
   - Tickets offline tienen IDs locales temporales
   - Al sincronizar, servidor remoto asigna ID real
   - Guardo mapeo `local_id → remote_id`

---

## 📊 INTERFAZ DE USUARIO

### Componente SyncStatus (nuevo)
- **Ubicación**: Visible en todas las vistas (o solo en `/productsSale`)
- **Muestra**:
  - 🟢 Indicador verde si servidor remoto está online
  - 🔴 Indicador rojo si servidor remoto está offline
  - 📊 "X tickets pendientes de sincronizar"
  - 🔄 Botón "Sincronizar Tickets" (solo si hay pendientes)
  - 📅 "Última sincronización: Partners (hace X horas)"

### Modificaciones visuales (TODO NUEVO)
- Componente `SyncStatus.vue` nuevo que se puede agregar a cualquier vista
- Banner discreto cuando está en modo offline (componente nuevo)
- Indicador de cantidad de tickets pendientes (componente nuevo)
- Botón de sincronización visible cuando hay pendientes (componente nuevo)
- **NO MODIFICO** ProductsSale.vue existente, solo agrego componente nuevo opcional

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### Lo que NO modifico:
- ✅ Backend remoto (sigue igual)
- ✅ Base de datos MySQL remota (sigue igual)
- ✅ Lógica de negocio existente (sigue igual)
- ✅ **Ningún componente Vue existente** (el interceptor funciona automáticamente)
- ✅ **Casi nada en middlewares/index.js** (solo 1 línea para importar interceptor)

### Lo que SÍ creo:
- ✅ Base de datos SQLite local (nueva)
- ✅ API Express local (nueva, puerto 3001)
- ✅ Servicio de sincronización (nuevo)
- ✅ Componentes frontend nuevos (SyncStatus, api-client)

### Requisitos del sistema:
- ✅ Node.js instalado (ya lo tienen)
- ✅ Windows (para servicio Windows o Tarea Programada)
- ✅ Espacio en disco: ~50-100 MB para SQLite (mínimo)

---

## 🧪 CÓMO PROBAR TODO

### Prueba 1: Modo Online (servidor remoto funcionando)
1. Iniciar API local: `npm run start:local`
2. Abrir frontend
3. Ir a `/productsSale`
4. Verificar que usa servidor remoto (indicador verde)
5. Vender producto normalmente
6. Verificar que se guarda en MySQL remoto

### Prueba 2: Modo Offline (servidor remoto caído)
1. Detener servidor remoto (o desconectar internet)
2. Iniciar API local: `npm run start:local`
3. Abrir frontend (el interceptor funciona automáticamente)
4. Ir a `/productsSale` (componente existente, sin modificar)
5. Verificar que detecta offline automáticamente (indicador rojo)
6. Vender producto (funciona igual que antes, pero guarda en SQLite)
7. Verificar que se guarda en SQLite local
8. Verificar que aparece "1 ticket pendiente" (componente SyncStatus)

### Prueba 3: Sincronización
1. Con servidor remoto funcionando
2. Presionar botón "Sincronizar Tickets"
3. Verificar que tickets se envían al servidor remoto
4. Verificar que indicador cambia a "0 tickets pendientes"

---

## ✅ RESUMEN: QUÉ VOY A CONSTRUIR

### Archivos nuevos que creo: **~22 archivos**
- 6 modelos SQLite
- 4 scripts de sincronización
- 1 API Express local
- 2 servicios frontend
- 1 plugin Vue (interceptor HTTP)
- 1 componente Vue (SyncStatus - opcional)
- 1 servicio Windows
- **CERO modificaciones** a componentes Vue existentes
- **Solo 1 línea** en main.js para registrar plugin

### Dependencias nuevas: **1 paquete**
- `sqlite3` (gratis, open source)

### Tiempo estimado de implementación: **4-6 horas**

### Riesgo: **BAJO**
- No modifico código existente crítico
- Todo es nuevo y aislado
- Si algo falla, el sistema remoto sigue funcionando igual

---

## ❓ ¿AUTORIZA ESTA IMPLEMENTACIÓN?

Si autoriza, procederé a:
1. ✅ Instalar dependencia `sqlite3`
2. ✅ Crear estructura de carpetas
3. ✅ Crear modelos SQLite
4. ✅ Crear lógica de sincronización
5. ✅ Crear API local
6. ✅ Crear servicio de sincronización
7. ✅ Modificar frontend para detección offline
8. ✅ Crear componente de estado de sincronización
9. ✅ Probar todo el flujo

¿Procedo con la implementación?

