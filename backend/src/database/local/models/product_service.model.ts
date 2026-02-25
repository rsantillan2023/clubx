import { DataTypes, Model } from 'sequelize';
import { LOCAL_DB } from '../connection';
import { IProductService } from '../../schemas/degira/interfaces/product_service.interface';

class ProductServiceLocal extends Model<IProductService> {}

ProductServiceLocal.init(
  {
    id_product_service: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.BIGINT,
    },
    description: {
      type: DataTypes.STRING(255),
    },
    available: {
      type: DataTypes.NUMBER,
    },
    long_description: {
      type: DataTypes.STRING(255),
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
    },
    url_image: {
      type: DataTypes.STRING(255),
    },
    featured: {
      type: DataTypes.BOOLEAN,
    }
  },
  {
    sequelize: LOCAL_DB,
    tableName: 'Products_Services',
    timestamps: false,
  },
);

export default ProductServiceLocal;

