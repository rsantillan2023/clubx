-- =====================================================
-- Agrega la pantalla de Gestión de Usuarios (solo si no existe).
-- Seguro para ejecutar en producción: no falla si ya está el ítem.
-- =====================================================

SET NAMES utf8mb4;

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
    'Gestión de Usuarios, Roles y Permisos',
    'Gestiona usuarios del sistema, sus roles y los permisos de cada rol',
    3,
    NULL,
    'mdi-account-cog',
    '/users-management',
    1,
    100
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM `Operations_Types`
    WHERE `path` = '/users-management'
);
