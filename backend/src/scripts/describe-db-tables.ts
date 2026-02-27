/**
 * Obtiene el DESCRIBE real de cada tabla de la BD del servidor (MySQL).
 * Ejecutar: npx ts-node src/scripts/describe-db-tables.ts
 * Salida: JSON con tablas y columnas para documentación.
 */
import * as path from 'path';
import dotenv from 'dotenv';

const envPath = path.join(__dirname, '../../.env');
dotenv.config({ path: envPath });

interface ColumnRow {
  COLUMN_NAME: string;
  DATA_TYPE: string;
  CHARACTER_MAXIMUM_LENGTH: number | null;
  NUMERIC_PRECISION: number | null;
  NUMERIC_SCALE: number | null;
  IS_NULLABLE: string;
  COLUMN_KEY: string;
  EXTRA: string;
}

async function main() {
  const { DEGIRA_DB } = await import('../database/connection');
  const { QueryTypes } = await import('sequelize');

  await DEGIRA_DB.authenticate();
  const dbName = (DEGIRA_DB as any).config.database;

  const tables: { TABLE_NAME: string }[] = await DEGIRA_DB.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
     WHERE TABLE_SCHEMA = :dbName AND TABLE_TYPE = 'BASE TABLE' 
     ORDER BY TABLE_NAME`,
    { replacements: { dbName }, type: QueryTypes.SELECT }
  );

  const result: Record<string, Array<Record<string, string>>> = {};

  for (const { TABLE_NAME } of tables) {
    const cols: ColumnRow[] = await DEGIRA_DB.query(
      `SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, 
              NUMERIC_PRECISION, NUMERIC_SCALE, IS_NULLABLE, COLUMN_KEY, EXTRA
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = :dbName AND TABLE_NAME = :tableName
       ORDER BY ORDINAL_POSITION`,
      {
        replacements: { dbName, tableName: TABLE_NAME },
        type: QueryTypes.SELECT,
      }
    );

    result[TABLE_NAME] = cols.map((c) => {
      let type = c.DATA_TYPE.toUpperCase();
      if (c.CHARACTER_MAXIMUM_LENGTH) type += `(${c.CHARACTER_MAXIMUM_LENGTH})`;
      else if (c.NUMERIC_PRECISION != null) {
        type += `(${c.NUMERIC_PRECISION}`;
        if (c.NUMERIC_SCALE != null) type += `,${c.NUMERIC_SCALE}`;
        type += ')';
      }
      return {
        Field: c.COLUMN_NAME,
        Type: type,
        Null: c.IS_NULLABLE === 'YES' ? 'YES' : 'NO',
        Key: c.COLUMN_KEY || '',
        Extra: c.EXTRA || '',
      };
    });
  }

  console.log(JSON.stringify(result, null, 2));
  await DEGIRA_DB.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
