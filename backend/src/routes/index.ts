import { Request, Response, Router } from 'express';
import fs from 'fs';
import path from 'path';

const serviceName = process.env.SERVICE_NAME || '';
const apiBaseRoute = process.env.API_BASE_ROUTE || '';
const entitiesFolderName = process.env.ENTITIES_FOLDER_NAME || '';
const routesFileName = process.env.ROUTES_FILE_NAME || '';
const routesDir = Router();

// Get Files from api folder
const basePath = path.join(__dirname, '../api');

if (fs.existsSync(basePath)) {
  let filesApi = fs.readdirSync(basePath, { withFileTypes: true });

  // Ensure remove database and routes folder
  filesApi = filesApi.filter(
    file => !['database', 'routes'].includes(file.name),
  );

  filesApi.forEach(f => {
    const serviceRoutes = `/${apiBaseRoute}/${f.name}/${serviceName}`.replace(/\/+/g, '/');

    const pathEntities = `${basePath}/${f.name}/${entitiesFolderName}`;
    if (!fs.existsSync(pathEntities)) return;

    // Get Entities
    const filesEntity = fs.readdirSync(pathEntities, {
      withFileTypes: true,
    });

    filesEntity.forEach(fe => {
      const finalRoute = `${serviceRoutes}/${fe.name}`
        .replace(' ', '-')
        .toLowerCase()
        .replace(/\/+/g, '/'); // Normalizar dobles slashes
      const finalPath = `${pathEntities}/${fe.name}/${routesFileName}`;
      if (
        !fs.existsSync(`${finalPath}.js`) &&
        !fs.existsSync(`${finalPath}.ts`)
      )
        return;
      const finalFile = require(finalPath);
      if (!Object.keys(finalFile).length) return;

      routesDir.use(finalRoute, finalFile);
      console.log('-------- RUTA CARGADA -------->', finalRoute);
    });

    // Add route for verify status server
    routesDir.get(`${serviceRoutes}`, (req: Request, res: Response) =>
      res.send({ status: 'OK' }),
    );
    console.log('-------- RUTA CARGADA -------->', serviceRoutes);

    // Add route for docs for each version
  });
} else {
  console.log('-------- NO HAY RUTAS PARA CARGAR --------');
}
export default routesDir;
