-- =====================================================
-- VERIFICAR TODOS LOS USUARIOS Y SUS ROLES
-- =====================================================

-- 1. Todos los usuarios y sus roles
SELECT 
    u.id_user,
    u.username,
    u.name,
    u.surname,
    u.password AS contraseña_actual,
    CASE 
        WHEN u.password IS NULL OR u.password = '' THEN 'Sin contraseña'
        WHEN u.password LIKE '$2%' THEN 'Hasheada (bcrypt)'
        ELSE 'Sin hashear'
    END AS estado_contraseña,
    GROUP_CONCAT(r.description ORDER BY r.id_role SEPARATOR ', ') AS roles,
    GROUP_CONCAT(r.id_role ORDER BY r.id_role SEPARATOR ', ') AS id_roles
FROM `Users` u
LEFT JOIN `Users_Roles` ur ON u.id_user = ur.id_user
LEFT JOIN `Roles` r ON ur.id_role = r.id_role
GROUP BY u.id_user, u.username, u.name, u.surname, u.password
ORDER BY u.username;

-- 2. Usuarios sin roles asignados
SELECT 
    u.id_user,
    u.username,
    u.name,
    u.surname,
    u.password AS contraseña_actual,
    CASE 
        WHEN u.password IS NULL OR u.password = '' THEN 'Sin contraseña'
        WHEN u.password LIKE '$2%' THEN 'Hasheada (bcrypt)'
        ELSE 'Sin hashear'
    END AS estado_contraseña
FROM `Users` u
LEFT JOIN `Users_Roles` ur ON u.id_user = ur.id_user
WHERE ur.id_user IS NULL
ORDER BY u.username;

-- 3. Verificar si hay usuarios que deberían ser admin pero no tienen el rol
-- (Buscar por username que contenga "admin")
SELECT 
    u.id_user,
    u.username,
    u.name,
    u.surname,
    u.password AS contraseña_actual,
    CASE 
        WHEN u.password IS NULL OR u.password = '' THEN 'Sin contraseña'
        WHEN u.password LIKE '$2%' THEN 'Hasheada (bcrypt)'
        ELSE 'Sin hashear'
    END AS estado_contraseña,
    GROUP_CONCAT(r.description ORDER BY r.id_role SEPARATOR ', ') AS roles_actuales
FROM `Users` u
LEFT JOIN `Users_Roles` ur ON u.id_user = ur.id_user
LEFT JOIN `Roles` r ON ur.id_role = r.id_role
WHERE UPPER(u.username) LIKE '%ADMIN%'
GROUP BY u.id_user, u.username, u.name, u.surname, u.password
ORDER BY u.username;

