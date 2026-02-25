import { DataTypes, Model } from 'sequelize';
import { LOCAL_DB } from '../connection';

interface ISyncMetadata {
  id?: number;
  resource_name: string;
  last_sync_date?: Date;
  last_sync_hash?: string;
  sync_status?: string;
  error_message?: string;
}

class SyncMetadata extends Model<ISyncMetadata> {}

SyncMetadata.init(
  {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    resource_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    last_sync_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_sync_hash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    sync_status: {
      type: DataTypes.STRING(20),
      defaultValue: 'PENDING',
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize: LOCAL_DB,
    tableName: 'sync_metadata',
    timestamps: false,
  },
);

export default SyncMetadata;

