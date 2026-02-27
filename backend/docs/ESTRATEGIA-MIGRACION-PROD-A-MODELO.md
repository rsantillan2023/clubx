# Estrategia: migrar datos de producción a una base local con el modelo nuevo

## Situación

- **Producción:** datos en la base real (MySQL) con el esquema actual (columnas, tipos y a veces columnas extra como `Ticket_Details.nro_item`).
- **Modelo nuevo:** definido en código (Sequelize en `backend/src/database/schemas/degira/models/`). Es el “contrato” al que quieres llevar los datos.

Objetivo: **copiar los datos de prod a una base local cuyas tablas siguen exactamente el modelo nuevo**, manejando diferencias de columnas y tipos.

---

## ¿Es posible?

Sí. La idea es:

1. **Crear la base local** con el esquema del modelo (tablas según el código).
2. **Leer de prod** tabla por tabla.
3. **Mapear cada fila** a las columnas del modelo (ignorar columnas que solo existen en prod, convertir tipos donde haga falta).
4. **Insertar en la base local** en orden que respete dependencias (FKs).

---

## Pasos de la estrategia

### Paso 0: Preparar la base local (esquema del modelo)

La base destino debe tener **solo** las tablas del modelo nuevo, creadas por Sequelize (o por un script que genere `CREATE TABLE` desde los modelos).

- **Opción A:** Poner en `.env` la conexión a la base local (ej. `DB_DATABASE_DEV` o `DB_DATABASE=miclub_local`) y ejecutar **sync** del schema degira contra esa base (una vez, con `sync({ force: true })` o `sync({ alter: true })` según quieras vaciar o ajustar). Así las tablas locales quedan igual que el modelo.
- **Opción B:** Un script que cree la base local y ejecute `CREATE TABLE` por cada modelo (leyendo atributos del modelo). Más trabajo, mismo resultado.

Resultado: base local con 18 tablas (incluida `UserDealers`) con la estructura del **código**, sin datos.

### Paso 1: Dos conexiones

- **Origen (prod):** `SOURCE_HOST`, `SOURCE_DATABASE`, `SOURCE_USER`, `SOURCE_PASSWORD` (o reutilizar `.env` de prod).
- **Destino (local):** `TARGET_*` o la misma config que usaste para el sync (ej. `DB_HOST`, `DB_DATABASE_DEV`, etc.).

El script abre dos instancias de Sequelize (o una conexión “prod” y la que ya usa la app para “local”) y **no** usa los modelos ligados a prod para escribir: solo usa los modelos para **saber la lista de columnas y tipos del modelo nuevo**.

### Paso 2: Orden de tablas (respetar FKs)

Copiar en un orden que no viole claves foráneas. Por ejemplo (igual que en `copy-db-data`):

**Base (sin FKs hacia otras tablas del mismo conjunto):**  
Actions, Days, Payment_Methods, Products_Services, Receivable_Concepts, Roles, States, Users, Visits_Types.

**Dependientes:**  
Partners, Users_Roles, Visits, Tickets, Ticket_Details, Operations_Types, Operations, Prices.

No copiar `UserDealers` desde prod (no existe en prod); la tabla puede quedar vacía en local.

### Paso 3: Por cada tabla: leer → mapear → escribir

- **Leer:** `SELECT * FROM prod.<tabla>` (o `SELECT col1, col2, ...` solo columnas que existan en prod).
- **Mapear:**
  - Quedarse solo con las propiedades que existen como atributos en el **modelo** (getAttributes()). Así se ignoran columnas de prod que no están en el modelo (ej. `nro_item` en Ticket_Details).
  - Convertir tipos cuando el modelo no coincida con prod:
    - **Ticket_Details.state:** en prod es `VARCHAR(20)`, en el modelo es `INTEGER`. Hace falta una regla: mapeo string → número (ej. `"pagado"` → 1, `"pendiente"` → 0) o guardar `NULL` si no hay mapeo.
    - Fechas: `DATE`/`DATETIME` de prod → el modelo usa `DATE` o `DATETIME`; MySQL suele aceptar sin más (solo vigilar truncado de hora si el modelo es DATE).
    - Decimales: prod `DECIMAL(10,0)` → modelo `DECIMAL(10,2)` es válido; solo rellenar decimales si hace falta.
- **Escribir:** `INSERT` en la base local (por fila o en lotes) usando **solo** las columnas del modelo. Se puede usar el modelo con la conexión local (si inyectas la conexión local en los modelos para esta ejecución) o `INSERT` raw con la lista de columnas del modelo.

### Paso 4: Casos especiales

- **UserDealers:** en prod no existe; no hay datos que migrar. La tabla en local puede existir vacía.
- **Ticket_Details:** columna `nro_item` solo en prod → no se incluye en el objeto que se inserta en local. Campo **state:** en prod `VARCHAR(20)`, en modelo `INTEGER`. Regla: mapeo string → número (ej. `"pendiente"`/pending → 0, `"pagado"`/paid → 1, `"cancelado"`/cancelled → 2); si el valor es numérico se parsea; si no hay mapeo se guarda `NULL`.
- **Integridad referencial:** desactivar `FOREIGN_KEY_CHECKS` en la sesión de la base local durante la carga y reactivarlo al final (como en `copy-db-data`), para evitar fallos por orden de inserción.

### Paso 5: Índices que están en prod y no en el modelo

El modelo en código no declara todos los índices que tiene la base real (p. ej. índices MUL en FKs). Para que el destino se comporte igual que prod en consultas y restricciones, el script **sincroniza índices**: después de copiar datos, lee de prod `INFORMATION_SCHEMA.STATISTICS` (todos los índices salvo PRIMARY), y en destino ejecuta `ALTER TABLE ... ADD [UNIQUE] INDEX ...` por cada índice que exista en prod y no exista en destino. Así la base local queda con los mismos índices que prod sin tener que declararlos en los modelos.

---

## Resumen del flujo del script

1. Cargar configuración (prod = origen, local = destino).
2. (Opcional) Crear esquema en destino desde modelos (sync) si no existe.
3. Obtener lista de modelos/tablas en el orden correcto (sin UserDealers para “origen prod”, o incluirla en destino vacía).
4. Para cada tabla:
   - Leer filas de prod (SELECT).
   - Para cada fila: construir objeto solo con claves que existan en el modelo; aplicar conversiones (ej. state en Ticket_Details).
   - Insertar en local (bulkCreate o INSERT en lotes).
5. Reactivar `FOREIGN_KEY_CHECKS` si se desactivó.
6. **Sincronizar índices:** leer índices de prod (salvo PRIMARY) y crear en destino los que falten (`ALTER TABLE ... ADD INDEX`).
7. Cerrar conexiones.

---

## Variables de entorno sugeridas

Para no tocar prod desde el mismo `.env` que desarrollo:

```env
# Origen = producción
SOURCE_DB_HOST=...
SOURCE_DB_DATABASE=degira_develop   # o la base real de prod
SOURCE_DB_USERNAME=...
SOURCE_DB_PASSWORD=...

# Destino = base local con modelo nuevo
TARGET_DB_HOST=127.0.0.1
TARGET_DB_DATABASE=miclub_local
TARGET_DB_USERNAME=root
TARGET_DB_PASSWORD=...
```

Si prefieres, el script puede leer prod desde el `.env` actual (production) y el destino desde `DB_DATABASE_DEV`; entonces ejecutarías el script con `NODE_ENV=development` y configurando prod aparte (ej. `SOURCE_*`).

---

## Siguiente paso

El script **`backend/src/scripts/migrate-prod-to-model.ts`** implementa esta estrategia:

1. Conecta a **origen** (prod) y **destino** (local) con `SOURCE_*` y `TARGET_*` (o fallback a `.env`).
2. Vacía tablas destino (orden inverso de FKs).
3. Por cada tabla en orden de FKs: lee de prod, mantiene solo columnas del modelo, convierte `Ticket_Details.state` (string → int; sin mapeo → `NULL`) e inserta en local.
4. No copia **UserDealers** (no existe en prod).
5. **Sincroniza índices:** crea en destino los índices que existen en prod y no están en el modelo (vía `INFORMATION_SCHEMA.STATISTICS` + `ALTER TABLE ... ADD INDEX`).

**Uso:**

```bash
cd backend

# 1) Crear base local con el modelo (una vez)
#    Poner en .env: DB_DATABASE_DEV=miclub_local (y host/user/pass de local)
#    Luego ejecutar sync del schema degira contra esa base (p. ej. con NODE_ENV=development).

# 2) Configurar origen (prod) y destino (local), por ejemplo en .env.migrate:
#    SOURCE_DB_HOST=... SOURCE_DB_DATABASE=degira_develop SOURCE_DB_USERNAME=... SOURCE_DB_PASSWORD=...
#    TARGET_DB_HOST=127.0.0.1 TARGET_DB_DATABASE=miclub_local TARGET_DB_USERNAME=... TARGET_DB_PASSWORD=...

# 3) Ejecutar migración
npx ts-node src/scripts/migrate-prod-to-model.ts
# o: node -r ts-node/register src/scripts/migrate-prod-to-model.ts
```

**Re-correr la migración:** vaciar antes las tablas locales (o hacer DROP/CREATE con sync) para evitar duplicados o conflictos de PK.
