-- =====================================================
-- SCRIPT DE VERIFICACIÓN - LISTO PARA COPIAR Y PEGAR
-- Verifica si la pantalla existe y muestra su información
-- =====================================================

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


