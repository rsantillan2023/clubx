-- ============================================
-- SOLUCIÓN PARA ERROR: Out of sort memory
-- ============================================
-- Este error ocurre porque MySQL intenta ordenar muchos datos
-- sin tener suficiente memoria o sin un índice adecuado

-- SOLUCIÓN 1: Crear índice en operation_date (RECOMENDADO)
-- Esto optimiza el ORDER BY y evita el error
-- Nota: Si el índice ya existe, dará un error pero puedes ignorarlo
CREATE INDEX idx_operation_date ON Operations(operation_date);

-- SOLUCIÓN 2: Aumentar el sort_buffer_size (si el índice no es suficiente)
-- Para la sesión actual:
SET SESSION sort_buffer_size = 2097152;  -- 2MB

-- Para hacerlo permanente, agrega esto a tu archivo my.cnf o my.ini:
-- sort_buffer_size = 2M

-- Verificar que el índice se creó correctamente
SHOW INDEXES FROM Operations WHERE Column_name = 'operation_date';

