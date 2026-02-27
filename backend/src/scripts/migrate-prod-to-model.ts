/**
 * Migra datos desde la base de PRODUCCIÓN (esquema real) a una base LOCAL
 * que sigue el modelo del código (schema degira).
 *
 * Requisitos:
 * - La base destino debe existir y tener ya las tablas creadas con el modelo
 *   (ej. ejecutar antes sync con .env apuntando a la base local).
 * - Variables de entorno: SOURCE_* (prod) y TARGET_* (local).
 *
 * Uso: npx ts-node src/scripts/migrate-prod-to-model.ts
 */
import * as path from 'path';
import dotenv from 'dotenv';
import { Sequelize, QueryTypes } from 'sequelize';

dotenv.config({ path: path.join(__dirname, '../../.env') });

// ========== Configuración ==========
const sourceConfig = {
  host: process.env.SOURCE_DB_HOST || process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.SOURCE_DB_PORT || process.env.DB_PORT || '3306', 10),
  database: process.env.SOURCE_DB_DATABASE || process.env.DB_DATABASE_PROD || process.env.DB_DATABASE,
  username: process.env.SOURCE_DB_USERNAME || process.env.DB_USERNAME,
  password: process.env.SOURCE_DB_PASSWORD || process.env.DB_PASSWORD,
  dialect: 'mysql' as const,
  logging: false,
};

const targetConfig = {
  host: process.env.TARGET_DB_HOST || process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.TARGET_DB_PORT || process.env.DB_PORT || '3306', 10),
  database: process.env.TARGET_DB_DATABASE || process.env.DB_DATABASE_DEV || 'miclub_local',
  username: process.env.TARGET_DB_USERNAME || process.env.DB_USERNAME,
  password: process.env.TARGET_DB_PASSWORD || process.env.DB_PASSWORD,
  dialect: 'mysql' as const,
  logging: false,
};

// Orden de tablas para respetar FKs
const TABLE_ORDER = [
  'Actions', 'Days', 'Payment_Methods', 'Products_Services', 'Receivable_Concepts',
  'Roles', 'States', 'Users', 'Visits_Types',
  'Partners', 'Users_Roles', 'Visits', 'Tickets', 'Ticket_Details',
  'Operations_Types', 'Operations', 'Prices',
];

// Ruta a cada modelo (relativa a este script: src/scripts/)
const MODEL_PATHS: Record<string, string> = {
  Actions: '../../database/schemas/degira/models/action.model',
  Days: '../../database/schemas/degira/models/day.model',
  Operations: '../../database/schemas/degira/models/operation.model',
  'Operations_Types': '../../database/schemas/degira/models/operation_type.model',
  Partners: '../../database/schemas/degira/models/partner.model',
  Payment_Methods: '../../database/schemas/degira/models/payment_method.model.interface',
  Prices: '../../database/schemas/degira/models/price.model',
  Products_Services: '../../database/schemas/degira/models/product_service.model',
  Receivable_Concepts: '../../database/schemas/degira/models/receivable_concepts.model',
  Roles: '../../database/schemas/degira/models/rol.model',
  States: '../../database/schemas/degira/models/states.model',
  Ticket_Details: '../../database/schemas/degira/models/ticket_details.model',
  Tickets: '../../database/schemas/degira/models/ticket.model',
  Users: '../../database/schemas/degira/models/user.model',
  Users_Roles: '../../database/schemas/degira/models/user_role.model',
  Visits: '../../database/schemas/degira/models/visit.model',
  Visits_Types: '../../database/schemas/degira/models/visit_type.model',
};

function getModelColumns(tableName: string): string[] {
  try {
    const fullPath = path.join(__dirname, MODEL_PATHS[tableName]);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const model = require(fullPath)?.default;
    if (!model || !model.getAttributes) return [];
    return Object.keys(model.getAttributes());
  } catch {
    return [];
  }
}

/** Convierte fila prod → solo columnas del modelo. Ticket_Details.state: string → int */
function mapRowToModel(tableName: string, row: Record<string, unknown>, modelColumns: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const col of modelColumns) {
    if (!(col in row)) continue;
    let value = row[col];
    if (tableName === 'Ticket_Details' && col === 'state' && typeof value === 'string') {
      value = mapTicketDetailStateToInt(value);
    }
    out[col] = value;
  }
  return out;
}

function mapTicketDetailStateToInt(state: string): number | null {
  const map: Record<string, number> = {
    pending: 0, pendiente: 0, paid: 1, pagado: 1,
    cancelled: 2, cancelado: 2,
  };
  const key = (state || '').toLowerCase().trim();
  if (key in map) return map[key];
  const n = parseInt(state, 10);
  return Number.isNaN(n) ? null : n;
}

/** Índice: nombre, si es único, columnas en orden */
interface IndexDef {
  name: string;
  unique: boolean;
  columns: string[];
}

/** Lee todos los índices (no PRIMARY) de un schema por tabla */
async function getIndexesByTable(
  db: Sequelize,
  schema: string
): Promise<Map<string, IndexDef[]>> {
  const [rows] = await db.query(
    `SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME, NON_UNIQUE, SEQ_IN_INDEX
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = :schema AND INDEX_NAME != 'PRIMARY'
     ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX`,
    { replacements: { schema }, type: QueryTypes.SELECT }
  ) as [Array<{ TABLE_NAME: string; INDEX_NAME: string; COLUMN_NAME: string; NON_UNIQUE: number; SEQ_IN_INDEX: number }>, unknown];

  const byTable = new Map<string, IndexDef[]>();
  const keyToRows = new Map<string, typeof rows>();

  for (const r of rows) {
    const key = `${r.TABLE_NAME}\0${r.INDEX_NAME}`;
    if (!keyToRows.has(key)) keyToRows.set(key, []);
    keyToRows.get(key)!.push(r);
  }

  for (const [key, list] of keyToRows) {
    const [tableName, indexName] = key.split('\0');
    const unique = list[0].NON_UNIQUE === 0;
    const columns = list.sort((a, b) => a.SEQ_IN_INDEX - b.SEQ_IN_INDEX).map((a) => a.COLUMN_NAME);
    const tableList = byTable.get(tableName) || [];
    tableList.push({ name: indexName, unique, columns });
    byTable.set(tableName, tableList);
  }

  return byTable;
}

/** Añade en destino los índices que existen en prod y no en destino */
async function syncIndexesFromProd(
  sourceDb: Sequelize,
  targetDb: Sequelize,
  sourceSchema: string,
  targetSchema: string,
  tableOrder: string[]
) {
  const prodIndexes = await getIndexesByTable(sourceDb, sourceSchema);
  const targetIndexes = await getIndexesByTable(targetDb, targetSchema);

  console.log('\n📑 Sincronizando índices (prod → destino)...\n');

  for (const tableName of tableOrder) {
    const prodList = prodIndexes.get(tableName) || [];
    const targetList = (targetIndexes.get(tableName) || []).map((idx) => idx.name);
    const targetSet = new Set(targetList);

    for (const idx of prodList) {
      if (targetSet.has(idx.name)) continue;
      if (idx.columns.length === 0) continue;
      const cols = idx.columns.map((c) => `\`${c}\``).join(', ');
      const unique = idx.unique ? 'UNIQUE ' : '';
      const sql = `ALTER TABLE \`${tableName}\` ADD ${unique}INDEX \`${idx.name}\` (${cols})`;
      try {
        await targetDb.query(sql);
        console.log(`   ✅ ${tableName}.${idx.name}`);
      } catch (err: any) {
        console.error(`   ❌ ${tableName}.${idx.name}: ${err.message?.slice(0, 60)}`);
      }
    }
  }
  console.log('');
}

async function run() {
  console.log('\n' + '='.repeat(70));
  console.log('📦 MIGRACIÓN PROD (esquema real) → LOCAL (modelo nuevo)');
  console.log('='.repeat(70) + '\n');

  const sourceDb = new Sequelize({ ...sourceConfig, database: sourceConfig.database! });
  const targetDb = new Sequelize({ ...targetConfig, database: targetConfig.database! });

  try {
    await sourceDb.authenticate();
    console.log(`✅ Origen (prod): ${sourceConfig.database} @ ${sourceConfig.host}`);
    await targetDb.authenticate();
    console.log(`✅ Destino (local): ${targetConfig.database} @ ${targetConfig.host}\n`);

    await targetDb.query('SET FOREIGN_KEY_CHECKS = 0');
    let totalRows = 0;

    // Vaciar tablas destino en orden inverso (dependientes primero) para carga completa
    console.log('🗑  Vaciando tablas destino...');
    for (let i = TABLE_ORDER.length - 1; i >= 0; i--) {
      const tableName = TABLE_ORDER[i];
      try {
        await targetDb.query(`TRUNCATE TABLE \`${tableName}\``);
      } catch (e) {
        // Tabla puede no existir aún
      }
    }
    console.log('');

    for (const tableName of TABLE_ORDER) {
      const modelColumns = getModelColumns(tableName);
      if (modelColumns.length === 0) {
        console.log(`⚠️  ${tableName}: modelo no encontrado, se omite.`);
        continue;
      }

      const [rowsRaw] = await sourceDb.query(
        `SELECT * FROM \`${tableName}\``,
        { type: QueryTypes.SELECT }
      );
      const rowsArray = (Array.isArray(rowsRaw) ? rowsRaw : []) as Record<string, unknown>[];
      if (rowsArray.length === 0) {
        console.log(`📋 ${tableName}: 0 filas`);
        continue;
      }

      const cols = modelColumns.map((c) => `\`${c}\``).join(', ');
      const placeholders = modelColumns.map(() => '?').join(', ');
      const insertSql = `INSERT INTO \`${tableName}\` (${cols}) VALUES (${placeholders})`;

      let inserted = 0;
      for (const row of rowsArray) {
        const mapped = mapRowToModel(tableName, row, modelColumns);
        const values = modelColumns.map((c) => mapped[c]);
        try {
          await targetDb.query(insertSql, { replacements: values });
          inserted++;
        } catch (err: any) {
          console.error(`   ❌ ${tableName}: ${err.message?.slice(0, 80)}`);
        }
      }
      totalRows += inserted;
      console.log(`📦 ${tableName}: ${inserted}/${rowsArray.length} filas`);
    }

    await targetDb.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('\n' + '='.repeat(70));
    console.log(`✅ Total filas insertadas: ${totalRows}`);
    console.log('='.repeat(70));

    // Índices: crear en destino los que existen en prod y no están en el modelo
    await syncIndexesFromProd(
      sourceDb,
      targetDb,
      sourceConfig.database!,
      targetConfig.database!,
      TABLE_ORDER
    );

    console.log('='.repeat(70) + '\n');
  } finally {
    await sourceDb.close();
    await targetDb.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
