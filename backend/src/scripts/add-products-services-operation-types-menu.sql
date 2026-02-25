-- Script para agregar las entradas en Operations_Types para el menú y operaciones masivas
-- Este script debe ejecutarse DESPUÉS de add-products-services-operation-types.sql
-- IMPORTANTE: Verificar el último id_operation_type antes de ejecutar

-- Verificar el último ID antes de insertar
-- SELECT MAX(id_operation_type) FROM Operations_Types;

-- 5. Actualización Masiva de Precios (id_operation_type = 26)
INSERT IGNORE INTO `Operations_Types` 
(`id_operation_type`, `description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`) 
VALUES 
(26, 'Actualización Masiva de Precios', 'Actualizar precios de múltiples productos/servicios de forma masiva', 1, NULL, 'mdi-currency-usd-circle', '/products-services', 0, NULL);

-- 6. Actualización Masiva de Productos/Servicios (id_operation_type = 27)
INSERT IGNORE INTO `Operations_Types` 
(`id_operation_type`, `description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`) 
VALUES 
(27, 'Actualización Masiva de Productos/Servicios', 'Actualizar múltiples productos/servicios de forma masiva', 1, NULL, 'mdi-package-variant-closed-edit', '/products-services', 0, NULL);

-- 7. Menú de Gestión de Productos y Servicios (para el menú principal)
-- NOTA: Este registro NO tiene un ID fijo, se asignará automáticamente
-- IMPORTANTE: Este es el que aparece en el menú (menu_available = 1)
INSERT INTO `Operations_Types` 
(`description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`) 
SELECT 'Gestión de Productos y Servicios', 'Gestionar productos y servicios: alta, modificación, baja, consulta, cambios masivos de precios', 1, NULL, 'mdi-store', '/products-services', 1, 14
WHERE NOT EXISTS (
    SELECT 1 FROM Operations_Types 
    WHERE description = 'Gestión de Productos y Servicios' 
    AND path = '/products-services'
    AND menu_available = 1
);

-- Verificar que los registros se insertaron correctamente
-- SELECT * FROM Operations_Types WHERE id_operation_type BETWEEN 26 AND 27;
-- SELECT * FROM Operations_Types WHERE description = 'Gestión de Productos y Servicios';

