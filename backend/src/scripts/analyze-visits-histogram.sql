-- Script para analizar los datos reales de visitas y verificar la lógica del histograma
-- Este script muestra información sobre las visitas para entender cómo se están agrupando
-- 
-- IMPORTANTE: Descomenta la línea USE correspondiente a tu base de datos:
-- USE miclub_db_dev;        -- Para desarrollo
-- USE miclub_db;            -- Para producción

-- Seleccionar base de datos (descomenta la que uses):
-- USE miclub_db_dev;
-- USE miclub_db;

-- 0. Mostrar la base de datos en uso
SELECT DATABASE() as base_datos_actual;

-- 1. Visitas agrupadas por día de la semana - Septiembre 2025
SELECT 
    DAYOFWEEK(visit_date) as dia_semana,
    MAX(CASE DAYOFWEEK(visit_date)
        WHEN 1 THEN 'Domingo'
        WHEN 2 THEN 'Lunes'
        WHEN 3 THEN 'Martes'
        WHEN 4 THEN 'Miércoles'
        WHEN 5 THEN 'Jueves'
        WHEN 6 THEN 'Viernes'
        WHEN 7 THEN 'Sábado'
    END) as nombre_dia,
    COUNT(*) as cantidad_visitas
FROM `Visits`
WHERE visit_date IS NOT NULL
    AND YEAR(visit_date) = 2025
    AND MONTH(visit_date) = 9
GROUP BY DAYOFWEEK(visit_date)
ORDER BY dia_semana;

-- 2. Visitas agrupadas por fecha y hora - Septiembre 2025
SELECT 
    DATE(visit_date) as fecha,
    DAYOFWEEK(visit_date) as dia_semana,
    MAX(CASE DAYOFWEEK(visit_date)
        WHEN 1 THEN 'Dom'
        WHEN 2 THEN 'Lun'
        WHEN 3 THEN 'Mar'
        WHEN 4 THEN 'Mié'
        WHEN 5 THEN 'Jue'
        WHEN 6 THEN 'Vie'
        WHEN 7 THEN 'Sáb'
    END) as dia,
    HOUR(visit_date) as hora,
    COUNT(*) as cantidad
FROM `Visits`
WHERE visit_date IS NOT NULL
    AND YEAR(visit_date) = 2025
    AND MONTH(visit_date) = 9
GROUP BY DATE(visit_date), HOUR(visit_date), DAYOFWEEK(visit_date)
ORDER BY fecha DESC, hora ASC;

-- 3. Verificar visitas fuera de Miércoles, Viernes y Sábado - Septiembre 2025
SELECT 
    DATE(visit_date) as fecha,
    DAYOFWEEK(visit_date) as dia_semana,
    MAX(CASE DAYOFWEEK(visit_date)
        WHEN 1 THEN 'Domingo'
        WHEN 2 THEN 'Lunes'
        WHEN 3 THEN 'Martes'
        WHEN 4 THEN 'Miércoles'
        WHEN 5 THEN 'Jueves'
        WHEN 6 THEN 'Viernes'
        WHEN 7 THEN 'Sábado'
    END) as nombre_dia,
    HOUR(visit_date) as hora,
    COUNT(*) as cantidad
FROM `Visits`
WHERE visit_date IS NOT NULL
    AND YEAR(visit_date) = 2025
    AND MONTH(visit_date) = 9
    AND DAYOFWEEK(visit_date) NOT IN (4, 6, 7) -- No Miércoles, Viernes, Sábado
GROUP BY DATE(visit_date), DAYOFWEEK(visit_date), HOUR(visit_date)
ORDER BY fecha DESC, hora ASC;

-- 4. Aplicar la lógica del histograma (20:00-8:00) - Septiembre 2025
-- CORRECCIÓN: Las visitas después de las 20:00 se agrupan al DÍA SIGUIENTE
-- Las visitas antes de las 8:00 se agrupan al DÍA ANTERIOR
SELECT 
    CASE 
        WHEN HOUR(visit_date) >= 20 THEN DATE_ADD(DATE(visit_date), INTERVAL 1 DAY)
        WHEN HOUR(visit_date) < 8 THEN DATE_SUB(DATE(visit_date), INTERVAL 1 DAY)
        ELSE DATE(visit_date)
    END as fecha_agrupada,
    MAX(DATE(visit_date)) as fecha_real,
    MAX(HOUR(visit_date)) as hora_real,
    MAX(DAYOFWEEK(visit_date)) as dia_semana_real,
    MAX(CASE DAYOFWEEK(visit_date)
        WHEN 1 THEN 'Dom'
        WHEN 2 THEN 'Lun'
        WHEN 3 THEN 'Mar'
        WHEN 4 THEN 'Mié'
        WHEN 5 THEN 'Jue'
        WHEN 6 THEN 'Vie'
        WHEN 7 THEN 'Sáb'
    END) as dia_real,
    COUNT(*) as cantidad
FROM `Visits`
WHERE visit_date IS NOT NULL
    AND YEAR(visit_date) = 2025
    AND MONTH(visit_date) = 9
GROUP BY 
    CASE 
        WHEN HOUR(visit_date) >= 20 THEN DATE_ADD(DATE(visit_date), INTERVAL 1 DAY)
        WHEN HOUR(visit_date) < 8 THEN DATE_SUB(DATE(visit_date), INTERVAL 1 DAY)
        ELSE DATE(visit_date)
    END,
    DATE(visit_date),
    HOUR(visit_date),
    DAYOFWEEK(visit_date)
ORDER BY fecha_agrupada DESC, hora_real ASC;

-- 4b. Aplicar la lógica del histograma para un sábado específico de septiembre 2025
-- (Cambia la fecha si quieres otro sábado: 2025-09-06, 2025-09-13, 2025-09-20, 2025-09-27)
-- CORRECCIÓN: Las visitas después de las 20:00 se agrupan al DÍA SIGUIENTE
SELECT 
    CASE 
        WHEN HOUR(visit_date) >= 20 THEN DATE_ADD(DATE(visit_date), INTERVAL 1 DAY)
        WHEN HOUR(visit_date) < 8 THEN DATE_SUB(DATE(visit_date), INTERVAL 1 DAY)
        ELSE DATE(visit_date)
    END as fecha_agrupada,
    MAX(DATE(visit_date)) as fecha_real,
    MAX(HOUR(visit_date)) as hora_real,
    MAX(DAYOFWEEK(visit_date)) as dia_semana_real,
    MAX(CASE DAYOFWEEK(visit_date)
        WHEN 1 THEN 'Dom'
        WHEN 2 THEN 'Lun'
        WHEN 3 THEN 'Mar'
        WHEN 4 THEN 'Mié'
        WHEN 5 THEN 'Jue'
        WHEN 6 THEN 'Vie'
        WHEN 7 THEN 'Sáb'
    END) as dia_real,
    COUNT(*) as cantidad
FROM `Visits`
WHERE visit_date IS NOT NULL
    AND (
        -- Visitas del sábado 6 de septiembre de 2025 (00:00 a 23:59)
        (DATE(visit_date) = '2025-09-06' AND DAYOFWEEK(visit_date) = 7)
        OR
        -- Visitas del viernes 5 de septiembre después de las 20:00 (se agrupan al sábado 6)
        (DATE(visit_date) = '2025-09-05' AND HOUR(visit_date) >= 20)
        OR
        -- Visitas del sábado 6 de septiembre entre las 8:00 y 19:59 (se agrupan al sábado 6)
        (DATE(visit_date) = '2025-09-06' AND HOUR(visit_date) >= 8 AND HOUR(visit_date) < 20)
        OR
        -- Visitas del domingo 7 de septiembre antes de las 8:00 (se agrupan al sábado)
        (DATE(visit_date) = '2025-09-07' AND HOUR(visit_date) < 8)
    )
GROUP BY 
    CASE 
        WHEN HOUR(visit_date) >= 20 THEN DATE_ADD(DATE(visit_date), INTERVAL 1 DAY)
        WHEN HOUR(visit_date) < 8 THEN DATE_SUB(DATE(visit_date), INTERVAL 1 DAY)
        ELSE DATE(visit_date)
    END,
    DATE(visit_date),
    HOUR(visit_date),
    DAYOFWEEK(visit_date)
ORDER BY fecha_real ASC, hora_real ASC;

-- 5. Comparar id_day guardado vs fecha calculada - Septiembre 2025
-- Muestra fecha real y fecha agrupada con la lógica corregida
SELECT 
    v.id_day,
    MAX(d.name) as nombre_dia_guardado,
    DATE(v.visit_date) as fecha_visit_date,
    DAYOFWEEK(v.visit_date) as dia_semana_visit_date,
    MAX(CASE DAYOFWEEK(v.visit_date)
        WHEN 1 THEN 'Domingo'
        WHEN 2 THEN 'Lunes'
        WHEN 3 THEN 'Martes'
        WHEN 4 THEN 'Miércoles'
        WHEN 5 THEN 'Jueves'
        WHEN 6 THEN 'Viernes'
        WHEN 7 THEN 'Sábado'
    END) as nombre_dia_visit_date,
    HOUR(v.visit_date) as hora,
    -- Fecha agrupada con la lógica corregida
    CASE 
        WHEN HOUR(v.visit_date) >= 20 THEN DATE_ADD(DATE(v.visit_date), INTERVAL 1 DAY)
        WHEN HOUR(v.visit_date) < 8 THEN DATE_SUB(DATE(v.visit_date), INTERVAL 1 DAY)
        ELSE DATE(v.visit_date)
    END as fecha_agrupada,
    DAYOFWEEK(
        CASE 
            WHEN HOUR(v.visit_date) >= 20 THEN DATE_ADD(DATE(v.visit_date), INTERVAL 1 DAY)
            WHEN HOUR(v.visit_date) < 8 THEN DATE_SUB(DATE(v.visit_date), INTERVAL 1 DAY)
            ELSE DATE(v.visit_date)
        END
    ) as dia_semana_agrupado,
    MAX(CASE DAYOFWEEK(
        CASE 
            WHEN HOUR(v.visit_date) >= 20 THEN DATE_ADD(DATE(v.visit_date), INTERVAL 1 DAY)
            WHEN HOUR(v.visit_date) < 8 THEN DATE_SUB(DATE(v.visit_date), INTERVAL 1 DAY)
            ELSE DATE(v.visit_date)
        END
    )
        WHEN 1 THEN 'Dom'
        WHEN 2 THEN 'Lun'
        WHEN 3 THEN 'Mar'
        WHEN 4 THEN 'Mié'
        WHEN 5 THEN 'Jue'
        WHEN 6 THEN 'Vie'
        WHEN 7 THEN 'Sáb'
    END) as nombre_dia_agrupado,
    COUNT(*) as cantidad
FROM `Visits` v
LEFT JOIN `Days` d ON v.id_day = d.id_day
WHERE v.visit_date IS NOT NULL
    AND YEAR(v.visit_date) = 2025
    AND MONTH(v.visit_date) = 9
GROUP BY v.id_day, DATE(v.visit_date), DAYOFWEEK(v.visit_date), HOUR(v.visit_date)
ORDER BY fecha_agrupada DESC, hora ASC
LIMIT 50;

-- 6. Resumen final: Visitas agrupadas por fecha (solo deberían aparecer Miércoles, Viernes y Sábado)
SELECT 
    CASE 
        WHEN HOUR(v.visit_date) >= 20 THEN DATE_ADD(DATE(v.visit_date), INTERVAL 1 DAY)
        WHEN HOUR(v.visit_date) < 8 THEN DATE_SUB(DATE(v.visit_date), INTERVAL 1 DAY)
        ELSE DATE(v.visit_date)
    END as fecha_agrupada,
    MAX(DAYOFWEEK(
        CASE 
            WHEN HOUR(v.visit_date) >= 20 THEN DATE_ADD(DATE(v.visit_date), INTERVAL 1 DAY)
            WHEN HOUR(v.visit_date) < 8 THEN DATE_SUB(DATE(v.visit_date), INTERVAL 1 DAY)
            ELSE DATE(v.visit_date)
        END
    )) as dia_semana_agrupado,
    MAX(CASE DAYOFWEEK(
        CASE 
            WHEN HOUR(v.visit_date) >= 20 THEN DATE_ADD(DATE(v.visit_date), INTERVAL 1 DAY)
            WHEN HOUR(v.visit_date) < 8 THEN DATE_SUB(DATE(v.visit_date), INTERVAL 1 DAY)
            ELSE DATE(v.visit_date)
        END
    )
        WHEN 1 THEN 'Domingo'
        WHEN 2 THEN 'Lunes'
        WHEN 3 THEN 'Martes'
        WHEN 4 THEN 'Miércoles'
        WHEN 5 THEN 'Jueves'
        WHEN 6 THEN 'Viernes'
        WHEN 7 THEN 'Sábado'
    END) as nombre_dia_agrupado,
    COUNT(*) as total_visitas
FROM `Visits` v
WHERE v.visit_date IS NOT NULL
    AND YEAR(v.visit_date) = 2025
    AND MONTH(v.visit_date) = 9
GROUP BY 
    CASE 
        WHEN HOUR(v.visit_date) >= 20 THEN DATE_ADD(DATE(v.visit_date), INTERVAL 1 DAY)
        WHEN HOUR(v.visit_date) < 8 THEN DATE_SUB(DATE(v.visit_date), INTERVAL 1 DAY)
        ELSE DATE(v.visit_date)
    END
ORDER BY fecha_agrupada DESC;

-- 7. Verificar agrupación de visitas problemáticas (Domingo, Jueves y Sábado a las 0:00)
SELECT 
    DATE(v.visit_date) as fecha_real,
    DAYOFWEEK(v.visit_date) as dia_semana_real,
    MAX(CASE DAYOFWEEK(v.visit_date)
        WHEN 1 THEN 'Domingo'
        WHEN 2 THEN 'Lunes'
        WHEN 3 THEN 'Martes'
        WHEN 4 THEN 'Miércoles'
        WHEN 5 THEN 'Jueves'
        WHEN 6 THEN 'Viernes'
        WHEN 7 THEN 'Sábado'
    END) as nombre_dia_real,
    MAX(HOUR(v.visit_date)) as hora_real,
    -- Fecha agrupada
    MAX(CASE 
        WHEN HOUR(v.visit_date) >= 20 THEN DATE_ADD(DATE(v.visit_date), INTERVAL 1 DAY)
        WHEN HOUR(v.visit_date) < 8 THEN DATE_SUB(DATE(v.visit_date), INTERVAL 1 DAY)
        ELSE DATE(v.visit_date)
    END) as fecha_agrupada,
    MAX(DAYOFWEEK(
        CASE 
            WHEN HOUR(v.visit_date) >= 20 THEN DATE_ADD(DATE(v.visit_date), INTERVAL 1 DAY)
            WHEN HOUR(v.visit_date) < 8 THEN DATE_SUB(DATE(v.visit_date), INTERVAL 1 DAY)
            ELSE DATE(v.visit_date)
        END
    )) as dia_semana_agrupado,
    MAX(CASE DAYOFWEEK(
        CASE 
            WHEN HOUR(v.visit_date) >= 20 THEN DATE_ADD(DATE(v.visit_date), INTERVAL 1 DAY)
            WHEN HOUR(v.visit_date) < 8 THEN DATE_SUB(DATE(v.visit_date), INTERVAL 1 DAY)
            ELSE DATE(v.visit_date)
        END
    )
        WHEN 1 THEN 'Domingo'
        WHEN 2 THEN 'Lunes'
        WHEN 3 THEN 'Martes'
        WHEN 4 THEN 'Miércoles'
        WHEN 5 THEN 'Jueves'
        WHEN 6 THEN 'Viernes'
        WHEN 7 THEN 'Sábado'
    END) as nombre_dia_agrupado,
    COUNT(*) as cantidad
FROM `Visits` v
WHERE v.visit_date IS NOT NULL
    AND YEAR(v.visit_date) = 2025
    AND MONTH(v.visit_date) = 9
    AND (
        (DAYOFWEEK(v.visit_date) = 1 AND HOUR(v.visit_date) = 0) -- Domingo a las 0:00
        OR
        (DAYOFWEEK(v.visit_date) = 5 AND HOUR(v.visit_date) = 0) -- Jueves a las 0:00
        OR
        (DAYOFWEEK(v.visit_date) = 7 AND HOUR(v.visit_date) = 0) -- Sábado a las 0:00
    )
GROUP BY DATE(v.visit_date), DAYOFWEEK(v.visit_date), HOUR(v.visit_date)
ORDER BY fecha_real DESC;

-- 8. DATOS PARA EL HISTOGRAMA (igual que el backend)
-- CORRECCIÓN: Usar hour_entry en lugar de visit_date para obtener la hora real de entrada
-- Esta consulta muestra exactamente los datos que se envían al frontend para el histograma
-- CON columnas adicionales para verificar la conversión
SELECT 
    -- Fecha y hora ORIGINALES (de hour_entry)
    MAX(DATE(v.hour_entry)) as fecha_real,
    MAX(HOUR(v.hour_entry)) as hora_real,
    MAX(DAYOFWEEK(v.hour_entry)) as dia_semana_real,
    MAX(CASE DAYOFWEEK(v.hour_entry)
        WHEN 1 THEN 'Domingo'
        WHEN 2 THEN 'Lunes'
        WHEN 3 THEN 'Martes'
        WHEN 4 THEN 'Miércoles'
        WHEN 5 THEN 'Jueves'
        WHEN 6 THEN 'Viernes'
        WHEN 7 THEN 'Sábado'
    END) as nombre_dia_real,
    -- Fecha y día AGRUPADOS
    -- LÓGICA: Si hora entre 19:00-23:59 → mismo día, si hora entre 0:00-18:59 → día anterior
    CASE 
        WHEN HOUR(v.hour_entry) >= 19 AND HOUR(v.hour_entry) <= 23 THEN DATE(v.hour_entry)
        WHEN HOUR(v.hour_entry) >= 0 AND HOUR(v.hour_entry) < 19 THEN DATE_SUB(DATE(v.hour_entry), INTERVAL 1 DAY)
        ELSE DATE(v.hour_entry)
    END as fecha_agrupada,
    MAX(DAYOFWEEK(
        CASE 
            WHEN HOUR(v.hour_entry) >= 19 AND HOUR(v.hour_entry) <= 23 THEN DATE(v.hour_entry)
            WHEN HOUR(v.hour_entry) >= 0 AND HOUR(v.hour_entry) < 19 THEN DATE_SUB(DATE(v.hour_entry), INTERVAL 1 DAY)
            ELSE DATE(v.hour_entry)
        END
    )) as dia_semana_agrupado,
    MAX(CASE DAYOFWEEK(
        CASE 
            WHEN HOUR(v.hour_entry) >= 19 AND HOUR(v.hour_entry) <= 23 THEN DATE(v.hour_entry)
            WHEN HOUR(v.hour_entry) >= 0 AND HOUR(v.hour_entry) < 19 THEN DATE_SUB(DATE(v.hour_entry), INTERVAL 1 DAY)
            ELSE DATE(v.hour_entry)
        END
    )
        WHEN 1 THEN 'Domingo'
        WHEN 2 THEN 'Lunes'
        WHEN 3 THEN 'Martes'
        WHEN 4 THEN 'Miércoles'
        WHEN 5 THEN 'Jueves'
        WHEN 6 THEN 'Viernes'
        WHEN 7 THEN 'Sábado'
    END) as nombre_dia_agrupado,
    vt.id_visit_type,
    vt.description as tipo_visita,
    COUNT(*) as cantidad
FROM `Visits` v
INNER JOIN `Visits_Types` vt ON v.id_visit_type = vt.id_visit_type
WHERE v.hour_entry IS NOT NULL
    AND YEAR(v.hour_entry) = 2025
    AND MONTH(v.hour_entry) = 9
GROUP BY 
    CASE 
        WHEN HOUR(v.hour_entry) >= 19 AND HOUR(v.hour_entry) <= 23 THEN DATE(v.hour_entry)
        WHEN HOUR(v.hour_entry) >= 0 AND HOUR(v.hour_entry) < 19 THEN DATE_SUB(DATE(v.hour_entry), INTERVAL 1 DAY)
        ELSE DATE(v.hour_entry)
    END,
    vt.id_visit_type,
    vt.description
ORDER BY fecha_agrupada DESC, vt.id_visit_type ASC;

-- 9. VERIFICAR HORA EXACTA DE LAS VISITAS (para detectar problemas de timezone)
SELECT 
    v.visit_date as fecha_hora_completa,
    DATE(v.visit_date) as fecha_extraida,
    HOUR(v.visit_date) as hora_extraida,
    TIME(v.visit_date) as hora_completa,
    DAYOFWEEK(v.visit_date) as dia_semana,
    CASE DAYOFWEEK(v.visit_date)
        WHEN 1 THEN 'Domingo'
        WHEN 2 THEN 'Lunes'
        WHEN 3 THEN 'Martes'
        WHEN 4 THEN 'Miércoles'
        WHEN 5 THEN 'Jueves'
        WHEN 6 THEN 'Viernes'
        WHEN 7 THEN 'Sábado'
    END as nombre_dia,
    vt.description as tipo_visita,
    COUNT(*) as cantidad
FROM `Visits` v
INNER JOIN `Visits_Types` vt ON v.id_visit_type = vt.id_visit_type
WHERE v.visit_date IS NOT NULL
    AND YEAR(v.visit_date) = 2025
    AND MONTH(v.visit_date) = 9
    AND (
        (DAYOFWEEK(v.visit_date) = 6 AND HOUR(v.visit_date) = 0)
        OR
        (DAYOFWEEK(v.visit_date) = 4 AND HOUR(v.visit_date) = 0)
        OR
        (DAYOFWEEK(v.visit_date) = 7 AND HOUR(v.visit_date) = 0)
    )
GROUP BY v.visit_date, DATE(v.visit_date), HOUR(v.visit_date), TIME(v.visit_date), DAYOFWEEK(v.visit_date), vt.description
ORDER BY fecha_hora_completa DESC
LIMIT 50;

-- 10. Verificar timezone de la base de datos
SELECT 
    @@global.time_zone as timezone_global,
    @@session.time_zone as timezone_session,
    NOW() as hora_actual,
    UTC_TIMESTAMP() as hora_utc;

-- 11. Verificar tipo de dato del campo visit_date y ver hora completa
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    COLUMN_TYPE,
    DATETIME_PRECISION
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Visits'
    AND COLUMN_NAME = 'visit_date';

-- 12. Ver visitas con hora completa real (usando CAST para asegurar que se muestre la hora)
SELECT 
    v.visit_date as fecha_hora_original,
    CAST(v.visit_date AS DATETIME) as fecha_hora_cast,
    DATE(v.visit_date) as fecha_extraida,
    HOUR(v.visit_date) as hora_extraida,
    MINUTE(v.visit_date) as minuto_extraido,
    SECOND(v.visit_date) as segundo_extraido,
    TIME(v.visit_date) as hora_completa,
    DAYOFWEEK(v.visit_date) as dia_semana,
    CASE DAYOFWEEK(v.visit_date)
        WHEN 1 THEN 'Domingo'
        WHEN 2 THEN 'Lunes'
        WHEN 3 THEN 'Martes'
        WHEN 4 THEN 'Miércoles'
        WHEN 5 THEN 'Jueves'
        WHEN 6 THEN 'Viernes'
        WHEN 7 THEN 'Sábado'
    END as nombre_dia,
    vt.description as tipo_visita,
    COUNT(*) as cantidad
FROM `Visits` v
INNER JOIN `Visits_Types` vt ON v.id_visit_type = vt.id_visit_type
WHERE v.visit_date IS NOT NULL
    AND YEAR(v.visit_date) = 2025
    AND MONTH(v.visit_date) = 9
    AND (
        (DAYOFWEEK(v.visit_date) = 6 AND HOUR(v.visit_date) = 0)
        OR
        (DAYOFWEEK(v.visit_date) = 4 AND HOUR(v.visit_date) = 0)
        OR
        (DAYOFWEEK(v.visit_date) = 7 AND HOUR(v.visit_date) = 0)
    )
GROUP BY v.visit_date, DATE(v.visit_date), HOUR(v.visit_date), MINUTE(v.visit_date), SECOND(v.visit_date), TIME(v.visit_date), DAYOFWEEK(v.visit_date), vt.description
ORDER BY fecha_hora_original DESC
LIMIT 20;


