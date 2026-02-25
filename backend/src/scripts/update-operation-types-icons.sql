-- Script para actualizar los iconos de Operations_Types
-- Este script actualiza los iconos para que sean únicos y representativos de cada operación
-- IMPORTANTE: Ejecutar este script para eliminar iconos duplicados y mejorar la representatividad

-- 1. Validación de Membresia de Socio - Ya tiene icono representativo 'mdi-card-account-details'
-- UPDATE no necesario

-- 2. Alta de Socio - Ya tiene icono representativo 'mdi-account-plus'
-- UPDATE no necesario

-- 3. Reactivación de Membresia - Icono más específico para reactivación/renovación
UPDATE `Operations_Types` 
SET `icon` = 'mdi-account-check'
WHERE `id_operation_type` = 3 AND `description` = 'Reactivación de Membresia';

-- 4. Registracion de Nueva Visita - Cambiar de 'mdi-account' a icono más específico de entrada
UPDATE `Operations_Types` 
SET `icon` = 'mdi-login'
WHERE `id_operation_type` = 4 AND `description` = 'Registracion de Nueva Visita';

-- 5. Consumo hasta ahora - Mantener (ya es representativo)
-- UPDATE no necesario, ya tiene 'mdi-account-cash'

-- 6. Salida - Pago - Egreso - Mantener (ya es representativo)
-- UPDATE no necesario, ya tiene 'mdi-exit-run'

-- 7. Venta de Bebidas y otros servicios - Mantener (ya es representativo)
-- UPDATE no necesario, ya tiene 'mdi-currency-usd'

-- 8. Modificacion de datos de socio - Mantener (ya es representativo)
-- UPDATE no necesario, ya tiene 'mdi-account-edit'

-- 9. Consulta de Datos de Socio - Mantener (ya es representativo)
-- UPDATE no necesario, ya tiene 'mdi-account-search-outline'

-- 10. Operacion de Guardarropa - Mantener 'mdi-hanger' (específico para guardarropa)
-- UPDATE no necesario

-- 11. Anulación de consumos - Cambiar de 'mdi-marker-cancel' a icono más específico
UPDATE `Operations_Types` 
SET `icon` = 'mdi-cancel-circle'
WHERE `id_operation_type` = 12 AND `description` = 'Anulación de consumos';

-- 12. Anular un consumo por error - Cambiar de 'mdi-marker-cancel' a icono de deshacer/retroceder
UPDATE `Operations_Types` 
SET `icon` = 'mdi-undo'
WHERE `id_operation_type` = 13 AND `description` = 'Anular un consumo por error';

-- 13. Devolucion de llave o ropa - Cambiar de 'mdi-hanger' a icono de devolución/retorno
UPDATE `Operations_Types` 
SET `icon` = 'mdi-arrow-left-circle'
WHERE `id_operation_type` = 17 AND `description` = 'Devolucion de llave o ropa';

-- 14. Socios en el club ahora - Mantener (ya es representativo)
-- UPDATE no necesario, ya tiene 'mdi-clipboard-text-clock'

-- 15. Operaciones - Cambiar de 'mdi-account-details' a icono más representativo de historial
UPDATE `Operations_Types` 
SET `icon` = 'mdi-history'
WHERE `id_operation_type` = 19 AND `description` = 'Operaciones';

-- 16. Alta Rapida - Mantener (ya es representativo)
-- UPDATE no necesario, ya tiene 'mdi-account-settings'

-- 17. Entrada Rapida - Mantener (ya es representativo)
-- UPDATE no necesario, ya tiene 'mdi-cash-fast'

-- Verificar iconos duplicados después de la actualización
SELECT 
    icon,
    COUNT(*) as cantidad,
    GROUP_CONCAT(CONCAT(id_operation_type, ':', description) SEPARATOR ' | ') as operaciones
FROM `Operations_Types`
WHERE icon IS NOT NULL
GROUP BY icon
HAVING COUNT(*) > 1
ORDER BY cantidad DESC;

-- Mostrar todos los iconos actualizados
SELECT 
    id_operation_type,
    description,
    icon,
    path
FROM `Operations_Types`
WHERE menu_available = 1
ORDER BY `order`, id_operation_type;

