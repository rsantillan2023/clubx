import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcrypt";
import { DEGIRA_DB } from "../database/connection";
import User from "../database/schemas/degira/models/user.model";

interface UserInfo {
  id_user: number;
  username: string;
  name: string;
  surname: string;
  password: string;
  isHashed: boolean;
}

class UserManager {
  async listUsers(): Promise<UserInfo[]> {
    try {
      const users = await User.findAll({
        attributes: ['id_user', 'username', 'name', 'surname', 'password'],
        raw: true,
      });

      return users.map((user: any) => ({
        id_user: user.id_user,
        username: user.username || '',
        name: user.name || '',
        surname: user.surname || '',
        password: user.password || '',
        isHashed: this.isBcryptHash(user.password),
      }));
    } catch (error: any) {
      console.error('Error al listar usuarios:', error.message);
      throw error;
    }
  }

  isBcryptHash(password: string): boolean {
    // Los hashes de bcrypt empiezan con $2a$, $2b$, $2x$, $2y$ o $2$
    return /^\$2[ayb]?\$\d{2}\$[./A-Za-z0-9]{53}$/.test(password);
  }

  async resetPassword(username: string, newPassword: string): Promise<boolean> {
    try {
      const hashedPassword = bcrypt.hashSync(newPassword, bcrypt.genSaltSync());
      
      const [affectedRows] = await User.update(
        { password: hashedPassword },
        { where: { username } }
      );

      return affectedRows > 0;
    } catch (error: any) {
      console.error('Error al resetear contraseña:', error.message);
      throw error;
    }
  }

  async testPassword(username: string, password: string): Promise<boolean> {
    try {
      const user = await User.findOne({
        where: { username },
        attributes: ['password'],
        raw: true,
      }) as any;

      if (!user || !user.password) {
        return false;
      }

      const userPassword = user.password;
      
      // Si está hasheada, comparar con bcrypt
      if (this.isBcryptHash(userPassword)) {
        return bcrypt.compareSync(password, userPassword);
      }
      
      // Si está en texto plano, comparar directamente
      return userPassword === password;
    } catch (error: any) {
      console.error('Error al probar contraseña:', error.message);
      return false;
    }
  }

  async displayUsers(): Promise<void> {
    console.log("\n" + "=".repeat(70));
    console.log("👥 GESTIÓN DE USUARIOS - MiClub");
    console.log("=".repeat(70) + "\n");

    try {
      const users = await this.listUsers();

      if (users.length === 0) {
        console.log("❌ No se encontraron usuarios en la base de datos.\n");
        return;
      }

      console.log(`📋 Usuarios encontrados: ${users.length}\n`);
      console.log("ID  | Username      | Nombre          | Contraseña (estado)");
      console.log("-".repeat(70));

      users.forEach((user) => {
        const id = user.id_user.toString().padEnd(3);
        const username = (user.username || '').padEnd(13);
        const name = `${user.name || ''} ${user.surname || ''}`.padEnd(15);
        const passwordStatus = user.isHashed 
          ? "🔒 Hasheada (bcrypt)" 
          : user.password 
            ? `🔓 Texto plano: "${user.password}"` 
            : "⚠️ Sin contraseña";
        
        console.log(`${id} | ${username} | ${name} | ${passwordStatus}`);
      });

      console.log("\n" + "=".repeat(70));
      console.log("💡 INFORMACIÓN");
      console.log("=".repeat(70));
      console.log("\nUsuarios disponibles para login:");
      users.forEach((user) => {
        if (user.username) {
          const password = user.isHashed 
            ? "(hasheada - necesita reset)" 
            : user.password || "(sin contraseña)";
          console.log(`   • Username: ${user.username}`);
          console.log(`     Contraseña: ${password}`);
          console.log();
        }
      });

      // Mostrar usuarios con contraseñas en texto plano
      const plainTextUsers = users.filter(u => !u.isHashed && u.password);
      if (plainTextUsers.length > 0) {
        console.log("✅ Usuarios con contraseñas en texto plano (puedes usar estos):");
        plainTextUsers.forEach((user) => {
          console.log(`   • ${user.username} / ${user.password}`);
        });
      }

      // Mostrar usuarios con contraseñas hasheadas
      const hashedUsers = users.filter(u => u.isHashed);
      if (hashedUsers.length > 0) {
        console.log("\n⚠️ Usuarios con contraseñas hasheadas (necesitas resetear):");
        hashedUsers.forEach((user) => {
          console.log(`   • ${user.username}`);
        });
        console.log("\n💡 Para resetear una contraseña, ejecuta:");
        console.log("   npm run reset-password -- <username> <nueva_contraseña>");
      }

    } catch (error: any) {
      console.error("❌ Error:", error.message);
    } finally {
      await DEGIRA_DB.close();
    }
  }
}

// Ejecutar según argumentos de línea de comandos
const args = process.argv.slice(2);
const command = args[0];

const manager = new UserManager();

if (command === 'reset' && args[1] && args[2]) {
  const username = args[1];
  const newPassword = args[2];
  
  manager.resetPassword(username, newPassword)
    .then((success) => {
      if (success) {
        console.log(`\n✅ Contraseña reseteada exitosamente para usuario: ${username}`);
        console.log(`   Nueva contraseña: ${newPassword}\n`);
      } else {
        console.log(`\n❌ No se pudo resetear la contraseña. Usuario no encontrado: ${username}\n`);
      }
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("\n❌ Error al resetear contraseña:", error.message);
      process.exit(1);
    });
} else if (command === 'test' && args[1] && args[2]) {
  const username = args[1];
  const password = args[2];
  
  manager.testPassword(username, password)
    .then((isValid) => {
      if (isValid) {
        console.log(`\n✅ La contraseña es correcta para el usuario: ${username}\n`);
      } else {
        console.log(`\n❌ La contraseña es incorrecta para el usuario: ${username}\n`);
      }
      process.exit(isValid ? 0 : 1);
    })
    .catch((error) => {
      console.error("\n❌ Error al probar contraseña:", error.message);
      process.exit(1);
    });
} else {
  // Por defecto, mostrar lista de usuarios
  manager.displayUsers()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Error:", error.message);
      process.exit(1);
    });
}

