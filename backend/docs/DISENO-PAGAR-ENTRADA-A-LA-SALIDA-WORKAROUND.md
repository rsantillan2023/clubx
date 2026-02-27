# Diseño: “Pagar entrada a la salida” — workaround sin tocar modelo de datos

## Objetivo

Si en el momento de la **entrada** el usuario elige **no pagar ahí** y **pagar a la salida**, en el momento de la **salida** el monto de la entrada debe aparecer como **pendiente de pago** y poder cobrarse ahí.

Todo sin agregar columnas ni tablas; solo convenciones y lógica sobre el modelo actual.

---

## Modelo actual relevante (Visits)

- **entry_amount_paid**: lo pagado en la entrada.
- **exit_amount_payed**: lo pagado en la salida (puede incluir consumos y/o entrada diferida).
- **had_to_paid**: lo que “tenía que pagar” (en la práctica, el monto de entrada acordado/sugerido).
- **entry_visit_obs** / **exit_visit_obs**: observaciones texto (VARCHAR).

No hay campo explícito “pagará a la salida” ni “pendiente de pago”. El workaround usa **convenciones** sobre estos campos.

---

## Idea central del workaround

1. **En la entrada**, si el usuario elige “Pagar a la salida”:
   - Registrar la visita con **entry_amount_paid = 0**.
   - Guardar el monto que deberá pagar en **had_to_paid** (monto de entrada, ej. sugerido por tipo de visita/día).
   - Marcar de forma reconocible que la entrada se pagará a la salida (ver opciones abajo).

2. **En la salida**, al cargar la visita:
   - Calcular **monto pendiente de entrada** = `had_to_paid - entry_amount_paid`.
   - Si ese valor > 0, mostrarlo como **“Pendiente de pago (entrada)”** y permitir registrar el pago (sumándolo a **exit_amount_payed** o mostrando el estado hasta que se registre).

Con eso se cumple el requisito: “al momento de la salida el monto esté pendiente de pago” y se pueda cobrar ahí.

---

## Convención para “pagará a la salida”

Necesitamos que en salida se sepa que ese monto pendiente corresponde a la **entrada diferida** y no a otro concepto. Dos opciones sin tocar modelo:

### Opción A — Inferencia (sin nuevo dato)

- **Regla:** Si `had_to_paid > 0` y `entry_amount_paid === 0` y la visita tiene `hour_entry` (entrada registrada), interpretar que la entrada quedó “a pagar a la salida”.
- **Pros:** No usar observaciones; solo lógica.
- **Contras:** Cualquier caso con entrada en 0 y had_to_paid > 0 se interpreta igual (p. ej. un error de carga). Si en el futuro hubiera otro flujo con entrada 0, podría haber ambigüedad.

### Opción B — Marcar en `entry_visit_obs` — **ADOPTADA**

- **Convención:** Guardar en **entry_visit_obs** un texto reservado que la app reconozca:
  - **Token único:** `PAGAR_AL_SALIR` (usar este literal en backend y frontend para detectar y escribir).
  - Si hay otras observaciones, concatenar al inicio: `PAGAR_AL_SALIR` + separador (ej. " — ") + texto libre.
- **En entrada:** Si el usuario elige “Pagar a la salida”, setear:
  - `entry_amount_paid = 0`
  - `had_to_paid = <monto de entrada>` + **cargos extras de entrada** (ej. estacionamiento, otros con recargo si aplica). Es decir, el **total** que el socio deberá abonar a la salida (entrada + extras con recargo).
  - `entry_visit_obs = 'PAGAR_AL_SALIR'` o `'PAGAR_AL_SALIR' + ' — ' + observacionesLibres`.
- **En salida:** Si `(entry_visit_obs || '').includes('PAGAR_AL_SALIR')`, mostrar “Entrada pendiente de pago” con monto = `had_to_paid - entry_amount_paid`.
- **Pros:** Sin ambigüedad; reportes pueden distinguir “entrada pagada en salida”.
- **Contras:** Consumir parte de `entry_visit_obs` con un valor reservado (documentado aquí; no pisar en otros flujos).

**Implementación:** Todo el código (backend y frontend) debe usar la cadena exacta `PAGAR_AL_SALIR` para escribir y para detectar.

---

## Flujo de datos (diseño)

### Al registrar la entrada (“Pagar a la salida”)

| Campo / concepto        | Valor |
|-------------------------|--------|
| entry_amount_paid       | 0      |
| had_to_paid             | **Total** a pagar en salida: monto entrada + cargos extras de entrada (con recargo si aplica). |
| extra_entry             | 0 (no se cobra nada en entrada; todo queda pendiente para la salida). |
| entry_visit_obs         | `PAGAR_AL_SALIR` (o `PAGAR_AL_SALIR — ` + observaciones libres) |
| Resto (hour_entry, id_visit_type, etc.) | Como hoy |

No se toca `exit_amount_payed` (sigue 0 hasta la salida).

#### Confirmación doble al grabar “Pagar a la salida”

Para que quede claro y se eviten registros por error:

- **Antes de enviar** el formulario de entrada, si el usuario marcó **“Pagar a la salida”**:
  1. Mostrar un **diálogo de confirmación** (modal) con texto explícito, por ejemplo:
     - Título: **“Confirmar: pagar entrada a la salida”**
     - Mensaje: **“El socio no abonará la entrada ahora. El monto de $X quedará pendiente y deberá pagarse al registrar la salida. ¿Confirmar registro de entrada?”**
  2. Solo si el usuario confirma (p. ej. botón “Sí, registrar entrada”), se envía el request al backend (entry o fast-entry) con `entry_amount_paid = 0`, `had_to_paid = X`, `entry_visit_obs = 'PAGAR_AL_SALIR'`.
  3. Si cancela, se cierra el modal y no se graba; el usuario puede seguir editando o cambiar a “Pagar ahora”.

- **Implementación sugerida (frontend):** al hacer clic en “Registrar Entrada” (o equivalente), si está activa la opción “Pagar a la salida”, abrir el modal de confirmación; el submit real solo se ejecuta desde el handler del botón “Confirmar” del modal.

### Al abrir la salida

1. Cargar la visita (como ya se hace).
2. Calcular:
   - `pendiente_entrada = had_to_paid - entry_amount_paid`
   - `es_pago_al_salir = (entry_visit_obs || '').includes('PAGAR_AL_SALIR')`
3. Si `pendiente_entrada > 0` (y opcionalmente si `es_pago_al_salir`):
   - Mostrar en UI: **“Monto pendiente de pago (entrada): $X”** (X = pendiente_entrada).
   - Permitir registrar el pago en la pantalla de salida (el monto se suma a **exit_amount_payed**).

### Al registrar el pago en la salida

- Actualizar la visita: `exit_amount_payed = exit_amount_payed_actual + pendiente_entrada`.
- Opcional: quitar o mantener el token en `entry_visit_obs`; si se quita, reemplazar la parte `PAGAR_AL_SALIR` por vacío para que no vuelva a mostrarse como “pendiente”.

---

## Cálculo del “monto pendiente” en salida

- **Siempre:**  
  `pendiente_entrada = had_to_paid - entry_amount_paid`  
  (usar `had_to_paid` y `entry_amount_paid` numéricos, con default 0 si vienen null).

- Si `pendiente_entrada <= 0`: no mostrar nada como pendiente de entrada.
- Si `pendiente_entrada > 0`: mostrarlo como “Pendiente de pago (entrada)” y ofrecer cobrarlo; al cobrar, sumar ese monto a **exit_amount_payed**.

No hace falta separar en BD “cuánto de exit_amount_payed es entrada” vs “consumos”; el trabajo es solo de presentación y de asegurar que en entrada se guarde `had_to_paid` y la convención “pagar al salir”.

---

## Origen del monto de entrada en “Pagar a la salida”

Al elegir “Pagar a la salida” en entrada, el monto a guardar en **had_to_paid** debe ser el **total** que el socio deberá abonar a la salida: monto de entrada (suggest o Prices) **más** cualquier cargo extra de entrada (ej. estacionamiento) con su recargo por método de pago si aplica. Así, en salida, `pendiente_entrada = had_to_paid - entry_amount_paid` refleja correctamente lo que falta por cobrar.

---

## Resumen del workaround (sin tocar modelo)

| Momento | Qué hacer |
|--------|------------|
| **Entrada** — usuario elige “Pagar a la salida” | Guardar visita con `entry_amount_paid = 0`, `had_to_paid = monto entrada`, `entry_visit_obs = 'PAGAR_AL_SALIR'` (o con observaciones: `'PAGAR_AL_SALIR — ' + texto`). |
| **Salida** — al cargar visita | Calcular `pendiente_entrada = had_to_paid - entry_amount_paid`. Si > 0, mostrar “Monto pendiente de pago (entrada): $X”. |
| **Salida** — usuario paga | Sumar ese monto a `exit_amount_payed` y actualizar la visita. Opcional: limpiar token en `entry_visit_obs`. |

- **Convención (Opción B adoptada):** token en **entry_visit_obs**: cadena exacta **`PAGAR_AL_SALIR`** para identificar “entrada a pagar a la salida”.
- **Monto pendiente:** siempre derivado como `had_to_paid - entry_amount_paid`; no hace falta nuevo campo.
- **Modelo de datos:** sin cambios; solo reglas de negocio y uso de campos existentes.

---

## Consideraciones

1. **Observaciones libres:** Si se usa `entry_visit_obs`, definir si el token va solo al inicio y el resto es libre (ej. `[PAGAR_AL_SALIR] Cliente pidió factura`) para no perder información.
2. **Reportes:** Con la convención en `entry_visit_obs` se pueden filtrar visitas “entrada pagada a la salida” para estadísticas o caja.
3. **Consistencia:** Asegurar que en entrada siempre se guarde **had_to_paid** cuando haya monto de entrada (también cuando se paga en entrada), para que en salida el cálculo sea correcto en todos los casos.

---

## Vista “Quiénes pagan a la salida”

### Objetivo

Una vista clara con nombre **“QUIENES PAGAN A LA SALIDA”** que liste a los socios que eligieron pagar la entrada a la salida y **aún no pagaron** (siguen dentro del establecimiento con entrada pendiente).

### Criterios de la lista

- **Visitas** con:
  - `hour_exit` IS NULL (aún no registraron salida).
  - `entry_visit_obs` contiene el token **`PAGAR_AL_SALIR`**.
  - Opcionalmente: `had_to_paid > 0` y `entry_amount_paid = 0` para mayor robustez.

- **Columnas / datos útiles a mostrar:**
  - Alias / nombre del socio (desde Partner).
  - Tarjeta / id_bracelet_1.
  - Hora de entrada.
  - **Monto pendiente de pago (entrada):** `had_to_paid - entry_amount_paid`.
  - Tipo de visita.
  - Acción: enlace o botón para ir al **Registro de salida** de esa visita (para cobrar ahí el pendiente).

### Comportamiento

- La vista es de **solo lectura** para la lista; el cobro se hace en la pantalla ya existente de **Registro de salida** (seleccionando al socio/visita y mostrando el monto pendiente).
- Al registrar la salida y cobrar el monto pendiente, esa visita deja de aparecer (porque se registra `hour_exit`).

### Ubicación sugerida

- **Ruta:** por ejemplo `/quienes-pagan-a-la-salida` o `/pay-at-exit`.
- **Menú:** dentro del módulo de Acceso o Visitas, con título visible **“Quiénes pagan a la salida”**.
- **Backend:** nuevo endpoint `GET /visits/paying-at-exit` que devuelva las visitas activas que cumplen los criterios, con datos del partner para la tabla.

### Condiciones para que aparezcan filas

Para que una visita aparezca en **“Quiénes pagan a la salida”** tienen que cumplirse **las dos** condiciones:

1. **Visita aún activa:** la visita no tiene registrada la salida → en BD `hour_exit` IS NULL (el socio sigue “adentro”).
2. **Entrada a pagar en salida:** en la entrada se eligió “Pagar a la salida” → en BD el campo `entry_visit_obs` contiene el texto **`PAGAR_AL_SALIR`** (por ejemplo `PAGAR_AL_SALIR` o `PAGAR_AL_SALIR — alguna obs`).

Por tanto, la lista estará vacía si:
- Nadie ha registrado una entrada con la opción “Pagar a la salida”, o  
- Todas esas visitas ya tienen registrada la salida (`hour_exit` no es NULL).

Para probar: registrar una **Entrada rápida** con el checkbox **“Pagar entrada a la salida”** marcado y **no** registrar la salida de ese socio; esa visita debería aparecer en la vista.

Este documento es solo diseño; la implementación en backend/frontend se hará en pasos posteriores.
