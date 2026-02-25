import dotenv from "dotenv";
dotenv.config();

import { Sequelize } from "sequelize";

// Configuración para conectar sin especificar base de datos (para crearla)
const tempConfig = {
  host: process.env.DB_HOST || "localhost",
  username: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "",
  dialect: (process.env.DB_DIALECT || "mysql") as "mysql",
};

const DEV_DATABASE_NAME = "miclub_db_dev";

async function createDevDatabase() {
  console.log("\n" + "=".repeat(70));
  console.log("🔧 CREACIÓN DE BASE DE DATOS DE DESARROLLO");
  console.log("=".repeat(70) + "\n");

  // Conectar sin especificar base de datos
  const sequelize = new Sequelize({
    ...tempConfig,
    database: "", // Sin base de datos
    logging: false,
  });

  try {
    await sequelize.authenticate();
    console.log("✅ Conexión a MySQL exitosa\n");

    // Verificar si la base de datos ya existe
    const [databases]: any = await sequelize.query(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${DEV_DATABASE_NAME}'`
    );

    if (databases.length > 0) {
      console.log(`⚠️  La base de datos '${DEV_DATABASE_NAME}' ya existe.`);
      console.log("   ¿Deseas eliminarla y crearla de nuevo? (Esto borrará todos los datos)");
      console.log("   Para recrearla, ejecuta primero:");
      console.log(`   DROP DATABASE IF EXISTS ${DEV_DATABASE_NAME};`);
      console.log();
    } else {
      // Crear la base de datos
      console.log(`📦 Creando base de datos '${DEV_DATABASE_NAME}'...`);
      await sequelize.query(`CREATE DATABASE IF NOT EXISTS \`${DEV_DATABASE_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`✅ Base de datos '${DEV_DATABASE_NAME}' creada exitosamente\n`);

      console.log("📝 PRÓXIMOS PASOS:");
      console.log("   1. Ejecuta los scripts SQL de la carpeta '22-08-25 (1)/22-08-25/'");
      console.log("      pero cambiando 'degira_develop' por 'miclub_db_dev'");
      console.log("   2. O importa la estructura desde miclub_db:");
      console.log(`      mysqldump -u root -p miclub_db --no-data > structure.sql`);
      console.log(`      mysql -u root -p ${DEV_DATABASE_NAME} < structure.sql`);
      console.log();
      console.log("   3. Actualiza el archivo .env:");
      console.log(`      DB_DATABASE=${DEV_DATABASE_NAME}`);
      console.log();
    }

    await sequelize.close();
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    if (error.original) {
      console.error("   Detalle:", error.original.message);
    }
    process.exit(1);
  }
}

createDevDatabase()
  .then(() => {
    console.log("=".repeat(70) + "\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error inesperado:", error);
    process.exit(1);
  });

