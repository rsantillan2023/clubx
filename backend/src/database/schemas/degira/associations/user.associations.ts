import Role from '../models/rol.model';
import State from '../models/states.model';
import User from '../models/user.model';
import UserRole from '../models/user_role.model';

export const userAssociations = () => {
  User.belongsToMany(Role, {
    through: UserRole,
    as: 'roles',
    foreignKey: 'id_user',
  });
};
