/**
 * Lista usuarios de la tabla Users (username, nombre) para saber con cuál ingresar.
 * Las contraseñas están hasheadas en la BD; no se pueden leer.
 * Para definir una contraseña conocida: npm run users:set-password -- usuario NuevaPass123
 */
import * as path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
  const { DEGIRA_DB } = await import('../database/connection');
  const User = (await import('../database/schemas/degira/models/user.model')).default;
  const Rol = (await import('../database/schemas/degira/models/rol.model')).default;
  const UserRole = (await import('../database/schemas/degira/models/user_role.model')).default;

  User.belongsToMany(Rol, { through: UserRole, foreignKey: 'id_user', otherKey: 'id_role', as: 'roles' });
  Rol.belongsToMany(User, { through: UserRole, foreignKey: 'id_role', otherKey: 'id_user', as: 'users' });

  try {
    await DEGIRA_DB.authenticate();

    const users = await User.findAll({
      attributes: ['id_user', 'username', 'name', 'surname'],
      include: [{ model: Rol, as: 'roles', attributes: ['id_role', 'description'] }],
    });

    console.log('\n' + '='.repeat(60));
    console.log('👤 USUARIOS EN LA TABLA Users (para ingresar a la app)');
    console.log('='.repeat(60));
    console.log('\n   Las contraseñas están hasheadas; no se pueden ver.\n');
    console.log('   id_user | username        | nombre');
    console.log('   ' + '-'.repeat(50));

    if (users.length === 0) {
      console.log('   (ningún usuario)');
    } else {
      for (const u of users) {
        const j = (u as any).toJSON();
        const roles = (j.roles || []).map((r: any) => r.description).join(', ');
        console.log(`   ${String(j.id_user).padEnd(7)} | ${(j.username || '').padEnd(15)} | ${(j.name || '')} ${(j.surname || '')} ${roles ? `[${roles}]` : ''}`);
      }
    }

    console.log('\n   Para poder ingresar con un usuario, define una contraseña conocida:');
    console.log('   npm run users:set-password -- <username> <contraseña_nueva>');
    console.log('   Ejemplo: npm run users:set-password -- admin MiPassword123');
    console.log('='.repeat(60) + '\n');

    await DEGIRA_DB.close();
  } catch (e: any) {
    console.error('❌ Error:', e.message);
    await DEGIRA_DB.close();
    process.exit(1);
  }
}

main();
