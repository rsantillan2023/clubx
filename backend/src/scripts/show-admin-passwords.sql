-- =====================================================
-- SCRIPT PARA VER USUARIOS ADMIN Y SUPERADMIN
-- Y VERIFICAR ESTADO DE SUS CONTRASEÑAS
-- =====================================================

-- Usuarios con rol ADMIN (id_role = 3)
SELECT 
    'ADMIN' AS tipo_rol,
    u.id_user,
    u.username,
    u.name,
    u.surname,
    r.description AS rol,
    u.password AS contraseña_actual,
    CASE 
        WHEN u.password IS NULL OR u.password = '' THEN 'Sin contraseña'
        WHEN u.password LIKE '$2%' THEN 'Hasheada (bcrypt) - No se puede ver original'
        ELSE 'Sin hashear (ver columna contraseña_actual)'
    END AS estado_contraseña,
    LENGTH(u.password) AS longitud_password
FROM `Users` u
INNER JOIN `Users_Roles` ur ON u.id_user = ur.id_user
INNER JOIN `Roles` r ON ur.id_role = r.id_role
WHERE ur.id_role = 3
ORDER BY u.username;

-- Usuarios con rol SUPERADMIN (id_role = 7)
SELECT 
    'SUPERADMIN' AS tipo_rol,
    u.id_user,
    u.username,
    u.name,
    u.surname,
    r.description AS rol,
    u.password AS contraseña_actual,
    CASE 
        WHEN u.password IS NULL OR u.password = '' THEN 'Sin contraseña'
        WHEN u.password LIKE '$2%' THEN 'Hasheada (bcrypt) - No se puede ver original'
        ELSE 'Sin hashear (ver columna contraseña_actual)'
    END AS estado_contraseña,
    LENGTH(u.password) AS longitud_password
FROM `Users` u
INNER JOIN `Users_Roles` ur ON u.id_user = ur.id_user
INNER JOIN `Roles` r ON ur.id_role = r.id_role
WHERE ur.id_role = 7
ORDER BY u.username;

-- Resumen: Todos los usuarios ADMIN y SUPERADMIN
SELECT 
    u.id_user,
    u.username,
    u.name,
    u.surname,
    GROUP_CONCAT(r.description ORDER BY r.id_role SEPARATOR ', ') AS roles,
    u.password AS contraseña_actual,
    CASE 
        WHEN u.password IS NULL OR u.password = '' THEN 'Sin contraseña'
        WHEN u.password LIKE '$2%' THEN 'Hasheada (bcrypt)'
        ELSE 'Sin hashear'
    END AS estado_contraseña
FROM `Users` u
INNER JOIN `Users_Roles` ur ON u.id_user = ur.id_user
INNER JOIN `Roles` r ON ur.id_role = r.id_role
WHERE ur.id_role IN (3, 7)
GROUP BY u.id_user, u.username, u.name, u.surname, u.password
ORDER BY u.username;
