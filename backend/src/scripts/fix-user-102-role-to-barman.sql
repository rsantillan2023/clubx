-- =====================================================
-- SCRIPT SIMPLE - Cambiar usuario 102 a rol BARMAN
-- =====================================================

-- Cambiar rol 7 (Superadmin) a rol 2 (BARMAN) para el usuario 102
UPDATE `Users_Roles` 
SET id_role = 2 
WHERE id_user = 102;

-- Verificar el cambio
SELECT 
    ur.id_user_role,
    ur.id_user,
    ur.id_role,
    r.description AS rol,
    u.username,
    u.name,
    u.surname
FROM `Users_Roles` ur
LEFT JOIN `Roles` r ON ur.id_role = r.id_role
LEFT JOIN `Users` u ON ur.id_user = u.id_user
WHERE ur.id_user = 102;


