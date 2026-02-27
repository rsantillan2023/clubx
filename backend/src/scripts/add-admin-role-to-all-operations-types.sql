-- =====================================================
-- 1) LISTAR paths que NO tienen ninguna fila con id_role = 3 (ADMIN)
--    (path normalizado sin barra final)
-- =====================================================
SET NAMES utf8mb4;

SELECT DISTINCT TRIM(TRAILING '/' FROM IFNULL(ot.path, '')) AS path_sin_admin
FROM `Operations_Types` ot
WHERE NOT EXISTS (
    SELECT 1 FROM `Operations_Types` ot2
    WHERE ot2.id_role = 3
    AND TRIM(TRAILING '/' FROM IFNULL(ot2.path, '')) = TRIM(TRAILING '/' FROM IFNULL(ot.path, ''))
)
ORDER BY path_sin_admin;

-- =====================================================
-- 2) AGREGAR fila ADMIN (id_role=3) para cada path que aún no la tiene.
--    Comparación normalizada (path sin barra final) para no dejar ninguno fuera.
-- =====================================================

INSERT INTO `Operations_Types` (`description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`)
SELECT
    ot.description,
    ot.action,
    3,
    ot.tag,
    ot.icon,
    ot.path,
    ot.menu_available,
    ot.`order`
FROM `Operations_Types` ot
INNER JOIN (
    SELECT `path`, MIN(id_operation_type) AS first_id
    FROM `Operations_Types`
    GROUP BY `path`
) first_per_path ON first_per_path.path = ot.path AND first_per_path.first_id = ot.id_operation_type
WHERE NOT EXISTS (
    SELECT 1 FROM `Operations_Types` ot2
    WHERE ot2.id_role = 3
    AND TRIM(TRAILING '/' FROM IFNULL(ot2.path, '')) = TRIM(TRAILING '/' FROM IFNULL(ot.path, ''))
);

-- =====================================================
-- 3) VERIFICAR: contar por path si tiene ADMIN
-- =====================================================
-- SELECT
--     TRIM(TRAILING '/' FROM IFNULL(path, '')) AS path_norm,
--     COUNT(*) AS filas,
--     MAX(CASE WHEN id_role = 3 THEN 1 ELSE 0 END) AS tiene_admin
-- FROM `Operations_Types`
-- GROUP BY TRIM(TRAILING '/' FROM IFNULL(path, ''))
-- ORDER BY path_norm;
