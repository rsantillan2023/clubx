-- Script para agregar las operaciones de actualización masiva (IDs 26 y 27)
-- Este script agrega los tipos de operación para actualizaciones masivas de productos y servicios

-- Verificar si los IDs ya existen
-- SELECT id_operation_type, description FROM Operations_Types WHERE id_operation_type IN (26, 27);

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

-- Verificar que los registros se insertaron correctamente
SELECT id_operation_type, description, path, menu_available
FROM Operations_Types 
WHERE id_operation_type IN (26, 27);

