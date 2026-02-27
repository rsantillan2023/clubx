-- Corrige path y texto de la pantalla "Pagos Mensuales" (id 63)
-- path: /esquema-pago-ensual -> /esquema-pago-mensual
-- action: "reovación" -> "renovación"
SET NAMES utf8mb4;

UPDATE `Operations_Types`
SET 
  `path` = '/esquema-pago-mensual',
  `action` = 'Alta y renovación del plan mensual'
WHERE `id_operation_type` = 63;

-- O por path por si el id cambió:
-- UPDATE `Operations_Types`
-- SET `path` = '/esquema-pago-mensual', `action` = 'Alta y renovación del plan mensual'
-- WHERE `path` = '/esquema-pago-ensual';
