import dotenv from "dotenv";
dotenv.config();

import { DEGIRA_DB } from "../database/connection";

async function testWrite() {
  console.log("\n" + "=".repeat(70));
  console.log("🧪 TEST DE ESCRITURA EN BASE DE DATOS");
  console.log("=".repeat(70) + "\n");

  try {
    await DEGIRA_DB.authenticate();
    console.log("✅ Conexión exitosa\n");

    // Obtener información de la base de datos actual
    const [dbInfo]: any = await DEGIRA_DB.query("SELECT DATABASE() as current_db");
    const currentDb = dbInfo[0]?.current_db || "N/A";
    
    console.log(`📊 Base de datos actual: ${currentDb}`);
    console.log(`📋 Configuración NODE_ENV: ${process.env.NODE_ENV || "NO DEFINIDO"}`);
    console.log();

    // Intentar insertar un registro de prueba en operations
    const testData = {
      id_operation_type: 1,
      id_partner: 1,
      amount: 0.01,
      operation_date: new Date(),
      operation_log: JSON.stringify({ test: true, timestamp: new Date().toISOString() }),
      operation_metadata: JSON.stringify({ test: "desarrollo_local" })
    };

    console.log("📝 Intentando insertar registro de prueba en tabla 'operations'...");
    const [result]: any = await DEGIRA_DB.query(
      `INSERT INTO operations (id_operation_type, id_partner, amount, operation_date, operation_log, operation_metadata) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          testData.id_operation_type,
          testData.id_partner,
          testData.amount,
          testData.operation_date,
          testData.operation_log,
          testData.operation_metadata
        ]
      }
    );

    const insertId = result.insertId;
    console.log(`✅ Registro insertado con ID: ${insertId}`);
    console.log(`📊 En base de datos: ${currentDb}`);
    console.log();

    // Verificar en qué base de datos quedó
    const [verify]: any = await DEGIRA_DB.query(
      `SELECT id_operation, operation_metadata FROM operations WHERE id_operation = ?`,
      { replacements: [insertId] }
    );

    if (verify && verify.length > 0) {
      console.log("✅ Registro verificado en la base de datos actual");
      console.log(`   ID: ${verify[0].id_operation}`);
      console.log(`   Metadata: ${verify[0].operation_metadata}`);
    }

    console.log("\n" + "=".repeat(70));
    console.log("📝 CONCLUSIÓN:");
    console.log("=".repeat(70));
    console.log(`   Si el registro está en '${currentDb}', entonces el backend`);
    console.log(`   está usando la base de datos correcta.`);
    console.log(`   Si aparece en 'miclub_db' (producción), hay un problema.`);
    console.log("=".repeat(70) + "\n");

    // Limpiar el registro de prueba
    console.log("🧹 Eliminando registro de prueba...");
    await DEGIRA_DB.query(`DELETE FROM operations WHERE id_operation = ?`, {
      replacements: [insertId]
    });
    console.log("✅ Registro de prueba eliminado\n");

    await DEGIRA_DB.close();
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    if (error.original) {
      console.error("   Detalle:", error.original.message);
    }
    process.exit(1);
  }
}

testWrite()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error inesperado:", error);
    process.exit(1);
  });

