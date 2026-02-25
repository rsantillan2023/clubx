-- Script para agregar la nueva operación de Validación de Membresia
-- Este script actualiza el operation type 1 para "Validacion de DNI" y crea uno nuevo para "Validacion de Membresia"
-- IMPORTANTE: Ejecutar este script después de verificar que el ID 36 está disponible

-- Verificar el último ID antes de insertar
-- SELECT MAX(id_operation_type) FROM Operations_Types;

-- 1. Actualizar el operation type 1 para que se llame "Validacion de DNI"
UPDATE `Operations_Types` 
SET `description` = 'Validacion de DNI',
    `action` = 'Valida DNI para saber si es socio. Muestra estado si puede entrar'
WHERE `id_operation_type` = 1;

-- 2. Crear nuevo operation type para "Validacion de Membresia" (id_operation_type = 36)
INSERT INTO `Operations_Types` 
(`id_operation_type`, `description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`) 
VALUES 
(36, 'Validacion de Membresia', 'Valida DNI para saber si es socio. Muestra estado si puede entrar', 1, NULL, 'mdi-card-account-details', '/accessMembership', 1, 1);

-- Verificar que los registros se actualizaron/insertaron correctamente
SELECT 
    id_operation_type,
    description,
    action,
    icon,
    path,
    menu_available,
    `order`
FROM `Operations_Types`
WHERE id_operation_type IN (1, 36)
ORDER BY id_operation_type;

