-- =====================================================
-- UPDATE PARA ASIGNAR ROL SUPERADMIN A rsantillan
-- =====================================================

-- 1. Eliminar todos los roles actuales del usuario rsantillan
DELETE ur FROM `Users_Roles` ur
INNER JOIN `Users` u ON ur.id_user = u.id_user
WHERE u.username = 'rsantillan';

-- 2. Asignar el rol SUPERADMIN (id_role = 7) al usuario rsantillan
INSERT INTO `Users_Roles` (id_user, id_role) 
SELECT id_user, 7 
FROM `Users` 
WHERE username = 'rsantillan';

-- 3. Verificar el resultado
SELECT 
    u.id_user,
    u.username,
    u.name,
    u.surname,
    r.description AS rol,
    r.id_role
FROM `Users` u
INNER JOIN `Users_Roles` ur ON u.id_user = ur.id_user
INNER JOIN `Roles` r ON ur.id_role = r.id_role
WHERE u.username = 'rsantillan';

