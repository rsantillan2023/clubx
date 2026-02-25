# 📋 PLAN FINAL - TODO NUEVO (Sin Modificar Archivos Existentes)

## ✅ RESUMEN: QUÉ VOY A CONSTRUIR

### 🆕 Archivos nuevos que creo: **~22 archivos**
- 6 modelos SQLite
- 4 scripts de sincronización
- 1 API Express local
- 2 servicios frontend
- 1 interceptor HTTP (offline)
- 1 componente Vue (SyncStatus - opcional)
- 1 servicio Windows
- Varios archivos de configuración

### ✏️ Archivos existentes que modifico: **SOLO 2**
1. `frontend/src/middlewares/index.js` - Solo 1 línea nueva al final: `import './offline-interceptor'`
2. `backend/package.json` - Solo agregar `"sqlite3": "^5.1.6"` en dependencies

### 🚫 Archivos existentes que NO modifico: **TODO LO DEMÁS**
- ✅ `ProductsSale.vue` - NO LO TOCO (funciona automáticamente con interceptor)
- ✅ `DetailConsumed.vue` - NO LO TOCO (funciona automáticamente)
- ✅ `main.js` - NO LO TOCO
- ✅ Cualquier otro componente Vue - NO LOS TOCO
- ✅ Backend remoto - NO LO TOCO
- ✅ Base de datos MySQL - NO LA TOCO

---

## 🗂️ ESTRUCTURA DE ARCHIVOS NUEVOS

```
MiClub/
├── backend/
│   ├── data/
│   │   └── local.db                    # NUEVO - Archivo SQLite (se crea automáticamente)
│   ├── src/
│   │   ├── database/
│   │   │   └── local/                   # NUEVA CARPETA COMPLETA
│   │   │       ├── connection.ts        # NUEVO
│   │   │       ├── models/              # NUEVA CARPETA
│   │   │       │   ├── partner.model.ts
│   │   │       │   ├── product_service.model.ts
│   │   │       │   ├── visit.model.ts
│   │   │       │   ├── ticket.model.ts
│   │   │       │   ├── ticket_details.model.ts
│   │   │       │   └── sync_metadata.model.ts
│   │   │       └── sync/                # NUEVA CARPETA
│   │   │           ├── sync-partners.ts
│   │   │           ├── sync-products.ts
│   │   │           ├── sync-visits.ts
│   │   │           └── sync-tickets.ts
│   │   └── api/
│   │       └── local/                    # NUEVA CARPETA COMPLETA
│   │           ├── server.ts            # NUEVO
│   │           ├── routes.ts            # NUEVO
│   │           └── controllers/        # NUEVA CARPETA
│   │               └── consumptions.controller.ts
│   └── sync-service/                    # NUEVA CARPETA COMPLETA
│       ├── index.ts                     # NUEVO
│       ├── scheduler.ts                 # NUEVO
│       └── install-service.ts           # NUEVO (opcional)
├── frontend/
│   └── src/
│       ├── middlewares/
│       │   └── offline-interceptor.js   # NUEVO (solo 1 línea de import en index.js)
│       ├── services/
│       │   ├── api-client.ts            # NUEVO
│       │   └── sync-service.ts          # NUEVO
│       └── components/
│           └── SyncStatus.vue           # NUEVO (opcional, para mostrar estado)
└── backend/package.json                 # SOLO agregar sqlite3 (1 línea)
```

---

## 🔧 CÓMO FUNCIONA EL INTERCEPTOR (Sin Modificar Componentes)

### El interceptor intercepta automáticamente TODAS las llamadas HTTP

**Archivo**: `frontend/src/middlewares/offline-interceptor.js` (NUEVO)

```javascript
import axios from 'axios';

// Intercepta TODAS las requests antes de enviarlas
axios.interceptors.request.use(async function (config) {
    // Si la URL es del servidor remoto, verificar si está disponible
    if (config.url && config.url.includes(process.env.VUE_APP_DEGIRA)) {
        try {
            // Intentar conectar al servidor remoto (timeout 3 seg)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const testResponse = await fetch(`${process.env.VUE_APP_DEGIRA}/health`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (!testResponse.ok) {
                // Servidor remoto no disponible, cambiar a local
                config.url = config.url.replace(
                    process.env.VUE_APP_DEGIRA, 
                    'http://localhost:3001/api/v1'
                );
            }
        } catch (error) {
            // Servidor remoto no disponible, cambiar a local
            config.url = config.url.replace(
                process.env.VUE_APP_DEGIRA, 
                'http://localhost:3001/api/v1'
            );
        }
    }
    
    return config;
}, function (error) {
    return Promise.reject(error);
});
```

**Registro**: Solo agrego 1 línea al final de `frontend/src/middlewares/index.js`:
```javascript
import './offline-interceptor';  // <-- ESTA LÍNEA NUEVA
```

**Resultado**: 
- ✅ `ProductsSale.vue` funciona offline automáticamente (sin modificarlo)
- ✅ `DetailConsumed.vue` funciona offline automáticamente (sin modificarlo)
- ✅ Cualquier otro componente funciona offline automáticamente (sin modificarlo)

---

## 📦 DEPENDENCIAS NUEVAS

### Backend (`backend/package.json`)
```json
{
  "dependencies": {
    "sqlite3": "^5.1.6"  // <-- SOLO ESTA LÍNEA NUEVA
  }
}
```

**Nota**: Ya tienen `node-cron` instalado, no necesito agregarlo.

---

## 🎯 RESUMEN FINAL

### ✅ Lo que SÍ hago:
- Creo ~22 archivos nuevos
- Agrego 1 línea en `middlewares/index.js`
- Agrego 1 línea en `package.json`

### ❌ Lo que NO hago:
- NO modifico ningún componente Vue existente
- NO modifico `main.js`
- NO modifico backend remoto
- NO modifico base de datos MySQL
- NO modifico lógica de negocio existente

### 🚀 Resultado:
- Sistema offline funciona automáticamente
- Todos los componentes existentes funcionan offline sin modificarlos
- Cero riesgo de romper código existente
- Fácil de desactivar (solo comentar 1 línea)

---

## ❓ ¿AUTORIZA ESTA IMPLEMENTACIÓN?

Si autoriza, procederé a crear TODO desde cero, sin tocar archivos existentes (excepto las 2 líneas mencionadas).

¿Procedo?

