-- =====================================================
-- SCRIPT LISTO PARA COPIAR Y PEGAR
-- Agrega la pantalla de Gestión de Usuarios, Roles y Permisos
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
    3,
    NULL,
    'mdi-account-cog',
    '/users-management',
    1,
    100
);


