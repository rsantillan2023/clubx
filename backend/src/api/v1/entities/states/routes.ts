import { Router } from 'express';
import { getStates } from './controllers';

const routes = Router();

routes.get('/get', getStates);

export = routes;