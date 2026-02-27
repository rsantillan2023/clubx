-- =============================================================================
-- Copiar precios de Receivable_Concept 2 a Receivable_Concept 3
-- Inserta en Prices un registro por cada combinación (id_day, id_visit_type)
-- que existe para concepto 2, con el mismo total_amount pero id_receivable_concept = 3.
-- No inserta si ya existe la misma combinación para concepto 3.
-- =============================================================================

-- Verificar que exista el concepto 3
SELECT id_receivable_concept, description FROM Receivable_Concepts WHERE id_receivable_concept IN (2, 3);

-- Registros actuales de concepto 2 (referencia)
-- SELECT id_day, id_visit_type, total_amount FROM Prices WHERE id_receivable_concept = 2 ORDER BY id_day, id_visit_type;

-- Insertar para concepto 3 los mismos precios que concepto 2 (sin duplicar si ya existe)
INSERT INTO `Prices` (`id_day`, `id_receivable_concept`, `id_visit_type`, `total_amount`)
SELECT
    p.id_day,
    3 AS id_receivable_concept,
    p.id_visit_type,
    p.total_amount
FROM `Prices` p
WHERE p.id_receivable_concept = 2
  AND NOT EXISTS (
    SELECT 1 FROM `Prices` p2
    WHERE p2.id_day = p.id_day
      AND p2.id_receivable_concept = 3
      AND p2.id_visit_type = p.id_visit_type
  );

-- Ver cuántos se insertaron
SELECT ROW_COUNT() AS filas_insertadas;

-- Ver los nuevos precios para concepto 3
SELECT id_price, id_day, id_receivable_concept, id_visit_type, total_amount
FROM `Prices`
WHERE id_receivable_concept = 3
ORDER BY id_day, id_visit_type;
