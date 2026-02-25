import Day from '../models/day.model';
import Operation from '../models/operation.model';
import OperationType from '../models/operation_type.model';
import Partner from '../models/partner.model';
import PaymentMethod from '../models/payment_method.model.interface';
import Role from '../models/rol.model';
import User from '../models/user.model';
import Visit from '../models/visit.model';

export const operationAssociations = () => {
  Operation.belongsTo(OperationType, {
    foreignKey: 'id_operation_type',
    as: 'operation_type',
  });
  Operation.belongsTo(User, {
    foreignKey: 'id_user',
    as: 'user',
  });
  Operation.belongsTo(Partner, {
    foreignKey: 'id_partner',
    as: 'partner',
  });
  Operation.belongsTo(Visit, {
    foreignKey: 'id_visit',
    as: 'visit',
  });
  Operation.belongsTo(PaymentMethod, {
    foreignKey: 'id_payment_method',
    as: 'payment_method',
    });
  Operation.belongsTo(Role, {
    foreignKey: 'id_role',
    as: 'role',
  });
  Operation.belongsTo(Day,{
    foreignKey: 'id_day',
    as: 'day',
  });
};
