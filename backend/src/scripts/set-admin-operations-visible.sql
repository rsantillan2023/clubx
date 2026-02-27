-- =====================================================
-- Asegura que todos los ítems con rol ADMIN (id_role = 3)
-- tengan menu_available = 1 (visible en el menú).
-- =====================================================

SET NAMES utf8mb4;

-- Ver cuántos tenían 0 antes (opcional)
-- SELECT id_operation_type, path, description, menu_available FROM Operations_Types WHERE id_role = 3 AND menu_available != 1;

UPDATE `Operations_Types`
SET `menu_available` = 1
WHERE `id_role` = 3
  AND (IFNULL(`menu_available`, 0) = 0 OR `menu_available` IS NULL);

-- Verificar: todos los ADMIN deben tener menu_available = 1
-- SELECT id_operation_type, path, id_role, menu_available, description FROM Operations_Types WHERE id_role = 3 ORDER BY path;
