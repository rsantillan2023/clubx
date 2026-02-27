/**
 * Establece una contraseña conocida para un usuario (por username).
 * Uso: npm run users:set-password -- <username> <nueva_contraseña>
 * Ejemplo: npm run users:set-password -- admin MiPassword123
 */
import * as path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
  const username = process.argv[2];
  const newPassword = process.argv[3];

  if (!username || !newPassword) {
    console.log('\nUso: npm run users:set-password -- <username> <nueva_contraseña>');
    console.log('Ejemplo: npm run users:set-password -- admin MiPassword123\n');
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

    const hashed = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10));
    await User.update({ password: hashed }, { where: { username } });

    const j = (user as any).toJSON();
    console.log('\n✅ Contraseña actualizada.');
    console.log(`   Usuario: ${j.username} (id_user: ${j.id_user})`);
    console.log('   Ya puedes ingresar con ese usuario y la contraseña que definiste.\n');
    await DEGIRA_DB.close();
  } catch (e: any) {
    console.error('❌ Error:', e.message);
    await DEGIRA_DB.close();
    process.exit(1);
  }
}

main();
