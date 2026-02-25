-- Script para agregar las entradas en Operations_Types para Productos y Servicios
-- Este script agrega los tipos de operación necesarios para el módulo de gestión de productos y servicios
-- IMPORTANTE: Ejecutar este script después de verificar el último id_operation_type en la tabla

-- Verificar el último ID antes de insertar
-- SELECT MAX(id_operation_type) FROM Operations_Types;

-- 1. Alta de Producto/Servicio (id_operation_type = 28)
INSERT IGNORE INTO `Operations_Types` 
(`id_operation_type`, `description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`) 
VALUES 
(28, 'Alta de Producto/Servicio', 'Crear un nuevo producto o servicio en el sistema', 1, NULL, 'mdi-package-variant-plus', '/products-services', 0, NULL);

-- 2. Modificación de Producto/Servicio (id_operation_type = 29)
INSERT IGNORE INTO `Operations_Types` 
(`id_operation_type`, `description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`) 
VALUES 
(29, 'Modificación de Producto/Servicio', 'Modificar los datos de un producto o servicio existente', 1, NULL, 'mdi-package-variant', '/products-services', 0, NULL);

-- 3. Eliminación de Producto/Servicio (id_operation_type = 30)
INSERT IGNORE INTO `Operations_Types` 
(`id_operation_type`, `description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`) 
VALUES 
(30, 'Eliminación de Producto/Servicio', 'Eliminar un producto o servicio del sistema', 1, NULL, 'mdi-package-variant-remove', '/products-services', 0, NULL);

-- 4. Consulta de Productos/Servicios (id_operation_type = 31)
INSERT IGNORE INTO `Operations_Types` 
(`id_operation_type`, `description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`) 
VALUES 
(31, 'Consulta de Productos/Servicios', 'Consultar y listar productos y servicios del sistema', 1, NULL, 'mdi-package-variant-closed', '/products-services', 0, NULL);

-- Verificar que los registros se insertaron correctamente
-- SELECT * FROM Operations_Types WHERE id_operation_type IN (28, 29, 30, 31);
