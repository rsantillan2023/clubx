import { DataTypes, Model } from 'sequelize';
import { DEGIRA_DB } from '../../../connection';
import { IDay } from '../interfaces/day.interface';

class Day extends Model<IDay> { }

Day.init(
    {
        id_day: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        name: {
            type: DataTypes.STRING(100),
        },
    },
    {
        // Other model options go here
        sequelize: DEGIRA_DB, // We need to pass the connection instance
        tableName: 'Days', // We need to choose the model name
        timestamps: false,
    },
);

export default Day;