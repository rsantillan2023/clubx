import { ITicket } from "../../../../database/schemas/degira/interfaces/tickets.interface";
import { IVisit } from "../../../../database/schemas/degira/interfaces/visit.interface";
import TicketDetails from "../../../../database/schemas/degira/models/ticket_details.model";
import { IRequestParams } from "../../types/requestParam.interface";

//INTERFACES
export interface IVisitRegister{
    //id_visit: number;
    id_partner: number;
    visit_date: Date;
    id_state: number;
    id_visit_type: number;
    other_visit_obs: string;
    entry_visit_obs: string;
    entry_amount_paid: number;
    other_paid: number;
    other_paid_obs: string;
    hour_entry: Date;
    id_bracelet_1: string;
    id_bracelet_2: string;
    id_payment_method: number;
    total_amount: number | undefined;
    had_to_paid: number;
}

export interface IExitRegister{
    id_visit: string;
    id_state: number;
    exit_visit_obs: string;
    exit_amount_payed: number;
    other_paid: number;
    other_paid_obs: string;
    hour_exit: Date;
    id_bracelet_1: string | undefined;
    id_bracelet_2: string | undefined;
    had_to_paid: number;
}

export interface ITicketAPI extends ITicket{
    ticket_detail: TicketDetails
}

export interface IVisitParams extends IRequestParams {
    id_partner?: string;
    id_state?: string;
    id_visit_type?: string;
}