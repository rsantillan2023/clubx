export interface ITicket {
    id_ticket?: number;
    id_visit: number | null;
    id_bracelet: string;
    observations: string;
    ticket_date: Date;
    ticket_amount: number;
}