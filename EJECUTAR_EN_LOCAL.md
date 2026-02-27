# Cómo ejecutar ClubX en local

## 1. Instalar dependencias

Abre **dos terminales** (PowerShell o CMD).

### Terminal 1 – Backend
```powershell
cd c:\Users\lenovo\Documents\clubx\backend
npm install
```

### Terminal 2 – Frontend
```powershell
cd c:\Users\lenovo\Documents\clubx\frontend
npm install
```

Espera a que termine cada `npm install` (puede tardar unos minutos).

---

## 2. Arrancar el backend (API local)

En la terminal del backend:

```powershell
cd c:\Users\lenovo\Documents\clubx\backend
npm run start:local
```

La API quedará en **http://localhost:3001**.

(Opcional) En otra terminal puedes iniciar el servicio de sincronización:

```powershell
cd c:\Users\lenovo\Documents\clubx\backend
npm run sync:start
```

---

## 3. Arrancar el frontend

En la terminal del frontend:

```powershell
cd c:\Users\lenovo\Documents\clubx\frontend
npm run serve
```

La app se abrirá en **http://localhost:8080** (o el puerto que indique la terminal).

---

## Resumen

| Qué              | Comando              | Dónde                      |
|------------------|----------------------|----------------------------|
| API local        | `npm run start:local`| carpeta `backend`          |
| Sincronización   | `npm run sync:start` | carpeta `backend` (opcional) |
| App web          | `npm run serve`      | carpeta `frontend`         |

Orden recomendado: primero backend, luego frontend.
