import dotenv from "dotenv";
dotenv.config();

import { DEGIRA_DB } from "../database/connection";

async function analyzeVisitsHistogram() {
  console.log("\n" + "=".repeat(70));
  console.log("📊 ANÁLISIS DE DATOS REALES - HISTOGRAMA DE VISITAS");
  console.log("=".repeat(70) + "\n");

  try {
    await DEGIRA_DB.authenticate();
    
    // Obtener la base de datos actual
    const [dbInfo]: any = await DEGIRA_DB.query("SELECT DATABASE() as current_db");
    const currentDb = dbInfo[0]?.current_db || "N/A";
    
    console.log(`📌 Base de datos en uso: ${currentDb}\n`);

    // 1. Visitas agrupadas por día de la semana
    console.log("=".repeat(70));
    console.log("1️⃣  VISITAS AGRUPADAS POR DÍA DE LA SEMANA (últimos 3 meses)");
    console.log("=".repeat(70));
    const [query1]: any = await DEGIRA_DB.query(`
      SELECT 
        DAYOFWEEK(visit_date) as dia_semana,
        CASE DAYOFWEEK(visit_date)
          WHEN 1 THEN 'Domingo'
          WHEN 2 THEN 'Lunes'
          WHEN 3 THEN 'Martes'
          WHEN 4 THEN 'Miércoles'
          WHEN 5 THEN 'Jueves'
          WHEN 6 THEN 'Viernes'
          WHEN 7 THEN 'Sábado'
        END as nombre_dia,
        COUNT(*) as cantidad_visitas
      FROM Visits
      WHERE visit_date IS NOT NULL
        AND visit_date >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
      GROUP BY DAYOFWEEK(visit_date)
      ORDER BY dia_semana
    `);
    console.table(query1);
    console.log();

    // 2. Visitas agrupadas por fecha y hora (últimos 30 días)
    console.log("=".repeat(70));
    console.log("2️⃣  VISITAS AGRUPADAS POR FECHA Y HORA (últimos 30 días)");
    console.log("=".repeat(70));
    const [query2]: any = await DEGIRA_DB.query(`
      SELECT 
        DATE(visit_date) as fecha,
        DAYOFWEEK(visit_date) as dia_semana,
        CASE DAYOFWEEK(visit_date)
          WHEN 1 THEN 'Dom'
          WHEN 2 THEN 'Lun'
          WHEN 3 THEN 'Mar'
          WHEN 4 THEN 'Mié'
          WHEN 5 THEN 'Jue'
          WHEN 6 THEN 'Vie'
          WHEN 7 THEN 'Sáb'
        END as dia,
        HOUR(visit_date) as hora,
        COUNT(*) as cantidad
      FROM Visits
      WHERE visit_date IS NOT NULL
        AND visit_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(visit_date), HOUR(visit_date), DAYOFWEEK(visit_date)
      ORDER BY fecha DESC, hora ASC
      LIMIT 50
    `);
    console.table(query2);
    console.log();

    // 3. Verificar visitas fuera de Miércoles, Viernes y Sábado
    console.log("=".repeat(70));
    console.log("3️⃣  VISITAS FUERA DE Miércoles, Viernes y Sábado (últimos 30 días)");
    console.log("=".repeat(70));
    const [query3]: any = await DEGIRA_DB.query(`
      SELECT 
        DATE(visit_date) as fecha,
        DAYOFWEEK(visit_date) as dia_semana,
        CASE DAYOFWEEK(visit_date)
          WHEN 1 THEN 'Domingo'
          WHEN 2 THEN 'Lunes'
          WHEN 3 THEN 'Martes'
          WHEN 4 THEN 'Miércoles'
          WHEN 5 THEN 'Jueves'
          WHEN 6 THEN 'Viernes'
          WHEN 7 THEN 'Sábado'
        END as nombre_dia,
        HOUR(visit_date) as hora,
        COUNT(*) as cantidad
      FROM Visits
      WHERE visit_date IS NOT NULL
        AND visit_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND DAYOFWEEK(visit_date) NOT IN (4, 6, 7)
      GROUP BY DATE(visit_date), DAYOFWEEK(visit_date), HOUR(visit_date)
      ORDER BY fecha DESC, hora ASC
    `);
    if (query3.length > 0) {
      console.log("⚠️  SE ENCONTRARON VISITAS EN DÍAS INESPERADOS:");
      console.table(query3);
    } else {
      console.log("✅ No se encontraron visitas fuera de Miércoles, Viernes y Sábado");
    }
    console.log();

    // 4. Aplicar la lógica del histograma (20:00-8:00)
    console.log("=".repeat(70));
    console.log("4️⃣  APLICANDO LÓGICA DEL HISTOGRAMA (20:00-8:00) - Últimos 30 días");
    console.log("=".repeat(70));
    console.log("   Visitas entre 20:00 y 8:00 se cuentan para el día inicial");
    console.log();
    const [query4]: any = await DEGIRA_DB.query(`
      SELECT 
        CASE 
          WHEN HOUR(visit_date) >= 20 THEN DATE(visit_date)
          WHEN HOUR(visit_date) < 8 THEN DATE_SUB(DATE(visit_date), INTERVAL 1 DAY)
          ELSE DATE(visit_date)
        END as fecha_agrupada,
        DATE(visit_date) as fecha_real,
        HOUR(visit_date) as hora_real,
        DAYOFWEEK(visit_date) as dia_semana_real,
        CASE DAYOFWEEK(visit_date)
          WHEN 1 THEN 'Dom'
          WHEN 2 THEN 'Lun'
          WHEN 3 THEN 'Mar'
          WHEN 4 THEN 'Mié'
          WHEN 5 THEN 'Jue'
          WHEN 6 THEN 'Vie'
          WHEN 7 THEN 'Sáb'
        END as dia_real,
        COUNT(*) as cantidad
      FROM Visits
      WHERE visit_date IS NOT NULL
        AND visit_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY 
        CASE 
          WHEN HOUR(visit_date) >= 20 THEN DATE(visit_date)
          WHEN HOUR(visit_date) < 8 THEN DATE_SUB(DATE(visit_date), INTERVAL 1 DAY)
          ELSE DATE(visit_date)
        END,
        DATE(visit_date),
        HOUR(visit_date),
        DAYOFWEEK(visit_date)
      ORDER BY fecha_agrupada DESC, hora_real ASC
      LIMIT 50
    `);
    console.table(query4);
    console.log();

    // 5. Comparar id_day guardado vs fecha calculada
    console.log("=".repeat(70));
    console.log("5️⃣  COMPARACIÓN: id_day guardado vs fecha calculada (últimos 30 días)");
    console.log("=".repeat(70));
    const [query5]: any = await DEGIRA_DB.query(`
      SELECT 
        v.id_day,
        d.name as nombre_dia_guardado,
        DATE(v.visit_date) as fecha_visit_date,
        DAYOFWEEK(v.visit_date) as dia_semana_visit_date,
        CASE DAYOFWEEK(v.visit_date)
          WHEN 1 THEN 'Domingo'
          WHEN 2 THEN 'Lunes'
          WHEN 3 THEN 'Martes'
          WHEN 4 THEN 'Miércoles'
          WHEN 5 THEN 'Jueves'
          WHEN 6 THEN 'Viernes'
          WHEN 7 THEN 'Sábado'
        END as nombre_dia_visit_date,
        HOUR(v.visit_date) as hora,
        COUNT(*) as cantidad
      FROM Visits v
      LEFT JOIN Days d ON v.id_day = d.id_day
      WHERE v.visit_date IS NOT NULL
        AND v.visit_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY v.id_day, d.name, DATE(v.visit_date), DAYOFWEEK(v.visit_date), HOUR(v.visit_date)
      ORDER BY fecha_visit_date DESC, hora ASC
      LIMIT 50
    `);
    console.table(query5);
    console.log();

    // 6. Resumen de la lógica aplicada
    console.log("=".repeat(70));
    console.log("6️⃣  RESUMEN: Visitas agrupadas por fecha (con lógica 20:00-8:00)");
    console.log("=".repeat(70));
    const [query6]: any = await DEGIRA_DB.query(`
      SELECT 
        CASE 
          WHEN HOUR(visit_date) >= 20 THEN DATE(visit_date)
          WHEN HOUR(visit_date) < 8 THEN DATE_SUB(DATE(visit_date), INTERVAL 1 DAY)
          ELSE DATE(visit_date)
        END as fecha_agrupada,
        DAYOFWEEK(
          CASE 
            WHEN HOUR(visit_date) >= 20 THEN DATE(visit_date)
            WHEN HOUR(visit_date) < 8 THEN DATE_SUB(DATE(visit_date), INTERVAL 1 DAY)
            ELSE DATE(visit_date)
          END
        ) as dia_semana_agrupado,
        CASE DAYOFWEEK(
          CASE 
            WHEN HOUR(visit_date) >= 20 THEN DATE(visit_date)
            WHEN HOUR(visit_date) < 8 THEN DATE_SUB(DATE(visit_date), INTERVAL 1 DAY)
            ELSE DATE(visit_date)
          END
        )
          WHEN 1 THEN 'Dom'
          WHEN 2 THEN 'Lun'
          WHEN 3 THEN 'Mar'
          WHEN 4 THEN 'Mié'
          WHEN 5 THEN 'Jue'
          WHEN 6 THEN 'Vie'
          WHEN 7 THEN 'Sáb'
        END as dia_agrupado,
        COUNT(*) as total_visitas
      FROM Visits
      WHERE visit_date IS NOT NULL
        AND visit_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY 
        CASE 
          WHEN HOUR(visit_date) >= 20 THEN DATE(visit_date)
          WHEN HOUR(visit_date) < 8 THEN DATE_SUB(DATE(visit_date), INTERVAL 1 DAY)
          ELSE DATE(visit_date)
        END
      ORDER BY fecha_agrupada DESC
      LIMIT 30
    `);
    console.table(query6);
    console.log();

    console.log("=".repeat(70));
    console.log("✅ Análisis completado");
    console.log("=".repeat(70) + "\n");

    await DEGIRA_DB.close();
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    if (error.original) {
      console.error("   Detalle:", error.original.message);
    }
    console.error(error);
    process.exit(1);
  }
}

analyzeVisitsHistogram()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error inesperado:", error);
    process.exit(1);
  });

