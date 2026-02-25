import * as cron from 'node-cron';
import { syncPartners } from '../src/database/local/sync/sync-partners';
import { syncProducts } from '../src/database/local/sync/sync-products';
import { syncVisits } from '../src/database/local/sync/sync-visits';
import { LOCAL_DB, testLocalConnection } from '../src/database/local/connection';

/**
 * Servicio de sincronización para Windows
 * Sincroniza datos del servidor remoto a SQLite local automáticamente
 */
class SyncService {
  private isRunning = false;

  /**
   * Inicializar servicio
   */
  async init() {
    console.log('🚀 Iniciando Servicio de Sincronización...');

    // Verificar conexión a SQLite
    const isConnected = await testLocalConnection();
    if (!isConnected) {
      console.error('❌ No se pudo conectar a SQLite local. El servicio no se iniciará.');
      process.exit(1);
    }

    // Sincronizar Partners al iniciar (una vez al día)
    console.log('📥 Sincronizando Partners (inicial)...');
    await syncPartners();

    // Configurar tareas programadas
    this.setupScheduledTasks();

    this.isRunning = true;
    console.log('✅ Servicio de Sincronización iniciado correctamente');
    console.log('📅 Tareas programadas:');
    console.log('   - Partners: Diario al iniciar');
    console.log('   - Products: Cada 15 minutos');
    console.log('   - Visits: Cada 15 minutos');
  }

  /**
   * Configurar tareas programadas (cron jobs)
   */
  private setupScheduledTasks() {
    // Sincronizar Products cada 15 minutos
    cron.schedule('*/15 * * * *', async () => {
      if (this.isRunning) {
        console.log('⏰ Ejecutando sincronización de Products_Services...');
        await syncProducts();
      }
    });

    // Sincronizar Visits cada 15 minutos
    cron.schedule('*/15 * * * *', async () => {
      if (this.isRunning) {
        console.log('⏰ Ejecutando sincronización de Visits...');
        await syncVisits();
      }
    });

    // Sincronizar Partners diario a las 2:00 AM
    cron.schedule('0 2 * * *', async () => {
      if (this.isRunning) {
        console.log('⏰ Ejecutando sincronización diaria de Partners...');
        await syncPartners();
      }
    });
  }

  /**
   * Detener servicio
   */
  stop() {
    this.isRunning = false;
    console.log('🛑 Servicio de Sincronización detenido');
  }
}

// Iniciar servicio si se ejecuta directamente
if (require.main === module) {
  const service = new SyncService();
  service.init().catch((error) => {
    console.error('❌ Error al iniciar servicio:', error);
    process.exit(1);
  });

  // Manejar señales de terminación
  process.on('SIGINT', () => {
    console.log('\n🛑 Recibida señal SIGINT, deteniendo servicio...');
    service.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Recibida señal SIGTERM, deteniendo servicio...');
    service.stop();
    process.exit(0);
  });
}

export default SyncService;

