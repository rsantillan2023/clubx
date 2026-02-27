# Diseño: Tipo de visitante "MENSUAL" — workaround sin tocar modelo de datos

## Objetivo

Permitir marcar que un socio **pagó el mes por otra vía**. Cuando ese socio ingresa, solo debe pagar **estacionamiento** y **consumos**, pero **no** los costos de entrada.

Todo sin agregar columnas ni tablas nuevas; solo un nuevo registro en tablas existentes (tipos de visitante y precios) y convenciones de presentación en frontend.

---

## Idea central del workaround

1. **Nuevo tipo de visitante:** crear en `Visits_Types` un registro con descripción **"MENSUAL"** (o "Mensual").
2. **Precios para MENSUAL:** en la tabla `Prices`, para ese `id_visit_type`:
   - **Entrada** (`id_receivable_concept = 2`): `total_amount = 0` para todos los días que apliquen.
   - **Estacionamiento** (`id_receivable_concept = 3`): mantener el monto real (copiar de otro tipo o configurar igual que el resto).
   - Cualquier otro concepto de entrada: en 0 si aplica.
3. **Visibilidad del tipo en la UI:**
   - **No mostrar** el tipo MENSUAL en los combos de:
     - Registro de **entrada** (entryRegisterLite, entryRegister).
     - **Alta** de socios (registerLite, register).
     - **Modificación** de socios (editPartner), si en el futuro se habilita el combo de tipo visitante.
   - **Sí mostrar** el tipo MENSUAL solo en la **pantalla admin "Esquema de pago mensual"** (para asignar/renovar) y en **Base de datos de socios** únicamente para **filtrar** (ver socios que ya son MENSUAL). **No** se permite asignar MENSUAL desde Base de datos de socios ni desde entrada/alta/edición; solo desde la pantalla especial.
4. **Flujo operativo:** el administrador asigna el tipo "MENSUAL" a un socio **únicamente desde la pantalla admin "Esquema de pago mensual"** (esa pantalla además registra fecha de vto, último monto y acumulado). Cuando ese socio viene al club, en la entrada ya figura como MENSUAL (por `id_visit_type_usualy`); el monto de entrada se calcula con los precios de ese tipo (0 para entrada, normal para estacionamiento).

---

## Modelo actual relevante

- **Visits_Types:** `id_visit_type`, `description`, `suggest_entry_amount`, `suggest_membership_amount`.
- **Prices:** `id_price`, `id_day`, `id_receivable_concept`, `id_visit_type`, `total_amount`.  
  En el código se usan: `id_receivable_concept = 2` para **entrada**, `id_receivable_concept = 3` para **estacionamiento**.  
  El concepto **Cualquier día** ya existe en `Prices` con **`id_day = 8`** (en el enum `EDays`, `CualquierDia = 8`). Para el tipo MENSUAL se cargará precio solo para **id_day = 8**, de modo que “cualquier día” cueste 0 en entrada.
- **Partners:** `id_visit_type_usualy` (tipo de visitante habitual del socio).

**Convención para socios en esquema MENSUAL (reutilización de campos sin tocar modelo):**

Para socios con `id_visit_type_usualy = MENSUAL`, se reutilizan tres campos de `Partners` con otro significado (solo para este esquema; no afectar el uso real de sanciones/expulsiones):

| Campo                | Uso en esquema MENSUAL        | Significado |
|----------------------|-------------------------------|-------------|
| `santion_date`       | Fecha de vencimiento del plan  | Hasta qué fecha tiene cubierto el pago mensual (ej. hoy + 30 días). Editable por el admin. |
| `suspension_reason`  | Monto del último pago        | Lo que abonó en el último registro (ej. "15000" o "15000.50"). |
| `expultion_reason`   | Monto total acumulado pagado | Suma de todos los pagos registrados en este esquema (acumular sumando al registrar cada pago). |

Al registrar un pago: `suspension_reason = monto de este pago`; `expultion_reason = (valor numérico actual de expultion_reason o 0) + monto de este pago`, guardado como string. Así se sabe “cuánto fue lo último que pagó” y “cuánto viene pagando en total”.

No se agregan campos ni tablas; solo filas nuevas en `Visits_Types` y `Prices` y esta convención sobre campos existentes de `Partners`.

---

## Convención para identificar "MENSUAL"

- **Criterio recomendado:** identificar por **descripción** exacta del tipo de visita, por ejemplo `description = 'MENSUAL'` o `'Mensual'` (definir una sola forma y usarla en backend y frontend).
- **Alternativa:** si se prefiere no depender del texto, se puede usar un **id fijo** una vez insertado el tipo (ej. `id_visit_type = 6`). Documentar ese id en este diseño y en el análisis de impacto.

En frontend, para filtrar "tipos que no se muestran en entrada/alta/edición", usar la misma convención (descripción o id constante).

---

## Datos a insertar

### 1. Visits_Types

Un solo registro:

| Campo                     | Valor   |
|---------------------------|--------|
| description               | MENSUAL (o Mensual) |
| suggest_entry_amount      | 0      |
| suggest_membership_amount  | 0      |

(En MySQL con auto_increment no se inserta `id_visit_type`; el valor generado se usará en Prices y en la convención si se usa id fijo.)

### 2. Prices

Para el nuevo `id_visit_type` (MENSUAL) se usa el concepto **Cualquier día** que ya existe en `Prices` con **`id_day = 8`** (`EDays.CualquierDia = 8`). Así, un solo precio por concepto: “cualquier día” cuesta 0 en entrada.

- **Entrada (`id_receivable_concept = 2`):** una sola fila con **`id_day = 8`** (Cualquier día), `id_visit_type = <id MENSUAL>`, **`total_amount = 0`** (precio 0 para cualquier día).
- **Estacionamiento (`id_receivable_concept = 3`):** una sola fila con **`id_day = 8`**, `id_visit_type = <id MENSUAL>`, **`total_amount` = un valor** (el monto de estacionamiento que se defina para este tipo).

Resumen: **un solo precio por concepto para día 8** — entrada = 0, estacionamiento = un valor.

**Importante:** El `priceSearcher` del backend hoy usa el día de la semana (1–7) para buscar el precio. Para que encuentre la fila de MENSUAL con `id_day = 8`, en backend debe usarse **`id_day = 8` (CualquierDia)** cuando el tipo de visita sea MENSUAL (ver análisis de impacto: cambio en `price/helpers.ts`).

Ejemplo de INSERT (reemplazar `<id_visit_type_MENSUAL>` por el id real tras crear el tipo):

```sql
-- Tras insertar el tipo en Visits_Types y obtener su id (ej. 6):
-- Entrada: día 8 (Cualquier día) = 0
INSERT INTO Prices (id_day, id_receivable_concept, id_visit_type, total_amount)
VALUES (8, 2, <id_visit_type_MENSUAL>, 0);

-- Estacionamiento: día 8 con un valor (reemplazar <VALOR> por el monto deseado)
INSERT INTO Prices (id_day, id_receivable_concept, id_visit_type, total_amount)
VALUES (8, 3, <id_visit_type_MENSUAL>, <VALOR>);
```

---

## Comportamiento en pantallas

### Entrada (entryRegisterLite / entryRegister)

- **Si el socio ya tiene `id_visit_type_usualy = MENSUAL`:**
  - Se **elige automáticamente** el tipo MENSUAL (preselección).
  - El tipo **no se puede cambiar**: el combo/botones deben mostrarlo como única opción o bloqueado (solo lectura). El usuario no puede elegir otro tipo ni elegir MENSUAL para otro socio.
  - El monto mostrado es 0 en entrada y, si aplica, el de estacionamiento.
- **Para socios que no son MENSUAL:** la lista de tipos en el combo/botones incluye **solo** los tipos que no son MENSUAL. El tipo MENSUAL **no** aparece como opción seleccionable; así no se puede asignar MENSUAL desde la pantalla de entrada.

Implementación sugerida: cargar todos los tipos; si `partner.id_visit_type_usualy` corresponde al tipo MENSUAL, mostrar solo ese tipo (o ese tipo destacado y deshabilitar el resto) y fijar `selectVisit` en ese id sin permitir cambio. Si el socio no es MENSUAL, usar `visitTypes.filter(t => t.description !== 'MENSUAL')` para el combo.

### Alta de socios (registerLite / register)

- Combo de tipo de visitante: **excluir MENSUAL**. No se puede dar de alta un socio directamente como MENSUAL; la asignación se hace **solo desde la pantalla "Esquema de pago mensual"**.

### Modificación de socios (editPartner)

- Hoy el combo de tipo de visitante está **deshabilitado**. Si en el futuro se habilita, el combo debe **excluir MENSUAL**. El cambio a MENSUAL **no** se hace desde esta pantalla ni desde Base de datos de socios; **solo desde la pantalla "Esquema de pago mensual"**.

### Base de datos de socios (PartnersDatabase)

- **Filtro por tipo de visita:** incluir **todos** los tipos (incluido MENSUAL) para poder filtrar y ver socios que ya son MENSUAL.
- **No** se permite asignar ni cambiar un socio a MENSUAL desde esta pantalla; eso se hace **solo** en la **pantalla admin "Esquema de pago mensual"**.

### Pantalla Admin — Esquema de pago mensual (nueva)

Pantalla exclusiva para el administrador que permite **sumar gente al esquema de pago mensual** (y renovar pagos). **Es el único lugar** donde se puede asignar o renovar el tipo MENSUAL; no se hace desde entrada, alta, edición de socios ni desde Base de datos de socios.

**Funcionalidad:**

**Vista por estado de vencimiento (obligatoria):** La pantalla debe mostrar claramente (1) **Abono vencido:** socios MENSUAL con santion_date &lt; hoy, en una sección destacada con alias, fecha vto, último monto, acumulado; (2) **Próximos a vencer (3 días):** MENSUAL con santion_date entre hoy y hoy+3 días (inclusive). Opcional: sección "Vigentes" (resto). **Anotar si paga o no:** para cada uno en vencidos o próximos a vencer, permitir **Registrar pago** (flujo de renovación) o **Anotar: no paga**. Para "no paga" sin tocar modelo: guardar en observations del partner un texto tipo NO_PAGO [YYYY-MM-DD] o MENSUAL_NO_PAGO YYYY-MM-DD; permitir ver y limpiar esa anotación.

1. **Buscar / seleccionar socio:** por DNI, alias, nombre o listado (por ejemplo solo socios que aún no son MENSUAL para “alta”, o solo MENSUAL para “renovar”).
2. **Al dar de alta en el esquema (socio que aún no es MENSUAL):**
   - Poner `id_visit_type_usualy` = id del tipo MENSUAL.
   - **Fecha de vencimiento:** por defecto **hoy + 30 días**, con posibilidad de cambiarla manualmente → guardar en **`santion_date`**.
   - **Monto abonado (este pago):** valor numérico que ingresa el admin → guardar en **`suspension_reason`** (ej. "15000" o "15000.50").
   - **Acumulado total:** para el primer pago es igual al monto abonado; guardar en **`expultion_reason`** (ej. "15000").
5. **Al renovar (socio que ya es MENSUAL):**
   - **Fecha de vencimiento:** por defecto hoy + 30 días (o, si se prefiere, fecha actual de `santion_date` + 30), editable manualmente → actualizar **`santion_date`**.
   - **Monto abonado (este pago):** guardar en **`suspension_reason`** (reemplaza el “último pago”).
   - **Acumulado total:** `expultion_reason` actual (parseado a número) + monto de este pago → guardar el resultado en **`expultion_reason`** (como string). Así se mantiene “cuánto fue lo último que pagó” y “cuánto viene pagando en total”.

**Resumen de convención en Partners (solo para MENSUAL):**

| Campo               | Uso en esquema MENSUAL      |
|---------------------|-----------------------------|
| `santion_date`      | Fecha de vencimiento del plan (editable, default hoy+30). |
| `suspension_reason` | Monto del último pago.      |
| `expultion_reason`  | Monto total acumulado (suma de todos los pagos). |
| observations        | Opcional: anotación "no paga" (ej. concatenar " | NO_PAGO [YYYY-MM-DD]"). |

**Ubicación sugerida:** ruta dedicada (ej. `/esquema-pago-mensual` o `/admin/pago-mensual`), en el menú de administración o de socios, con nombre visible tipo “Esquema de pago mensual” o “Alta / renovación pago mensual”.

**Backend:** un endpoint (o uso del PATCH de partners existente) que reciba: `id_partner`, `id_visit_type_usualy` (MENSUAL), `santion_date`, monto de este pago; calcule el nuevo acumulado leyendo el `expultion_reason` actual, sume y guarde `suspension_reason` y `expultion_reason`. No se requiere nuevo modelo; solo lógica que actualice `Partners` con esta convención. Para **Anotar: no paga**, un endpoint o PATCH que actualice `observations` del partner concatenando el texto acordado (ej. " | NO_PAGO [YYYY-MM-DD]").

### Otras vistas

- **Gestión de precios (PricesManagement):** mostrar **todos** los tipos (incluido MENSUAL) para poder configurar/ver precios en 0 para MENSUAL.
- **Visitas activas / Histórico de visitas:** pueden mostrar todos los tipos; si una visita tiene tipo MENSUAL se muestra tal cual.
- **Reactivación de membresía:** si hay combo de tipo, **excluir** MENSUAL (misma regla que en alta).

---

## Resumen del workaround

| Aspecto | Decisión |
|--------|----------|
| Modelo de datos | Sin cambios de estructura; solo INSERT en `Visits_Types` y en `Prices`. |
| Identificación MENSUAL | Por `description = 'MENSUAL'` (o id fijo documentado). |
| Precios MENSUAL | **Solo id_day = 8 (Cualquier día):** entrada (concepto 2) = **0**; estacionamiento (concepto 3) = **un valor** (una sola fila por concepto). |
| Combo en entrada | Si el socio es MENSUAL: preseleccionar MENSUAL y **bloquear** (no permitir cambiar; no mostrar MENSUAL como opción para otros). Si no es MENSUAL: no mostrar MENSUAL en el combo. |
| Combo en alta | No mostrar MENSUAL. |
| Combo en edición de socio | No mostrar MENSUAL (cuando el combo esté habilitado). |
| Origen del tipo MENSUAL | Solo desde **pantalla Admin “Esquema de pago mensual”** (y opcionalmente Base de datos de socios). No desde entrada ni desde alta. |
| Pantalla “Esquema de pago mensual” | Nueva pantalla admin: alta/renovación en el esquema; setea `id_visit_type_usualy = MENSUAL`, `santion_date` = vto (default hoy+30), `suspension_reason` = último monto, `expultion_reason` = acumulado total. |
| Base de datos de socios | Solo filtro por tipo (incluido MENSUAL). No permite asignar MENSUAL; solo la pantalla Esquema de pago mensual. |
| Consumos | Sin cambio; los consumos se cobran en bar/salida con la lógica actual; no dependen del tipo de visitante para el monto de entrada. |
| Convención campos Partner (solo MENSUAL) | `santion_date` = vto del plan; `suspension_reason` = último monto pagado; `expultion_reason` = total acumulado pagado (string numérico). |

---

## Consideraciones

1. **Consumos:** el documento asume que los consumos se gestionan aparte (bar, salida). Si en algún flujo se usa `id_visit_type` para precios de consumos, verificar que para MENSUAL no se aplique un cargo de entrada y sí estacionamiento donde corresponda.
2. **Reportes y listados:** los reportes que listan por tipo de visitante incluirán MENSUAL; puede ser útil para saber cuántos socios "pagaron el mes por otra vía".
3. **Búsqueda de precio para MENSUAL:** el backend debe usar **id_day = 8 (CualquierDia)** cuando el tipo de visita sea MENSUAL al consultar `Prices`, ya que solo se cargan precios con id_day = 8 para ese tipo (ver análisis de impacto).
4. **Reversión:** si en el futuro se deja de usar este workaround, se puede dejar de mostrar MENSUAL en la UI y eventualmente migrar socios a otro tipo y borrar el tipo y sus precios (con cuidado de no romper visitas históricas que ya tienen `id_visit_type = MENSUAL`).
5. **Sanciones y expulsiones:** los campos `santion_date`, `suspension_reason`, `expultion_reason` se reutilizan **solo** para el esquema MENSUAL en esos socios. No usar esos mismos campos para sanciones o expulsiones reales en socios que están en el plan MENSUAL, o documentar que al aplicar una sanción/expulsión a un socio MENSUAL se pierde (o se migra) la información del esquema de pago mensual.

Este documento es solo diseño; la implementación en scripts SQL, backend y frontend se detalla en el análisis de impacto.
