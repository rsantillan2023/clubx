import { IRole } from '../../../../database/schemas/degira/interfaces/rol.interface';
import { IUser } from '../../../../database/schemas/degira/interfaces/user.interface';
import { IUserDealer } from '../../../../database/schemas/degira/interfaces/userDealer.interface';
import { IRequestParams } from './../../types/requestParam.interface';
import { IOperationType } from '../../../../database/schemas/degira/interfaces/operation_type.interface';

// ENUMS

export enum EUserRoles {
  ADMIN = 1,
  SUPERADMIN = 2,
  DEALER = 3,
}

// INTERFACES

export interface IUserAPI extends IUser {
  password: string;
  roles: IRole[];
}

export interface ILogin {
  id_user: number;
  name: string;
  username: string;
  roles: IRole[];
  token: string;
}

export interface IUserParams extends IRequestParams {
  id_rol?: string;
  search?: string;
  roleId?: number;
}

export interface ICreateUser {
  name: string;
  surname: string;
  username: string;
  password: string;
  roles?: number[];
}

export interface IUpdateUser {
  name?: string;
  surname?: string;
  username?: string;
  password?: string;
}

export interface IUserWithRoles extends IUser {
  roles: IRole[];
}

export interface IUserWithPermissions extends IUser {
  roles: IRole[];
  permissions: IOperationType[];
}
