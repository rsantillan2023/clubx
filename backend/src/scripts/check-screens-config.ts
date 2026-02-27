/**
 * Compara las pantallas del router (frontend) con los ítems en Operations_Types (BD).
 * Muestra qué rutas tienen ítem en el menú, cuáles faltan en la BD y cuáles están en BD pero no en el router.
 *
 * Ejecutar: npm run check:screens
 */
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });

// Rutas del frontend que son pantallas (requiresAuth + tienen path propio, excluyendo home/login/unauthorized)
const ROUTER_PATHS: { path: string; title: string }[] = [
  { path: '/access', title: 'Validación de DNI' },
  { path: '/accessMembership', title: 'Validación de Membresia' },
  { path: '/productsSale', title: 'Venta de Productos' },
  { path: '/lockers', title: 'Guardarropas' },
  { path: '/devolution', title: 'Devoluciones' },
  { path: '/account', title: 'Usuario' },
  { path: '/consumed', title: 'Consumos' },
  { path: '/activeVisits', title: 'Socios en el club' },
  { path: '/historicalVisits', title: 'Histórico de Visitantes' },
  { path: '/visitsConsumptions', title: 'Consumos por Visita' },
  { path: '/registerPartner', title: 'Alta de Socio' },
  { path: '/registerPartnerLite', title: 'Alta Rápida de Socio' },
  { path: '/editPartner', title: 'Editar datos de Socio' },
  { path: '/partnerSearch', title: 'Busqueda de Socio' },
  { path: '/membershipReactivation', title: 'Reactivación de membresía' },
  { path: '/entryRegisterLite', title: 'Registro Rápido de Nueva Visita' },
  { path: '/entryRegister', title: 'Registro de Nueva Visita' },
  { path: '/exitRegister', title: 'Registro de Salida' },
  { path: '/operations', title: 'Operaciones' },
  { path: '/table-crud', title: 'CRUD de Tablas' },
  { path: '/partners-database', title: 'Base de datos de socios' },
  { path: '/products-services', title: 'Gestión de Productos y Servicios' },
  { path: '/prices-management', title: 'Gestión de Precios' },
  { path: '/users-management', title: 'Gestión de Usuarios, Roles y Permisos' },
];

function normalizePath(p: string): string {
  return p.replace(/\/+$/, '') || '/';
}

async function main() {
  const { DEGIRA_DB } = await import('../database/connection');
  const OperationType = (await import('../database/schemas/degira/models/operation_type.model')).default;

  try {
    await DEGIRA_DB.authenticate();

    const rows = await OperationType.findAll({
      order: [['order', 'ASC']],
    });

    const dbPaths = new Map<string, { id_operation_type: number; description: string; path: string; id_role: number }>();
    for (const row of rows) {
      const j = (row as any).toJSON();
      const pathNorm = normalizePath(j.path || '');
      if (pathNorm) {
        dbPaths.set(pathNorm, {
          id_operation_type: j.id_operation_type,
          description: j.description || '',
          path: j.path,
          id_role: j.id_role,
        });
      }
    }

    const routerPathSet = new Set(ROUTER_PATHS.map((r) => normalizePath(r.path)));
    const inBoth: string[] = [];
    const onlyInRouter: { path: string; title: string }[] = [];
    const onlyInDb: { path: string; description: string; id_operation_type: number }[] = [];

    for (const { path: rPath, title } of ROUTER_PATHS) {
      const norm = normalizePath(rPath);
      if (dbPaths.has(norm)) {
        inBoth.push(norm);
      } else {
        onlyInRouter.push({ path: rPath, title });
      }
    }
    for (const [p, info] of dbPaths) {
      if (!routerPathSet.has(p)) {
        onlyInDb.push({
          path: info.path,
          description: info.description,
          id_operation_type: info.id_operation_type,
        });
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('  PANTALLAS: Router (frontend) vs Operations_Types (BD)');
    console.log('='.repeat(70));

    console.log('\n  CONFIGURADAS (en router y en BD):');
    if (inBoth.length === 0) {
      console.log('    (ninguna)');
    } else {
      inBoth.sort().forEach((p) => {
        const info = dbPaths.get(p)!;
        console.log(`    ${p}  →  ${info.description} (id: ${info.id_operation_type}, id_role: ${info.id_role})`);
      });
    }

    console.log('\n  FALTAN EN LA BD (existen en el router pero no en Operations_Types):');
    if (onlyInRouter.length === 0) {
      console.log('    (ninguna)');
    } else {
      onlyInRouter.forEach(({ path: p, title }) => {
        console.log(`    ${p}  →  ${title}`);
      });
    }

    console.log('\n  EN LA BD PERO NO EN EL ROUTER (pueden ser ítems viejos o rutas eliminadas):');
    if (onlyInDb.length === 0) {
      console.log('    (ninguna)');
    } else {
      onlyInDb.forEach(({ path: p, description, id_operation_type }) => {
        console.log(`    ${p}  →  ${description} (id: ${id_operation_type})`);
      });
    }

    console.log('\n' + '-'.repeat(70));
    console.log(`  Resumen: ${inBoth.length} configuradas | ${onlyInRouter.length} faltan en BD | ${onlyInDb.length} solo en BD`);
    console.log('='.repeat(70) + '\n');

    await DEGIRA_DB.close();
  } catch (e: any) {
    console.error('Error:', e.message);
    await DEGIRA_DB.close();
    process.exit(1);
  }
}

main();
