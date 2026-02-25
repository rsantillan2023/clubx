import dotenv from 'dotenv';
dotenv.config();
import compression from 'compression';
import morgan from 'morgan';
import cors from 'cors';
import express, { Application, json, urlencoded } from 'express';
import path from 'path';
import { initAllAssociations } from './database';
import routesDir from './routes';
import updateMembershipCron from "./workers/updateMembershipCron";
import partnersWithoutVisitsCron from "./workers/partnersWithoutVisitsCron";

// Permitir configuración mediante variable de entorno, por defecto '0.0.0.0' para escuchar en todas las interfaces
const hostname = process.env.HOST || '0.0.0.0';

const port = process.env.PORT || 3000;

const app: Application = express();

app.set('port', port);

// Middlewares
app.use(compression());
app.use(
  morgan((tokens, req, res) => {
    if ((tokens as any)['response-time'](req, res) > 1500)
      return [
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        tokens.res(req, res, 'content-length'),
        '-',
        tokens['response-time'](req, res),
        'ms',
      ].join(' ');
  }),
);
app.use(cors());
app.use(json({ limit: '50mb' }));
app.use(urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos (imágenes subidas) ANTES de las rutas de la API
// Determinar la ruta correcta según el entorno
let uploadsPath: string;
if (__dirname.includes('dist')) {
  // Producción: dist está en backend/dist, uploads debería estar en backend/uploads
  uploadsPath = path.join(__dirname, '../uploads');
} else {
  // Desarrollo con ts-node: __dirname es backend/src, uploads está en backend/src/uploads
  uploadsPath = path.join(__dirname, './uploads');
}

console.log('Serving static files from:', uploadsPath);
console.log('__dirname:', __dirname);
console.log('process.cwd():', process.cwd());

// Verificar que el directorio existe
const fs = require('fs');
if (!fs.existsSync(uploadsPath)) {
  console.warn('WARNING: Uploads directory does not exist:', uploadsPath);
  console.warn('Attempting to create directory...');
  try {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log('Directory created successfully');
  } catch (error) {
    console.error('Failed to create directory:', error);
  }
} else {
  console.log('Uploads directory exists');
  // Listar archivos en products-services para verificar
  const productsServicesPath = path.join(uploadsPath, 'products-services');
  if (fs.existsSync(productsServicesPath)) {
    const files = fs.readdirSync(productsServicesPath);
    console.log(`Found ${files.length} files in products-services directory`);
  }
}

// Servir archivos estáticos ANTES de las rutas de la API
app.use('/uploads', express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    // Agregar headers CORS si es necesario
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

// Routes
app.use('', routesDir);

// DB
initAllAssociations();

app.listen({ hostname, port }, () => {
  console.log(`Server running on http://${hostname}:${port}`);
  if (process.env.CRON_ENABLE === 'true') {
    console.log('Cron enabled');
    partnersWithoutVisitsCron.start();
    updateMembershipCron.start();
  } else {
    console.log('Cron disabled');    
    partnersWithoutVisitsCron.stop();
    updateMembershipCron.stop();
  }
});
