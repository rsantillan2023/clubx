# Análisis de impacto — Tipo de visitante "MENSUAL" (workaround)

Referencia: [DISENO-TIPO-VISITANTE-MENSUAL-WORKAROUND.md](./DISENO-TIPO-VISITANTE-MENSUAL-WORKAROUND.md)

**Convención:** tipo identificado por `description = 'MENSUAL'` en `Visits_Types` (o por un `id_visit_type` fijo documentado tras el INSERT).

---

## Resumen

Este documento lista los **archivos y pasos afectados** al implementar:

1. Nuevo tipo de visitante MENSUAL en BD (Visits_Types + Prices).
2. Exclusión de MENSUAL en combos de entrada, alta y edición de socios.
3. **Entrada:** si el socio es MENSUAL, elegir automáticamente ese tipo y **no permitir cambiarlo** ni elegir MENSUAL para otros socios.
4. **Pantalla Admin “Esquema de pago mensual”** para sumar gente al esquema (y renovar): La pantalla debe mostrar abono vencido (santion_date menor que hoy), próximos a vencer en 3 días (santion_date entre hoy y hoy+3) y permitir anotar si paga o no (Registrar pago / Anotar: no paga; "no paga" se guarda en observations).
5. Asignación a MENSUAL **solo** desde la **pantalla admin "Esquema de pago mensual"**; no desde Base de datos de socios, entrada, alta ni edición. Base de datos de socios solo permite filtrar por tipo (ver quiénes son MENSUAL).

---

## 1. Base de datos (scripts SQL)

| Archivo / Acción | Cambios |
|------------------|--------|
| **Nuevo script SQL** (ej. `backend/src/scripts/insert-visit-type-mensual.sql`) | INSERT en `Visits_Types`: `description = 'MENSUAL'`, `suggest_entry_amount = 0`, `suggest_membership_amount = 0`. Luego INSERT en `Prices` **solo para id_day = 8 (Cualquier día)** — ese concepto ya existe en Prices: (id_day = 8, id_receivable_concept = 2, id_visit_type = id MENSUAL, total_amount = 0); (id_day = 8, id_receivable_concept = 3, id_visit_type = id MENSUAL, total_amount = monto estacionamiento deseado). |
| **Documentación** | En el script o en DISENO, anotar el `id_visit_type` generado si se usa id fijo en frontend (opcional). |

No se modifican tablas ni columnas existentes; solo datos.

---

## 2. Backend

**Cambios necesarios:**

- **price/get (priceSearcher):** cuando el tipo de visita sea MENSUAL, usar **`id_day = 8` (CualquierDia)** en la búsqueda en `Prices`, ya que para MENSUAL solo se cargan precios con id_day = 8 (entrada 0, estacionamiento según corresponda). En `backend/src/api/v1/entities/price/helpers.ts`, antes del `Price.findOne`, si `id_visit_type` es el id del tipo MENSUAL, asignar `dayVisit = EDays.CualquierDia` (8) en lugar del día de la semana calculado. Requiere conocer el id del tipo MENSUAL (constante o consulta por descripción).
- **visits_types/get** y el resto de **Partners:** sin cambios adicionales para este punto.

**Nuevo (recomendado) para Esquema de pago mensual:**

| Archivo / Acción | Cambios |
|------------------|--------|
| **Nuevo endpoint** (ej. `POST /partners/mensual-scheme` o `POST /partners/:id/mensual-payment`) | Recibir: `id_partner`, `santion_date` (fecha de vencimiento), `amount` (monto de este pago). Obtener el id del tipo MENSUAL (por descripción o constante). Si el partner aún no es MENSUAL: setear `id_visit_type_usualy = id MENSUAL`, `santion_date`, `suspension_reason = amount` (como string), `expultion_reason = amount` (string). Si ya es MENSUAL (renovación): actualizar `santion_date`; `suspension_reason = amount`; `expultion_reason = (parseFloat(expultion_reason actual) || 0) + amount`, guardado como string. Validar que el partner exista y que el monto sea numérico. |
| **Anotar "no paga"** | Endpoint o PATCH que actualice `observations` del partner concatenando un texto acordado (ej. " | NO_PAGO [YYYY-MM-DD]" o "MENSUAL_NO_PAGO YYYY-MM-DD") cuando el admin marca que no pagó. |
| **Routes / controllers de partners** | Registrar la nueva ruta y un controlador que llame al helper anterior; proteger con rol admin. |

**Opcional:** query param en `GET /visits_types/get` (ej. `?for_entry_combos=1`) que excluya MENSUAL; no es obligatorio si el frontend filtra por descripción.

---

## 3. Frontend

### 3.1 Constante para MENSUAL

| Archivo | Cambios |
|---------|--------|
| **Constante compartida** (ej. `frontend/src/constants/visitTypes.js` o donde exista) | Definir `VISIT_TYPE_DESCRIPTION_MENSUAL = 'MENSUAL'` (o el valor exacto usado en BD) para usar en filtros. Opcional: `ID_VISIT_TYPE_MENSUAL` si se usa id fijo. |

### 3.2 Entrada

| Archivo | Cambios |
|---------|--------|
| **`frontend/src/views/access/entryRegisterLite.vue`** | Si el socio tiene `id_visit_type_usualy` = tipo MENSUAL: **preseleccionar automáticamente** ese tipo y **bloquear** el combo/botones (solo lectura o única opción; no permitir cambiar ni elegir MENSUAL para otros). Si el socio no es MENSUAL: mostrar solo tipos que no son MENSUAL (excluir MENSUAL del combo). Asegurar que `getPrice` use `id_receivable_concept=2` para entrada y `id_receivable_concept=3` para estacionamiento (ya lo hace). |
| **`frontend/src/views/access/entryRegister.vue`** | Misma lógica: si partner es MENSUAL → preseleccionar y bloquear; si no → no mostrar MENSUAL en las opciones. |

### 3.3 Alta de socios

| Archivo | Cambios |
|---------|--------|
| **`frontend/src/views/partner/registerLite.vue`** | Al asignar `vm.visits` desde la respuesta de `visits_types/get`, filtrar: `visits = response.data.data.filter(t => t.description !== 'MENSUAL')`. |
| **`frontend/src/views/partner/register.vue`** | Igual: filtrar tipos para que el combo no incluya MENSUAL. |

### 3.4 Modificación de socios

| Archivo | Cambios |
|---------|--------|
| **`frontend/src/views/partner/editPartner.vue`** | Hoy el combo de tipo de visitante está **disabled**. Si en el futuro se habilita, al cargar `visits` filtrar excluyendo MENSUAL. Mientras siga disabled, no es obligatorio filtrar, pero si se carga la lista para mostrar el label del tipo actual, puede incluir todos (el socio con MENSUAL se verá correctamente). |

### 3.5 Base de datos de socios

| Archivo | Cambios |
|---------|--------|
| **`frontend/src/views/partner/PartnersDatabase.vue`** | **Filtro:** mantener todos los tipos (incluido MENSUAL) para filtrar. **No** implementar asignación de MENSUAL aquí; se hace **solo** en la pantalla Esquema de pago mensual. |

### 3.6 Pantalla Admin — Esquema de pago mensual (nueva)

| Archivo | Cambios |
|---------|--------|
| **`frontend/src/views/admin/EsquemaPagoMensual.vue`** (o nombre acordado) | **Crear** vista para admin. **Obligatorio:** (1) Sección **Abono vencido:** listar MENSUAL con santion_date &lt; hoy (alias, fecha vto, último monto, acumulado). (2) Sección **Próximos a vencer (3 días):** MENSUAL con santion_date entre hoy y hoy+3 días. (3) Para cada uno en esas secciones: acciones **Registrar pago** (flujo renovación) y **Anotar: no paga** (guardar en observations convención NO_PAGO / MENSUAL_NO_PAGO + fecha); permitir ver y limpiar anotación. Además: búsqueda/selección de socio, formulario alta (fecha vto, monto) y renovación; llamar a endpoint esquema mensual y, si aplica, endpoint/PATCH "no paga". Mostrar último monto y acumulado (suspension_reason, expultion_reason). |
| **Router** | Añadir ruta (ej. `/esquema-pago-mensual` o `/admin/pago-mensual`) con meta de admin. |
| **Menú** | Añadir enlace "Esquema de pago mensual" (o "Alta / renovación pago mensual") en menú de administración o socios. |

### 3.7 Otras vistas

| Archivo | Cambios |
|---------|--------|
| **`frontend/src/views/admin/PricesManagement.vue`** | Sin cambio en filtro de tipos; debe seguir mostrando todos los tipos para que el admin pueda ver/editar precios de MENSUAL (entrada 0, estacionamiento según corresponda). |
| **`frontend/src/views/partner/activeVisits.vue`** | Sin cambio; si una visita tiene tipo MENSUAL se muestra su descripción. |
| **`frontend/src/views/partner/historicalVisits.vue`** | Sin cambio; idem. |
| **`frontend/src/views/partner/reactivation.vue`** | Si existe combo de tipo de visitante, filtrar excluyendo MENSUAL (misma regla que alta). |
| **`frontend/src/views/access/exitRegister.vue`** | Sin cambio de lógica de tipos; solo muestra datos de la visita (puede mostrar "MENSUAL" como tipo). |

---

## 4. Resumen por capa

| Capa | Archivos a modificar | Archivos nuevos |
|------|----------------------|----------------|
| **BD / Scripts** | — | `insert-visit-type-mensual.sql` (o similar) |
| **Backend** | partners: endpoint esquema pago mensual; **price/helpers.ts**: usar id_day = 8 cuando tipo sea MENSUAL | — |
| **Frontend – constante** | — | Opcional: constantes para MENSUAL |
| **Frontend – entrada** | entryRegisterLite.vue, entryRegister.vue | — |
| **Frontend – alta** | registerLite.vue, register.vue | — |
| **Frontend – edición** | editPartner.vue (solo si se habilita combo) | — |
| **Frontend – Base de datos socios** | PartnersDatabase.vue (solo filtro por tipo; no asignar MENSUAL) | — |
| **Frontend – Esquema pago mensual** | router, menú | EsquemaPagoMensual.vue (o similar) |
| **Frontend – reactivation** | reactivation.vue (solo si hay combo de tipo) | — |

---

## 5. Orden sugerido de implementación

1. **BD:** script SQL (tipo MENSUAL + Prices). Ejecutar y anotar `id_visit_type` si se usa id fijo.
2. **Backend:** endpoint para esquema de pago mensual (alta/renovación): actualizar `id_visit_type_usualy`, `santion_date`, `suspension_reason`, `expultion_reason` con lógica de acumulado.
3. **Frontend – constante:** `VISIT_TYPE_DESCRIPTION_MENSUAL` (y opcionalmente `ID_VISIT_TYPE_MENSUAL`).
4. **Frontend – entrada:** en entryRegisterLite y entryRegister, si socio es MENSUAL → preseleccionar y **bloquear** tipo; si no es MENSUAL → no mostrar MENSUAL en el combo.
5. **Frontend – alta:** en registerLite y register, filtrar tipos para no mostrar MENSUAL.
6. **Frontend – Esquema de pago mensual:** crear vista admin (búsqueda socio, fecha vto, monto, llamada al nuevo endpoint), ruta y menú.
7. **Frontend – Base de datos de socios:** solo filtro con todos los tipos (sin opción de asignar MENSUAL).
8. **Frontend – edición y reactivation:** si aplica, filtrar MENSUAL en editPartner y reactivation.
9. **Pruebas:** alta en esquema desde la nueva pantalla; renovación; entrada de socio MENSUAL (tipo fijo, 0 entrada); no poder elegir MENSUAL para otro socio en entrada.

---

## 6. Riesgos y mitigación

| Riesgo | Mitigación |
|--------|------------|
| Cambio de descripción "MENSUAL" en BD | Usar constante en frontend; si se usa id fijo, documentarlo y no reutilizar ese id para otro tipo. |
| Precios faltantes para algún día/concepto | Para MENSUAL solo se usan precios con **id_day = 8** (Cualquier día); el backend debe usar ese id en la búsqueda cuando el tipo sea MENSUAL. |
| Visitas históricas | Si en el futuro se elimina el tipo MENSUAL, las visitas con ese `id_visit_type` seguirían referenciándolo; considerar no borrar el tipo o migrar antes. |
| Conflicto con sanciones/expulsiones reales | Los campos `santion_date`, `suspension_reason`, `expultion_reason` se reutilizan **solo** para socios con tipo MENSUAL. No usar esos campos para sanciones/expulsiones en socios MENSUAL, o documentar que al pasar un socio MENSUAL a sanción/expulsión se pierde o se migra la info del esquema mensual. |

Este documento complementa el diseño y debe actualizarse si se cambian pantallas o convenciones.
