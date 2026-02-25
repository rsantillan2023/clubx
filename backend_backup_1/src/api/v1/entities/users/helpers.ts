import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { FindAndCountOptions, Includeable, Model, Op } from "sequelize";
import Rol from "../../../../database/schemas/degira/models/rol.model";
import User from "../../../../database/schemas/degira/models/user.model";
import UserDealer from "../../../../database/schemas/degira/models/userDealer.model";
import { errorHandler } from "../../helpers";
import { getPagination } from "./../../helpers/index";
import { EUserStates, ILogin, IUserAPI, IUserParams } from "./types";

// Usar JWT_SECRET del .env o AUTH_KEY (compatible con producción)
const AUTH_KEY = process.env.JWT_SECRET || process.env.AUTH_KEY || "";

const rolIncludeable: Includeable = {
  model: Rol,
  as: "rol",
};
const userDealerIncludeable: Includeable = {
  model: UserDealer,
  as: "user_dealer",
  include: [],
};

export const getUserList = async (userParams: IUserParams) => {
  try {
    const { page, pageSize } = userParams;

    const include: Includeable[] = [];
    let findOptions: FindAndCountOptions = { 
      include,
      // Especificar solo las columnas que existen en la tabla
      attributes: ['id_user', 'username', 'name', 'surname', 'password']
    };

    if (page && pageSize) {
      const { limit, offset } = getPagination(page, pageSize);
      findOptions = { ...findOptions, offset, limit };
    }

    const users = await User.findAndCountAll(findOptions);
    return users;
  } catch (error) {
    console.log(error);
  }
};

export const userLogin = async (
  username: string,
  password: string
): Promise<ILogin> => {
  try {
    // Solo incluir relaciones si las tablas existen
    const include: Includeable[] = [];
    // Intentar incluir rol solo si la relación existe
    // const include: Includeable[] = [rolIncludeable, userDealerIncludeable];
    
    const user = await User.findOne({
      where: {
        username, // Solo buscar por username ya que email no existe
        // id_state: EUserStates.ACTIVE, // Comentar si id_state no existe
      },
      include,
      // Especificar solo las columnas que existen
      attributes: ['id_user', 'username', 'name', 'surname', 'password']
    });
    if (!user) errorHandler(403, "El usuario no existe");
    const {
      password: userPassword = "",
      id_user = 0,
      name = "",
      username: userUsername = "",
      // email = "", // No existe en la BD
      // rol,
    } = (user?.toJSON() as IUserAPI) || {};

    // Validar contraseña con bcrypt (compatible con producción)
    const validatePass = bcrypt.compareSync(password, userPassword);
    if (!validatePass) errorHandler(403, "La contraseña no es correcta");

    // 3 - Generate token
    const token = jwt.sign({ id_user }, AUTH_KEY, {});

    return { id_user, name, username: userUsername, email: "", token };
  } catch (error) {
    throw error;
  }
};

export const encryptPassword = (password: string) => {
  try {
    const salt = bcrypt.genSaltSync();
    let encryptedPassword = bcrypt.hashSync(password, salt);
    return encryptedPassword;
  } catch (error) {
    console.log(error);
  }
};
