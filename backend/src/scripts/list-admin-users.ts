import dotenv from "dotenv";
dotenv.config();

import { DEGIRA_DB } from "../database/connection";
import User from "../database/schemas/degira/models/user.model";
import Rol from "../database/schemas/degira/models/rol.model";
import UserRole from "../database/schemas/degira/models/user_role.model";

// Configurar asociaciones
User.belongsToMany(Rol, {
  through: UserRole,
  foreignKey: 'id_user',
  otherKey: 'id_role',
  as: 'roles',
});

Rol.belongsToMany(User, {
  through: UserRole,
  foreignKey: 'id_role',
  otherKey: 'id_user',
  as: 'users',
});

async function listAdminUsers() {
  try {
    console.log("\n" + "=".repeat(70));
    console.log("👤 LISTADO DE USUARIOS ADMIN Y SUPERADMIN");
    console.log("=".repeat(70) + "\n");

    // Buscar el rol ADMIN (id_role = 3 según el enum ERoles)
    const adminRole = await Rol.findOne({
      where: { id_role: 3 },
    });

    if (!adminRole) {
      console.log("⚠️  No se encontró el rol ADMIN (id_role = 3)");
    } else {
      console.log(`📋 Rol ADMIN encontrado: ${adminRole.get('description')} (ID: ${adminRole.get('id_role')})\n`);
    }

    // Buscar usuarios con rol ADMIN (id_role = 3)
    const adminUsers = await User.findAll({
      include: [
        {
          model: Rol,
          as: 'roles',
          where: { id_role: 3 },
          required: true,
        },
      ],
    });

    console.log(`\n🔑 USUARIOS CON ROL ADMIN (${adminUsers.length} encontrados):\n`);
    
    if (adminUsers.length === 0) {
      console.log("   No se encontraron usuarios con rol ADMIN\n");
    } else {
      adminUsers.forEach((user: any) => {
        const userData = user.toJSON();
        const hasPassword = userData.password && userData.password.length > 0;
        const isHashed = hasPassword && /^\$2[ayb]?\$\d{2}\$[./A-Za-z0-9]{53}$/.test(userData.password);
        
        console.log(`   👤 Usuario: ${userData.username || 'N/A'}`);
        console.log(`      ID: ${userData.id_user}`);
        console.log(`      Nombre: ${userData.name || 'N/A'} ${userData.surname || ''}`);
        console.log(`      Contraseña: ${hasPassword ? (isHashed ? '✅ Hasheada (bcrypt)' : '⚠️  Sin hashear') : '❌ Sin contraseña'}`);
        console.log(`      Roles: ${userData.roles?.map((r: any) => r.description).join(', ') || 'N/A'}`);
        console.log("");
      });
    }

    // Buscar si existe un rol SUPERADMIN (podría ser id_role = 7 según algunos scripts)
    const superAdminRoles = await Rol.findAll({
      where: {
        description: {
          [require('sequelize').Op.like]: '%SUPER%',
        },
      },
    });

    if (superAdminRoles.length > 0) {
      console.log(`\n👑 ROLES SUPERADMIN ENCONTRADOS (${superAdminRoles.length}):\n`);
      superAdminRoles.forEach((role: any) => {
        console.log(`   ${role.get('description')} (ID: ${role.get('id_role')})`);
      });

      // Buscar usuarios con roles SUPERADMIN
      const superAdminRoleIds = superAdminRoles.map((r: any) => r.get('id_role'));
      const superAdminUsers = await User.findAll({
        include: [
          {
            model: Rol,
            as: 'roles',
            where: { id_role: superAdminRoleIds },
            required: true,
          },
        ],
      });

      console.log(`\n👑 USUARIOS CON ROL SUPERADMIN (${superAdminUsers.length} encontrados):\n`);
      
      if (superAdminUsers.length === 0) {
        console.log("   No se encontraron usuarios con rol SUPERADMIN\n");
      } else {
        superAdminUsers.forEach((user: any) => {
          const userData = user.toJSON();
          const hasPassword = userData.password && userData.password.length > 0;
          const isHashed = hasPassword && /^\$2[ayb]?\$\d{2}\$[./A-Za-z0-9]{53}$/.test(userData.password);
          
          console.log(`   👤 Usuario: ${userData.username || 'N/A'}`);
          console.log(`      ID: ${userData.id_user}`);
          console.log(`      Nombre: ${userData.name || 'N/A'} ${userData.surname || ''}`);
          console.log(`      Contraseña: ${hasPassword ? (isHashed ? '✅ Hasheada (bcrypt)' : '⚠️  Sin hashear') : '❌ Sin contraseña'}`);
          console.log(`      Roles: ${userData.roles?.map((r: any) => r.description).join(', ') || 'N/A'}`);
          console.log("");
        });
      }
    } else {
      console.log("\n⚠️  No se encontraron roles con 'SUPER' en el nombre\n");
    }

    // También buscar usuarios con id_role = 7 (mencionado en algunos scripts)
    const role7 = await Rol.findByPk(7);
    if (role7) {
      console.log(`\n🔍 Verificando rol con ID 7: ${role7.get('description')}\n`);
      
      const usersWithRole7 = await User.findAll({
        include: [
          {
            model: Rol,
            as: 'roles',
            where: { id_role: 7 },
            required: true,
          },
        ],
      });

      if (usersWithRole7.length > 0) {
        console.log(`   Usuarios con rol ID 7 (${usersWithRole7.length} encontrados):\n`);
        usersWithRole7.forEach((user: any) => {
          const userData = user.toJSON();
          console.log(`   👤 ${userData.username || 'N/A'} (ID: ${userData.id_user})`);
        });
        console.log("");
      }
    }

    console.log("=".repeat(70));
    console.log("💡 NOTA: Las contraseñas están hasheadas con bcrypt.");
    console.log("   No es posible recuperar la contraseña original.");
    console.log("   Si olvidaste la contraseña, debes restablecerla.");
    console.log("=".repeat(70) + "\n");

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error(error);
  } finally {
    await DEGIRA_DB.close();
  }
}

listAdminUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error inesperado:", error);
    process.exit(1);
  });

