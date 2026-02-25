-- =====================================================
-- SCRIPT SIMPLE PARA ELIMINAR DUPLICADO
-- Elimina el registro con ID 38, dejando el 37
-- =====================================================

-- Opción 1: Eliminar por ID específico (más seguro)
DELETE FROM `Operations_Types`
WHERE id_operation_type = 38
AND `path` = '/users-management';

-- Verificar resultado
SELECT 
    id_operation_type,
    description,
    path,
    icon,
    menu_available,
    `order`
FROM `Operations_Types`
WHERE `path` = '/users-management';


