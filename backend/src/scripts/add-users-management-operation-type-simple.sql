-- =====================================================
-- Script SIMPLE para agregar la pantalla de Gestión de Usuarios
-- =====================================================
-- Ejecuta este script directamente en tu base de datos
-- =====================================================

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
    3,  -- ADMIN (ajusta el id_role según tu configuración)
    NULL,
    'mdi-account-cog',
    '/users-management',
    1,  -- Visible en el menú
    100  -- Orden en el menú (ajusta según prefieras)
);

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


