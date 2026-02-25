export interface IPartner {
  id_partner?: number;
  alias?: string;
  partner_dni?: string;
  partner_name?: string;
  partner_birthdate?: Date;
  partner_phone?: string;
  affiliate_dni?: string;
  affiliate_name?: string;
  affiliate_birthdate?: Date | null;
  id_visit_type_usualy?: number;
  partner_discharge_date?: Date;
  id_state?: number;
  observations?: string;
  suspension_reason?: string;
  expultion_reason?: string;
  santion_date?: Date;
  affiliate_phone?: string;
  partner_in_establishment?: boolean;
  last_visit?: Date | undefined | null;
}
