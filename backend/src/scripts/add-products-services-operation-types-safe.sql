-- Script SEGURO para agregar las entradas en Operations_Types para Productos y Servicios
-- Este script verifica si los registros existen antes de insertarlos
-- IMPORTANTE: Ejecutar este script después de verificar el último id_operation_type en la tabla

-- Verificar qué IDs ya existen
-- SELECT id_operation_type, description FROM Operations_Types WHERE id_operation_type BETWEEN 22 AND 27;

-- 1. Alta de Producto/Servicio (id_operation_type = 22)
INSERT IGNORE INTO `Operations_Types` 
(`id_operation_type`, `description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`) 
VALUES 
(22, 'Alta de Producto/Servicio', 'Crear un nuevo producto o servicio en el sistema', 1, NULL, 'mdi-package-variant-plus', '/products-services', 0, NULL);

-- 2. Modificación de Producto/Servicio (id_operation_type = 23)
INSERT IGNORE INTO `Operations_Types` 
(`id_operation_type`, `description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`) 
VALUES 
(23, 'Modificación de Producto/Servicio', 'Modificar los datos de un producto o servicio existente', 1, NULL, 'mdi-package-variant', '/products-services', 0, NULL);

-- 3. Eliminación de Producto/Servicio (id_operation_type = 24)
INSERT IGNORE INTO `Operations_Types` 
(`id_operation_type`, `description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`) 
VALUES 
(24, 'Eliminación de Producto/Servicio', 'Eliminar un producto o servicio del sistema', 1, NULL, 'mdi-package-variant-remove', '/products-services', 0, NULL);

-- 4. Consulta de Productos/Servicios (id_operation_type = 25)
INSERT IGNORE INTO `Operations_Types` 
(`id_operation_type`, `description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`) 
VALUES 
(25, 'Consulta de Productos/Servicios', 'Consultar y listar productos y servicios del sistema', 1, NULL, 'mdi-package-variant-closed', '/products-services', 0, NULL);

-- Verificar que los registros se insertaron correctamente
SELECT * FROM Operations_Types WHERE id_operation_type BETWEEN 22 AND 25;

