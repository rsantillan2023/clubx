# Qué hay en el servidor — Comandos para explorar

Conéctate primero:
```bash
ssh -p 5548 root@181.13.244.106
```

Luego ejecuta estos comandos **uno por uno** (o varios seguidos) y anota qué sale.

---

## 1. Sistema y recursos
```bash
# Versión del sistema
cat /etc/os-release

# Uso de disco
df -h

# Memoria
free -h

# Usuarios con sesión / quién está conectado
who
```

---

## 2. Servicios que escuchan (puertos abiertos)
```bash
# Puertos en escucha (qué servicios están activos)
ss -tlnp

# O con netstat
netstat -tlnp 2>/dev/null
```
Ahí verás si hay algo en 80 (HTTP), 443 (HTTPS), 3000, 3001, 8080, etc.

---

## 3. Servidor web
```bash
# ¿Nginx?
which nginx
nginx -v 2>/dev/null

# ¿Apache?
which apache2
apache2 -v 2>/dev/null
```

---

## 4. Node.js / aplicación
```bash
# ¿Node instalado?
which node
node -v

# ¿npm?
which npm
npm -v

# Procesos de Node corriendo
ps aux | grep node
```

---

## 5. Bases de datos (ya sabes que MySQL no está)
```bash
which mysql
which psql
ss -tlnp | grep -E '3306|5432'
```

---

## 6. Contenedores y servicios
```bash
# Docker
which docker
docker ps 2>/dev/null

# Servicios systemd (qué está activo)
systemctl list-units --type=service --state=running
```

---

## 7. Carpetas típicas de proyectos
```bash
# Ver qué hay en /var/www (suelen estar sitios web)
ls -la /var/www 2>/dev/null

# Ver en /home
ls -la /home 2>/dev/null

# Ver en /opt
ls -la /opt 2>/dev/null
```

---

## 8. Cron (tareas programadas)
```bash
crontab -l
ls -la /etc/cron.d/
```

---

## Resumen rápido (todo en uno)
Copia y pega este bloque para tener un resumen:

```bash
echo "=== OS ===" && cat /etc/os-release | head -5
echo "" && echo "=== PUERTOS ===" && ss -tlnp
echo "" && echo "=== NODE ===" && (node -v 2>/dev/null || echo "Node no instalado")
echo "" && echo "=== WEB ===" && (nginx -v 2>/dev/null; apache2 -v 2>/dev/null)
echo "" && echo "=== /var/www ===" && ls /var/www 2>/dev/null
echo "" && echo "=== PROCESOS NODE ===" && ps aux | grep -E 'node|npm' | grep -v grep
```

Con eso verás: sistema operativo, puertos abiertos, si hay Node, si hay Nginx/Apache, qué hay en `/var/www` y si hay procesos de Node. Si quieres, pega aquí la salida y te digo qué hay en el servidor.
