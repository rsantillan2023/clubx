# Comandos para setup local / producción (degira_develop)

Variables usadas:

- **Host:** 127.0.0.1  
- **Puerto:** 3307  
- **Usuario:** desarrollo  
- **Contraseña:** desarrollo  
- **Base de datos:** degira_develop  

Ruta de MySQL en este equipo: `C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe`

---

## 1. Crear la base de datos (si no existe)

En PowerShell:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -h 127.0.0.1 -P 3307 -u desarrollo -pdesarrollo -e "CREATE DATABASE IF NOT EXISTS degira_develop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

*(Si no quieres dejar la contraseña en el comando, quita `-pdesarrollo` y usa solo `-p`; te la pedirá.)*

---

## 2. Ejecutar script: Gestión de Usuarios (Operations_Types)

Desde la carpeta `backend`:

```powershell
cd C:\Users\lenovo\Documents\clubx\backend
cmd /c "`"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe`" -h 127.0.0.1 -P 3307 -u desarrollo -pdesarrollo degira_develop < src\scripts\add-users-management-operation-type-ready.sql"
```

Con prompt de contraseña (más seguro):

```powershell
cd C:\Users\lenovo\Documents\clubx\backend
cmd /c "`"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe`" -h 127.0.0.1 -P 3307 -u desarrollo -p degira_develop < src\scripts\add-users-management-operation-type-ready.sql"
```

---

## 3. Verificar que la app conecta

```powershell
cd C:\Users\lenovo\Documents\clubx\backend
npm run count
```

Debería listar las tablas y conteos de `degira_develop` usando el `.env` actual.

---

## Resumen de lo que tienes en `.env`

- `DB_HOST=127.0.0.1`
- `DB_PORT=3307`
- `DB_USERNAME=desarrollo`
- `DB_PASSWORD=desarrollo`
- `DB_DATABASE=degira_develop`
- `DB_DIALECT=mysql`
- `NODE_ENV=production`

Todo esto ya está configurado en `backend\.env`; no hace falta cambiar nada para que la API use esta base.
