import dotenv from "dotenv";
dotenv.config();

import { Sequelize } from "sequelize";

const SOURCE_DB = process.env.DB_DATABASE || "miclub_db";
const TARGET_DB = "miclub_db_dev";

const config = {
  host: process.env.DB_HOST || "localhost",
  username: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "",
  dialect: (process.env.DB_DIALECT || "mysql") as "mysql",
  logging: false,
};

async function copyDatabaseStructure() {
  console.log("\n" + "=".repeat(70));
  console.log("📋 COPIANDO ESTRUCTURA DE BASE DE DATOS");
  console.log("=".repeat(70) + "\n");

  const sourceSequelize = new Sequelize({
    ...config,
    database: SOURCE_DB,
  });

  const targetSequelize = new Sequelize({
    ...config,
    database: TARGET_DB,
  });

  try {
    // Verificar conexiones
    await sourceSequelize.authenticate();
    console.log(`✅ Conectado a base de datos origen: ${SOURCE_DB}`);
    
    await targetSequelize.authenticate();
    console.log(`✅ Conectado a base de datos destino: ${TARGET_DB}\n`);

    // Obtener todas las tablas de la base de datos origen
    const [tables]: any = await sourceSequelize.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '${SOURCE_DB}' AND TABLE_TYPE = 'BASE TABLE'`
    );

    console.log(`📊 Encontradas ${tables.length} tablas en ${SOURCE_DB}\n`);

    // Ordenar tablas: primero las que no tienen foreign keys, luego las que sí
    // Tablas base (sin dependencias)
    const baseTables = ['actions', 'days', 'payment_methods', 'products_services', 
                        'receivable_concepts', 'roles', 'states', 'users', 'visits_types'];
    
    // Tablas con dependencias (en orden)
    const dependentTables = ['partners', 'users_roles', 'visits', 'tickets', 
                              'ticket_details', 'operations_types', 'operations', 'prices'];

    const orderedTables = [
      ...baseTables.filter(t => tables.some((tb: any) => tb.TABLE_NAME.toLowerCase() === t.toLowerCase())),
      ...dependentTables.filter(t => tables.some((tb: any) => tb.TABLE_NAME.toLowerCase() === t.toLowerCase())),
      ...tables.map((t: any) => t.TABLE_NAME).filter((t: string) => 
        !baseTables.includes(t.toLowerCase()) && !dependentTables.includes(t.toLowerCase())
      )
    ];

    console.log(`📋 Copiando ${orderedTables.length} tablas en orden correcto...\n`);

    // Deshabilitar foreign key checks temporalmente
    await targetSequelize.query("SET FOREIGN_KEY_CHECKS = 0");

    // Para cada tabla, obtener su estructura CREATE TABLE
    for (const tableName of orderedTables) {
      console.log(`📦 Copiando estructura de tabla: ${tableName}...`);

      try {
        // Eliminar tabla si existe
        await targetSequelize.query(`DROP TABLE IF EXISTS \`${tableName}\``);

        // Obtener el CREATE TABLE statement
        const [createTable]: any = await sourceSequelize.query(
          `SHOW CREATE TABLE \`${SOURCE_DB}\`.\`${tableName}\``
        );

        if (createTable && createTable.length > 0) {
          let createStatement = createTable[0]["Create Table"];
          
          // Reemplazar el nombre de la base de datos en el statement si aparece
          createStatement = createStatement.replace(
            new RegExp(`\`${SOURCE_DB}\``, "g"),
            `\`${TARGET_DB}\``
          );

          // Ejecutar el CREATE TABLE en la base de datos destino
          await targetSequelize.query(createStatement);
          console.log(`   ✅ Tabla ${tableName} creada`);
        }
      } catch (error: any) {
        console.log(`   ⚠️  Error al copiar ${tableName}: ${error.message}`);
      }
    }

    // Rehabilitar foreign key checks
    await targetSequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("\n✅ Estructura copiada exitosamente");
    console.log(`\n📝 La base de datos '${TARGET_DB}' ahora tiene la misma estructura que '${SOURCE_DB}'`);
    console.log("   (sin datos, solo estructura)\n");

    await sourceSequelize.close();
    await targetSequelize.close();
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    if (error.original) {
      console.error("   Detalle:", error.original.message);
    }
    process.exit(1);
  }
}

copyDatabaseStructure()
  .then(() => {
    console.log("=".repeat(70) + "\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error inesperado:", error);
    process.exit(1);
  });

