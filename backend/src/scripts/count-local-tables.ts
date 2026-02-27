/**
 * Conteo en SQLite LOCAL (archivo local.db). No usa .env.
 * Para contar en MySQL del .env usa:  npm run count   o   npm run count:env
 */
import * as path from 'path';
import { LOCAL_DB, testLocalConnection } from '../database/local/connection';

// Cargar modelos para registrar tablas en Sequelize
import '../database/local/models/partner.model';
import '../database/local/models/product_service.model';
import '../database/local/models/visit.model';
import '../database/local/models/ticket.model';
import '../database/local/models/ticket_details.model';
import '../database/local/models/sync_metadata.model';

import PartnerLocal from '../database/local/models/partner.model';
import ProductServiceLocal from '../database/local/models/product_service.model';
import VisitLocal from '../database/local/models/visit.model';
import TicketLocal from '../database/local/models/ticket.model';
import TicketDetailsLocal from '../database/local/models/ticket_details.model';
import SyncMetadata from '../database/local/models/sync_metadata.model';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MODELS: { name: string; model: any }[] = [
  { name: 'Partners', model: PartnerLocal },
  { name: 'Products_Services', model: ProductServiceLocal },
  { name: 'Visits', model: VisitLocal },
  { name: 'Tickets', model: TicketLocal },
  { name: 'Ticket_Details', model: TicketDetailsLocal },
  { name: 'sync_metadata', model: SyncMetadata },
];

async function countByTable() {
  console.log('\n' + '='.repeat(50));
  console.log('📊 REGISTROS POR TABLA — SQLite LOCAL (no es MySQL del .env)');
  console.log('='.repeat(50));
  console.log('   Para MySQL del .env ejecuta:  npm run count');
  console.log('');

  const dbPath = path.join(__dirname, '../../data/local.db');
  console.log(`\n📁 Base de datos: ${dbPath}\n`);

  try {
    const connected = await testLocalConnection();
    if (!connected) {
      throw new Error('No se pudo conectar a la base de datos local');
    }

    await LOCAL_DB.sync({ alter: false });

    let total = 0;
    const results: { table: string; count: number }[] = [];

    for (const { name, model } of MODELS) {
      const count = await model.count();
      total += count;
      results.push({ table: name, count });
    }

    const maxNameLen = Math.max(...results.map((r) => r.table.length), 10);
    console.log(`   ${'Tabla'.padEnd(maxNameLen)} | Registros`);
    console.log('   ' + '-'.repeat(maxNameLen + 2) + '|' + '-'.repeat(12));

    for (const { table, count } of results) {
      console.log(`   ${table.padEnd(maxNameLen)} | ${count}`);
    }

    console.log('   ' + '-'.repeat(maxNameLen + 2) + '|' + '-'.repeat(12));
    console.log(`   ${'TOTAL'.padEnd(maxNameLen)} | ${total}`);
    console.log('\n' + '='.repeat(50) + '\n');

    await LOCAL_DB.close();
  } catch (error: any) {
    console.error('❌ Error:', error.message || error);
    await LOCAL_DB.close();
    process.exit(1);
  }
}

countByTable()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
