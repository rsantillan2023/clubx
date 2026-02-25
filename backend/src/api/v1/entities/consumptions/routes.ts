import { Router, Request, Response } from 'express';
import { barmanRoleValidator, jwtValidator, validRole } from '../../middlewares';
import {  createConsumption, getBraceletConsumptions, getFeaturedProducts, minimumConsumption } from './controllers';
//import { createProductConsumption, getConsumptions, getConsumption } from './controllers';

const routes = Router();

// Ruta principal para verificar que el endpoint existe
routes.get('/', [jwtValidator, barmanRoleValidator, validRole], (req: Request, res: Response) => {
  res.status(200).send({ 
    message: 'Consumptions endpoint activo',
    availableRoutes: [
      'GET /get/consume - Obtener consumos por brazalete',
      'GET /get/featured - Obtener productos destacados',
      'GET /get/minimum - Obtener consumo mínimo',
      'POST /create - Crear consumo'
    ]
  });
});

routes.get('/get/consume', [jwtValidator, barmanRoleValidator, validRole], getBraceletConsumptions);
routes.get('/get/featured', [jwtValidator, barmanRoleValidator, validRole], getFeaturedProducts);
routes.get('/get/minimum', [jwtValidator, barmanRoleValidator, validRole], minimumConsumption);
//routes.delete('/delete/consume/:id_ticket_detail', [jwtValidator, barmanRoleValidator, validRole], deleteConsumption);
routes.post('/create', [jwtValidator, barmanRoleValidator, validRole], createConsumption);


export = routes; 