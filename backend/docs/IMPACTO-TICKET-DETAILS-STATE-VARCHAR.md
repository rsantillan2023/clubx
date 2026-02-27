# Impacto real de mantener Ticket_Details.state en VARCHAR en la base de datos

## Conclusión

**Mantener la columna `Ticket_Details.state` como `VARCHAR(20)` en la base de datos no tiene impacto negativo.** El código ya escribe y está pensado para valores en texto. No hace falta cambiar la BD; lo que conviene es alinear el **modelo** Sequelize con la realidad (STRING en vez de INTEGER).

---

## Estado actual

| Capa | Definición | Valores que se usan |
|------|------------|----------------------|
| **BD real** | `VARCHAR(20)` | Texto (ej. 'NO PAGADO', 'PAGADO', 'NC', 'ANULADO') |
| **Interfaz** `ITicketDetails` | `state?: string` | Coherente con string |
| **Modelo** Sequelize (degira) | `DataTypes.INTEGER` | **Inconsistente** con BD e interfaz |
| **Modelo** local (SQLite) | `DataTypes.INTEGER` | Mismo desajuste |

---

## Uso real en el código

### Escritura (backend)

Todo el backend escribe **strings** en `state`:

| Archivo | Uso |
|---------|-----|
| `api/v1/entities/consumptions/helpers.ts` | `state: 'NO PAGADO'` al crear consumos (bulkCreate). |
| `api/v1/entities/consumptions/helpers.ts` | `state: "NC"` al crear detalles de nota de crédito (cancelación). |
| `api/v1/entities/consumptions/helpers.ts` | `state: "ANULADO"` al anular un ticket_detail (update). |
| `api/v1/entities/visits/helpers.ts` | `state: "PAGADO"` al registrar salida y marcar detalles pagados (TicketDetails.update). |
| `api/local/controllers/consumptions.controller.ts` | `state: 'NO PAGADO'` en creación local. |

Ningún flujo escribe un número en `state`.

### Lectura y comparaciones

- No hay en el backend ningún lugar que lea `ticket_detail.state` (o `ticketDetail.state`) y haga comparaciones numéricas (`=== 1`, `=== 2`, etc.).
- No se filtra por `state` en `where` en los archivos revisados.
- El frontend no usa el campo `state` de los items de `ticket_details`; los “state” que aparecen son de Partner/Visit (por ejemplo `partner.state`, `$store.state`).

Por tanto, mantener `state` como string en BD no rompe ninguna lógica actual.

---

## Comportamiento con la BD real (VARCHAR)

- **INSERT/UPDATE:** Sequelize envía strings (`'NO PAGADO'`, `'PAGADO'`, etc.). MySQL los guarda en `VARCHAR(20)` sin problema.
- **SELECT:** MySQL devuelve strings. Sequelize los expone en el modelo; en JavaScript se usan como string. Aunque el modelo diga `INTEGER`, en runtime el valor es string cuando la columna es VARCHAR.
- **Conclusión:** Con la BD en VARCHAR, el comportamiento en producción es el esperado: todo el código ya trabaja con strings.

---

## Riesgos si se cambiara la BD a INTEGER (sin tocar código)

Si se hiciera `ALTER TABLE ... state INT` y se migraran valores a números:

- Los `bulkCreate` y `update` que envían `'NO PAGADO'`, `'PAGADO'`, etc. fallarían o dependerían de conversión implícita (MySQL puede convertir algunos strings a número, pero 'NO PAGADO' no tiene sentido como INT).
- Habría que cambiar todo el código a enviar números y definir un mapa (ej. 0 = NO PAGADO, 1 = PAGADO, 2 = ANULADO, 3 = NC), y migrar datos. Es cambio de modelo y de lógica.

No es necesario si el objetivo es solo “mantener la BD como está”.

---

## Recomendación

1. **Mantener la base de datos con `Ticket_Details.state` en `VARCHAR(20)`.** No hay impacto negativo y coincide con el uso actual del código.
2. **Opcional pero recomendable:** Ajustar el modelo Sequelize (degira y local) para que `state` sea `DataTypes.STRING(20)` (o equivalente), de modo que:
   - Coincida con la BD real.
   - Coincida con la interfaz `ITicketDetails` (`state?: string`).
   - Evite confusión y posibles errores si en el futuro alguien asume que es número.

Con eso, el “impacto real” de mantener la BD en VARCHAR es **nulo** para el comportamiento actual y **positivo** en coherencia si se alinea el modelo.
