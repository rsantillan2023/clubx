# Configuración MySQL para acceso remoto a `miclub_db`

## Objetivo

Permitir que la aplicación (y scripts como `npm run count`) se conecten a MySQL desde **cualquier IP** (o desde la IP del servidor de la app) usando el usuario configurado en `.env`.

---

## Opción A: Instrucciones para DevOps (ejecutar en el servidor MySQL)

Quien tenga acceso al servidor donde corre MySQL debe ejecutar **como usuario con permisos de administrador** (ej. `root` de MySQL).

### 1. Conectarse a MySQL

```bash
mysql -u root -p
# (ingresar contraseña de root de MySQL)
```

O si MySQL corre en un contenedor/servicio:

```bash
# Ejemplo con Docker
docker exec -it <nombre_contenedor_mysql> mysql -u root -p

# Ejemplo con servicio en el mismo servidor
mysql -h localhost -u root -p
```

### 2. Crear usuario y dar permisos sobre `miclub_db`

**Si quieren seguir usando el usuario `root` desde fuera** (solo si la política de seguridad lo permite):

```sql
-- Permitir a root conectarse desde cualquier host
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'Espacio2016';
GRANT ALL PRIVILEGES ON miclub_db.* TO 'root'@'%';
FLUSH PRIVILEGES;
```

*(Reemplazar `Espacio2016` por la contraseña real que usa la aplicación en el .env.)*

**Recomendado: crear un usuario solo para la aplicación** (mejor para seguridad):

```sql
-- Usuario solo para la app (reemplazar 'PASSWORD_SEGURA' por la contraseña real)
CREATE USER IF NOT EXISTS 'miclub_app'@'%' IDENTIFIED BY 'PASSWORD_SEGURA';
GRANT ALL PRIVILEGES ON miclub_db.* TO 'miclub_app'@'%';
FLUSH PRIVILEGES;
```

Luego en el `.env` de la aplicación usar:

```
DB_USERNAME=miclub_app
DB_PASSWORD=PASSWORD_SEGURA
```

### 3. Restringir por IP (opcional)

Si en vez de `'%'` quieren permitir solo la IP del servidor de la app (ej. `10.42.0.1`):

```sql
CREATE USER IF NOT EXISTS 'miclub_app'@'10.42.0.1' IDENTIFIED BY 'PASSWORD_SEGURA';
GRANT ALL PRIVILEGES ON miclub_db.* TO 'miclub_app'@'10.42.0.1';
FLUSH PRIVILEGES;
```

### 4. Verificar

```sql
SELECT user, host FROM mysql.user WHERE user IN ('root', 'miclub_app');
```

---

## Opción B: Cómo hacerlo tú (si tienes acceso)

1. **Acceso por consola al servidor**  
   - SSH al servidor donde está MySQL.  
   - Ejecutar `mysql -u root -p` (o el usuario admin que tengas) y seguir los mismos comandos SQL de la Opción A.

2. **phpMyAdmin / Adminer**  
   - Entrar con un usuario con permisos (ej. root).  
   - Ir a la pestaña **“Cuentas de usuario”** / **“User accounts”**.  
   - Crear usuario nuevo: nombre `miclub_app`, host `%`, contraseña, y asignar permisos sobre la base `miclub_db` (ALL PRIVILEGES sobre esa base).  
   - Guardar. Luego en el `.env` usar ese usuario y contraseña.

3. **MySQL Workbench**  
   - Conectar al servidor (host `dev-imasdsooft.imasdsooft.com.ar`, usuario root, etc.).  
   - En el menú: **Server → Users and Privileges**.  
   - Añadir cuenta: Login Name `miclub_app`, Limit to Host `%`, contraseña.  
   - En **Schema Privileges** dar todos los privilegios sobre `miclub_db`.  
   - Aplicar. Actualizar `.env` con `DB_USERNAME=miclub_app` y `DB_PASSWORD=...`.

4. **Panel del proveedor (cPanel, Plesk, etc.)**  
   - Buscar la sección de **Bases de datos** / **MySQL** / **Usuarios MySQL**.  
   - Crear usuario y asignarlo a la base `miclub_db` con todos los privilegios.  
   - Usar ese usuario y contraseña en el `.env`.

---

## Resumen para mandar a DevOps

Puedes copiar y pegar esto:

> Necesito que en el servidor MySQL (`dev-imasdsooft.imasdsooft.com.ar`) se permita conexión remota a la base `miclub_db`.  
> Opción 1: Dar a `root` permiso desde cualquier host (`'root'@'%'`) con la contraseña que ya usa la app.  
> Opción 2 (recomendada): Crear usuario `miclub_app` con permiso desde `%` solo sobre `miclub_db`, y pasarme usuario y contraseña para configurar el .env de la aplicación.  
> Comandos de referencia están en `backend/docs/MYSQL-SETUP-DEVOPS.md`.

---

*Archivo de referencia del proyecto ClubX.*
