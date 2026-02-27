# Análisis: uso de UserDealers en el código

## Conclusión

**UserDealers no se usa en ningún flujo que toque la base de datos.** El modelo y la interfaz existen en el código, pero ninguna ruta, asociación ni consulta los utiliza. La tabla puede no existir en la BD real sin que la aplicación falle por ello.

---

## Dónde aparece UserDealer(s)

### 1. Definición del modelo e interfaz (solo definición)

| Archivo | Uso |
|---------|-----|
| `backend/src/database/schemas/degira/models/userDealer.model.ts` | Define el modelo Sequelize y `tableName: 'UserDealers'`. |
| `backend/src/database/schemas/degira/interfaces/userDealer.interface.ts` | Define `IUserDealer`. |

Ninguno de los dos es importado por controladores, helpers ni asociaciones que hagan consultas.

---

### 2. Import sin uso (tipos de users)

| Archivo | Uso |
|---------|-----|
| `backend/src/api/v1/entities/users/types.ts` | Importa `IUserDealer` pero **no lo usa** en ninguna interfaz exportada (`IUserAPI`, `ILogin`, `IUserWithRoles`, etc.). Es un import muerto. |

---

### 3. Asociaciones de User

| Archivo | Uso |
|---------|-----|
| `backend/src/database/schemas/degira/associations/user.associations.ts` | Solo define `User.belongsToMany(Role, { through: UserRole, as: 'roles' })`. **No importa UserDealer ni define ninguna relación User ↔ UserDealer.** |

En el backup había `User.hasOne(UserDealer, { as: 'user_dealer' })`; en el backend actual eso **no está**.

---

### 4. Helpers de users

| Archivo | Uso |
|---------|-----|
| `backend/src/api/v1/entities/users/helpers.ts` | No importa `UserDealer`. El `include` en login y en las consultas de usuarios usa solo `rolIncludeable` (Role vía UserRole). **No hay `user_dealer` ni `userDealerIncludeable`.** |

En el backup había un `userDealerIncludeable` (en un include comentado); en el backend actual **no existe**.

---

### 5. CRUD genérico (tablas del modelo)

| Archivo | Uso |
|---------|-----|
| `backend/src/api/v1/entities/crud/helpers.ts` | El `modelMap` incluye 17 tablas (Actions, Days, Operations, …). **UserDealers no está en el map**, así que el CRUD genérico nunca opera sobre esa tabla. |

---

### 6. Frontend

Búsqueda de `user_dealer`, `userDealer`, `UserDealer` en el frontend: **ningún resultado**. No se usa.

---

## Resumen por tipo de uso

| Tipo de uso | ¿Existe? |
|-------------|----------|
| Modelo definido | Sí (archivo del modelo) |
| Interfaz definida | Sí (IUserDealer) |
| Interfaz usada en tipos de API | No (import muerto en `users/types.ts`) |
| Asociación User ↔ UserDealer | No |
| Include en consultas de usuarios | No |
| CRUD genérico (modelMap) | No |
| Cualquier otra consulta/escritura a UserDealers | No |
| Referencia en frontend | No |

---

## Implicación para el deploy

Para el escenario “nuevo front + back apuntando a la base real”:

- **No hace falta crear la tabla UserDealers** en la base real para que la aplicación actual funcione.
- **No hay que cambiar código** para “dejar de usar” UserDealers: ya no se usa en ningún flujo que toque la BD.

Si en el futuro se quisiera usar la relación usuario–dealer, entonces sí habría que:
1. Crear la tabla en la BD (si no existe), y/o  
2. Volver a definir la asociación en `user.associations.ts` y usar el include en los helpers de users.

Con el código actual, la tabla puede no existir sin problema.
