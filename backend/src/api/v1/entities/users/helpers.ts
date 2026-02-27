import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { FindAndCountOptions, Includeable, Op, WhereOptions } from 'sequelize';
import OperationType from '../../../../database/schemas/degira/models/operation_type.model';
import Rol from '../../../../database/schemas/degira/models/rol.model';
import { IRole } from '../../../../database/schemas/degira/interfaces/rol.interface';
import User from '../../../../database/schemas/degira/models/user.model';
import UserRole from '../../../../database/schemas/degira/models/user_role.model';
import { errorHandler } from '../../helpers';
import { getPagination } from './../../helpers/index';
import {
  ICreateUser,
  ILogin,
  IUpdateUser,
  IUserAPI,
  IUserParams,
  IUserWithPermissions,
  IUserWithRoles,
} from './types';

// Usar JWT_SECRET del .env o AUTH_KEY (compatible con producción)
const AUTH_KEY = process.env.JWT_SECRET || process.env.AUTH_KEY || '';

const rolIncludeable: Includeable = {
  model: Rol,
  as: 'roles',
};

// ==================== AUTENTICACIÓN ====================

/** Indica si el valor guardado parece un hash bcrypt (sistema nuevo). */
const isBcryptHash = (stored: string): boolean =>
  typeof stored === 'string' && (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$'));

/**
 * Valida la contraseña: acepta bcrypt (nuevo) o texto plano (legacy).
 * No se escribe en la BD: si está en plano sigue en plano, así sirve para ambos sistemas.
 */
const validatePassword = (pass: string, storedPassword: string): boolean => {
  if (isBcryptHash(storedPassword)) {
    return bcrypt.compareSync(pass, storedPassword);
  }
  return pass === storedPassword;
};

export const userLogin = async (
  username: string,
  pass: string,
): Promise<ILogin> => {
  try {
    const include: Includeable[] = [rolIncludeable];
    const user = await User.findOne({
      where: {
        username,
      },
      include,
    });
    if (!user) errorHandler(403, 'El usuario no existe');
    const {
      password = '',
      id_user = 0,
      name = '',
      roles,
    } = (user?.toJSON() as IUserAPI) || {};

    const validatePass = validatePassword(pass, password);
    if (!validatePass) errorHandler(403, 'Contraseña incorrecta');

    const token = jwt.sign({ id_user, roles }, AUTH_KEY, {});

    return { id_user, name, username, roles, token };
  } catch (error) {
    throw error;
  }
};

// ==================== VALIDACIONES ====================

export const validateUserExists = async (id_user: number): Promise<void> => {
  const user = await User.findByPk(id_user);
  if (!user) {
    errorHandler(404, 'Usuario no encontrado');
  }
};

export const validateUsernameUnique = async (
  username: string,
  excludeId?: number,
): Promise<void> => {
  const where: WhereOptions = { username };
  if (excludeId) {
    where.id_user = { [Op.ne]: excludeId };
  }
  const existingUser = await User.findOne({ where });
  if (existingUser) {
    errorHandler(400, 'El nombre de usuario ya está en uso');
  }
};

export const validatePasswordStrength = (password: string): void => {
  if (password.length < 8) {
    errorHandler(400, 'La contraseña debe tener al menos 8 caracteres');
  }
  // Opcional: agregar más validaciones de complejidad
};

// ==================== HELPERS DE CONTRASEÑA ====================

export const hashPassword = (password: string): string => {
  try {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
  } catch (error) {
    errorHandler(500, 'Error al encriptar contraseña');
    return '';
  }
};

// ==================== CRUD DE USUARIOS ====================

export const getUserList = async (userParams: IUserParams) => {
  try {
    const { page, pageSize, search, roleId } = userParams;

    const include: Includeable[] = [rolIncludeable];
    const where: WhereOptions = {};

    // Búsqueda por nombre, apellido o username
    if (search) {
      where[Op.or as any] = [
        { name: { [Op.like]: `%${search}%` } },
        { surname: { [Op.like]: `%${search}%` } },
        { username: { [Op.like]: `%${search}%` } },
      ];
    }

    // Filtro por rol
    if (roleId) {
      include.push({
        model: Rol,
        as: 'roles',
        where: { id_role: roleId },
        required: true,
      });
    }

    let findOptions: FindAndCountOptions = {
      include,
      where,
      distinct: true,
    };

    if (page && pageSize) {
      const { limit, offset } = getPagination(page, pageSize);
      findOptions = { ...findOptions, offset, limit };
    }

    const users = await User.findAndCountAll(findOptions);
    return users;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getUserById = async (
  id_user: number,
): Promise<IUserWithRoles | null> => {
  try {
    const user = await User.findByPk(id_user, {
      include: [rolIncludeable],
    });

    if (!user) {
      return null;
    }

    return user.toJSON() as IUserWithRoles;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const createUser = async (
  userData: ICreateUser,
): Promise<IUserWithRoles> => {
  try {
    const { name, surname, username, password, roles = [] } = userData;

    // Validaciones
    await validateUsernameUnique(username);
    validatePasswordStrength(password);

    // Crear usuario
    const hashedPassword = hashPassword(password);
    const user = await User.create({
      name,
      surname,
      username,
      password: hashedPassword,
    } as any);

    const id_user = (user as any).id_user;

    // Asignar roles si se proporcionaron
    if (roles.length > 0) {
      await assignRolesToUser(id_user, roles);
    }

    // Retornar usuario con roles
    return (await getUserById(id_user))!;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const updateUser = async (
  id_user: number,
  userData: IUpdateUser,
): Promise<IUserWithRoles> => {
  try {
    await validateUserExists(id_user);

    const { name, surname, username, password } = userData;
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (surname !== undefined) updateData.surname = surname;
    if (username !== undefined) {
      await validateUsernameUnique(username, id_user);
      updateData.username = username;
    }
    if (password !== undefined) {
      validatePasswordStrength(password);
      updateData.password = hashPassword(password);
    }

    await User.update(updateData, {
      where: { id_user },
    });

    return (await getUserById(id_user))!;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const deleteUser = async (id_user: number): Promise<void> => {
  try {
    await validateUserExists(id_user);

    // Eliminar relaciones de roles primero
    await UserRole.destroy({
      where: { id_user },
    });

    // Eliminar usuario
    await User.destroy({
      where: { id_user },
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
};

// ==================== GESTIÓN DE ROLES DE USUARIO ====================

export const getUserRoles = async (id_user: number): Promise<IRole[]> => {
  try {
    await validateUserExists(id_user);

    const user = await User.findByPk(id_user, {
      include: [rolIncludeable],
    });

    return (user?.toJSON() as IUserAPI)?.roles || [];
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const assignRolesToUser = async (
  id_user: number,
  roleIds: number[],
): Promise<void> => {
  try {
    console.log('assignRolesToUser - id_user:', id_user, 'roleIds:', roleIds);
    
    await validateUserExists(id_user);

    // Asegurar que todos sean números
    const validRoleIds = roleIds.map(id => Number(id)).filter(id => !isNaN(id) && id > 0);
    
    console.log('RoleIds validados:', validRoleIds);

    // Validar que los roles existen
    const roles = await Rol.findAll({
      where: { id_role: validRoleIds },
    });

    const rolesData = roles.map(r => (r as any).toJSON ? (r as any).toJSON() : (r as any));
    console.log('Roles encontrados en BD:', rolesData.map((r: any) => ({ id: r.id_role, desc: r.description })));

    if (roles.length !== validRoleIds.length) {
      const foundIds = rolesData.map((r: any) => r.id_role);
      const missingIds = validRoleIds.filter(id => !foundIds.includes(id));
      console.error('Roles no encontrados:', missingIds);
      errorHandler(400, `Los siguientes roles no existen: ${missingIds.join(', ')}`);
    }

    // Verificar roles actuales antes de eliminar (SOLO para este usuario)
    const rolesAntes = await UserRole.findAll({
      where: { id_user: Number(id_user) },
    });
    console.log(`Roles actuales del usuario ${id_user} (antes de eliminar):`, rolesAntes.map((r: any) => {
      const roleData = (r as any).toJSON ? (r as any).toJSON() : (r as any);
      return {
        id_user_role: roleData.id_user_role,
        id_user: roleData.id_user,
        id_role: roleData.id_role
      };
    }));

    // Verificar que solo estamos trabajando con el usuario correcto
    if (rolesAntes.length > 0) {
      const usuariosAfectados = [...new Set(rolesAntes.map((r: any) => {
        const roleData = (r as any).toJSON ? (r as any).toJSON() : (r as any);
        return roleData.id_user;
      }))];
      if (usuariosAfectados.length > 1 || usuariosAfectados[0] !== id_user) {
        console.error(`ERROR: Se encontraron roles de múltiples usuarios! Usuarios: ${usuariosAfectados.join(', ')}, Esperado: ${id_user}`);
        throw new Error(`Error: Se encontraron roles de múltiples usuarios`);
      }
    }

    // Eliminar roles actuales y asignar nuevos (SOLO para este usuario)
    const deletedCount = await UserRole.destroy({
      where: { id_user: Number(id_user) },
    });

    console.log(`Roles anteriores eliminados para usuario ${id_user}: ${deletedCount} registros eliminados`);
    
    // Verificar que solo se eliminaron roles del usuario correcto
    if (deletedCount > 0) {
      const rolesRestantes = await UserRole.findAll({
        where: { id_user: Number(id_user) },
      });
      if (rolesRestantes.length > 0) {
        console.error(`ERROR: Aún quedan roles después de eliminar!`);
        throw new Error(`Error: No se eliminaron todos los roles del usuario ${id_user}`);
      }
    }

    // Crear nuevas asignaciones (SOLO para este usuario)
    const userRoles = validRoleIds.map(id_role => ({
      id_user: Number(id_user), // Asegurar que sea número
      id_role: Number(id_role),
    }));

    console.log('Creando asignaciones (SOLO para usuario', id_user, '):', userRoles);
    
    // Verificar que todos los roles sean para el mismo usuario
    const usuariosEnRoles = [...new Set(userRoles.map(r => r.id_user))];
    if (usuariosEnRoles.length > 1 || usuariosEnRoles[0] !== id_user) {
      console.error(`ERROR: Se intentan crear roles para múltiples usuarios! Usuarios: ${usuariosEnRoles.join(', ')}, Esperado: ${id_user}`);
      throw new Error(`Error: Se intentan crear roles para múltiples usuarios`);
    }
    
    const createdRoles = await UserRole.bulkCreate(userRoles as any);
    console.log(`Roles asignados correctamente: ${createdRoles.length} roles creados para usuario ${id_user}`);
    
    // Verificar roles después de crear (con un pequeño delay para asegurar que se guardó)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const rolesDespues = await UserRole.findAll({
      where: { id_user: Number(id_user) },
    });
    
    // Verificar que solo se crearon roles para el usuario correcto
    const usuariosConRoles = [...new Set(rolesDespues.map((r: any) => {
      const roleData = (r as any).toJSON ? (r as any).toJSON() : (r as any);
      return roleData.id_user;
    }))];
    if (usuariosConRoles.length > 1 || (usuariosConRoles.length === 1 && usuariosConRoles[0] !== id_user)) {
      console.error(`ERROR: Se encontraron roles de múltiples usuarios después de crear! Usuarios: ${usuariosConRoles.join(', ')}, Esperado: ${id_user}`);
      throw new Error(`Error: Se encontraron roles de múltiples usuarios después de crear`);
    }
    console.log(`Roles del usuario ${id_user} (después de crear):`, rolesDespues.map((r: any) => ({
      id_user_role: r.id_user_role,
      id_user: r.id_user,
      id_role: r.id_role
    })));
    
    // Verificar que los roles creados coincidan con los esperados
    const rolesIdsDespues = rolesDespues.map((r: any) => Number(r.id_role));
    const rolesEsperados = validRoleIds;
    const coinciden = rolesIdsDespues.length === rolesEsperados.length && 
                      rolesEsperados.every(id => rolesIdsDespues.includes(id));
    
    if (!coinciden) {
      console.error('ERROR: Los roles guardados no coinciden con los esperados!');
      console.error('Roles esperados:', rolesEsperados);
      console.error('Roles guardados:', rolesIdsDespues);
      throw new Error(`Los roles guardados no coinciden. Esperados: ${rolesEsperados.join(', ')}, Guardados: ${rolesIdsDespues.join(', ')}`);
    } else {
      console.log('✓ Verificación exitosa: Los roles guardados coinciden con los esperados');
    }
  } catch (error) {
    console.error('Error en assignRolesToUser:', error);
    throw error;
  }
};

export const addRoleToUser = async (
  id_user: number,
  id_role: number,
): Promise<void> => {
  try {
    await validateUserExists(id_user);

    // Validar que el rol existe
    const role = await Rol.findByPk(id_role);
    if (!role) {
      errorHandler(404, 'Rol no encontrado');
    }

    // Verificar que no esté ya asignado
    const existing = await UserRole.findOne({
      where: { id_user, id_role },
    });

    if (existing) {
      errorHandler(400, 'El usuario ya tiene este rol asignado');
    }

    await UserRole.create({ id_user, id_role } as any);
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const removeRoleFromUser = async (
  id_user: number,
  id_role: number,
): Promise<void> => {
  try {
    await validateUserExists(id_user);

    const userRole = await UserRole.findOne({
      where: { id_user, id_role },
    });

    if (!userRole) {
      errorHandler(404, 'El usuario no tiene este rol asignado');
    }

    await UserRole.destroy({
      where: { id_user, id_role },
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
};

// ==================== GESTIÓN DE PERMISOS ====================

export const getUserPermissions = async (
  id_user: number,
): Promise<IUserWithPermissions> => {
  try {
    await validateUserExists(id_user);

    const user = await User.findByPk(id_user, {
      include: [rolIncludeable],
    });

    if (!user) {
      errorHandler(404, 'Usuario no encontrado');
    }

    const userData = user!.toJSON() as IUserAPI;
    const roles = userData.roles || [];
    const roleIds = roles.map(role => role.id_role);

    // Obtener todas las operations_types de los roles del usuario
    const operations = await OperationType.findAll({
      where: {
        id_role: roleIds,
      },
      include: [
        {
          model: Rol,
          as: 'role',
        },
      ],
      order: [['order', 'ASC']],
    });

    return {
      ...userData,
      permissions: operations.map(op => op.toJSON()),
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const changeUserPassword = async (
  id_user: number,
  newPassword: string,
): Promise<void> => {
  try {
    await validateUserExists(id_user);
    validatePasswordStrength(newPassword);

    const hashedPassword = hashPassword(newPassword);
    await User.update(
      { password: hashedPassword },
      { where: { id_user } },
    );
  } catch (error) {
    console.log(error);
    throw error;
  }
};
