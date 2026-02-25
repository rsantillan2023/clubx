import dotenv from "dotenv";
dotenv.config();

import { DEGIRA_DB } from "../database/connection";

async function verifyCurrentDatabase() {
  console.log("\n" + "=".repeat(70));
  console.log("🔍 VERIFICACIÓN DE BASE DE DATOS EN USO");
  console.log("=".repeat(70) + "\n");

  try {
    await DEGIRA_DB.authenticate();
    
    // Obtener la base de datos actual
    const [dbInfo]: any = await DEGIRA_DB.query("SELECT DATABASE() as current_db");
    const currentDb = dbInfo[0]?.current_db || "N/A";
    
    // Obtener configuración
    const config = DEGIRA_DB.config;
    
    console.log("📊 INFORMACIÓN DE CONEXIÓN:");
    console.log(`   Base de datos en uso: ${currentDb}`);
    console.log(`   Host: ${config.host}`);
    console.log(`   Usuario: ${config.username}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || "NO DEFINIDO"}`);
    console.log();

    // Verificar si es la base de datos correcta
    if (currentDb === "miclub_db_dev") {
      console.log("✅ CORRECTO: Estás usando la base de datos de DESARROLLO");
      console.log("   Los cambios NO deberían aparecer en producción");
    } else if (currentDb === "miclub_db") {
      console.log("⚠️  ADVERTENCIA: Estás usando la base de datos de PRODUCCIÓN");
      console.log("   Los cambios SÍ aparecerán en producción");
      console.log("   Esto NO debería pasar si NODE_ENV=development");
    } else {
      console.log(`⚠️  Base de datos desconocida: ${currentDb}`);
    }

    console.log("\n" + "=".repeat(70));
    console.log("📝 RECOMENDACIÓN:");
    console.log("=".repeat(70));
    console.log("   Si ves 'miclub_db_dev' → Tu backend local está bien configurado");
    console.log("   Si ves 'miclub_db' → Hay un problema de configuración");
    console.log("=".repeat(70) + "\n");

    await DEGIRA_DB.close();
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

verifyCurrentDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error inesperado:", error);
    process.exit(1);
  });

