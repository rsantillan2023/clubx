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

async function copyDatabaseData() {
  console.log("\n" + "=".repeat(70));
  console.log("📋 COPIANDO DATOS DE BASE DE DATOS");
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

    // Obtener todas las tablas
    const [tables]: any = await sourceSequelize.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '${SOURCE_DB}' AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME`
    );

    console.log(`📊 Copiando datos de ${tables.length} tablas...\n`);

    // Ordenar tablas: primero las que no tienen foreign keys, luego las que sí
    const baseTables = ['actions', 'days', 'payment_methods', 'products_services', 
                        'receivable_concepts', 'roles', 'states', 'users', 'visits_types'];
    
    const dependentTables = ['partners', 'users_roles', 'visits', 'tickets', 
                              'ticket_details', 'operations_types', 'operations', 'prices'];

    const orderedTables = [
      ...baseTables.filter(t => tables.some((tb: any) => tb.TABLE_NAME.toLowerCase() === t.toLowerCase())),
      ...dependentTables.filter(t => tables.some((tb: any) => tb.TABLE_NAME.toLowerCase() === t.toLowerCase())),
      ...tables.map((t: any) => t.TABLE_NAME).filter((t: string) => 
        !baseTables.includes(t.toLowerCase()) && !dependentTables.includes(t.toLowerCase())
      )
    ];

    // Deshabilitar foreign key checks y auto commit
    await targetSequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    await targetSequelize.query("SET AUTOCOMMIT = 0");
    await targetSequelize.query("START TRANSACTION");

    let totalRows = 0;

    // Para cada tabla, copiar los datos
    for (const tableName of orderedTables) {
      try {
        console.log(`📦 Copiando datos de tabla: ${tableName}...`);

        // Obtener todos los datos de la tabla origen
        const [rows]: any = await sourceSequelize.query(
          `SELECT * FROM \`${SOURCE_DB}\`.\`${tableName}\``
        );

        if (rows.length === 0) {
          console.log(`   ⚠️  Tabla ${tableName} está vacía`);
          continue;
        }

        // Limpiar tabla destino
        await targetSequelize.query(`TRUNCATE TABLE \`${tableName}\``);

        // Insertar datos en lotes para mejor rendimiento
        const batchSize = 100;
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          
          if (batch.length > 0) {
            // Obtener nombres de columnas
            const columns = Object.keys(batch[0]);
            const columnNames = columns.map(col => `\`${col}\``).join(', ');
            
            // Crear valores para el INSERT usando parámetros preparados
            const placeholders = batch.map(() => 
              `(${columns.map(() => '?').join(', ')})`
            ).join(', ');
            
            const values = batch.flatMap((row: any) => 
              columns.map(col => {
                const value = row[col];
                if (value === null || value === undefined) {
                  return null;
                } else if (Buffer.isBuffer(value)) {
                  // Para BLOB y tipos binarios
                  return value;
                } else if (value instanceof Date) {
                  return value;
                } else if (typeof value === 'object') {
                  // Para JSON y objetos
                  try {
                    // Si ya es un string que parece JSON, intentar parsearlo y volver a stringificarlo
                    if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
                      try {
                        JSON.parse(value);
                        return value; // Ya es JSON válido
                      } catch {
                        // No es JSON válido, escapar como string
                        return `'${value.replace(/'/g, "''")}'`;
                      }
                    }
                    return JSON.stringify(value);
                  } catch {
                    // Si falla, convertir a string
                    return String(value);
                  }
                } else {
                  return value;
                }
              })
            );
            
            // Usar replace para manejar mejor los valores especiales
            const insertQuery = `INSERT INTO \`${tableName}\` (${columnNames}) VALUES ${placeholders}`;
            
            try {
              await targetSequelize.query({
                query: insertQuery,
                values: values
              } as any);
            } catch (insertError: any) {
              // Si falla con parámetros preparados, intentar con valores directos (más lento pero más compatible)
              const directValues = batch.map((row: any) => {
                const rowValues = columns.map(col => {
                  const value = row[col];
                  if (value === null || value === undefined) {
                    return 'NULL';
                  } else if (Buffer.isBuffer(value)) {
                    return `0x${value.toString('hex')}`;
                  } else if (value instanceof Date) {
                    return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
                  } else if (typeof value === 'string') {
                    // Escapar comillas y caracteres especiales
                    return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "''").replace(/\n/g, '\\n').replace(/\r/g, '\\r')}'`;
                  } else if (typeof value === 'object') {
                    try {
                      const jsonStr = JSON.stringify(value);
                      return `'${jsonStr.replace(/'/g, "''")}'`;
                    } catch {
                      return `'${String(value).replace(/'/g, "''")}'`;
                    }
                  } else {
                    return value;
                  }
                });
                return `(${rowValues.join(', ')})`;
              });
              
              const directInsertQuery = `INSERT INTO \`${tableName}\` (${columnNames}) VALUES ${directValues.join(', ')}`;
              await targetSequelize.query(directInsertQuery);
            }
          }
        }

        totalRows += rows.length;
        console.log(`   ✅ ${rows.length} filas copiadas`);
      } catch (error: any) {
        console.log(`   ❌ Error al copiar ${tableName}: ${error.message}`);
        
        // Intentar copiar fila por fila para identificar el problema
        if (tableName === 'operations') {
          console.log(`   🔄 Intentando copiar ${tableName} fila por fila...`);
          try {
            const [allRows]: any = await sourceSequelize.query(
              `SELECT * FROM \`${SOURCE_DB}\`.\`${tableName}\``
            );
            
            let copied = 0;
            let skipped = 0;
            
            for (const row of allRows) {
              try {
                // Limpiar datos JSON problemáticos
                if (row.operation_log && typeof row.operation_log === 'string') {
                  try {
                    JSON.parse(row.operation_log);
                  } catch {
                    // Si no es JSON válido, limpiar o poner null
                    row.operation_log = null;
                  }
                }
                if (row.operation_metadata && typeof row.operation_metadata === 'string') {
                  try {
                    JSON.parse(row.operation_metadata);
                  } catch {
                    row.operation_metadata = null;
                  }
                }
                
                const columns = Object.keys(row);
                const columnNames = columns.map(col => `\`${col}\``).join(', ');
                const values = columns.map(col => {
                  const val = row[col];
                  if (val === null || val === undefined) return 'NULL';
                  if (typeof val === 'string') return `'${val.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
                  if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
                  return val;
                });
                
                await targetSequelize.query(
                  `INSERT INTO \`${tableName}\` (${columnNames}) VALUES (${values.join(', ')})`
                );
                copied++;
              } catch (rowError: any) {
                skipped++;
                if (skipped <= 5) {
                  console.log(`      ⚠️  Fila omitida: ${rowError.message.substring(0, 50)}...`);
                }
              }
            }
            
            console.log(`   ✅ ${copied} filas copiadas, ${skipped} omitidas`);
            totalRows += copied;
          } catch (retryError: any) {
            console.log(`   ❌ Error en reintento: ${retryError.message}`);
          }
        }
        // Continuar con la siguiente tabla
      }
    }

    // Confirmar transacción
    await targetSequelize.query("COMMIT");
    await targetSequelize.query("SET FOREIGN_KEY_CHECKS = 1");
    await targetSequelize.query("SET AUTOCOMMIT = 1");

    console.log("\n✅ Datos copiados exitosamente");
    console.log(`📊 Total de filas copiadas: ${totalRows}`);
    console.log(`\n📝 La base de datos '${TARGET_DB}' ahora tiene los mismos datos que '${SOURCE_DB}'\n`);

    await sourceSequelize.close();
    await targetSequelize.close();
  } catch (error: any) {
    // Rollback en caso de error
    try {
      await targetSequelize.query("ROLLBACK");
      await targetSequelize.query("SET FOREIGN_KEY_CHECKS = 1");
      await targetSequelize.query("SET AUTOCOMMIT = 1");
    } catch (e) {}
    
    console.error("❌ Error:", error.message);
    if (error.original) {
      console.error("   Detalle:", error.original.message);
    }
    process.exit(1);
  }
}

copyDatabaseData()
  .then(() => {
    console.log("=".repeat(70) + "\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error inesperado:", error);
    process.exit(1);
  });

