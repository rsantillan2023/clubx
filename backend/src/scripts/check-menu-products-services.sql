-- Script para verificar si el menú de Productos y Servicios está configurado correctamente
-- Ejecutar este script para verificar qué registros tienen menu_available = 1

-- Ver todos los registros relacionados con productos/servicios
SELECT 
    id_operation_type,
    description,
    path,
    menu_available,
    `order`,
    icon
FROM Operations_Types 
WHERE path = '/products-services'
   OR description LIKE '%Producto%Servicio%'
ORDER BY id_operation_type;

-- Verificar específicamente el registro del menú (debe tener menu_available = 1)
SELECT 
    id_operation_type,
    description,
    path,
    menu_available,
    `order`,
    icon
FROM Operations_Types 
WHERE description = 'Gestión de Productos y Servicios'
   AND menu_available = 1;

-- Si no existe el registro del menú, ejecutar este INSERT:
/*
INSERT INTO `Operations_Types` 
(`description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`) 
VALUES 
('Gestión de Productos y Servicios', 'Gestionar productos y servicios: alta, modificación, baja, consulta, cambios masivos de precios', 1, NULL, 'mdi-store', '/products-services', 1, 14);
*/

-- Verificar todos los menús disponibles (menu_available = 1)
SELECT 
    id_operation_type,
    description,
    path,
    `order`,
    icon
FROM Operations_Types 
WHERE menu_available = 1
ORDER BY `order`, id_operation_type;

