import express, { Application, json, urlencoded } from 'express';
import cors from 'cors';
import { LOCAL_DB, testLocalConnection } from '../../database/local/connection';
import routes from './routes';

// Importar modelos para inicializar asociaciones (necesarios para sync)
import '../../database/local/models/partner.model';
import '../../database/local/models/product_service.model';
import '../../database/local/models/visit.model';
import '../../database/local/models/ticket.model';
import '../../database/local/models/ticket_details.model';
import '../../database/local/models/sync_metadata.model';

const PORT = process.env.LOCAL_API_PORT || 3001;

const app: Application = express();

// Middlewares
app.use(cors());
app.use(json({ limit: '50mb' }));
app.use(urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/v1', routes);

// Inicializar base de datos y asociaciones
const initLocalDatabase = async () => {
  try {
    // Verificar conexión
    const isConnected = await testLocalConnection();
    if (!isConnected) {
      throw new Error('No se pudo conectar a SQLite local');
    }

    // Sincronizar modelos (crear tablas si no existen)
    await LOCAL_DB.sync({ alter: false }); // alter: false para no modificar estructura existente

    // Definir asociaciones
    const { initLocalAssociations } = await import('../../database/local/associations');
    initLocalAssociations();

    console.log('✅ Base de datos local inicializada correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar base de datos local:', error);
    process.exit(1);
  }
};

// Iniciar servidor
const startServer = async () => {
  await initLocalDatabase();

  app.listen(PORT, () => {
    console.log(`🚀 API Local corriendo en http://localhost:${PORT}`);
    console.log(`📦 Endpoints disponibles:`);
    console.log(`   - GET  /api/v1/health`);
    console.log(`   - GET  /api/v1/consumptions/get/featured`);
    console.log(`   - GET  /api/v1/partners/inside`);
    console.log(`   - POST /api/v1/consumptions/create`);
    console.log(`   - GET  /api/v1/sync/status`);
    console.log(`   - POST /api/v1/sync/tickets`);
  });
};

// Manejar errores no capturados
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Iniciar
startServer().catch((error) => {
  console.error('❌ Error al iniciar servidor local:', error);
  process.exit(1);
});

export default app;

