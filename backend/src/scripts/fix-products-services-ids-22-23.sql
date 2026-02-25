-- Script para verificar y solucionar los IDs 22 y 23 ocupados
-- Ejecutar este script para ver qué registros están ocupando los IDs 22 y 23

-- 1. Ver qué hay en los IDs 22 y 23
SELECT 
    id_operation_type,
    description,
    action,
    path,
    icon,
    menu_available,
    `order`
FROM Operations_Types 
WHERE id_operation_type IN (22, 23);

-- 2. Verificar si ya existen registros de productos/servicios con otros IDs
SELECT 
    id_operation_type,
    description,
    path
FROM Operations_Types 
WHERE path = '/products-services'
   OR description LIKE '%Producto%Servicio%'
ORDER BY id_operation_type;

-- OPCIÓN A: Si los IDs 22 y 23 tienen registros de OTRO módulo y puedes cambiarlos
-- Buscar el próximo ID disponible después del 27
SELECT MAX(id_operation_type) + 1 AS proximo_id_disponible FROM Operations_Types;

-- OPCIÓN B: Si los IDs 22 y 23 tienen registros que NO son importantes, actualizarlos
-- (Solo ejecutar si estás seguro de que puedes reemplazar esos registros)
/*
UPDATE Operations_Types 
SET description = 'Alta de Producto/Servicio',
    action = 'Crear un nuevo producto o servicio en el sistema',
    icon = 'mdi-package-variant-plus',
    path = '/products-services',
    menu_available = 0,
    `order` = NULL
WHERE id_operation_type = 22;

UPDATE Operations_Types 
SET description = 'Modificación de Producto/Servicio',
    action = 'Modificar los datos de un producto o servicio existente',
    icon = 'mdi-package-variant',
    path = '/products-services',
    menu_available = 0,
    `order` = NULL
WHERE id_operation_type = 23;
*/

-- OPCIÓN C: Si los IDs 22 y 23 son importantes, usar otros IDs (ej: 28, 29)
-- Pero esto requerirá actualizar el enum en TypeScript
/*
INSERT INTO `Operations_Types` 
(`id_operation_type`, `description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`) 
VALUES 
(28, 'Alta de Producto/Servicio', 'Crear un nuevo producto o servicio en el sistema', 1, NULL, 'mdi-package-variant-plus', '/products-services', 0, NULL);

INSERT INTO `Operations_Types` 
(`id_operation_type`, `description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`) 
VALUES 
(29, 'Modificación de Producto/Servicio', 'Modificar los datos de un producto o servicio existente', 1, NULL, 'mdi-package-variant', '/products-services', 0, NULL);
*/

-- Verificar resultado final
SELECT 
    id_operation_type,
    description,
    path,
    icon
FROM Operations_Types 
WHERE path = '/products-services'
ORDER BY id_operation_type;

