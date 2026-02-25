import OperationType from '../models/operation_type.model';
import Role from '../models/rol.model';
import User from '../models/user.model';
import UserRole from '../models/user_role.model';

export const roleAssociations = () => {
  Role.belongsToMany(User, {
    through: UserRole,
    as: 'users',
    foreignKey: 'id_role',
  });
  
  Role.hasMany(OperationType, {
    foreignKey: 'id_role',
    as: 'operations',
  });
};
