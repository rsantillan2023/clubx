-- Script para cambiar el rol del usuario admin (ID: 104) de Superadmin (ID: 7) a ADMIN (ID: 3)
-- Ejecutar este script directamente en MySQL si el cambio desde la UI no funciona

-- 1. Verificar el estado actual
SELECT 
    ur.id_user_role,
    ur.id_user,
    ur.id_role,
    r.description AS rol,
    u.username
FROM `Users_Roles` ur
LEFT JOIN `Roles` r ON ur.id_role = r.id_role
LEFT JOIN `Users` u ON ur.id_user = u.id_user
WHERE ur.id_user = 104;

-- 2. Eliminar el rol 7 (Superadmin) del usuario admin
DELETE FROM `Users_Roles` 
WHERE id_user = 104 AND id_role = 7;

-- 3. Asignar el rol 3 (ADMIN) al usuario admin
INSERT INTO `Users_Roles` (id_user, id_role) 
VALUES (104, 3)
ON DUPLICATE KEY UPDATE id_role = 3;

-- 4. Verificar el resultado final
SELECT 
    ur.id_user_role,
    ur.id_user,
    ur.id_role,
    r.description AS rol,
    u.username
FROM `Users_Roles` ur
LEFT JOIN `Roles` r ON ur.id_role = r.id_role
LEFT JOIN `Users` u ON ur.id_user = u.id_user
WHERE ur.id_user = 104;


