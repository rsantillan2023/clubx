-- Script para encontrar IDs disponibles para los registros faltantes
-- Ejecutar este script para ver qué IDs están disponibles

-- Ver todos los IDs entre 20 y 30
SELECT 
    id_operation_type,
    description,
    path,
    CASE 
        WHEN id_operation_type IN (22, 23) THEN 'OCUPADO - Necesario para Productos/Servicios'
        WHEN id_operation_type IN (24, 25) THEN 'OK - Ya creado'
        ELSE 'Disponible'
    END AS estado
FROM Operations_Types 
WHERE id_operation_type BETWEEN 20 AND 30
ORDER BY id_operation_type;

-- Encontrar el próximo ID disponible después del 27
SELECT 
    COALESCE(MAX(id_operation_type), 0) + 1 AS proximo_id_disponible
FROM Operations_Types;

-- Ver qué registros de productos/servicios ya existen
SELECT 
    id_operation_type,
    description,
    path,
    menu_available
FROM Operations_Types 
WHERE path = '/products-services'
   OR description LIKE '%Producto%Servicio%'
ORDER BY id_operation_type;

