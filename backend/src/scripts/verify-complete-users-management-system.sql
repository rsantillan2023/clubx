-- =====================================================
-- SCRIPT ÚNICO DE VERIFICACIÓN COMPLETA
-- Verifica que todo el sistema de gestión esté configurado
-- =====================================================

-- 1. Verificar que la pantalla existe y está correcta
SELECT 
    'PANTALLA DE GESTIÓN' AS verificacion,
    ot.id_operation_type,
    ot.description,
    r.description AS role,
    ot.path,
    ot.icon,
    ot.menu_available,
    ot.`order`,
    CASE 
        WHEN ot.path = '/users-management' AND ot.menu_available = 1 THEN '✓ OK'
        ELSE '✗ ERROR'
    END AS estado
FROM `Operations_Types` ot
LEFT JOIN `Roles` r ON ot.id_role = r.id_role
WHERE ot.`path` = '/users-management';

-- 2. Verificar roles disponibles
SELECT 
    'ROLES DISPONIBLES' AS verificacion,
    id_role,
    description,
    CASE 
        WHEN id_role = 3 THEN '✓ ADMIN (para gestión)'
        ELSE 'Otro rol'
    END AS uso
FROM `Roles`
ORDER BY id_role;

-- 3. Verificar usuarios con rol ADMIN
SELECT 
    'USUARIOS ADMIN' AS verificacion,
    u.id_user,
    u.name,
    u.surname,
    u.username,
    COUNT(ur.id_role) AS cantidad_roles,
    GROUP_CONCAT(r.description SEPARATOR ', ') AS roles
FROM `Users` u
LEFT JOIN `Users_Roles` ur ON u.id_user = ur.id_user
LEFT JOIN `Roles` r ON ur.id_role = r.id_role
WHERE ur.id_role = 3 OR u.id_user IN (
    SELECT DISTINCT id_user FROM `Users_Roles` WHERE id_role = 3
)
GROUP BY u.id_user, u.name, u.surname, u.username
ORDER BY u.id_user;

-- 4. Verificar que hay pantallas asignadas a cada rol
SELECT 
    'PANTALLAS POR ROL' AS verificacion,
    r.id_role,
    r.description AS rol,
    COUNT(ot.id_operation_type) AS cantidad_pantallas,
    GROUP_CONCAT(ot.description SEPARATOR ' | ') AS pantallas
FROM `Roles` r
LEFT JOIN `Operations_Types` ot ON r.id_role = ot.id_role
GROUP BY r.id_role, r.description
ORDER BY r.id_role;

-- 5. Resumen final
SELECT 
    'RESUMEN FINAL' AS verificacion,
    (SELECT COUNT(*) FROM `Operations_Types` WHERE `path` = '/users-management') AS pantalla_existe,
    (SELECT COUNT(*) FROM `Roles` WHERE id_role = 3) AS rol_admin_existe,
    (SELECT COUNT(DISTINCT u.id_user) FROM `Users` u INNER JOIN `Users_Roles` ur ON u.id_user = ur.id_user WHERE ur.id_role = 3) AS usuarios_admin,
    (SELECT COUNT(*) FROM `Operations_Types` WHERE id_role = 3 AND menu_available = 1) AS pantallas_admin_visibles,
    CASE 
        WHEN (SELECT COUNT(*) FROM `Operations_Types` WHERE `path` = '/users-management') = 1 
         AND (SELECT COUNT(*) FROM `Roles` WHERE id_role = 3) = 1
        THEN '✓ SISTEMA LISTO'
        ELSE '✗ REVISAR CONFIGURACIÓN'
    END AS estado_final;


