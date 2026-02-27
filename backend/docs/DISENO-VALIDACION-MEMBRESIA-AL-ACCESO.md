# Diseño: validar “socio no frecuente” al consultar el partner (acceso)

## Objetivo

En lugar de depender solo del **cron** para marcar como “socio no frecuente” a quienes llevan más de un año sin visitar, **validar la última visita en el momento en que el frontend va a usar el estado** para decidir entre “Pagar Entrada” y “Reactivar Membresía”. Si ya pasó más de un año, actualizar el estado en ese instante y devolver el partner ya con estado/acción correctos, de modo que el sistema obligue a pagar la reactivación sin depender de que el cron haya corrido.

---

## Situación actual

1. **Cron** (`updateMembershipCron`): cada día a las 9:30 ejecuta `updatePartnerMembership()` y marca como `SOCIO_NO_FRECUENTE` a todos los que cumplen la regla (última visita &lt; hace 1 año).
2. **Frontend**: al buscar el partner por DNI (acceso/validación de membresía), recibe `partner.state` y `partner.state.actions`. Si `id_action === 3` muestra “Reactivar Membresía” y no “Pagar Entrada”.
3. **Problema**: si el cron no corrió (servidor apagado, `CRON_ENABLE` en false, etc.), el partner puede seguir con estado “normal” y ver “Pagar Entrada” aunque lleve más de un año sin visitar.

---

## Propuesta de diseño (sin cambiar código aún)

### Idea central

**En el backend, en el flujo que devuelve el partner cuando se va a tomar la decisión de acceso** (por ejemplo la consulta por DNI que usa la pantalla de acceso/validación de membresía):

1. Obtener el partner y su `last_visit` (ya se hace en `getPartner`).
2. **Antes de armar la respuesta**, aplicar la misma regla de negocio que usa `updatePartnerMembership` pero **solo para ese partner**:
   - Si el partner está en un estado “normal” (no es ya SOCIO_NO_FRECUENTE, SUSPENDIDO, EXPULSADO, INVITADO) **y**  
     (`last_visit` es null **o** `last_visit <= hoy - 1 año`),  
     entonces:
   - Ejecutar `Partner.update({ id_state: EPartnerState.SOCIO_NO_FRECUENTE }, { where: { id_partner } })`.
   - Recargar el partner (o rearmar la respuesta) con el estado y la acción actualizados, para que en la respuesta venga `state.actions.id_action === 3`.
3. Devolver el partner con el estado ya corregido.

Así, **en el evento de querer entrar**, el sistema corrige el estado si corresponde y la pantalla muestra “Reactivar Membresía” y obliga a pagar la membresía, sin depender del cron.

---

## Dónde aplicar la lógica

### Opción A (recomendada): solo en la consulta por DNI para acceso

- **Punto:** el endpoint que usa el frontend cuando en la pantalla de **acceso / validación de membresía** se ingresa el DNI y se pide el partner para decidir si mostrar “Pagar Entrada” o “Reactivar Membresía”. En el código actual es **`getPartner`** (por ejemplo `GET /partners?dni=...` o el que corresponda según las rutas).
- **Ventaja:** se valida solo cuando realmente se va a tomar esa decisión; no se toca búsqueda general ni listados.
- **Implementación conceptual:** dentro de `getPartner`, después de tener el partner y su `last_visit`, si el partner existe y no es null:
  - Calcular `yearAgo = hoy - 1 año` (misma función/fórmula que en `updatePartnerMembership`).
  - Si `id_state` no está en [SOCIO_NO_FRECUENTE, SUSPENDIDO, EXPULSADO, INVITADO] y (`last_visit` es null o `last_visit <= yearAgo`):
    - Actualizar el partner a `id_state = SOCIO_NO_FRECUENTE`.
    - Volver a cargar el partner con `include: [stateIncludeable, ...]` (o reasignar `state` en el objeto que se devuelve) para que la respuesta traiga `state.actions.id_action === 3`.
  - Seguir con el resto de la lógica actual de `getPartner` y devolver el partner.

### Opción B: también en búsqueda de partner (partner search)

- **Punto:** el endpoint que usa la pantalla de búsqueda de socios (por DNI, alias, etc.) cuando desde ahí se puede ir a “Reactivar Membresía”. En el código actual podría ser **`searchPartner`** o el que devuelva un partner con estado.
- **Ventaja:** en cualquier lugar donde se “vea” el estado para esa decisión, el estado está actualizado.
- **Desventaja:** más actualizaciones en BD (cada búsqueda que devuelva un socio no frecuente por fecha podría disparar un `UPDATE`). Sigue siendo un solo partner por request.

Se puede dejar para una segunda fase o solo aplicar en el flujo de acceso (Opción A).

---

## Regla de negocio a reutilizar (misma que el cron)

Para **un solo partner** con `last_visit` ya calculado:

- **Condición para pasar a SOCIO_NO_FRECUENTE:**  
  `id_state` no está en `[SOCIO_NO_FRECUENTE(5), SOCIO_SUSPENDIDO(7), SOCIO_EXPULSADO(6), SOCIO_INVITADO(8)]`  
  **y**  
  (`last_visit === null` **o** `last_visit <= yearAgo`).

Donde `yearAgo` es la misma fecha que en `updatePartnerMembership` (hoy menos un año, en la zona horaria que ya usa la app, p. ej. argentina).

No cambiar el estado si ya es SOCIO_NO_FRECUENTE, SUSPENDIDO, EXPULSADO o INVITADO.

---

## Flujo resultante (diseño)

1. Usuario en frontend ingresa DNI en pantalla de acceso / validación de membresía.
2. Frontend llama al endpoint que devuelve el partner por DNI (ej. `getPartner`).
3. Backend:
   - Busca el partner y calcula/obtiene `last_visit`.
   - **(Nuevo)** Si aplica la regla anterior, hace `Partner.update(..., SOCIO_NO_FRECUENTE)` para ese `id_partner` y asegura que la respuesta incluya `state` + `state.actions` actualizados.
   - Devuelve el partner (con estado ya actualizado si se aplicó la regla).
4. Frontend recibe `partner.state.actions.id_action === 3` cuando corresponde → muestra “Reactivar Membresía” y no “Pagar Entrada”.
5. El socio debe pagar la reactivación para volver a estado normal; no hay dependencia de que el cron haya corrido.

---

## Interacción con el cron y con `partner-check`

- **Cron:** puede seguir existiendo para actualizar en lote a todos los que cumplan la regla (por ejemplo una vez al día). La validación al acceso no lo reemplaza necesariamente; lo complementa: si el cron no corrió, la primera vez que el socio “quiera entrar” se corrige el estado en ese momento.
- **`PUT /partners/partner-check`:** puede seguir llamando a `updatePartnerMembership()` para forzar un barrido completo cuando se quiera (manual o desde otro sistema). No es necesario llamarlo desde el frontend en el flujo de acceso si se implementa esta validación en `getPartner`.

---

## Consideraciones

1. **Transacciones:** si `getPartner` usa transacciones, el `Partner.update` y la recarga del partner deberían ir en la misma transacción para no devolver datos inconsistentes.
2. **Rendimiento:** un `UPDATE` por request de acceso cuando el socio lleva más de un año sin visitar es poco frecuente; el resto de las veces solo se evalúa la condición y no se escribe.
3. **Consistencia:** la regla (1 año, mismos estados excluidos) debe ser la misma que en `updatePartnerMembership` (idealmente extraída a una función helper reutilizable).
4. **Frontend:** no requiere cambios; sigue usando `partner.state.actions.id_action === 3` para mostrar “Reactivar Membresía”. El cambio es solo en el backend y en el momento en que se arma la respuesta del partner.

---

## Resumen

- **Qué:** Validar “más de un año sin visita” en el momento en que se consulta el partner para decidir entrada (p. ej. en `getPartner` por DNI), y si aplica, actualizar el estado a SOCIO_NO_FRECUENTE y devolver el partner con estado/acción ya actualizados.
- **Para qué:** Que “Reactivar Membresía” se muestre y se obligue a pagar la membresía aunque el cron no haya corrido.
- **Dónde (diseño):** En el endpoint que alimenta la pantalla de acceso/validación de membresía (recomendado: solo `getPartner` por DNI; opcionalmente también en búsqueda de partner).
- **Sin cambiar código:** Este documento describe solo el diseño; la implementación se hará en un paso posterior.

### En una frase

**Un solo endpoint (getPartner), meter en el medio la lógica: consultar si ya pasó un año, cambiar el estado si aplica y devolver el partner con el estado nuevo. El frontend no se toca: solo recibe el estado ya corregido y muestra “Reactivar Membresía” cuando corresponde — es “engañar” al frontend con un update metido en el medio del backend.**
