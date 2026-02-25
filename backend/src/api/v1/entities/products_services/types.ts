import { IProductService } from '../../../../database/schemas/degira/interfaces/product_service.interface';
import { IRequestParams } from '../../types/requestParam.interface';

export interface IProductServiceParams extends IRequestParams {
  search?: string;
  id_product_service?: number;
  available?: number;
  featured?: boolean;
}

export interface IPostProductService {
  description: string;
  available?: number;
  long_description?: string;
  price: number;
  url_image?: string;
  featured?: boolean;
}

export interface IUpdateProductService {
  description?: string;
  available?: number;
  long_description?: string;
  price?: number;
  url_image?: string;
  featured?: boolean;
}

export interface IBulkPriceUpdate {
  ids: number[];
  updateType: 'percentage' | 'absolute' | 'relative';
  value: number;
}

