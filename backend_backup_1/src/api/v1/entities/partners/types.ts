import { IRequestParams } from "../../types/requestParam.interface";

export interface IPartnerAPI {
  id_partner: number;
  dni: string;
  alias: string;
  email?: string;
  phone?: string;
  id_state: number;
  created_at?: Date;
  updated_at?: Date;
  visits_count?: number;
}

export interface IPartnerParams extends IRequestParams {
  sortBy?: string;
  sortDesc?: boolean;
  searcher?: string;
  status?: string;
  fechas?: string;
  dni?: string;
  alias?: string;
}
