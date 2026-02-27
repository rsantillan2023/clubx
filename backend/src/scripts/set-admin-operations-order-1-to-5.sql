-- =====================================================
-- Orden por afinidad funcional para ítems con rol ADMIN (id_role = 3).
-- Agrupa de 4 en 4 por fila (order 1 = fila 1, ..., order 5 = fila 5).
-- Solo aplica a filas que coincidan por description.
-- =====================================================

SET NAMES utf8mb4;

-- Fila 1 (order 1)
UPDATE `Operations_Types` SET `order` = 1 WHERE id_role = 3 AND (description = 'Validación de Membresia de Socio' OR description LIKE 'Validación de Membresia de Socio%');
UPDATE `Operations_Types` SET `order` = 1 WHERE id_role = 3 AND (description = 'Consulta de Datos de Socio' OR description LIKE 'Consulta de Datos de Socio%');
UPDATE `Operations_Types` SET `order` = 1 WHERE id_role = 3 AND (description = 'Alta de Socio' OR description LIKE 'Alta de Socio%');
UPDATE `Operations_Types` SET `order` = 1 WHERE id_role = 3 AND (description LIKE 'Venta de Bebidas%' OR description = 'Venta de Bebidas y otros servicios');

-- Fila 2 (order 2)
UPDATE `Operations_Types` SET `order` = 2 WHERE id_role = 3 AND (description LIKE 'Consumo%' OR description LIKE 'Anulación de consumos%');
UPDATE `Operations_Types` SET `order` = 2 WHERE id_role = 3 AND (description LIKE 'Salida%Pago%Egreso%' OR description LIKE 'Salida - Pago%');
UPDATE `Operations_Types` SET `order` = 2 WHERE id_role = 3 AND (description LIKE 'Socios en el club%');
UPDATE `Operations_Types` SET `order` = 2 WHERE id_role = 3 AND description = 'Operaciones';

-- Fila 3 (order 3)
UPDATE `Operations_Types` SET `order` = 3 WHERE id_role = 3 AND (description = 'Alta Rapida' OR description LIKE 'Alta Rápida%');
UPDATE `Operations_Types` SET `order` = 3 WHERE id_role = 3 AND (description = 'Entrada Rapida' OR description LIKE 'Entrada Rápida%');
UPDATE `Operations_Types` SET `order` = 3 WHERE id_role = 3 AND (description = 'Validación de Membresia' OR description LIKE 'Validación de Membresia%');
UPDATE `Operations_Types` SET `order` = 3 WHERE id_role = 3 AND description = 'Usuario';

-- Fila 4 (order 4)
UPDATE `Operations_Types` SET `order` = 4 WHERE id_role = 3 AND (description LIKE 'Histórico de Visitantes%');
UPDATE `Operations_Types` SET `order` = 4 WHERE id_role = 3 AND (description = 'Consumos por Visita' OR description LIKE 'Consumos por Visita%');
UPDATE `Operations_Types` SET `order` = 4 WHERE id_role = 3 AND (description LIKE 'CRUD de Tablas%');
UPDATE `Operations_Types` SET `order` = 4 WHERE id_role = 3 AND (description LIKE 'Base de datos de socios%');

-- Fila 5 (order 5)
UPDATE `Operations_Types` SET `order` = 5 WHERE id_role = 3 AND (description LIKE 'Gestión de Productos%');
UPDATE `Operations_Types` SET `order` = 5 WHERE id_role = 3 AND (description LIKE 'Gestión de Precios%');
UPDATE `Operations_Types` SET `order` = 5 WHERE id_role = 3 AND (description LIKE 'Gestión de Usuarios%');
UPDATE `Operations_Types` SET `order` = 5 WHERE id_role = 3 AND (description LIKE 'Reactivación de Membresia%');
UPDATE `Operations_Types` SET `order` = 5 WHERE id_role = 3 AND (description LIKE 'Operacion de Guardarropa%' OR description LIKE 'Operación de Guardarropa%');
UPDATE `Operations_Types` SET `order` = 5 WHERE id_role = 3 AND (description LIKE 'Registracion de Nueva Visita%' OR description LIKE 'Registración%');
UPDATE `Operations_Types` SET `order` = 5 WHERE id_role = 3 AND (description LIKE 'Devolucion de llave%' OR description LIKE 'Devolución%');
UPDATE `Operations_Types` SET `order` = 5 WHERE id_role = 3 AND (description LIKE 'Modificacion de datos de socio%' OR description LIKE 'Modificación de datos%');
