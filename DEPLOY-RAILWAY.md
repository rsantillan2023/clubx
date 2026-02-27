# Deploy en Railway (front + back, base de datos remota)

Este proyecto se despliega en [Railway](https://railway.com/) con **dos servicios** desde el mismo repositorio: backend y frontend. La base de datos **no** está en Railway; el backend se conecta a tu MySQL remoto usando las variables de entorno.

---

## 1. Subir el código a Git

Desde la raíz del repo:

```powershell
cd c:\Users\lenovo\Documents\clubx
git add .
git status   # revisar que no se suban .env ni node_modules
git commit -m "Estado actual: cambios para deploy Railway (front + back, DB remota)"
git push origin master
```

Si aún no tienes remoto o quieres usar otro:

```powershell
git remote add origin https://github.com/TU_USUARIO/clubx.git
git push -u origin master
```

---

## 2. Crear proyecto en Railway

1. Entra en [railway.com](https://railway.com/) e inicia sesión (GitHub).
2. **New Project** → **Deploy from GitHub repo** → elige el repo `clubx`.
3. Railway creará un primer servicio. Lo usaremos como **backend**; luego añadiremos el frontend.

---

## 3. Servicio 1: Backend

### 3.1 Configurar el servicio como backend

- En el servicio que creó Railway, entra en **Settings**.
- **Root Directory**: `backend` (o `backend/`).
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start` (equivale a `node dist/index.js`)
- **Watch Paths** (opcional): `backend/**` para que solo los cambios en `backend` disparen redeploy.

### 3.2 Variables de entorno (Backend)

En **Variables** del servicio backend, añade todas estas. La base de datos es la **remota** (no crees MySQL en Railway):

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NODE_ENV` | Entorno | `production` |
| `PORT` | Puerto (Railway lo inyecta; si no, usa 3001) | `3001` |
| `DB_HOST` | Host de tu MySQL remoto | `tu-servidor.com` o IP |
| `DB_PORT` | Puerto MySQL | `3306` |
| `DB_USERNAME` | Usuario MySQL | (tu usuario) |
| `DB_PASSWORD` | Contraseña MySQL | (tu contraseña) |
| `DB_DATABASE` | Nombre de la base | `miclub_db` o el que uses |
| `DB_DIALECT` | Dialecto | `mysql` |
| `API_BASE_ROUTE` | Prefijo API | `api` |
| `SERVICE_NAME` | Servicio | `degira` |
| `ENTITIES_FOLDER_NAME` | Carpeta entidades | `entities` |
| `ROUTES_FILE_NAME` | Archivo rutas | `routes` |
| `JWT_SECRET` | Clave JWT (genera una segura) | (string largo aleatorio) |
| `JWT_EXPIRES_IN` | Expiración JWT | `24h` |

No subas `.env` al repo; configúralas solo en Railway.

### 3.3 Dominio público del backend

- En el servicio backend: **Settings** → **Networking**.
- Si ves **"Generate Domain"**, haz clic y anota la URL (ej. `https://clubz.up.railway.app`).
- Si solo dice **"Public domain will be generated"**: el dominio se crea **automáticamente** cuando el servicio está público. Activa la red pública si hace falta; tras el primer deploy, la URL aparecerá en esa sección o en **Deployments**. Copia esa URL para las variables del frontend.

---

## 4. Servicio 2: Frontend

### 4.1 Añadir segundo servicio

- En el mismo proyecto Railway: **+ New** → **GitHub Repo** → elige otra vez el repo `clubx` (o **+ New** → **Empty Service** y enlaza el mismo repo).
- En **Settings** del nuevo servicio:
  - **Root Directory**: `frontend`
  - **Build Command**: `npm install && npm run build`
  - **Start Command**: `npx serve -s dist -l 3000`  
    (sirve la carpeta `dist` de Vue; el puerto puede ser el que Railway asigne si usas `PORT`).
- **Watch Paths** (opcional): `frontend/**`

### 4.2 Variables de entorno (Frontend)

El frontend necesita apuntar al **backend en Railway**, no a `localhost`. Usa la URL que generaste en el paso 3.3.

Sustituye `https://clubx-backend-xxxx.up.railway.app` por tu URL real:

| Variable | Valor |
|----------|--------|
| `VUE_APP_ENVIROMENT` | `production` |
| `VUE_APP_DEGIRA` | `https://clubx-backend-xxxx.up.railway.app/api/v1/degira/` |
| `VUE_APP_LOGIN_URI` | `https://clubx-backend-xxxx.up.railway.app/api/v1/degira/users/login` |
| `VUE_APP_PARTNERS` | `https://clubx-backend-xxxx.up.railway.app/api/v1/degira/partners` |
| `VUE_APP_REGISTER` | `https://clubx-backend-xxxx.up.railway.app/api/v1/degira/partners/discharge` |
| `VUE_APP_PARTNERS_UPDATE` | `https://clubx-backend-xxxx.up.railway.app/api/v1/degira/partners/update` |
| `VUE_APP_CREATE_BRAZALETE` | `https://clubx-backend-xxxx.up.railway.app/api/v1/degira/consumptions/create` |
| `VUE_APP_VISITS` | `https://clubx-backend-xxxx.up.railway.app/api/v1/degira/visits/` |
| `VUE_APP_ENTRY_REGISTER` | `https://clubx-backend-xxxx.up.railway.app/api/v1/degira/visits/entry` |
| `VUE_APP_EXIT_REGISTER` | `https://clubx-backend-xxxx.up.railway.app/api/v1/degira/visits/exit/` |
| `VUE_APP_BUTTONS` | `https://clubx-backend-xxxx.up.railway.app/api/v1/degira/operations_types/get` |

En Vue CLI estas variables se “hornean” en el build; si cambias la URL del backend, hay que **volver a desplegar el frontend** después de cambiar las variables.

### 4.3 Dominio público del frontend

- En el servicio frontend: **Settings** → **Networking**.
- Si hay botón **"Generate Domain"**, úsalo y anota la URL.
- Si solo dice **"Public domain will be generated"**: el dominio se genera **solo** cuando el servicio tenga red pública y un deploy correcto. Tras desplegar, la URL aparecerá en **Networking** o en el último **Deployment**. Esa es la URL de tu app en producción.

---

## 5. CORS en el backend

El backend ya usa `cors()` sin restricción de origen, así que el frontend en Railway podrá llamar a la API sin cambiar nada. Si más adelante quieres limitar orígenes, configura en `backend/src/index.ts` la lista de dominios permitidos.

---

## 6. Resumen

| Dónde | Qué hace |
|-------|----------|
| **Git** | Código actual (front + back) en `master`. |
| **Railway – Servicio Backend** | `backend/` → build + start; variables `DB_*` apuntan a tu MySQL remoto; dominio público para la API. |
| **Railway – Servicio Frontend** | `frontend/` → build + `serve -s dist`; variables `VUE_APP_*` apuntan a la URL del backend en Railway. |
| **Base de datos** | Fuera de Railway; el backend se conecta por `DB_HOST`/`DB_PORT`/etc. |

Así el backend en Railway “habla” con tu base remota y el frontend en Railway usa solo ese backend.
