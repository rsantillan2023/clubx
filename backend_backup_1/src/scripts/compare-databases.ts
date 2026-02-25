import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcrypt";
import { Sequelize, QueryTypes } from "sequelize";

// Configuración de base de datos local
const localConfig = {
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_DATABASE || "",
  username: process.env.DB_USERNAME || "",
  password: process.env.DB_PASSWORD || "",
  dialect: "mysql" as const,
};

// Configuración de base de datos de producción (desde variables de entorno)
const prodConfig = {
  host: process.env.PROD_DB_HOST || process.env.DB_HOST || "localhost",
  database: process.env.PROD_DB_DATABASE || process.env.DB_DATABASE || "",
  username: process.env.PROD_DB_USERNAME || process.env.DB_USERNAME || "",
  password: process.env.PROD_DB_PASSWORD || process.env.DB_PASSWORD || "",
  dialect: "mysql" as const,
};

interface TableComparison {
  tableName: string;
  localColumns: string[];
  prodColumns: string[];
  missingInLocal: string[];
  missingInProd: string[];
}

interface DataComparison {
  tableName: string;
  localCount: number;
  prodCount: number;
  differences: Array<{
    id: any;
    field: string;
    localValue: any;
    prodValue: any;
  }>;
}

class DatabaseComparator {
  private localDB: Sequelize;
  private prodDB: Sequelize;

  constructor() {
    this.localDB = new Sequelize(
      localConfig.database,
      localConfig.username,
      localConfig.password,
      {
        host: localConfig.host,
        dialect: localConfig.dialect,
        logging: false,
      }
    );

    this.prodDB = new Sequelize(
      prodConfig.database,
      prodConfig.username,
      prodConfig.password,
      {
        host: prodConfig.host,
        dialect: prodConfig.dialect,
        logging: false,
      }
    );
  }

  async testConnections(): Promise<{ local: boolean; prod: boolean }> {
    const results = { local: false, prod: false };

    try {
      await this.localDB.authenticate();
      results.local = true;
      console.log("✅ Conexión a base de datos LOCAL exitosa");
    } catch (error: any) {
      console.log("❌ Error conectando a LOCAL:", error.message);
    }

    try {
      await this.prodDB.authenticate();
      results.prod = true;
      console.log("✅ Conexión a base de datos PRODUCCIÓN exitosa");
    } catch (error: any) {
      console.log("❌ Error conectando a PRODUCCIÓN:", error.message);
      console.log("💡 Asegúrate de configurar las variables de entorno:");
      console.log("   PROD_DB_HOST, PROD_DB_DATABASE, PROD_DB_USERNAME, PROD_DB_PASSWORD");
    }

    return results;
  }

  async compareTableStructures(): Promise<TableComparison[]> {
    const comparisons: TableComparison[] = [];

    // Obtener tablas de ambas bases de datos
    const [localTables]: any = await this.localDB.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '${localConfig.database}'`
    );
    const [prodTables]: any = await this.prodDB.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '${prodConfig.database}'`
    );

    const localTableNames = localTables.map((t: any) => t.TABLE_NAME);
    const prodTableNames = prodTables.map((t: any) => t.TABLE_NAME);
    const allTables = [...new Set([...localTableNames, ...prodTableNames])];

    for (const tableName of allTables) {
      const localExists = localTableNames.includes(tableName);
      const prodExists = prodTableNames.includes(tableName);

      if (!localExists || !prodExists) {
        comparisons.push({
          tableName,
          localColumns: [],
          prodColumns: [],
          missingInLocal: prodExists ? ["TABLA COMPLETA"] : [],
          missingInProd: localExists ? ["TABLA COMPLETA"] : [],
        });
        continue;
      }

      // Obtener columnas de cada tabla
      const [localCols]: any = await this.localDB.query(
        `SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = '${localConfig.database}' AND TABLE_NAME = '${tableName}'`
      );
      const [prodCols]: any = await this.prodDB.query(
        `SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = '${prodConfig.database}' AND TABLE_NAME = '${tableName}'`
      );

      const localColumnNames = localCols.map((c: any) => c.COLUMN_NAME);
      const prodColumnNames = prodCols.map((c: any) => c.COLUMN_NAME);

      comparisons.push({
        tableName,
        localColumns: localColumnNames,
        prodColumns: prodColumnNames,
        missingInLocal: prodColumnNames.filter((c: string) => !localColumnNames.includes(c)),
        missingInProd: localColumnNames.filter((c: string) => !prodColumnNames.includes(c)),
      });
    }

    return comparisons;
  }

  async compareTableData(tableName: string): Promise<DataComparison> {
    try {
      // Obtener conteos
      const [localCountResult]: any = await this.localDB.query(
        `SELECT COUNT(*) as count FROM \`${tableName}\``
      );
      const [prodCountResult]: any = await this.prodDB.query(
        `SELECT COUNT(*) as count FROM \`${tableName}\``
      );

      const localCount = localCountResult[0]?.count || 0;
      const prodCount = prodCountResult[0]?.count || 0;

      // Obtener datos para comparar (solo primeras 100 filas para no sobrecargar)
      const [localData]: any = await this.localDB.query(
        `SELECT * FROM \`${tableName}\` LIMIT 100`
      );
      const [prodData]: any = await this.prodDB.query(
        `SELECT * FROM \`${tableName}\` LIMIT 100`
      );

      const differences: DataComparison["differences"] = [];

      // Comparar datos (buscar por ID común)
      const commonIds = new Set([
        ...localData.map((r: any) => r.id_user || r.id_partner || r.id || Object.values(r)[0]),
        ...prodData.map((r: any) => r.id_user || r.id_partner || r.id || Object.values(r)[0]),
      ]);

      for (const id of commonIds) {
        const localRow = localData.find((r: any) => 
          r.id_user === id || r.id_partner === id || r.id === id
        );
        const prodRow = prodData.find((r: any) => 
          r.id_user === id || r.id_partner === id || r.id === id
        );

        if (localRow && prodRow) {
          const allKeys = new Set([...Object.keys(localRow), ...Object.keys(prodRow)]);
          for (const key of allKeys) {
            const localVal = localRow[key];
            const prodVal = prodRow[key];

            // Ignorar diferencias en timestamps
            if (key.includes("_at") || key.includes("time")) continue;

            if (localVal !== prodVal) {
              // Verificar si es una contraseña hasheada
              const isPassword = key.toLowerCase().includes("password");
              const isHashed = isPassword && /^\$2[ayb]?\$\d{2}\$/.test(String(prodVal || ""));

              differences.push({
                id,
                field: key,
                localValue: isPassword && !isHashed ? "[TEXTO PLANO]" : localVal,
                prodValue: isPassword ? "[HASHEADO]" : prodVal,
              });
            }
          }
        }
      }

      return {
        tableName,
        localCount,
        prodCount,
        differences,
      };
    } catch (error: any) {
      return {
        tableName,
        localCount: 0,
        prodCount: 0,
        differences: [{ id: null, field: "ERROR", localValue: error.message, prodValue: "" }],
      };
    }
  }

  async generateReport(): Promise<void> {
    console.log("\n" + "=".repeat(70));
    console.log("🔍 COMPARACIÓN DE BASES DE DATOS - Producción vs Local");
    console.log("=".repeat(70) + "\n");

    // 1. Probar conexiones
    console.log("1️⃣ Probando conexiones...\n");
    const connections = await this.testConnections();
    console.log();

    if (!connections.local) {
      console.log("❌ No se puede continuar sin conexión a la base de datos local.\n");
      await this.close();
      process.exit(1);
    }

    if (!connections.prod) {
      console.log("⚠️ No se puede conectar a producción. Solo se mostrará información de local.\n");
    }

    // 2. Comparar estructuras de tablas
    console.log("2️⃣ Comparando estructuras de tablas...\n");
    const structureComparisons = await this.compareTableStructures();

    const tablesWithDifferences = structureComparisons.filter(
      (c) => c.missingInLocal.length > 0 || c.missingInProd.length > 0
    );

    if (tablesWithDifferences.length > 0) {
      console.log("⚠️ Diferencias en estructuras encontradas:\n");
      tablesWithDifferences.forEach((comp) => {
        if (comp.missingInLocal.length > 0) {
          console.log(`   📋 ${comp.tableName}:`);
          console.log(`      ❌ Faltan en LOCAL: ${comp.missingInLocal.join(", ")}`);
        }
        if (comp.missingInProd.length > 0) {
          console.log(`      ⚠️ Faltan en PRODUCCIÓN: ${comp.missingInProd.join(", ")}`);
        }
      });
    } else {
      console.log("✅ Las estructuras de tablas coinciden\n");
    }
    console.log();

    // 3. Comparar datos de tablas importantes
    if (connections.prod) {
      console.log("3️⃣ Comparando datos de tablas importantes...\n");
      const importantTables = ["Users", "partners", "Roles", "States"];

      for (const tableName of importantTables) {
        try {
          const dataComp = await this.compareTableData(tableName);
          
          console.log(`📊 ${tableName}:`);
          console.log(`   Local: ${dataComp.localCount} registros`);
          console.log(`   Producción: ${dataComp.prodCount} registros`);

          if (dataComp.differences.length > 0) {
            console.log(`   ⚠️ Diferencias encontradas: ${dataComp.differences.length}`);
            
            // Agrupar por tipo de diferencia
            const passwordDiffs = dataComp.differences.filter(d => 
              d.field.toLowerCase().includes("password")
            );
            const otherDiffs = dataComp.differences.filter(d => 
              !d.field.toLowerCase().includes("password")
            );

            if (passwordDiffs.length > 0) {
              console.log(`\n   🔐 DIFERENCIAS EN CONTRASEÑAS:`);
              passwordDiffs.forEach((diff) => {
                console.log(`      ID ${diff.id}: ${diff.field}`);
                console.log(`         Local: ${diff.localValue}`);
                console.log(`         Producción: ${diff.prodValue}`);
              });
            }

            if (otherDiffs.length > 0 && otherDiffs.length <= 10) {
              console.log(`\n   📝 Otras diferencias:`);
              otherDiffs.slice(0, 10).forEach((diff) => {
                console.log(`      ID ${diff.id}: ${diff.field}`);
                console.log(`         Local: ${diff.localValue}`);
                console.log(`         Producción: ${diff.prodValue}`);
              });
            }
          } else {
            console.log(`   ✅ Sin diferencias detectadas`);
          }
          console.log();
        } catch (error: any) {
          console.log(`   ❌ Error comparando ${tableName}: ${error.message}\n`);
        }
      }
    }

    // 4. Resumen y recomendaciones
    console.log("=".repeat(70));
    console.log("📊 RESUMEN Y RECOMENDACIONES");
    console.log("=".repeat(70));
    console.log("\n💡 Para sincronizar LOCAL con PRODUCCIÓN:");
    console.log("   1. Ejecuta: npm run hash-passwords (para hashear contraseñas)");
    console.log("   2. Revisa las diferencias mostradas arriba");
    console.log("   3. Ajusta manualmente los datos que necesiten corrección\n");
    console.log("=".repeat(70) + "\n");

    await this.close();
  }

  async close(): Promise<void> {
    await this.localDB.close();
    if (this.prodDB) {
      await this.prodDB.close();
    }
  }
}

// Ejecutar comparación
const comparator = new DatabaseComparator();
comparator
  .generateReport()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error inesperado:", error);
    process.exit(1);
  });

