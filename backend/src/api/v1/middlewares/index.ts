import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Role from '../../../database/schemas/degira/models/rol.model';
import User from '../../../database/schemas/degira/models/user.model';
import { ERoles } from '../entities/roles/types';
import { IUserAPI } from '../entities/users/types';

export const jwtValidator = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).send({ message: 'Unauthorized' });
  }
  try {
    // Usar JWT_SECRET del .env o AUTH_KEY (compatible con producción)
    const authKey = process.env.JWT_SECRET || process.env.AUTH_KEY || '';
    let payload = jwt.verify(token, authKey);
    const { id_user } = payload as any;
    let roles = [];
    if (!id_user) {
      return res.status(401).send({ message: 'Unauthorized' });
    } else {
      const user = await User.findOne({
        where: {
          id_user,
        },
        include: [
          {
            model: Role,
            as: 'roles',
          },
        ],
      }) as IUserAPI | null;
      roles = user?.roles.map((role: any) => role.id_role) || [];
      if (!user) {
        return res.status(401).send({ message: 'Unauthorized' });
      }
    }
    // Guardar información del usuario autenticado en req.body para uso en validaciones
    // PERO no sobrescribir campos que ya existen (como roles que se envían desde el frontend)
    req.body.id_user = id_user;
    // Solo asignar roles del usuario autenticado si no se están enviando roles en el body
    // Esto permite que endpoints como POST /users/:id/roles puedan recibir los roles desde el frontend
    if (!req.body.roles || (Array.isArray(req.body.roles) && req.body.roles.length === 0)) {
      req.body.roles = roles;
    }
    // Guardar los roles del usuario autenticado en un campo separado para validaciones
    req.body.userAuthenticatedRoles = roles;
    req.body.roleValid = true //cambiar a false si se quiere que el usuario tenga que tener un rol especifico y este sea validado en los siguientes middlewares
    next();
  } catch (error) {
    console.log(error);
  }
};

export const cajaRoleValidator = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const roles = req.body.userAuthenticatedRoles ?? req.body.roles ?? [];
    if (roles.includes(ERoles.CAJA)) {
      req.body.roleValid = true
    }
    return next();
  } catch (error) {
    console.log(error);
  }
};

export const adminRoleValidator = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const roles = req.body.userAuthenticatedRoles ?? req.body.roles ?? [];
    if (roles.includes(ERoles.ADMIN)) {
      req.body.roleValid = true
    }
    next();
  } catch (error) {
    console.log(error);
  }
}



export const barmanRoleValidator = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const roles = req.body.userAuthenticatedRoles ?? req.body.roles ?? [];
    if (roles.includes(ERoles.BARMAN)) {
      req.body.roleValid = true
    }
    return next();
  } catch (error) {
    console.log(error);
  }
}


export const guardaRopaRoleValidator = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const roles = req.body.userAuthenticatedRoles ?? req.body.roles ?? [];
    if (roles.includes(ERoles.GUARDAROPA)) {
      req.body.roleValid = true
    }
    next();
  } catch (error) {
    console.log(error);
  }
}

export const validRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { roleValid } = req.body;
    if (roleValid) {
      return next();
    } else {
      return res.status(401).send({ message: 'Unauthorized' });
    }
  } catch (error) {
    console.log(error);
  }
}