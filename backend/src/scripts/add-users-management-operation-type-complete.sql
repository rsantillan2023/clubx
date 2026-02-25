-- =====================================================
-- Script COMPLETO para agregar la pantalla de Gestión de Usuarios
-- Incluye verificaciones y opciones de configuración
-- =====================================================

-- =====================================================
-- PASO 1: Verificar roles disponibles
-- =====================================================
SELECT 
    id_role,
    description
FROM `Roles`
ORDER BY id_role;

-- =====================================================
-- PASO 2: Verificar si ya existe la pantalla
-- =====================================================
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
-- PASO 3: Eliminar si existe (opcional, solo si quieres recrearla)
-- =====================================================
-- DELETE FROM `Operations_Types` WHERE `path` = '/users-management';

-- =====================================================
-- PASO 4: Insertar la nueva pantalla
-- =====================================================
-- OPCIÓN A: Solo para ADMIN (id_role = 3)
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
VALUES 
(
    'Gestión de Usuarios, Roles y Permisos',
    'Gestiona usuarios del sistema, sus roles y los permisos de cada rol',
    3,  -- ADMIN
    NULL,
    'mdi-account-cog',
    '/users-management',
    1,  -- Visible en el menú
    100  -- Orden en el menú
);

-- =====================================================
-- OPCIÓN B: Para múltiples roles (descomenta si necesitas)
-- =====================================================
-- Para ADMIN
-- INSERT INTO `Operations_Types` 
-- (`description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`)
-- VALUES 
-- ('Gestión de Usuarios, Roles y Permisos', 
--  'Gestiona usuarios del sistema, sus roles y los permisos de cada rol',
--  3, NULL, 'mdi-account-cog', '/users-management', 1, 100);

-- Para SUPERADMIN (si existe id_role = 2 y es SUPERADMIN)
-- INSERT INTO `Operations_Types` 
-- (`description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`)
-- VALUES 
-- ('Gestión de Usuarios, Roles y Permisos', 
--  'Gestiona usuarios del sistema, sus roles y los permisos de cada rol',
--  2, NULL, 'mdi-account-cog', '/users-management', 1, 100);

-- =====================================================
-- PASO 5: Verificar el orden actual del menú
-- =====================================================
SELECT 
    id_operation_type,
    description,
    `order`,
    path,
    icon
FROM `Operations_Types`
WHERE menu_available = 1
ORDER BY `order`, id_operation_type;

-- =====================================================
-- PASO 6: Ajustar el orden si es necesario
-- =====================================================
-- Ejemplo: Poner después de "Operaciones" (order = 10)
-- UPDATE `Operations_Types` 
-- SET `order` = 11
-- WHERE `path` = '/users-management';

-- Ejemplo: Poner al final (después del último)
-- SET @max_order = (SELECT MAX(`order`) FROM `Operations_Types` WHERE menu_available = 1);
-- UPDATE `Operations_Types` 
-- SET `order` = @max_order + 1
-- WHERE `path` = '/users-management';

-- =====================================================
-- PASO 7: Verificar resultado final
-- =====================================================
SELECT 
    ot.id_operation_type,
    ot.description,
    r.description AS role_description,
    ot.path,
    ot.icon,
    ot.menu_available,
    ot.`order`
FROM `Operations_Types` ot
LEFT JOIN `Roles` r ON ot.id_role = r.id_role
WHERE ot.`path` = '/users-management';

-- =====================================================
-- NOTAS:
-- =====================================================
-- 1. El id_role = 3 corresponde a ADMIN según la estructura actual
-- 2. El icono 'mdi-account-cog' es de Material Design Icons
-- 3. El path '/users-management' debe coincidir con la ruta en el router
-- 4. menu_available = 1 hace que aparezca en el Dashboard
-- 5. El order controla la posición en el menú (mayor número = más abajo)
-- =====================================================


