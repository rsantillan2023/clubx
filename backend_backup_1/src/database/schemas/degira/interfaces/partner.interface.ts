export interface IPartner {
  id_partner: number;
  dni: string;
  alias: string;
  email?: string;
  phone?: string;
  id_state: number;
  created_at?: Date;
  updated_at?: Date;
}
