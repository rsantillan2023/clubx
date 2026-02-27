import { Request, Response, Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { responseHandler } from '../../helpers';
import { IErrorResponse } from '../../types/errorResponse.interface';

const router = Router();

// Configurar el directorio de almacenamiento
// En Railway: usar el mismo path que index.ts (RAILWAY_VOLUME_MOUNT_PATH o UPLOADS_PATH) para persistir en Volume
const projectRoot = process.cwd();
const baseUploadsDir = process.env.RAILWAY_VOLUME_MOUNT_PATH || process.env.UPLOADS_PATH || path.join(projectRoot, 'uploads');
const uploadsDir = path.join(baseUploadsDir, 'products-services');

// Normalizar la ruta para evitar problemas con barras
const normalizedUploadsDir = path.normalize(uploadsDir);

console.log('Upload directory (normalized):', normalizedUploadsDir);
console.log('Upload directory (absolute):', path.resolve(normalizedUploadsDir));

// Crear el directorio si no existe
if (!fs.existsSync(normalizedUploadsDir)) {
  fs.mkdirSync(normalizedUploadsDir, { recursive: true });
  console.log('Created upload directory:', normalizedUploadsDir);
} else {
  console.log('Upload directory already exists');
}

// Filtro para solo aceptar imágenes
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  console.log('FileFilter - Verificando archivo:');
  console.log('  - Nombre:', file.originalname);
  console.log('  - MIME type:', file.mimetype);
  
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    console.log('  - Archivo aceptado');
    cb(null, true);
  } else {
    console.error('  - Archivo rechazado - MIME type no permitido:', file.mimetype);
    cb(new Error('Solo se permiten archivos de imagen (JPEG, PNG, GIF, WEBP)'));
  }
};

// Usar memoryStorage para tener control total sobre el guardado
const memoryStorage = multer.memoryStorage();

const upload = multer({
  storage: memoryStorage, // Cambiar a memoryStorage para tener el buffer
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
});

// Endpoint para subir imagen
// La ruta base ya es /upload desde routes.ts, así que aquí solo usamos '/'
router.post('/', (req: Request, res: Response, next: any) => {
  console.log('=== MULTER MIDDLEWARE EJECUTADO ===');
  console.log('  - Content-Type:', req.headers['content-type']);
  console.log('  - Method:', req.method);
  console.log('  - URL:', req.url);
  
  upload.single('image')(req, res, (err: any) => {
    if (err) {
      console.error('ERROR DE MULTER:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).send({ message: 'El archivo es demasiado grande. Máximo 5MB' });
      }
      if (err.message) {
        return res.status(400).send({ message: err.message });
      }
      return res.status(400).send({ message: 'Error al procesar el archivo: ' + (err.toString() || 'Error desconocido') });
    }
    console.log('=== MULTER PROCESÓ EL ARCHIVO, LLAMANDO NEXT ===');
    next();
  });
}, async (req: Request, res: Response) => {
  try {
    console.log('=== INICIO SUBIDA DE IMAGEN ===');
    console.log('Request file:', req.file);
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    
    if (!req.file) {
      console.error('ERROR: No se recibió ningún archivo');
      console.error('Request files:', (req as any).files);
      console.error('Request body keys:', Object.keys(req.body || {}));
      return res.status(400).send({ message: 'No se proporcionó ninguna imagen' });
    }
    
    // Verificar que req.file tiene la información necesaria
    if (!req.file.originalname || !(req.file as any).buffer) {
      console.error('ERROR: req.file no tiene la información completa');
      console.error('req.file completo:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        hasBuffer: !!(req.file as any).buffer
      });
      return res.status(400).send({ message: 'Información del archivo incompleta' });
    }

    console.log('Archivo recibido:');
    console.log('  - Nombre original:', req.file.originalname);
    console.log('  - Tamaño:', req.file.size, 'bytes');
    console.log('  - MIME type:', req.file.mimetype);
    console.log('  - Directorio destino:', normalizedUploadsDir);

    // Generar nombre único para el archivo (ya que memoryStorage no tiene filename callback)
    const timestamp = Date.now();
    const randomHash = Math.round(Math.random() * 1E9).toString(36);
    const ext = path.extname(req.file.originalname).toLowerCase();
    const originalName = path.basename(req.file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 15)
      .toLowerCase();
    const filename = originalName && originalName.length > 0
      ? `product-${timestamp}-${randomHash}-${originalName}${ext}`
      : `product-${timestamp}-${randomHash}${ext}`;
    
    console.log('  - Nombre generado:', filename);

    // Usar la ruta absoluta del directorio donde guardaremos el archivo
    const absoluteDir = path.resolve(normalizedUploadsDir);
    const absolutePath = path.join(absoluteDir, filename);
    
    console.log('=== VERIFICACIÓN DE ARCHIVO ===');
    console.log('  - Nombre del archivo:', filename);
    console.log('  - normalizedUploadsDir:', normalizedUploadsDir);
    console.log('  - Directorio destino (absoluto):', absoluteDir);
    console.log('  - Ruta completa del archivo (absoluta):', absolutePath);
    console.log('  - ¿Directorio existe?:', fs.existsSync(absoluteDir));
    
    // Listar archivos en el directorio para debug
    if (fs.existsSync(absoluteDir)) {
      try {
        const files = fs.readdirSync(absoluteDir);
        console.log('  - Archivos en el directorio:', files);
        console.log('  - Total de archivos:', files.length);
      } catch (err) {
        console.error('  - Error al listar archivos:', err);
      }
    }
    
    // Verificar información de multer sobre dónde guardó el archivo
    console.log('=== INFORMACIÓN DE MULTER (req.file) ===');
    console.log('  - req.file.path:', req.file.path);
    console.log('  - req.file.destination:', req.file.destination);
    console.log('  - req.file.filename:', req.file.filename);
    console.log('  - req.file.fieldname:', req.file.fieldname);
    console.log('  - req.file.encoding:', req.file.encoding);
    console.log('  - req.file.mimetype:', req.file.mimetype);
    console.log('  - req.file.size:', req.file.size);
    console.log('  - req.file.originalname:', req.file.originalname);
    
    // Con memoryStorage, siempre guardamos manualmente desde el buffer
    console.log('=== GUARDANDO ARCHIVO DESDE BUFFER ===');
    console.log('  - ¿Tiene buffer?:', !!(req.file as any).buffer);
    console.log('  - Tamaño del buffer:', (req.file as any).buffer?.length || 0);
    
    // Asegurar que el directorio existe
    if (!fs.existsSync(absoluteDir)) {
      try {
        fs.mkdirSync(absoluteDir, { recursive: true });
        console.log('  - ✓ Directorio creado:', absoluteDir);
      } catch (mkdirErr: any) {
        console.error('  - ✗ ERROR al crear directorio:', mkdirErr);
        return res.status(500).send({ message: 'Error al crear directorio: ' + mkdirErr.message });
      }
    } else {
      console.log('  - ✓ Directorio ya existe');
    }
    
    // Guardar el archivo desde el buffer
    if (!(req.file as any).buffer) {
      console.error('  - ✗ ERROR: No hay buffer en req.file');
      return res.status(500).send({ message: 'Error: No se pudo obtener el contenido del archivo' });
    }
    
    let stats: fs.Stats;
    try {
      console.log('  - Guardando archivo desde buffer en:', absolutePath);
      fs.writeFileSync(absolutePath, (req.file as any).buffer);
      console.log('  - ✓ Archivo escrito en disco');
      
      // Verificar inmediatamente que se guardó
      if (!fs.existsSync(absolutePath)) {
        console.error('  - ✗ ERROR: Archivo no encontrado después de escribir');
        return res.status(500).send({ message: 'Error: El archivo no se guardó correctamente' });
      }
      
      stats = fs.statSync(absolutePath);
      console.log('  - ✓ Verificación: Archivo existe, tamaño:', stats.size, 'bytes');
      
      if (stats.size === 0) {
        console.error('  - ✗ ERROR: Archivo guardado está vacío');
        fs.unlinkSync(absolutePath);
        return res.status(500).send({ message: 'Error: El archivo guardado está vacío' });
      }
      
      if (stats.size !== req.file.size) {
        console.warn('  - ⚠ ADVERTENCIA: Tamaño del archivo guardado no coincide');
        console.warn('    - Tamaño esperado:', req.file.size);
        console.warn('    - Tamaño guardado:', stats.size);
      }
    } catch (writeErr: any) {
      console.error('  - ✗ ERROR al guardar archivo:', writeErr);
      console.error('  - Error message:', writeErr.message);
      console.error('  - Error code:', writeErr.code);
      console.error('  - Error stack:', writeErr.stack);
      return res.status(500).send({ message: 'Error al guardar el archivo: ' + writeErr.message });
    }

    // Mostrar estadísticas finales del archivo guardado
    console.log('Estadísticas finales del archivo:');
    console.log('  - Tamaño en disco:', stats.size, 'bytes');
    console.log('  - Fecha creación:', stats.birthtime);

    // Construir la URL de la imagen (usar el nombre exacto del archivo guardado)
    const imageUrl = `/uploads/products-services/${filename}`;
    
    console.log('Imagen subida exitosamente:');
    console.log('  - Nombre del archivo:', filename);
    console.log('  - Ruta completa:', absolutePath);
    console.log('  - URL guardada en BD:', imageUrl);
    console.log('=== FIN SUBIDA DE IMAGEN ===');
    
    responseHandler({ url: imageUrl, filename: filename }, res);
  } catch (error: any) {
    console.error('Error al subir imagen:', error);
    console.error('Stack:', error.stack);
    const { code = 400, message = 'Error al subir la imagen' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
});

// Endpoint para servir las imágenes
router.get('/image/:filename', (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(normalizedUploadsDir, filename);

    // Verificar que el archivo existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).send({ message: 'Imagen no encontrada' });
    }

    // Enviar el archivo
    res.sendFile(filePath);
  } catch (error: any) {
    const { code = 400, message = 'Error al obtener la imagen' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
});

// Endpoint para eliminar imagen
router.delete('/image/:filename', (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(normalizedUploadsDir, filename);

    // Verificar que el archivo existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).send({ message: 'Imagen no encontrada' });
    }

    // Eliminar el archivo
    fs.unlinkSync(filePath);
    
    responseHandler({ message: 'Imagen eliminada correctamente' }, res);
  } catch (error: any) {
    const { code = 400, message = 'Error al eliminar la imagen' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
});

export = router;

