import { IPartner } from '../../../../database/schemas/degira/interfaces/partner.interface';
import { IVisit } from '../../../../database/schemas/degira/interfaces/visit.interface';
import { IVisitType } from '../../../../database/schemas/degira/interfaces/visit_type.interface';
import { IRequestParams } from './../../types/requestParam.interface';
//ENUMS

export enum EPartnerState {
  SOCIO_VIP = 1,
  SOCIO_NORMAL = 2,
  SOCIO_TURISTA = 3,
  SOCIO_OBSERVADO = 4,
  SOCIO_NO_FRECUENTE = 5,
  SOCIO_EXPULSADO = 6,
  SOCIO_SUSPENDIDO = 7,
  SOCIO_INVITADO = 8,
}

export enum EPartnerVisitType {
  SOLO = 1,
  PAREJA = 2,
  OTRO = 3,
  SOLA = 4,
}

//INTERFACES

export interface IPostPartner extends IPartner{
  id_partner?: number;
  alias: string;
  partner_dni: string;
  partner_name: string
  partner_birthdate: Date;
  partner_phone: string;
  affiliate_dni: string;
  affiliate_name: string;
  affiliate_birthdate: Date | null;
  id_visit_type_usualy: number;
  id_state: number;
  observations: string;
  suggest_membership_amount: number;
}

export interface IPartnerInsideAPI extends IPartner {
  visit_type: IVisitType[];
  visit_date: Date;
  id_bracelet_1: string;
  id_bracelet_2: string;
  hour_entry: Date;
  total_payed: number;
}
export interface IVisitInsideAPI extends IVisit {
  visit_type: IVisitType[];
  partner: IPartnerInsideAPI[];
  total_amount: number;
}

export interface IPartnerDNIAPI extends IPartner {
  partner_in_establishment: boolean;
  id_bracelet_1?: string;
  id_bracelet_2?: string;
  last_visit: Date | undefined | null;
  has_consumptions?: boolean;
}

export interface IPartnerParams extends IRequestParams {
  search?: string;
  id_partner?: string;
  dni?: string;
  id_state?: number | number[];
  id_visit_type_usualy?: number;
  id_visit_type?: number;
  date?: string;
  bracelet_number?: string;
}
