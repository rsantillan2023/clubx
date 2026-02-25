-- =====================================================
-- Script para agregar la pantalla de Gestión de Usuarios, Roles y Permisos
-- =====================================================
-- Este script agrega un nuevo operation_type para acceder al módulo
-- de gestión de usuarios, roles y permisos desde el Dashboard
-- =====================================================

-- Verificar si ya existe antes de insertar
SET @exists = (SELECT COUNT(*) FROM `Operations_Types` WHERE `path` = '/users-management');

-- Insertar solo si no existe
INSERT INTO `Operations_Types` 
(
    `description`,
    `action`,
    `id_role`,
    `tag`,
    `icon`,
    `path`,
    `menu_available`,
    `order`
)
SELECT 
    'Gestión de Usuarios, Roles y Permisos' AS `description`,
    'Gestiona usuarios del sistema, sus roles y los permisos de cada rol' AS `action`,
    3 AS `id_role`,  -- ADMIN (id_role = 3 según enum ERoles)
    NULL AS `tag`,
    'mdi-account-cog' AS `icon`,
    '/users-management' AS `path`,
    1 AS `menu_available`,  -- Visible en el menú
    100 AS `order`  -- Orden alto para que aparezca al final del menú
WHERE @exists = 0;

-- Verificar que se insertó correctamente
SELECT 
    id_operation_type,
    description,
    id_role,
    path,
    icon,
    menu_available,
    `order`
FROM `Operations_Types`
WHERE `path` = '/users-management';

-- =====================================================
-- OPCIONAL: Si quieres que aparezca en una posición específica del menú
-- puedes actualizar el campo `order` con un valor diferente
-- =====================================================
-- Ejemplo para ponerlo después de "Operaciones" (order = 10):
-- UPDATE `Operations_Types` 
-- SET `order` = 11
-- WHERE `path` = '/users-management';
-- =====================================================

-- =====================================================
-- OPCIONAL: Si quieres que también sea accesible para otros roles
-- (por ejemplo, SUPERADMIN), puedes crear registros adicionales
-- =====================================================
-- INSERT INTO `Operations_Types` 
-- (`description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`)
-- VALUES 
-- ('Gestión de Usuarios, Roles y Permisos', 
--  'Gestiona usuarios del sistema, sus roles y los permisos de cada rol',
--  2,  -- SUPERADMIN (si existe)
--  NULL,
--  'mdi-account-cog',
--  '/users-management',
--  1,
--  100);
-- =====================================================


