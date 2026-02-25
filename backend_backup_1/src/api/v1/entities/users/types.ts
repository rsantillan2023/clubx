import { IRol } from "../../../../database/schemas/degira/interfaces/rol.interface";
import { IUser } from "../../../../database/schemas/degira/interfaces/user.interface";
import { IUserDealer } from "../../../../database/schemas/degira/interfaces/userDealer.interface";
import { IRequestParams } from "./../../types/requestParam.interface";

// ENUMS
export enum EUserStates {
  ACTIVE = 1,
  INACTIVE = 2,
}

export enum EUserRoles {
  ADMIN = 1,
  SUPERADMIN = 2,
  DEALER = 3,
}

// INTERFACES
export interface IUserDealerAPI extends IUserDealer {
  user: IUserAPI;
}

export interface IUserAPI extends IUser {
  rol: IRol;
  user_dealer: IUserDealerAPI;
}

export interface ILogin {
  id_user: number;
  name: string;
  username: string;
  email: string;
  rol?: IRol; // Opcional ya que puede no existir en la BD
  token: string;
}

export interface IUserParams extends IRequestParams {
  id_rol: string;
}
