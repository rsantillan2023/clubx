import OperationType from '../models/operation_type.model';
import Role from '../models/rol.model';

export const operationTypeAssociations = () => {
  OperationType.belongsTo(Role, {
    foreignKey: 'id_role',
    as: 'role',
  });
};
