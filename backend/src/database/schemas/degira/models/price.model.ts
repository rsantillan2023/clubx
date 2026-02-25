import { DataTypes, Model } from 'sequelize';
import { DEGIRA_DB } from '../../../connection';
import { IPrice } from '../interfaces/price.interface';

class Price extends Model<IPrice> { }

Price.init(
    {
        id_price: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        id_day: {
            type: DataTypes.INTEGER,
        },
        id_receivable_concept: {
            type: DataTypes.INTEGER,
        },
        id_visit_type: {
            type: DataTypes.INTEGER,
        },
        total_amount: {
            type: DataTypes.DECIMAL(10, 2),
        },
    },
    {
        // Other model options go here
        sequelize: DEGIRA_DB, // We need to pass the connection instance
        tableName: 'Prices', // We need to choose the model name
        timestamps: false,
    },
);

export default Price;