# Conectar al servidor y configurar MySQL

Guía para entrar por SSH al servidor y permitir acceso remoto a la base `miclub_db`.

---

## 1. Conectarte por SSH

En tu PC (PowerShell o CMD):

```bash
ssh -p 5548 root@181.13.244.106
```

Cuando pida contraseña, usa la que te dieron para SSH (no la de MySQL).

---

## 2. Comprobar si MySQL está instalado

Ya dentro del servidor:

```bash
# Ver si existe el comando mysql
which mysql

# O si MySQL corre en Docker
docker ps | grep -i mysql
```

- Si ves una ruta (ej. `/usr/bin/mysql`), sigue al paso 3.
- Si ves un contenedor MySQL, anota el nombre del contenedor y usa el paso 3 con Docker.

---

## 3. Entrar a MySQL

**Si MySQL está instalado directamente en el servidor:**

```bash
mysql -u root -p
```

Te pedirá la contraseña de **root de MySQL** (la que te dieron para MySQL, no la de SSH). Escríbela y pulsa Enter (no se verá mientras escribes).

**Si MySQL corre en Docker:**

```bash
docker exec -it NOMBRE_CONTENEDOR mysql -u root -p
```

(Sustituye `NOMBRE_CONTENEDOR` por el nombre que viste en `docker ps`, por ejemplo `mysql` o `db`.)

---

## 4. Ejecutar los comandos para permitir acceso remoto

Una vez dentro de MySQL (verás el prompt `mysql>`), ejecuta estos comandos **uno por uno**:

**Opción recomendada: usuario solo para la app**

```sql
-- Crear usuario 'miclub_app' que pueda conectarse desde cualquier IP
-- (cuando te pida la contraseña, usa una segura y guárdala para el .env)
CREATE USER IF NOT EXISTS 'miclub_app'@'%' IDENTIFIED BY 'PON_AQUI_UNA_PASSWORD_SEGURA';
GRANT ALL PRIVILEGES ON miclub_db.* TO 'miclub_app'@'%';
FLUSH PRIVILEGES;
```

Sustituye `PON_AQUI_UNA_PASSWORD_SEGURA` por la contraseña que quieras usar en el .env de la app.

**Si prefieres permitir a root desde cualquier IP** (solo si tu política lo permite):

```sql
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'LA_MISMA_PASSWORD_QUE_ROOT';
GRANT ALL PRIVILEGES ON miclub_db.* TO 'root'@'%';
FLUSH PRIVILEGES;
```

Luego salir de MySQL:

```sql
EXIT;
```

---

## 5. Verificar (opcional)

Desde el servidor:

```bash
mysql -u root -p -e "SELECT user, host FROM mysql.user WHERE user IN ('root','miclub_app');"
```

Deberías ver filas con `miclub_app` y `%` (o `root` y `%` si usaste root).

---

## 6. Firewall (por si no conecta desde fuera)

Si desde tu PC la app sigue sin conectar, en el servidor puede estar bloqueado el puerto 3306:

```bash
# Ver si el puerto 3306 está escuchando
ss -tlnp | grep 3306
# o
netstat -tlnp | grep 3306
```

Si tu proveedor tiene firewall (UFW, firewalld, o panel), hay que permitir el puerto **3306** para la IP de tu app o para todo (según lo que te permitan).

---

## Resumen rápido

| Paso | Comando / acción |
|------|-------------------|
| 1 | `ssh -p 5548 root@181.13.244.106` (contraseña SSH cuando pida) |
| 2 | `which mysql` o `docker ps \| grep mysql` |
| 3 | `mysql -u root -p` (o `docker exec -it CONTENEDOR mysql -u root -p`) |
| 4 | Crear usuario y GRANT (los SQL de arriba), luego `EXIT` |
| 5 | Actualizar el `.env` de la app con ese usuario y contraseña |

Después de esto, desde tu PC ejecuta de nuevo `npm run count` en el backend; debería conectar a `miclub_db` en el servidor.
