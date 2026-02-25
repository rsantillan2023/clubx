import { IPartner } from "../../../../database/schemas/degira/interfaces/partner.interface";
import { IProductService } from "../../../../database/schemas/degira/interfaces/product_service.interface";
import { ITicket } from "../../../../database/schemas/degira/interfaces/tickets.interface";
import { ITicketDetails } from "../../../../database/schemas/degira/interfaces/ticket_details.interface";
import { IVisit } from "../../../../database/schemas/degira/interfaces/visit.interface";
import { IVisitType } from "../../../../database/schemas/degira/interfaces/visit_type.interface";
import { IRequestParams } from "../../types/requestParam.interface";

//ENUMS


export enum EMinimumConsumption {
    MINIMUM_CONSUMPTION = 7,
}

//INTERFACES

export interface IVisitAPI extends IVisit {
    visit_type: IVisitType[];
}

export interface IPartnerAPI extends IPartner {
    id_visit_type: number;
    id_bracelet_1: string;
    id_bracelet_2: string;
}

export interface ITicketDetailsAPI extends ITicketDetails {
    product_service: IProductService;
  }

export interface ITicketAPI extends ITicket {
    ticket_details: ITicketDetailsAPI[];
  }
  
export interface IConsumptionAPI extends IVisit{
    visit_type: IVisitType[];
    partner: IPartnerAPI[];
    tickets: ITicketAPI[];
}
export interface IConsumptionParams extends IRequestParams {
    id_product_service?: string;
    id_bracelet?: string;   
} 
/* export interface IConsumptionPost extends IBraceletConsumption {
    id_bracelet_consumption: number,
    id_product_service: number,
    amount: number,
    observation: string,
    id_bracelet: string,
}

export interface IConsumptionAPI extends IBraceletConsumption {
    product_service: IProductService[]
}*/
