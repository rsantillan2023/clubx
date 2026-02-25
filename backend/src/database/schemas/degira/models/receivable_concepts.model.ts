import { DataTypes, Model } from 'sequelize';
import { DEGIRA_DB } from '../../../connection';
import { IReceivableConcept } from '../interfaces/receivable_concepts.interface';

class ReceivableConcept extends Model<IReceivableConcept> { }

ReceivableConcept.init(
    {
        id_receivable_concept: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
        },
        description: {
            type: DataTypes.STRING(100),
        },
    },
    {
        // Other model options go here
        sequelize: DEGIRA_DB, // We need to pass the connection instance
        tableName: 'Receivable_Concepts', // We need to choose the model name
        timestamps: false,
    },
);

export default ReceivableConcept;