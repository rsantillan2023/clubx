-- =====================================================
-- SCRIPT PARA LIMPIAR ROLES INVÁLIDOS DE USUARIOS
-- Elimina asignaciones de roles que no existen
-- =====================================================

-- 1. Ver roles inválidos (roles asignados que no existen en la tabla Roles)
SELECT 
    'ROLES INVÁLIDOS' AS verificacion,
    ur.id_user_role,
    ur.id_user,
    ur.id_role AS rol_invalido,
    u.username,
    u.name,
    u.surname
FROM `Users_Roles` ur
LEFT JOIN `Roles` r ON ur.id_role = r.id_role
LEFT JOIN `Users` u ON ur.id_user = u.id_user
WHERE r.id_role IS NULL;

-- 2. Eliminar roles inválidos (descomenta para ejecutar)
-- DELETE ur FROM `Users_Roles` ur
-- LEFT JOIN `Roles` r ON ur.id_role = r.id_role
-- WHERE r.id_role IS NULL;

-- 3. Verificar usuarios con rol 7 específicamente
SELECT 
    'USUARIOS CON ROL 7' AS verificacion,
    ur.id_user_role,
    ur.id_user,
    ur.id_role,
    u.username,
    u.name,
    u.surname
FROM `Users_Roles` ur
LEFT JOIN `Users` u ON ur.id_user = u.id_user
WHERE ur.id_role = 7;

-- 4. Cambiar rol 7 a BARMAN (id_role = 2) para el usuario 102
-- UPDATE `Users_Roles` 
-- SET id_role = 2 
-- WHERE id_user_role = 107 AND id_user = 102;

-- 5. O eliminar el rol inválido y asignar BARMAN manualmente
-- DELETE FROM `Users_Roles` WHERE id_user_role = 107;
-- INSERT INTO `Users_Roles` (id_user, id_role) VALUES (102, 2);

-- 6. Verificar resultado final
SELECT 
    ur.id_user_role,
    ur.id_user,
    ur.id_role,
    r.description AS rol,
    u.username
FROM `Users_Roles` ur
LEFT JOIN `Roles` r ON ur.id_role = r.id_role
LEFT JOIN `Users` u ON ur.id_user = u.id_user
WHERE ur.id_user = 102;


