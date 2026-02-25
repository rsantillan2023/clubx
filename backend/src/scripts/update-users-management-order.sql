-- =====================================================
-- SCRIPT PARA CAMBIAR EL ORDEN - LISTO PARA COPIAR Y PEGAR
-- Ajusta el orden de la pantalla en el menú
-- =====================================================

-- Opción 1: Poner después de "Operaciones" (order = 10)
UPDATE `Operations_Types` 
SET `order` = 11
WHERE `path` = '/users-management';

-- Opción 2: Poner al final (descomenta si prefieres esta opción)
-- SET @max_order = (SELECT MAX(`order`) FROM `Operations_Types` WHERE menu_available = 1);
-- UPDATE `Operations_Types` 
-- SET `order` = @max_order + 1
-- WHERE `path` = '/users-management';

-- Opción 3: Poner en una posición específica (cambia el número según necesites)
-- UPDATE `Operations_Types` 
-- SET `order` = 50
-- WHERE `path` = '/users-management';


