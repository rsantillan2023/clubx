-- =====================================================
-- Workaround: Tipo de visitante MENSUAL (sin tocar modelo).
-- 1) Inserta tipo MENSUAL en Visits_Types.
-- 2) Inserta precios para id_day = 8 (Cualquier día): entrada 0, estacionamiento un valor.
-- 3) Agrega la pantalla "Esquema de pago mensual" en Operations_Types para rol ADMIN.
-- Ejecutar en la base del proyecto (ej. degira_develop).
-- =====================================================

SET NAMES utf8mb4;

-- -------------------------------------------------------
-- 1. Insertar tipo MENSUAL en Visits_Types (si no existe)
-- -------------------------------------------------------
INSERT INTO `Visits_Types` (`description`, `suggest_entry_amount`, `suggest_membership_amount`)
SELECT 'MENSUAL', 0, 0
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `Visits_Types` WHERE `description` = 'MENSUAL');

-- Obtener id del tipo MENSUAL (para uso en Prices)
SET @id_visit_type_mensual = (SELECT `id_visit_type` FROM `Visits_Types` WHERE `description` = 'MENSUAL' LIMIT 1);

-- -------------------------------------------------------
-- 2. Precios para MENSUAL: solo id_day = 8 (Cualquier día)
-- id_receivable_concept: 2 = entrada, 3 = estacionamiento
-- -------------------------------------------------------
-- Entrada (concepto 2): 0
INSERT INTO `Prices` (`id_day`, `id_receivable_concept`, `id_visit_type`, `total_amount`)
SELECT 8, 2, @id_visit_type_mensual, 0
FROM DUAL
WHERE @id_visit_type_mensual IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM `Prices` p
    WHERE p.`id_day` = 8 AND p.`id_receivable_concept` = 2 AND p.`id_visit_type` = @id_visit_type_mensual
  );

-- Estacionamiento (concepto 3): copiar monto de otro tipo para id_day=8, o 0
INSERT INTO `Prices` (`id_day`, `id_receivable_concept`, `id_visit_type`, `total_amount`)
SELECT 8, 3, @id_visit_type_mensual, IFNULL(
  (SELECT p2.`total_amount` FROM `Prices` p2 WHERE p2.`id_receivable_concept` = 3 AND p2.`id_day` = 8 LIMIT 1),
  0
)
FROM DUAL
WHERE @id_visit_type_mensual IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM `Prices` p
    WHERE p.`id_day` = 8 AND p.`id_receivable_concept` = 3 AND p.`id_visit_type` = @id_visit_type_mensual
  );

-- -------------------------------------------------------
-- 3. Pantalla "Esquema de pago mensual" en menú (Operations_Types)
-- Rol ADMIN = 3
-- -------------------------------------------------------
INSERT INTO `Operations_Types`
(`description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`)
SELECT
    'Esquema de pago mensual',
    'Alta y renovación del plan mensual; ver vencidos y próximos a vencer; anotar si paga o no',
    3,
    NULL,
    'mdi-calendar-check',
    '/esquema-pago-mensual',
    1,
    61
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM `Operations_Types`
    WHERE `path` = '/esquema-pago-mensual'
);

-- Verificación (opcional): mostrar id del tipo MENSUAL creado/usado
-- SELECT @id_visit_type_mensual AS id_visit_type_MENSUAL;
