-- Script para agregar la entrada en Operations_Types para Histórico de Visitantes por Día
-- Este script crea el registro que aparece en el menú principal (menu_available = 1)
-- IMPORTANTE: Verificar el último id_operation_type antes de ejecutar

-- Verificar el último ID disponible
-- SELECT MAX(id_operation_type) AS ultimo_id FROM Operations_Types;

-- Verificar si ya existe el registro del menú
SELECT 
    id_operation_type,
    description,
    path,
    menu_available,
    `order`
FROM Operations_Types 
WHERE description = 'Histórico de Visitantes por Día'
   OR (path = '/historicalVisits' AND menu_available = 1);

-- Insertar el registro del menú si no existe
INSERT INTO `Operations_Types` 
(`id_operation_type`, `description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`) 
SELECT 
    34,
    'Histórico de Visitantes por Día', 
    'Permite consultar el histórico de visitantes por día, ver quién visitó en una fecha específica y visualizar estadísticas mediante histogramas', 
    1, 
    NULL, 
    'mdi-calendar-clock', 
    '/historicalVisits', 
    1, 
    8
WHERE NOT EXISTS (
    SELECT 1 FROM Operations_Types 
    WHERE id_operation_type = 34
       OR (description = 'Histórico de Visitantes por Día' AND menu_available = 1)
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
WHERE id_operation_type = 34
   OR (path = '/historicalVisits' AND menu_available = 1);

-- Ver todos los ítems del menú (menu_available = 1) ordenados
SELECT 
    id_operation_type,
    description,
    path,
    `order`,
    icon
FROM Operations_Types 
WHERE menu_available = 1
ORDER BY `order`, id_operation_type;


