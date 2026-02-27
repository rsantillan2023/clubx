# Dump de producción y agregar Operation Type

Flujo: **hacer backup de la base de producción** y luego **ejecutar en producción** el script que agrega el ítem "Gestión de Usuarios, Roles y Permisos" en `Operations_Types`.

---

## Datos de producción (completar los que uses)

Reemplazá en los comandos:

| Variable      | Ejemplo                          | Descripción              |
|---------------|----------------------------------|---------------------------|
| `PROD_HOST`   | `dev-imasdsooft.imasdsooft.com.ar` o IP | Host del MySQL de producción |
| `PROD_PORT`   | `3306`                           | Puerto (3306 es el habitual) |
| `PROD_USER`   | `miclub_app` o `root`            | Usuario MySQL de producción |
| `PROD_DB`     | `miclub_db` o `degira_develop`    | Nombre de la base en producción |
| `PROD_PASS`   | *(tu contraseña)*                | Contraseña del usuario   |

Ruta local de MySQL (para ejecutar desde tu PC):

`C:\Program Files\MySQL\MySQL Server 8.4\bin\`

---

## 1. Dump (backup) de la base de producción

En PowerShell, desde cualquier carpeta. **Reemplazá** `PROD_HOST`, `PROD_PORT`, `PROD_USER`, `PROD_DB` y `PROD_PASS`:

```powershell
$fecha = Get-Date -Format "yyyyMMdd_HHmm"
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqldump.exe" -h PROD_HOST -P PROD_PORT -u PROD_USER -pPROD_PASS --single-transaction --routines --triggers PROD_DB > "C:\Users\lenovo\Documents\clubx\backend\backups\dump_prod_$fecha.sql"
```

Ejemplo con valores (mismo servidor que tu .env actual: 127.0.0.1:3307, usuario desarrollo, base degira_develop):

```powershell
mkdir -Force C:\Users\lenovo\Documents\clubx\backend\backups
$fecha = Get-Date -Format "yyyyMMdd_HHmm"
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqldump.exe" -h 127.0.0.1 -P 3307 -u desarrollo -pdesarrollo degira_develop --single-transaction --routines --triggers > "C:\Users\lenovo\Documents\clubx\backend\backups\dump_prod_$fecha.sql"
```

Si preferís que te pida la contraseña (más seguro), quitá `-pTU_PASSWORD` y dejá solo `-p`:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqldump.exe" -h PROD_HOST -P PROD_PORT -u PROD_USER -p --single-transaction --routines --triggers PROD_DB > "C:\Users\lenovo\Documents\clubx\backend\backups\dump_prod_$fecha.sql"
```

El archivo quedará en `backend\backups\dump_prod_YYYYMMDD_HHmm.sql`.

---

## 2. Ejecutar en producción el script que agrega el Operation Type

Usá la versión **safe** del script para que no falle si el ítem ya existe.

Desde la carpeta `backend`:

```powershell
cd C:\Users\lenovo\Documents\clubx\backend
cmd /c "`"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe`" -h PROD_HOST -P PROD_PORT -u PROD_USER -pPROD_PASS PROD_DB < src\scripts\add-users-management-operation-type-ready-safe.sql"
```

Ejemplo (reemplazá host, puerto, usuario, contraseña y base):

```powershell
cd C:\Users\lenovo\Documents\clubx\backend
cmd /c "`"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe`" -h dev-imasdsooft.imasdsooft.com.ar -P 3306 -u miclub_app -p miclub_db < src\scripts\add-users-management-operation-type-ready-safe.sql"
```

Con `-p` sin contraseña te la pide y no queda en el historial.

---

## Resumen de archivos

| Archivo | Uso |
|---------|-----|
| `add-users-management-operation-type-ready.sql` | INSERT directo; puede dar error si ya existe el ítem. |
| `add-users-management-operation-type-ready-safe.sql` | INSERT solo si no existe `path = '/users-management'`. Recomendado para producción. |

---

## Orden recomendado

1. **Dump de producción** (paso 1) → tenés el backup.
2. **Ejecutar el script safe en producción** (paso 2) → se agrega el ítem de Gestión de Usuarios en el menú/permisos.

No hace falta crear ninguna base ni tabla: la base de producción ya existe y tiene la tabla `Operations_Types`. El script solo inserta una fila nueva (o ninguna si ya está).
