-- =====================================================
-- Agrega la pantalla "Quiénes pagan a la salida" en
-- Operations_Types para rol ADMIN (id_role = 3).
-- Path: /quienes-pagan-a-la-salida
-- =====================================================

SET NAMES utf8mb4;

INSERT INTO `Operations_Types`
(`description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`)
SELECT
    'Quiénes pagan a la salida',
    'Socios que eligieron pagar la entrada a la salida y aún no pagaron',
    3,
    NULL,
    'mdi-cash-clock',
    '/quienes-pagan-a-la-salida',
    1,
    60
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM `Operations_Types`
    WHERE `path` = '/quienes-pagan-a-la-salida'
);
