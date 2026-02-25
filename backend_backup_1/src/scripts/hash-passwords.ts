import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcrypt";
import { DEGIRA_DB } from "../database/connection";
import User from "../database/schemas/degira/models/user.model";

async function hashAllPasswords() {
  try {
    console.log("\n" + "=".repeat(70));
    console.log("🔐 HASHING DE CONTRASEÑAS - Compatible con Producción");
    console.log("=".repeat(70) + "\n");

    const users = await User.findAll({
      attributes: ['id_user', 'username', 'password'],
      raw: true,
    }) as any[];

    if (users.length === 0) {
      console.log("❌ No se encontraron usuarios.\n");
      await DEGIRA_DB.close();
      return;
    }

    console.log(`📋 Usuarios encontrados: ${users.length}\n`);

    let hashedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      const currentPassword = user.password || '';
      
      // Verificar si ya está hasheada
      const isBcryptHash = /^\$2[ayb]?\$\d{2}\$[./A-Za-z0-9]{53}$/.test(currentPassword);
      
      if (isBcryptHash) {
        console.log(`⏭️  ${user.username}: Ya está hasheada, se omite`);
        skippedCount++;
        continue;
      }

      if (!currentPassword) {
        console.log(`⚠️  ${user.username}: Sin contraseña, se omite`);
        skippedCount++;
        continue;
      }

      // Hashear la contraseña
      const hashedPassword = bcrypt.hashSync(currentPassword, bcrypt.genSaltSync());
      
      // Usar SQL directo para evitar problemas con campos que no existen
      await DEGIRA_DB.query(
        `UPDATE Users SET password = ? WHERE id_user = ?`,
        {
          replacements: [hashedPassword, user.id_user],
        }
      );

      console.log(`✅ ${user.username}: Contraseña hasheada correctamente`);
      hashedCount++;
    }

    console.log("\n" + "=".repeat(70));
    console.log("📊 RESUMEN");
    console.log("=".repeat(70));
    console.log(`✅ Contraseñas hasheadas: ${hashedCount}`);
    console.log(`⏭️  Omitidas (ya hasheadas o sin contraseña): ${skippedCount}`);
    console.log(`📋 Total procesados: ${users.length}`);
    console.log("=".repeat(70) + "\n");

    console.log("💡 Ahora puedes usar las contraseñas originales para login:");
    console.log("   El sistema comparará automáticamente con bcrypt.\n");

  } catch (error: any) {
    console.error("❌ Error:", error.message);
  } finally {
    await DEGIRA_DB.close();
  }
}

hashAllPasswords()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error inesperado:", error);
    process.exit(1);
  });

