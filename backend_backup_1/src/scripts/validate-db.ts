import dotenv from "dotenv";
dotenv.config();

import { Sequelize } from "sequelize";
import { DEGIRA_DB } from "../database/connection";

// Lista de tablas esperadas basadas en los modelos y scripts SQL
const EXPECTED_TABLES = [
  "Users",
  "Roles",
  "States",
  "Actions",
  "partners",
  "UserDealers",
  "Visits",
  "Tickets",
  "Ticket_Details",
  "Products_Services",
  "Prices",
  "Payment_Methods",
  "Operations",
  "Operations_Types",
  "Receivable_Concepts",
  "Days",
  "Users_Roles",
  "Visits_Types",
];

interface ValidationResult {
  success: boolean;
  message: string;
  details?: any;
}

class DatabaseValidator {
  private sequelize: Sequelize;

  constructor() {
    this.sequelize = DEGIRA_DB;
  }

  async validateConnection(): Promise<ValidationResult> {
    try {
      await this.sequelize.authenticate();
      return {
        success: true,
        message: "✅ Conexión a la base de datos exitosa",
        details: {
          database: process.env.DB_DATABASE,
          host: process.env.DB_HOST,
          dialect: process.env.DB_DIALECT,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: "❌ Error al conectar con la base de datos",
        details: {
          error: error.message,
          database: process.env.DB_DATABASE,
          host: process.env.DB_HOST,
        },
      };
    }
  }

  async validateDatabaseExists(): Promise<ValidationResult> {
    try {
      const [results]: any = await this.sequelize.query(
        `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${process.env.DB_DATABASE}'`
      );

      if (results.length > 0) {
        return {
          success: true,
          message: `✅ La base de datos '${process.env.DB_DATABASE}' existe`,
        };
      } else {
        return {
          success: false,
          message: `❌ La base de datos '${process.env.DB_DATABASE}' NO existe`,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: "❌ Error al verificar la base de datos",
        details: { error: error.message },
      };
    }
  }

  async validateTables(): Promise<ValidationResult> {
    try {
      const [tables]: any = await this.sequelize.query(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '${process.env.DB_DATABASE}'`
      );

      const existingTables = tables.map((row: any) => row.TABLE_NAME);
      const existingTablesLower = existingTables.map((t: string) => t.toLowerCase());
      
      // Comparación case-insensitive
      const missingTables = EXPECTED_TABLES.filter(
        (table) => !existingTablesLower.includes(table.toLowerCase())
      );
      
      // Encontrar las tablas que coinciden (case-insensitive)
      const matchedTables: { expected: string; actual: string }[] = [];
      EXPECTED_TABLES.forEach((expectedTable) => {
        const found = existingTables.find(
          (actual: string) => actual.toLowerCase() === expectedTable.toLowerCase()
        );
        if (found) {
          matchedTables.push({ expected: expectedTable, actual: found });
        }
      });
      
      const extraTables = existingTables.filter(
        (table: string) => !EXPECTED_TABLES.some(
          (expected) => expected.toLowerCase() === table.toLowerCase()
        )
      );

      const allTablesExist = missingTables.length === 0;

      return {
        success: allTablesExist,
        message: allTablesExist
          ? `✅ Todas las tablas esperadas existen (${EXPECTED_TABLES.length} tablas)`
          : `⚠️ Faltan ${missingTables.length} tabla(s)`,
        details: {
          totalExpected: EXPECTED_TABLES.length,
          totalFound: existingTables.length,
          matchedTables: matchedTables.length > 0 ? matchedTables : undefined,
          missingTables: missingTables.length > 0 ? missingTables : undefined,
          extraTables: extraTables.length > 0 ? extraTables : undefined,
          existingTables,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: "❌ Error al verificar las tablas",
        details: { error: error.message },
      };
    }
  }

  async validateTableStructure(tableName: string): Promise<ValidationResult> {
    try {
      // Buscar el nombre real de la tabla (case-insensitive)
      const [tables]: any = await this.sequelize.query(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_SCHEMA = '${process.env.DB_DATABASE}' 
         AND LOWER(TABLE_NAME) = LOWER('${tableName}')`
      );

      if (tables.length === 0) {
        return {
          success: false,
          message: `❌ La tabla '${tableName}' no existe`,
        };
      }

      const actualTableName = tables[0].TABLE_NAME;

      const [columns]: any = await this.sequelize.query(
        `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = '${process.env.DB_DATABASE}' 
         AND TABLE_NAME = '${actualTableName}'`
      );

      return {
        success: true,
        message: `✅ La tabla '${actualTableName}' tiene ${columns.length} columna(s)`,
        details: { columns, actualTableName },
      };
    } catch (error: any) {
      return {
        success: false,
        message: `❌ Error al verificar la estructura de '${tableName}'`,
        details: { error: error.message },
      };
    }
  }

  async getTableRowCount(tableName: string): Promise<number> {
    try {
      // Buscar el nombre real de la tabla (case-insensitive)
      const [tables]: any = await this.sequelize.query(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_SCHEMA = '${process.env.DB_DATABASE}' 
         AND LOWER(TABLE_NAME) = LOWER('${tableName}')`
      );

      if (tables.length === 0) {
        return -1;
      }

      const actualTableName = tables[0].TABLE_NAME;
      const [results]: any = await this.sequelize.query(
        `SELECT COUNT(*) as count FROM \`${actualTableName}\``
      );
      return results[0]?.count || 0;
    } catch (error) {
      return -1;
    }
  }

  async generateReport(): Promise<void> {
    console.log("\n" + "=".repeat(60));
    console.log("🔍 VALIDACIÓN DE BASE DE DATOS - MiClub");
    console.log("=".repeat(60) + "\n");

    // Validar conexión
    console.log("1️⃣ Validando conexión...");
    const connectionResult = await this.validateConnection();
    console.log(`   ${connectionResult.message}`);
    if (connectionResult.details) {
      console.log(`   Detalles:`, connectionResult.details);
    }
    console.log();

    if (!connectionResult.success) {
      console.log("❌ No se puede continuar sin conexión a la base de datos.\n");
      await this.sequelize.close();
      process.exit(1);
    }

    // Validar existencia de la base de datos
    console.log("2️⃣ Validando existencia de la base de datos...");
    const dbResult = await this.validateDatabaseExists();
    console.log(`   ${dbResult.message}`);
    console.log();

    if (!dbResult.success) {
      console.log("❌ La base de datos no existe. Debes crearla primero.\n");
      await this.sequelize.close();
      process.exit(1);
    }

    // Validar tablas
    console.log("3️⃣ Validando tablas...");
    const tablesResult = await this.validateTables();
    console.log(`   ${tablesResult.message}`);
    if (tablesResult.details) {
      const details = tablesResult.details;
      console.log(`   Total esperadas: ${details.totalExpected}`);
      console.log(`   Total encontradas: ${details.totalFound}`);
      
      if (details.matchedTables && details.matchedTables.length > 0) {
        const caseMismatches = details.matchedTables.filter(
          (m: { expected: string; actual: string }) => m.expected !== m.actual
        );
        if (caseMismatches.length > 0) {
          console.log(`\n   ℹ️ Diferencias de mayúsculas/minúsculas (no es un problema):`);
          caseMismatches.forEach((match: { expected: string; actual: string }) => {
            console.log(`      Esperado: '${match.expected}' → Encontrado: '${match.actual}'`);
          });
        }
      }
      
      if (details.missingTables && details.missingTables.length > 0) {
        console.log(`\n   ⚠️ Tablas faltantes:`);
        details.missingTables.forEach((table: string) => {
          console.log(`      - ${table}`);
        });
      }
      
      if (details.extraTables && details.extraTables.length > 0) {
        console.log(`\n   ℹ️ Tablas adicionales encontradas:`);
        details.extraTables.forEach((table: string) => {
          console.log(`      - ${table}`);
        });
      }
    }
    console.log();

    // Validar estructura de tablas principales
    console.log("4️⃣ Validando estructura de tablas principales...");
    const mainTables = ["Users", "Roles", "States", "Actions", "partners"];
    for (const table of mainTables) {
      const structureResult = await this.validateTableStructure(table);
      if (structureResult.success) {
        const rowCount = await this.getTableRowCount(table);
        console.log(
          `   ${structureResult.message}${rowCount >= 0 ? ` (${rowCount} registros)` : ""}`
        );
      } else {
        console.log(`   ${structureResult.message}`);
      }
    }
    console.log();

    // Resumen final
    console.log("=".repeat(60));
    console.log("📊 RESUMEN");
    console.log("=".repeat(60));
    
    const allValid = connectionResult.success && dbResult.success && tablesResult.success;
    
    if (allValid) {
      console.log("✅ La base de datos está correctamente configurada");
      console.log(`   Base de datos: ${process.env.DB_DATABASE}`);
      console.log(`   Host: ${process.env.DB_HOST} (Base de datos LOCAL)`);
      console.log(`   Tablas: ${tablesResult.details?.totalFound || 0}/${EXPECTED_TABLES.length}`);
      console.log("\n   ✅ Conexión exitosa a la base de datos local");
      console.log("   ✅ Todas las tablas necesarias están presentes");
    } else {
      console.log("⚠️ La base de datos necesita configuración adicional");
      if (!connectionResult.success) {
        console.log("   ❌ Problema de conexión");
      }
      if (!dbResult.success) {
        console.log("   ❌ Base de datos no existe");
      }
      if (!tablesResult.success) {
        console.log("   ⚠️ Faltan tablas");
        if (tablesResult.details?.missingTables) {
          console.log("\n   Para crear las tablas faltantes, ejecuta en MySQL:");
          tablesResult.details.missingTables.forEach((table: string) => {
            console.log(`   - Busca el script SQL: degira_develop_${table}.sql`);
          });
        }
      }
    }
    
    console.log("=".repeat(60) + "\n");

    await this.sequelize.close();
  }
}

// Ejecutar validación
const validator = new DatabaseValidator();
validator
  .generateReport()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error inesperado:", error);
    process.exit(1);
  });

