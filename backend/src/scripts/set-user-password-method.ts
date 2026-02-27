/**
 * Establece la contraseña de un usuario en el formato que elijas, para probar
 * qué acepta el sistema viejo (plain, bcrypt o md5).
 *
 * Uso: npm run users:set-password-method -- <username> <contraseña> <método>
 * Métodos: plain | bcrypt | md5
 *
 * Ejemplos:
 *   npm run users:set-password-method -- rsantillan 12345678 plain
 *   npm run users:set-password-method -- rsantillan 12345678 bcrypt
 *   npm run users:set-password-method -- rsantillan 12345678 md5
 */
import * as crypto from 'crypto';
import * as path from 'path';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });

type Method = 'plain' | 'bcrypt' | 'md5';

function toStoragePassword(password: string, method: Method): string {
  switch (method) {
    case 'plain':
      return password;
    case 'bcrypt':
      return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
    case 'md5':
      return crypto.createHash('md5').update(password, 'utf8').digest('hex');
    default:
      throw new Error(`Método desconocido: ${method}. Usar: plain | bcrypt | md5`);
  }
}

async function main() {
  const username = process.argv[2];
  const password = process.argv[3];
  const method = (process.argv[4] || 'bcrypt').toLowerCase() as Method;

  if (!username || !password) {
    console.log('\nUso: npm run users:set-password-method -- <username> <contraseña> [método]');
    console.log('Métodos: plain | bcrypt | md5');
    console.log('\nEjemplos:');
    console.log('  npm run users:set-password-method -- rsantillan 12345678 plain   (sin hash)');
    console.log('  npm run users:set-password-method -- rsantillan 12345678 bcrypt  (bcrypt, lo que usa este backend)');
    console.log('  npm run users:set-password-method -- rsantillan 12345678 md5    (MD5)\n');
    process.exit(1);
  }

  const validMethods: Method[] = ['plain', 'bcrypt', 'md5'];
  if (!validMethods.includes(method)) {
    console.error(`\n❌ Método inválido: "${method}". Usar: plain | bcrypt | md5\n`);
    process.exit(1);
  }

  const { DEGIRA_DB } = await import('../database/connection');
  const User = (await import('../database/schemas/degira/models/user.model')).default;

  try {
    await DEGIRA_DB.authenticate();

    const user = await User.findOne({ where: { username } });
    if (!user) {
      console.error(`\n❌ No existe ningún usuario con username "${username}".`);
      console.log('   Lista usuarios con: npm run users:list\n');
      await DEGIRA_DB.close();
      process.exit(1);
    }

    const storageValue = toStoragePassword(password, method);
    await User.update({ password: storageValue }, { where: { username } });

    const j = (user as any).toJSON();
    console.log('\n✅ Contraseña actualizada.');
    console.log(`   Usuario: ${j.username} (id_user: ${j.id_user})`);
    console.log(`   Método: ${method}`);
    if (method === 'plain') {
      console.log('   Guardado: texto plano (sin hash).');
    } else if (method === 'bcrypt') {
      console.log('   Guardado: hash bcrypt (este backend valida con bcrypt).');
    } else {
      console.log('   Guardado: hash MD5 (32 caracteres hex).');
    }
    console.log('   Probá login con ese usuario y la contraseña que pasaste.\n');
    await DEGIRA_DB.close();
  } catch (e: any) {
    console.error('❌ Error:', e.message);
    await DEGIRA_DB.close();
    process.exit(1);
  }
}

main();
