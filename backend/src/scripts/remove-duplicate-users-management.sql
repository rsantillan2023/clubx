-- =====================================================
-- SCRIPT PARA ELIMINAR DUPLICADO - LISTO PARA COPIAR Y PEGAR
-- Elimina el registro duplicado, dejando solo el de menor ID
-- =====================================================

-- Ver duplicados antes de eliminar
SELECT 
    id_operation_type,
    description,
    path,
    id_role
FROM `Operations_Types`
WHERE `path` = '/users-management'
ORDER BY id_operation_type;

-- Eliminar el duplicado (deja el de menor ID)
DELETE FROM `Operations_Types`
WHERE `path` = '/users-management'
AND id_operation_type NOT IN (
    SELECT MIN(id_operation_type) 
    FROM (SELECT * FROM `Operations_Types`) AS temp
    WHERE `path` = '/users-management'
);

-- Verificar que quedó solo uno
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


