# Punto crítico: contraseñas planas (sistema viejo) vs bcrypt (sistema nuevo)

## Problema

- **Sistema viejo:** los usuarios entran con contraseña en **texto plano** guardada en la BD.
- **Sistema nuevo:** el login valida con **bcrypt** (`bcrypt.compareSync(contraseña_ingresada, hash_en_BD)`).
- Si la BD sigue teniendo claves planas y el nuevo backend solo acepta bcrypt, **nadie podría entrar** después del corte.

## Solución implementada

En `backend/src/api/v1/entities/users/helpers.ts` el login quedó **compatible con los dos**:

1. **Si en la BD el valor guardado es un hash bcrypt** (empieza con `$2a$`, `$2b$` o `$2y$`): se valida con `bcrypt.compareSync` como hasta ahora.
2. **Si en la BD está en texto plano** (legacy): se compara `contraseña_ingresada === valor_en_BD`. Si coincide, el usuario entra y, **en ese mismo login**, se actualiza su fila guardando el hash bcrypt de esa contraseña. En el próximo inicio de sesión ese usuario ya usa bcrypt.

Así:

- Los usuarios del sistema viejo pueden entrar al nuevo **sin cambiar la BD antes** y sin tener que resetear contraseñas.
- Cada vez que alguien entra con clave plana, se migra su contraseña a bcrypt en la BD; con el uso se va migrando todo solo.

## Detalle técnico

- `isBcryptHash(stored)`: detecta si lo guardado es un hash bcrypt por el prefijo.
- `validatePassword(pass, storedPassword, id_user)`:  
  - Si es hash → `bcrypt.compareSync(pass, storedPassword)`.  
  - Si es plano → compara `pass === storedPassword` y, si coincide, hace `User.update({ password: hashPassword(pass) }, { where: { id_user } })`.
- `userLogin` usa `validatePassword` en lugar de llamar directo a `bcrypt.compareSync`.

## Resumen

No hace falta script previo de migración de contraseñas. Se puede dejar la base real como está, conectar el nuevo backend y frontend, y los usuarios que hoy entran con clave plana seguirán pudiendo entrar; al hacerlo, su contraseña se irá pasando a bcrypt en la BD.
