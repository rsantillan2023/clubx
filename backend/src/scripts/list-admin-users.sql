-- =====================================================
-- SCRIPT PARA LISTAR USUARIOS ADMIN Y SUPERADMIN
-- Muestra los usuarios con roles de administrador
-- =====================================================

-- 1. Listar todos los roles disponibles
SELECT 
    'TODOS LOS ROLES' AS tipo,
    id_role,
    description AS descripcion
FROM `Roles`
ORDER BY id_role;

-- 2. Usuarios con rol ADMIN (id_role = 3)
SELECT 
    'USUARIOS ADMIN' AS tipo,
    u.id_user,
    u.username,
    u.name,
    u.surname,
    r.id_role,
    r.description AS rol,
    CASE 
        WHEN u.password IS NULL OR u.password = '' THEN 'Sin contraseña'
        WHEN u.password LIKE '$2%' THEN 'Contraseña hasheada (bcrypt)'
        ELSE 'Contraseña sin hashear (⚠️ necesita hashing)'
    END AS estado_contraseña,
    LENGTH(u.password) AS longitud_password
FROM `Users` u
INNER JOIN `Users_Roles` ur ON u.id_user = ur.id_user
INNER JOIN `Roles` r ON ur.id_role = r.id_role
WHERE ur.id_role = 3
ORDER BY u.username;

-- 3. Buscar roles que contengan "SUPER" o "ADMIN" en la descripción
SELECT 
    'ROLES SUPERADMIN/ADMIN' AS tipo,
    id_role,
    description AS descripcion
FROM `Roles`
WHERE UPPER(description) LIKE '%SUPER%' 
   OR UPPER(description) LIKE '%ADMIN%'
ORDER BY id_role;

-- 4. Usuarios con roles que contengan "SUPER" o "ADMIN"
SELECT 
    'USUARIOS CON ROLES SUPERADMIN/ADMIN' AS tipo,
    u.id_user,
    u.username,
    u.name,
    u.surname,
    r.id_role,
    r.description AS rol,
    CASE 
        WHEN u.password IS NULL OR u.password = '' THEN 'Sin contraseña'
        WHEN u.password LIKE '$2%' THEN 'Contraseña hasheada (bcrypt)'
        ELSE 'Contraseña sin hashear (⚠️ necesita hashing)'
    END AS estado_contraseña,
    LENGTH(u.password) AS longitud_password
FROM `Users` u
INNER JOIN `Users_Roles` ur ON u.id_user = ur.id_user
INNER JOIN `Roles` r ON ur.id_role = r.id_role
WHERE UPPER(r.description) LIKE '%SUPER%' 
   OR UPPER(r.description) LIKE '%ADMIN%'
ORDER BY u.username, r.id_role;

-- 5. Verificar si existe un rol con id_role = 7 (mencionado en algunos scripts)
SELECT 
    'VERIFICACIÓN ROL ID 7' AS tipo,
    id_role,
    description AS descripcion,
    CASE 
        WHEN id_role = 7 THEN '⚠️ Este rol existe (puede ser SUPERADMIN)'
        ELSE 'No encontrado'
    END AS observacion
FROM `Roles`
WHERE id_role = 7;

-- 6. Usuarios con rol ID 7 (si existe)
SELECT 
    'USUARIOS CON ROL ID 7' AS tipo,
    u.id_user,
    u.username,
    u.name,
    u.surname,
    r.id_role,
    r.description AS rol,
    CASE 
        WHEN u.password IS NULL OR u.password = '' THEN 'Sin contraseña'
        WHEN u.password LIKE '$2%' THEN 'Contraseña hasheada (bcrypt)'
        ELSE 'Contraseña sin hashear (⚠️ necesita hashing)'
    END AS estado_contraseña
FROM `Users` u
INNER JOIN `Users_Roles` ur ON u.id_user = ur.id_user
INNER JOIN `Roles` r ON ur.id_role = r.id_role
WHERE ur.id_role = 7
ORDER BY u.username;

-- =====================================================
-- NOTA IMPORTANTE:
-- Las contraseñas están hasheadas con bcrypt, por lo que
-- NO es posible recuperar la contraseña original.
-- Si olvidaste la contraseña, debes restablecerla.
-- =====================================================

