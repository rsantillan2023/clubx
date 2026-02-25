-- Script para agregar el ítem del menú de Productos y Servicios
-- Este script crea el registro que aparece en el menú principal (menu_available = 1)
-- IMPORTANTE: Este es el único registro que debe tener menu_available = 1

-- Verificar si ya existe el registro del menú
SELECT 
    id_operation_type,
    description,
    path,
    menu_available,
    `order`
FROM Operations_Types 
WHERE description = 'Gestión de Productos y Servicios'
   OR (path = '/products-services' AND menu_available = 1);

-- Si no existe, ejecutar este INSERT:
INSERT INTO `Operations_Types` 
(`description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`) 
SELECT 
    'Gestión de Productos y Servicios', 
    'Gestionar productos y servicios: alta, modificación, baja, consulta, cambios masivos de precios', 
    1, 
    NULL, 
    'mdi-store', 
    '/products-services', 
    1, 
    14
WHERE NOT EXISTS (
    SELECT 1 FROM Operations_Types 
    WHERE description = 'Gestión de Productos y Servicios' 
    AND path = '/products-services'
    AND menu_available = 1
);

-- Verificar que se creó correctamente
SELECT 
    id_operation_type,
    description,
    path,
    menu_available,
    `order`,
    icon
FROM Operations_Types 
WHERE path = '/products-services'
ORDER BY menu_available DESC, id_operation_type;

-- Ver todos los ítems del menú (menu_available = 1)
SELECT 
    id_operation_type,
    description,
    path,
    `order`,
    icon
FROM Operations_Types 
WHERE menu_available = 1
ORDER BY `order`, id_operation_type;

