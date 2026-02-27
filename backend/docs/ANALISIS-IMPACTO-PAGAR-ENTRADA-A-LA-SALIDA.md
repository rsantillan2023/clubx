# Análisis de impacto — “Pagar entrada a la salida”

Referencia: [DISENO-PAGAR-ENTRADA-A-LA-SALIDA-WORKAROUND.md](./DISENO-PAGAR-ENTRADA-A-LA-SALIDA-WORKAROUND.md)

**Convención adoptada:** Opción B — token **`PAGAR_AL_SALIR`** en el campo `entry_visit_obs` para marcar “entrada a pagar a la salida”.

---

## Resumen

Este documento lista los **archivos que se verán afectados** al implementar:

1. Opción “Pagar a la salida” en entrada (con confirmación doble al grabar).
2. Monto pendiente de entrada en la pantalla de salida.
3. Vista **“Quiénes pagan a la salida”** (socios que aún no pagaron la entrada diferida).

---

## Backend

### 1. Visits — registro de entrada y salida

| Archivo | Cambios |
|---------|--------|
| **`backend/src/api/v1/entities/visits/helpers.ts`** | **entryRegister:** aceptar flag “pagar a la salida”; cuando corresponda, guardar `entry_amount_paid = 0`, `had_to_paid = monto entrada`, `entry_visit_obs = 'PAGAR_AL_SALIR'` (o concatenar al inicio si hay otras observaciones). **fastEntryRegister:** misma lógica. **exitRegister:** opcionalmente en la respuesta del GET de la visita incluir campo calculado `pendiente_entrada` y `es_pago_al_salir` para la UI. **Nuevo:** función que devuelva visitas con `hour_exit IS NULL` y `(entry_visit_obs || '').includes('PAGAR_AL_SALIR')`, con include de Partner y VisitType. |
| **`backend/src/api/v1/entities/visits/controllers.ts`** | **Nuevo controlador** `getVisitsPayingAtExit` (o nombre acordado) que llame al helper anterior y devuelva la lista. Recibir query params de paginación si se desea (page, pageSize). |
| **`backend/src/api/v1/entities/visits/routes.ts`** | Agregar ruta **GET** `/paying-at-exit` (o `/paying-at-exit`) con middlewares de auth/roles adecuados, que use el nuevo controlador. |
| **`backend/src/api/v1/entities/visits/middlewares.ts`** | **entryValidator:** permitir `entry_amount_paid = 0` cuando se envía flag `pay_at_exit === true` en body (o cuando `entry_visit_obs` ya contiene `PAGAR_AL_SALIR`). Ajustar mensaje de validación para no exigir “cantidad pagada” en ese caso. **exitValidator:** sin cambios obligatorios. |

### 2. Partners — datos de visita para salida

| Archivo | Cambios |
|---------|--------|
| **`backend/src/api/v1/entities/partners/helpers.ts`** | Donde se arma la respuesta de la **visita activa** para la pantalla de salida: incluir campos calculados **`pendiente_entrada`** = `had_to_paid - entry_amount_paid` y **`es_pago_al_salir`** = `(entry_visit_obs || '').includes('PAGAR_AL_SALIR')`. |

---

## Frontend

### 3. Entrada — opción “Pagar a la salida” y confirmación doble

| Archivo | Cambios |
|---------|--------|
| **`frontend/src/views/access/entryRegisterLite.vue`** | Añadir opción **“Pagar a la salida”**. Si está activa: enviar `entry_amount_paid = 0`, `had_to_paid = total`, `entry_visit_obs = 'PAGAR_AL_SALIR'` (o concatenar si hay otras observaciones). **Confirmación doble:** si “Pagar a la salida” está marcado, abrir modal de confirmación; solo al confirmar llamar a `POST …/fast-entry`. |
| **`frontend/src/views/access/entryRegister.vue`** | Si este formulario también registra entrada, aplicar la misma lógica: opción “Pagar a la salida”, confirmación doble y envío con `entry_amount_paid = 0`, `had_to_paid`, `entry_visit_obs = 'PAGAR_AL_SALIR'` vía `POST …/entry`. |

### 4. Salida — mostrar monto pendiente y cobrarlo

| Archivo | Cambios |
|---------|--------|
| **`frontend/src/views/access/exitRegister.vue`** | Obtener de la visita/partner los campos **`pendiente_entrada`** y **`es_pago_al_salir`** (si el backend los devuelve en la visita activa). Si `pendiente_entrada > 0` (y opcionalmente `es_pago_al_salir`), mostrar un bloque/clase claro: **“Monto pendiente de pago (entrada): $X”** y pre-cargar o sumar ese monto en el campo de “monto abonado en salida” (o en un desglose) para que al grabar la salida se envíe `exit_amount_payed` incluyendo ese valor. Ajustar etiquetas si hace falta para que quede claro que es la entrada diferida. |

### 5. Vista “Quiénes pagan a la salida”

| Archivo | Cambios |
|---------|--------|
| **`frontend/src/views/access/quienesPaganALaSalida.vue`** (nuevo) | **Crear** vista “QUIENES PAGAN A LA SALIDA”. Consumir **GET /visits/paying-at-exit**. Columnas: alias/socio, tarjeta, hora entrada, monto pendiente (entrada), tipo de visita, acción “Ir a salida”. |
| **`frontend/src/router/index.js`** | Añadir ruta (ej. `path: "/quienes-pagan-a-la-salida"`, `name: "quienesPaganALaSalida"`, `meta: { title: "Quiénes pagan a la salida", requiresAuth: true, requiresAccess: true }`, `component: () => import("../views/access/quienesPaganALaSalida.vue")`). |
| **Menú / navegación** | Añadir enlace a “Quiénes pagan a la salida” en el menú del módulo de Acceso o Visitas (archivo donde esté definido el menú lateral o superior, p. ej. un componente de layout o un drawer). |

---

## Archivos que podrían tocarse (según convenciones del proyecto)

- **Constantes / tipos:** definir en un solo lugar la constante **`PAGAR_AL_SALIR = 'PAGAR_AL_SALIR'`** para uso en backend y frontend (evitar typos).
- **Servicios API (frontend):** si existe un módulo que centralice las llamadas a visitas (ej. `services/visits.js`), añadir la llamada a `GET /visits/paying-at-exit`.
- **Traducciones / i18n:** si la app usa archivos de idioma, añadir los textos de la nueva vista y del modal de confirmación.

---

## Resumen por capa

| Capa | Archivos a modificar | Archivos nuevos |
|------|----------------------|------------------|
| **Backend – visits** | helpers.ts, controllers.ts, routes.ts, middlewares.ts | — |
| **Backend – partners** | helpers.ts | — |
| **Frontend – entrada** | entryRegisterLite.vue, entryRegister.vue | — |
| **Frontend – salida** | exitRegister.vue | — |
| **Frontend – vista nueva** | router/index.js, menú/navegación | quienesPaganALaSalida.vue |

---

## Orden sugerido de implementación

1. Backend: convención en helpers (entry + fastEntry) y validación en middlewares.
2. Backend: endpoint GET paying-at-exit y helper de listado.
3. Frontend: opción “Pagar a la salida” + confirmación doble en entryRegisterLite (y entryRegister si aplica).
4. Backend: incluir `pendiente_entrada` y `es_pago_al_salir` en la respuesta de la visita activa (partners/helpers o el endpoint que use exitRegister).
5. Frontend: mostrar monto pendiente en exitRegister y permitir cobrarlo.
6. Frontend: crear vista quienesPaganALaSalida.vue, ruta y enlace en menú.
