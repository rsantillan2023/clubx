import { IRole } from '../../../../database/schemas/degira/interfaces/rol.interface';
import { IUser } from '../../../../database/schemas/degira/interfaces/user.interface';
import { IOperationType } from '../../../../database/schemas/degira/interfaces/operation_type.interface';
import { IRequestParams } from '../../types/requestParam.interface';

// ENUMS

export enum ERoles {
  CAJA = 1,
  BARMAN = 2,
  ADMIN = 3,
  GUARDAROPA = 4,
  CAJA_ESPECIAL = 5,
  BARMAN_SUPERV = 6,
}

// INTERFACES

export interface ICreateRole {
  description: string;
}

export interface IUpdateRole {
  description?: string;
}

export interface IRoleWithUsers extends IRole {
  users: IUser[];
}

export interface IRoleWithOperations extends IRole {
  operations: IOperationType[];
}

export interface IRoleComplete extends IRole {
  users: IUser[];
  operations: IOperationType[];
}

export interface IRoleParams extends IRequestParams {
  search?: string;
}
