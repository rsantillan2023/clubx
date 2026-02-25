-- =====================================================
-- SCRIPT ÚNICO COMPLETO - LISTO PARA COPIAR Y PEGAR
-- Elimina duplicados y deja solo un registro
-- =====================================================

-- Paso 1: Eliminar TODOS los registros duplicados
DELETE FROM `Operations_Types` 
WHERE `path` = '/users-management';

-- Paso 2: Insertar UN SOLO registro
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
    3,
    NULL,
    'mdi-account-cog',
    '/users-management',
    1,
    100
);

-- Paso 3: Verificar resultado (debe mostrar solo 1 registro)
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


