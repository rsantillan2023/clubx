import { IOperationType } from '../../../../database/schemas/degira/interfaces/operation_type.interface';
import { IRole } from '../../../../database/schemas/degira/interfaces/rol.interface';
import { IRequestParams } from '../../types/requestParam.interface';

export enum EOpertationType {
    LECTURA_DNI = 1,
    ALTA_SOCIO = 2,
    REACTIVACION_MEMBRESIA = 3,
    INGRESO_VISITA = 4,
    ASOCIACION_BRAZALETE = 5,
    MONTO_TOTAL_CONSUMIDO = 6,
    EGRESO_VISITA = 7,
    CONSUMOS = 8,
    MODIFICACION_SOCIO = 9,
    CONSULTAR_SOCIO = 10,
    GUARDARROPA = 11,
    ENTRADA_RAPIDA = 21,
    ACTUALIZACION_MASIVA_PRECIOS = 26,
    ACTUALIZACION_MASIVA_PRODUCTOS_SERVICIOS = 27,
    ALTA_PRODUCTO_SERVICIO = 28,
    MODIFICACION_PRODUCTO_SERVICIO = 29,
    ELIMINACION_PRODUCTO_SERVICIO = 30,
    CONSULTA_PRODUCTOS_SERVICIOS = 31,
    GESTION_PRECIOS = 33,
    HISTORICO_VISITANTES = 34,
    CONSUMOS_POR_VISITA = 35,
    VALIDACION_MEMBRESIA = 36,
}

export interface ICreateOperationType {
    description: string;
    action?: string;
    id_role: number;
    tag?: string;
    icon?: string;
    path?: string;
    menu_available?: number;
    order?: number;
}

export interface IUpdateOperationType {
    description?: string;
    action?: string;
    id_role?: number;
    tag?: string;
    icon?: string;
    path?: string;
    menu_available?: number;
    order?: number;
}

export interface IOperationTypeWithRole extends IOperationType {
    role: IRole;
}

export interface IOperationTypeParams extends IRequestParams {
    roleId?: number;
    search?: string;
    menuAvailable?: number;
}