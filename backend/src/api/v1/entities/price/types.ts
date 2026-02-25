export interface IPrice {
    id_visit_type: number;
    id_payment_method: number;
    id_receivable_concept: number;
    id_day: number;
}

export interface IPriceListParams {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDesc?: boolean;
    id_day?: number;
    id_visit_type?: number;
    id_receivable_concept?: number;
}

export interface IBulkPriceUpdate {
    ids: number[];
    updateType: 'absolute' | 'relative' | 'percentage';
    value: number;
}