# PDF de consumos por socio (visitsConsumptions)

## Objetivo

En la pantalla **Consumos por Visita** (`/visitsConsumptions`) se agregó un botón **"Exportar PDF consumos"** que genera un PDF con el listado de socios que tienen consumos mayores a 0 y, debajo de cada socio, el detalle de lo consumido (igual que en la vista `/consumed?id_bracelet=XXX`). Sirve como respaldo para cobrar cuando puede cortarse la luz o internet durante la fiesta; se pueden ir generando PDFs actualizados a lo largo de la noche.

## Dónde está

- **Pantalla:** `http://localhost:8080/visitsConsumptions`
- **Botón:** junto a "Exportar XLS", botón rojo **"Exportar PDF consumos"** (icono `mdi-file-pdf-box`).
- **Condición:** debe estar seleccionada una **fecha de visita**. El PDF incluye solo visitas de esa fecha con consumos > 0.

## Cómo funciona (flujo)

1. El usuario elige la **fecha** en el selector y opcionalmente usa filtros (buscar, tarjeta).
2. Al hacer clic en **"Exportar PDF consumos"**:
   - Se pide al backend **todas** las visitas de esa fecha (hasta 5000) con el endpoint `partners/visits-consumptions`.
   - Se filtran solo las que tienen **Consumos > 0** (`visit_amount_consumed > 0`).
   - Se ordenan por **monto consumido de mayor a menor**.
   - Para cada socio se llama a `consumptions/get/consume?id_bracelet=XXX` para obtener el detalle de productos (en lotes de 5 en paralelo).
   - Se arma un único PDF con:
     - Encabezado: título, fecha de visita, fecha/hora de generación.
     - Por cada socio: bloque con datos del socio y tabla con el detalle de consumos (mismo criterio que la vista Consumed).

3. El archivo se descarga con nombre:  
   `consumos_socios_YYYY-MM-DD_HHmm.pdf`

## Cómo se ve el PDF

- **Primera página**
  - Título: **"Listado de consumos por socio"**
  - Línea: **"Fecha de visita: DD/MM/YYYY  |  Generado: DD/MM/YYYY HH:mm"**
  - Luego, por cada socio con consumos:

**Bloque de socio (recuadro naranja):**
- Línea 1: **Socio: [Alias] - [Nombre]**
- Línea 2: **Tarjeta: [número]  |  Tipo: [tipo visita]  |  Total: $[monto]**

**Tabla de detalle (debajo del bloque):**
| # | Descripción | Hora | P.Unit | Cant | Monto |
|---|-------------|------|--------|------|--------|
| 1 | ...         | HH:mm| $...   | ...  | $...   |
| 2 | ...         | ...  | ...    | ...  | ...    |

- Los socios aparecen **ordenados por monto consumido (mayor a menor)**.
- Si no entra todo en una hoja, se usa **varias páginas** (corte automático).
- El detalle de cada socio es el mismo que en `/consumed?id_bracelet=XXX`: solo ítems con cantidad > 0 y no anulados.

## Dependencias

- `jspdf`: generación del PDF.
- `jspdf-autotable`: tablas en el PDF (detalle de consumos por socio).

Ambas están en `frontend/package.json`. Si faltan:  
`npm install jspdf jspdf-autotable --save` en `frontend/`.

## Archivos tocados

- `frontend/package.json`: dependencias `jspdf` y `jspdf-autotable`.
- `frontend/src/views/partner/visitsConsumptions.vue`:
  - Botón "Exportar PDF consumos" y estado `loadPdf`.
  - Método `exportToPdf()`: pedido de visitas, filtro consumos > 0, pedidos de detalle por tarjeta, construcción del PDF y descarga.

## Notas

- El PDF se genera **en el navegador** con los datos actuales del backend (fecha seleccionada). Para tener un respaldo actualizado, conviene generar el PDF cada cierto tiempo durante la noche.
- Si no hay ningún socio con consumos > 0 para la fecha elegida, se muestra un mensaje de advertencia y no se descarga archivo.
