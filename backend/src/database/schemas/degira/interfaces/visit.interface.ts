export interface IVisit {
  id_visit?: number;
  id_partner?: number;
  visit_date: Date;
  id_state?: number;
  id_visit_type?: number;
  other_visit_obs?: string;
  entry_visit_obs?: string;
  exit_visit_obs?: string;
  entry_amount_paid?: number;
  visit_amount_consumed?: number;
  exit_amount_payed?: number;
  hour_entry?: Date | null;
  hour_exit?: Date | null;
  id_bracelet_1?: string;
  id_bracelet_2?: string;
  last_visit?: Date;
  id_day?: number;
  extra_entry?: number;
  extra_exit?: number;
  extra_entry_obs?: string;
  extra_exit_obs?: string;
  had_to_paid?: number;
}
