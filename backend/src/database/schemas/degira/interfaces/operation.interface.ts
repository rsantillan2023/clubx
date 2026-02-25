export interface IOperation {
  id_operation?: number;
  id_operation_type: number;
  id_user: number;
  operation_metadata: string;
  operation_log: string;
  operation_date: Date;
  id_role?: number;
  id_partner?: number;
  id_visit?: number;
  operation_amount?: number;
  id_payment_method?: number;
  id_day?: number;
}
