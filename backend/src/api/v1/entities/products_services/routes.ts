import { Router } from 'express';
import { adminRoleValidator, jwtValidator, validRole } from '../../middlewares';
import {
  getProductsServices,
  getProductService,
  postProductService,
  putProductService,
  deleteProductServiceController,
  putBulkUpdatePrices,
  putBulkUpdate,
} from './controllers';
import uploadRoutes from './upload';

const routes = Router();

// Obtener lista de productos/servicios
routes.get('/', [jwtValidator, adminRoleValidator, validRole], getProductsServices);

// Obtener un producto/servicio por ID
routes.get('/:id_product_service', [jwtValidator, adminRoleValidator, validRole], getProductService);

// Crear un nuevo producto/servicio
routes.post('/', [jwtValidator, adminRoleValidator, validRole], postProductService);

// Actualizar un producto/servicio
routes.put('/:id_product_service', [jwtValidator, adminRoleValidator, validRole], putProductService);

// Eliminar un producto/servicio
routes.delete('/:id_product_service', [jwtValidator, adminRoleValidator, validRole], deleteProductServiceController);

// Actualización masiva de precios
routes.put('/bulk/prices', [jwtValidator, adminRoleValidator, validRole], putBulkUpdatePrices);

// Actualización masiva de otros campos
routes.put('/bulk/update', [jwtValidator, adminRoleValidator, validRole], putBulkUpdate);

// Rutas para subida de imágenes
routes.use('/upload', [jwtValidator, adminRoleValidator, validRole], uploadRoutes);

export = routes;

