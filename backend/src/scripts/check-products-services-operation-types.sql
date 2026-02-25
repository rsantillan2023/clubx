-- Script para verificar qué registros de Operations_Types ya existen
-- Ejecutar este script antes de ejecutar los scripts de inserción

-- Verificar todos los IDs relacionados con productos y servicios
SELECT 
    id_operation_type,
    description,
    action,
    path,
    menu_available,
    `order`
FROM Operations_Types 
WHERE id_operation_type BETWEEN 22 AND 27
   OR path = '/products-services'
   OR description LIKE '%Producto%Servicio%'
ORDER BY id_operation_type;

-- Verificar el último ID disponible
SELECT MAX(id_operation_type) AS ultimo_id FROM Operations_Types;

