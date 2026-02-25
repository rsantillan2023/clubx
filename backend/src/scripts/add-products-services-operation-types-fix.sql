-- Script para agregar/actualizar las entradas faltantes en Operations_Types
-- Este script verifica qué IDs están disponibles y crea los registros faltantes

-- Primero, verificar qué IDs están ocupados
SELECT id_operation_type, description, path 
FROM Operations_Types 
WHERE id_operation_type IN (22, 23, 24, 25, 26, 27)
ORDER BY id_operation_type;

-- Verificar el último ID disponible
SELECT MAX(id_operation_type) AS ultimo_id_disponible FROM Operations_Types;

-- Si los IDs 22 y 23 están ocupados por otros registros, usar IDs automáticos
-- O actualizar los existentes si son del mismo módulo

-- OPCIÓN 1: Si los IDs 22 y 23 están ocupados por OTROS registros (no de productos/servicios)
-- Buscar los próximos IDs disponibles después del 27
-- INSERT IGNORE creará con IDs automáticos si los especificados están ocupados

-- Intentar insertar con IDs específicos (fallará si están ocupados, pero INSERT IGNORE lo maneja)
INSERT IGNORE INTO `Operations_Types` 
(`id_operation_type`, `description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`) 
VALUES 
(22, 'Alta de Producto/Servicio', 'Crear un nuevo producto o servicio en el sistema', 1, NULL, 'mdi-package-variant-plus', '/products-services', 0, NULL);

INSERT IGNORE INTO `Operations_Types` 
(`id_operation_type`, `description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`) 
VALUES 
(23, 'Modificación de Producto/Servicio', 'Modificar los datos de un producto o servicio existente', 1, NULL, 'mdi-package-variant', '/products-services', 0, NULL);

-- OPCIÓN 2: Si los IDs 22 y 23 están ocupados, insertar sin especificar ID (auto-increment)
-- Pero esto no funcionará bien con el enum de TypeScript que espera IDs fijos

-- OPCIÓN 3: Actualizar los registros existentes en 22 y 23 si son de otro módulo
-- (Solo ejecutar si los registros en 22 y 23 NO son importantes o son de otro módulo)
-- UPDATE Operations_Types 
-- SET description = 'Alta de Producto/Servicio',
--     action = 'Crear un nuevo producto o servicio en el sistema',
--     icon = 'mdi-package-variant-plus',
--     path = '/products-services'
-- WHERE id_operation_type = 22;

-- UPDATE Operations_Types 
-- SET description = 'Modificación de Producto/Servicio',
--     action = 'Modificar los datos de un producto o servicio existente',
--     icon = 'mdi-package-variant',
--     path = '/products-services'
-- WHERE id_operation_type = 23;

-- Verificar el resultado final
SELECT id_operation_type, description, path, icon
FROM Operations_Types 
WHERE path = '/products-services'
ORDER BY id_operation_type;

