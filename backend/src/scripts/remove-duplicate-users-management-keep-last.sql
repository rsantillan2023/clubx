-- =====================================================
-- SCRIPT PARA ELIMINAR DUPLICADO - MANTIENE EL ÚLTIMO (MAYOR ID)
-- Elimina el registro con menor ID, dejando el de mayor ID
-- =====================================================

-- Eliminar el duplicado (deja el de mayor ID = 38)
DELETE FROM `Operations_Types`
WHERE id_operation_type = 37
AND `path` = '/users-management';

-- Verificar resultado
SELECT 
    ot.id_operation_type,
    ot.description,
    r.description AS role_description,
    ot.path,
    ot.icon,
    ot.menu_available,
    ot.`order`
FROM `Operations_Types` ot
LEFT JOIN `Roles` r ON ot.id_role = r.id_role
WHERE ot.`path` = '/users-management';


