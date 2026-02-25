import { IRequestParams } from "../../types/requestParam.interface";

export interface IOperationParams extends IRequestParams{
    searcher?: string;
    tipoOperacion?: string;
    fechas?: string;
}