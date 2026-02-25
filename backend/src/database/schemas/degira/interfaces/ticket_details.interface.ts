export interface ITicketDetails {
    id_ticket_detail?: number;
    id_ticket?: number;
    id_product_service: number;
    quantity: number;
    unit_price: number;
    payed?: boolean | null;
    ref_id_ticket_detail?: number;
    state?: string;
}