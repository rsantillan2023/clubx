-- =====================================================
-- SCRIPT PARA ASIGNAR ROL SUPERADMIN A rsantillan
-- =====================================================

-- 1. Verificar el usuario actual y sus roles
SELECT 
    'ESTADO ACTUAL' AS accion,
    u.id_user,
    u.username,
    u.name,
    u.surname,
    GROUP_CONCAT(r.description ORDER BY r.id_role SEPARATOR ', ') AS roles_actuales,
    GROUP_CONCAT(r.id_role ORDER BY r.id_role SEPARATOR ', ') AS id_roles_actuales
FROM `Users` u
LEFT JOIN `Users_Roles` ur ON u.id_user = ur.id_user
LEFT JOIN `Roles` r ON ur.id_role = r.id_role
WHERE u.username = 'rsantillan'
GROUP BY u.id_user, u.username, u.name, u.surname;

-- 2. Eliminar todos los roles actuales del usuario rsantillan
DELETE ur FROM `Users_Roles` ur
INNER JOIN `Users` u ON ur.id_user = u.id_user
WHERE u.username = 'rsantillan';

-- 3. Asignar el rol SUPERADMIN (id_role = 7) al usuario rsantillan
INSERT INTO `Users_Roles` (id_user, id_role) 
SELECT id_user, 7 
FROM `Users` 
WHERE username = 'rsantillan';

-- 4. Verificar el resultado final
SELECT 
    'RESULTADO FINAL' AS accion,
    u.id_user,
    u.username,
    u.name,
    u.surname,
    r.description AS rol,
    r.id_role
FROM `Users` u
INNER JOIN `Users_Roles` ur ON u.id_user = ur.id_user
INNER JOIN `Roles` r ON ur.id_role = r.id_role
WHERE u.username = 'rsantillan'
ORDER BY r.id_role;

