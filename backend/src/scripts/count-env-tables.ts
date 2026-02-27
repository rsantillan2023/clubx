/**
 * Conteo de registros por tabla en la base de datos configurada en .env (MySQL).
 * Usa la misma conexión que la aplicación (DEGIRA_DB).
 * Ejecutar: npm run count  o  npm run count:env
 */
import * as path from 'path';
import dotenv from 'dotenv';
import { QueryTypes } from 'sequelize';

// Cargar .env ANTES de importar connection (sino la contraseña no se lee)
const envPath = path.join(__dirname, '../../.env');
dotenv.config({ path: envPath });

async function countByTable() {
  // Importar conexión después de cargar .env para que config lea las variables
  const { DEGIRA_DB } = await import('../database/connection');

  console.log('\n' + '='.repeat(60));
  console.log('📊 REGISTROS POR TABLA — MySQL del .env (misma que la app)');
  console.log('='.repeat(60));

  const dialect = process.env.DB_DIALECT || '';
  const dbName = process.env.DB_DATABASE || process.env.DB_DATABASE_DEV || process.env.DB_DATABASE_PROD || '(no definido)';
  const passSet = process.env.DB_PASSWORD ? '*** (definida)' : '(vacía o no definida)';
  console.log('\n📋 Configuración (.env):');
  console.log(`   DB_HOST:     ${process.env.DB_HOST || '(no definido)'}`);
  console.log(`   DB_DATABASE: ${dbName}`);
  console.log(`   DB_USERNAME: ${process.env.DB_USERNAME || '(no definido)'}`);
  console.log(`   DB_PASSWORD: ${passSet}`);
  console.log(`   DB_DIALECT:  ${dialect || '(no definido)'}  ${dialect === 'mysql' ? '← MySQL' : ''}`);
  console.log(`   NODE_ENV:    ${process.env.NODE_ENV || 'development'}`);
  console.log(`   .env leído:  ${envPath}`);
  console.log('');

  try {
    await DEGIRA_DB.authenticate();
    console.log('✅ Conexión exitosa — la aplicación puede conectarse a esta base.\n');

    const currentDb = (DEGIRA_DB as any).config.database;
    console.log(`   Base de datos en uso: ${currentDb}\n`);

    const tables = await DEGIRA_DB.query<{ TABLE_NAME: string }>(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = :dbName AND TABLE_TYPE = 'BASE TABLE' 
       ORDER BY TABLE_NAME`,
      { replacements: { dbName: currentDb }, type: QueryTypes.SELECT }
    );

    if (!tables || tables.length === 0) {
      console.log('   No se encontraron tablas en esta base de datos.');
      await DEGIRA_DB.close();
      return;
    }

    const results: { table: string; count: number }[] = [];
    let total = 0;

    for (const row of tables) {
      const tableName = row.TABLE_NAME;
      try {
        const countRows = await DEGIRA_DB.query<{ cnt: number }>(
          `SELECT COUNT(*) as cnt FROM \`${tableName}\``,
          { type: QueryTypes.SELECT }
        );
        const count = Number(countRows?.[0]?.cnt ?? 0);
        total += count;
        results.push({ table: tableName, count });
      } catch (err: any) {
        results.push({ table: tableName, count: -1 });
      }
    }

    const maxNameLen = Math.max(...results.map((r) => r.table.length), 10);
    console.log(`   ${'Tabla'.padEnd(maxNameLen)} | Registros`);
    console.log('   ' + '-'.repeat(maxNameLen + 2) + '|' + '-'.repeat(12));

    for (const { table, count } of results) {
      const countStr = count >= 0 ? String(count) : '(error)';
      console.log(`   ${table.padEnd(maxNameLen)} | ${countStr}`);
    }

    console.log('   ' + '-'.repeat(maxNameLen + 2) + '|' + '-'.repeat(12));
    console.log(`   ${'TOTAL'.padEnd(maxNameLen)} | ${total}`);
    console.log('\n' + '='.repeat(60) + '\n');

    await DEGIRA_DB.close();
  } catch (error: any) {
    console.error('❌ Error al conectar a MySQL. Revisa tu .env:');
    console.error('   DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DATABASE (o DB_DATABASE_DEV), DB_DIALECT=mysql');
    console.error('   Detalle:', error.message || error);
    await DEGIRA_DB.close();
    process.exit(1);
  }
}

countByTable()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
