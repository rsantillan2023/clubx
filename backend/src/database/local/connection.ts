import { Sequelize } from 'sequelize';
import * as path from 'path';
import * as fs from 'fs';

// Crear directorio data si no existe
const dataDir = path.join(__dirname, '../../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Ruta al archivo SQLite
const dbPath = path.join(dataDir, 'local.db');

console.log(`📦 Conectando a base de datos SQLite local: ${dbPath}`);

export const LOCAL_DB = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false, // Cambiar a console.log para debug si es necesario
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    freezeTableName: true,
    timestamps: false
  }
});

// Función para verificar conexión
export const testLocalConnection = async (): Promise<boolean> => {
  try {
    await LOCAL_DB.authenticate();
    console.log('✅ Conexión a SQLite local establecida correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error al conectar a SQLite local:', error);
    return false;
  }
};

