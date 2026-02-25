import { DataTypes, Model } from 'sequelize';
import { DEGIRA_DB } from '../../../connection';
import { IProductService } from '../interfaces/product_service.interface';

class ProductService extends Model<IProductService> {}

ProductService.init(
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
    // Other model options go here
    sequelize: DEGIRA_DB, // We need to pass the connection instance
    tableName: 'Products_Services', // We need to choose the model name
    timestamps: false,
  },
);

export default ProductService;
