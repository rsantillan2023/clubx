import { DataTypes, Model } from 'sequelize';
import { DEGIRA_DB } from '../../../connection';
import { IPaymentMethod } from '../interfaces/payment_methods.interface';

class PaymentMethod extends Model<IPaymentMethod> { }

PaymentMethod.init(
    {
        id_payment_method: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        method: {
            type: DataTypes.STRING(100),
        },
        percent: {
            type: DataTypes.DECIMAL(10, 2),
        },
    },
    {
        // Other model options go here
        sequelize: DEGIRA_DB, // We need to pass the connection instance
        tableName: 'Payment_Methods', // We need to choose the model name
        timestamps: false,
    },
);

export default PaymentMethod;
