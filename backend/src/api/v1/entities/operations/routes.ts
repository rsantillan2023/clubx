import { Router } from 'express';
import { jwtValidator, validRole } from '../../middlewares';
import { getOperations } from './controllers';

const routes = Router();

routes.get('/get',[jwtValidator, validRole], getOperations);

export = routes;