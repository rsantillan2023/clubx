import Rol from "../models/rol.model";
import User from "../models/user.model";
import UserDealer from "../models/userDealer.model";

export const userAssociations = () => {
  User.belongsTo(Rol, {
    foreignKey: "id_rol",
    as: "rol",
  });

  User.hasOne(UserDealer, {
    foreignKey: "id_user",
    as: "user_dealer",
  });
};
