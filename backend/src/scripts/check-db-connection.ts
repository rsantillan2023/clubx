import dotenv from "dotenv";
dotenv.config();

import { DEGIRA_DB } from "../database/connection";
import * as os from "os";
import * as dns from "dns";
import { promisify } from "util";

const lookup = promisify(dns.lookup);

async function checkDatabaseConnection() {
  console.log("\n" + "=".repeat(70));
  console.log("🔍 VERIFICACIÓN DE CONEXIÓN A BASE DE DATOS");
  console.log("=".repeat(70) + "\n");

  // 1. Mostrar configuración del .env
  console.log("📋 CONFIGURACIÓN DEL .ENV:");
  console.log(`   DB_HOST: ${process.env.DB_HOST || "NO DEFINIDO"}`);
  console.log(`   DB_DATABASE: ${process.env.DB_DATABASE || "NO DEFINIDO"}`);
  console.log(`   DB_USERNAME: ${process.env.DB_USERNAME || "NO DEFINIDO"}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || "NO DEFINIDO"}`);
  console.log();

  // 2. Resolver la IP real de localhost
  console.log("🌐 RESOLUCIÓN DNS:");
  try {
    const host = process.env.DB_HOST || "localhost";
    const addresses = await lookup(host);
    console.log(`   Host configurado: ${host}`);
    console.log(`   IP resuelta: ${addresses.address}`);
    console.log(`   Familia: ${addresses.family === 4 ? "IPv4" : "IPv6"}`);
    
    if (addresses.address === "127.0.0.1" || addresses.address === "::1") {
      console.log(`   ✅ Es localhost (IP local)`);
    } else {
      console.log(`   ⚠️ NO es localhost - IP: ${addresses.address}`);
    }
  } catch (error: any) {
    console.log(`   ❌ Error al resolver DNS: ${error.message}`);
  }
  console.log();

  // 3. Intentar conectar y obtener información del servidor MySQL
  console.log("🔌 CONEXIÓN A MYSQL:");
  try {
    await DEGIRA_DB.authenticate();
    console.log("   ✅ Conexión exitosa");
    
    // Obtener información del servidor MySQL
    const [hostnameResult]: any = await DEGIRA_DB.query("SELECT @@hostname as hostname");
    const [versionResult]: any = await DEGIRA_DB.query("SELECT @@version as version");
    const [databaseResult]: any = await DEGIRA_DB.query("SELECT DATABASE() as current_database");
    
    const hostname = hostnameResult[0]?.hostname || "N/A";
    const version = versionResult[0]?.version || "N/A";
    const database = databaseResult[0]?.current_database || "N/A";
    
    console.log("\n   📊 INFORMACIÓN DEL SERVIDOR MYSQL:");
    console.log(`   Hostname del servidor: ${hostname}`);
    console.log(`   Versión MySQL: ${version}`);
    console.log(`   Base de datos actual: ${database}`);
    
    // Verificar si el hostname es local o remoto
    const localHostname = os.hostname();
    
    console.log("\n   🔍 ANÁLISIS:");
    console.log(`   Hostname local de tu PC: ${localHostname}`);
    console.log(`   Hostname del servidor MySQL: ${hostname}`);
    
    if (hostname.toLowerCase() === localHostname.toLowerCase() || 
        hostname === "localhost" || 
        hostname.startsWith("127.0.0.1") ||
        hostname === "::1") {
      console.log(`   ✅ El servidor MySQL parece ser LOCAL`);
      console.log(`   ⚠️ PERO: Si ves datos de producción, tu BD local es una copia de producción`);
    } else {
      console.log(`   ⚠️ El servidor MySQL parece ser REMOTO (${hostname})`);
      console.log(`   ⚠️ ESTO INDICA QUE ESTÁS CONECTADO A PRODUCCIÓN`);
    }

    // Intentar obtener información de conexión adicional
    try {
      const [connInfo]: any = await DEGIRA_DB.query("SHOW VARIABLES LIKE 'hostname'");
      console.log("\n   🔗 DETALLES ADICIONALES:");
      if (connInfo && connInfo.length > 0) {
        console.log(`   Variable hostname MySQL: ${connInfo[0].Value}`);
      }
    } catch (e) {
      // Ignorar errores en consultas adicionales
    }

  } catch (error: any) {
    console.log(`   ❌ Error de conexión: ${error.message}`);
    if (error.original) {
      console.log(`   Detalle: ${error.original.message || error.original}`);
    }
  }
  console.log();

  // 4. Verificar conexiones de red activas
  console.log("🌐 CONEXIONES DE RED ACTIVAS (puerto 3306 - MySQL):");
  console.log("   (Ejecuta 'netstat -ano | findstr :3306' para ver conexiones MySQL)");
  console.log();

  // 5. Resumen final
  console.log("=".repeat(70));
  console.log("📝 RESUMEN:");
  console.log("=".repeat(70));
  console.log(`   Configuración: ${process.env.DB_HOST || "localhost"} → ${process.env.DB_DATABASE || "N/A"}`);
  console.log(`   Entorno: ${process.env.NODE_ENV || "NO DEFINIDO"}`);
  console.log();
  console.log("   ⚠️ IMPORTANTE:");
  console.log("   Si el hostname del servidor MySQL NO coincide con tu PC,");
  console.log("   entonces estás conectado a un servidor REMOTO (producción).");
  console.log("=".repeat(70) + "\n");

  await DEGIRA_DB.close();
}

checkDatabaseConnection()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error inesperado:", error);
    process.exit(1);
  });

