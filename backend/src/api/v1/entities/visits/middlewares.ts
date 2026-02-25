import { Op, Transaction } from "sequelize";
import Partner from "../../../../database/schemas/degira/models/partner.model";
import State from "../../../../database/schemas/degira/models/states.model";
import Visit from "../../../../database/schemas/degira/models/visit.model";
import VisitType from "../../../../database/schemas/degira/models/visit_type.model";
import { argentinianDate, maxLimitHour, minLimitHour } from "../../helpers";
import { QueryTypes } from "sequelize";
import { DEGIRA_DB } from '../../../../database/connection';
import PaymentMethod from "../../../../database/schemas/degira/models/payment_method.model.interface";
import { EPartnerState } from "../partners/types";
import { EPaymentMethod } from "../payment_method/types";


export const entryValidator = async (
    id_partner: number,
    //visit_date: string,
    id_state: number,
    id_visit_type: number,
    //other_visit_obs: string,
    //entry_visit_obs: string,
    entry_amount_paid: number,
    other_paid: number,
    other_paid_obs: string,
    id_bracelet_1: string,
    id_bracelet_2: string,
    id_payment_method: number,
): Promise<[boolean, string]> => {
    try {
        let isValid: boolean = true;
        let message: string = "";
        const today = new Date();
        //ID PARTNER
        if (!id_partner || isNaN(Number(id_partner))) {
            isValid = false;
            message = "id_partner es requerido y debe ser un numero";
        } else {
            const partner = await Partner.findOne({ where: { id_partner: Number(id_partner) } });

            if (!partner) {
                isValid = false;
                message = "el socio no existe";
            } else {
                // Check if the partner already visited in the same night
                const visitQuery = await Visit.findAll({
                    where: {
                        id_partner,
                        hour_exit:  null,
                    },
                });


                if (visitQuery.length) {
                    isValid = false;
                    message = "El socio ya ingresó hoy";
                }
            }
        }

        //ID STATE
        if (!id_state || isNaN(Number(id_state))) {
            isValid = false;
            message += "- El id_state es requerido y debe ser un numero";
        } else {
            const state = await Partner.findOne({ where: { id_state: Number(id_state) } });

            if (!state) {
                isValid = false;
                message += "- El estado no existe";
            }
        }

        //ID VISIT TYPE
        if (!id_visit_type || isNaN(Number(id_visit_type))) {
            isValid = false;
            message += "- id_visit_type es requerido y debe ser un numero";
        } else {
            const visitType = await VisitType.findOne({ where: { id_visit_type: Number(id_visit_type) } });

            if (!visitType) {
                isValid = false;
                message += "- El tipo de visita no existe";
            }
        }

        /*         //OTHER VISIT OBS
                if (!other_visit_obs || !other_visit_obs.length) {
                    isValid = false;
                    message += "- other_visit_obs is required";
                } */

        if (id_payment_method !== EPaymentMethod.NO_PAGA && ((!entry_amount_paid || isNaN(Number(entry_amount_paid))) && id_state !== EPartnerState.SOCIO_INVITADO)) {
            isValid = false;
            message += "- la cantidad pagada es requerida y debe ser un numero";
        }

        //OTHER PAID
        if (other_paid) {
            if (isNaN(Number(other_paid))) {
                isValid = false;
                message += "- el monto de otros pagos debe ser un numero";
            }
            if (other_paid_obs && !other_paid_obs.length) {
                isValid = false;
                message += "- la observacion de otros pagos es requerida";
            }
        }


        //ID BRACELET 1


        if (!id_bracelet_1) {
            isValid = false;
            message += "- id_bracelet_1 es requerido";
        } else {
            const argDate = argentinianDate(today)
            //const minHour = minLimitHour(argDate).toISOString();
            //const maxHour = maxLimitHour(argDate).toISOString();
            const bracelet = await Visit.findOne({
                where: {
                    [Op.or]: [
                        {
                            id_bracelet_1: id_bracelet_1,
                        },
                        {
                            id_bracelet_2: id_bracelet_1,
                        }
                    ],
                    /* hour_entry: {
                        [Op.between]: [minHour, maxHour]
                    } */
                }

            });
            if (bracelet) {
                isValid = false;
                message += "- el id_bracelet_1 ya estuvo en el club";
            }
        }

        //ID BRACELET 2
        if (id_bracelet_2) {
            if (id_bracelet_1 === id_bracelet_2) {
                isValid = false;
                message += "- id_bracelet_1 y id_bracelet_2 no pueden ser iguales";
            } else {
                const argDate = argentinianDate(today)
                const minHour = minLimitHour(argDate).toISOString();
                const maxHour = maxLimitHour(argDate).toISOString();

                const bracelet = await Visit.findOne({
                    where: {
                        [Op.or]: [
                            {
                                id_bracelet_1: id_bracelet_2,
                            },
                            {
                                id_bracelet_2: id_bracelet_2,
                            }
                        ],/* 
                        hour_entry: {
                            [Op.between]: [minHour, maxHour]
                        } */
                    }
                });

                if (bracelet) {
                    isValid = false;
                    message += "- el id_bracelet_2 ya estuvo en el club";
                }
            }
        }

        //ID PAYMENT METHOD
        if ((!id_payment_method || isNaN(Number(id_payment_method))) && id_state !== EPartnerState.SOCIO_INVITADO) {
            isValid = false;
            message += "- id_payment_method es requerido y debe ser un numero";
        } else if (id_payment_method && id_state !== EPartnerState.SOCIO_INVITADO) {
            const paymentMethod = await PaymentMethod.findOne({ where: { id_payment_method: Number(id_payment_method) } });

            if (!paymentMethod) {
                isValid = false;
                message += "- El metodo de pago no existe";
            }
        }



        return [isValid, message];

    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const exitValidator = async (
    id_visit: string,
    id_state: number,
    exit_visit_obs: string,
    exit_amount_payed: number,
    other_paid: number,
    other_paid_obs: string,
    id_payment_method: number,
): Promise<[boolean, string]> => {
    try {
        let isValid: boolean = true;
        let message: string = "";

        //ID VISIT
        if (!id_visit || !id_visit.length) {
            isValid = false;
            message = "la visita es requerida";
        } else {
            const visit = await Visit.findOne({ where: { id_visit: Number(id_visit) } });

            if (!visit) {
                isValid = false;
                message = "la visita no existe";
            }
        }

        //ID STATE
        if (id_state) {
            if (isNaN(Number(id_state))) {
                isValid = false;
                message += "- el id_state debe ser un numero";
            } else {
                const state = await State.findOne({ where: { id_state: Number(id_state) } });

                if (!state) {
                    isValid = false;
                    message += "- el estado no existe";
                }
            }
        }

        //EXIT VISIT OBS
        if (exit_visit_obs) {
            if (!exit_visit_obs.length) {
                isValid = false;
                message += "- no se ingreso observacion de salida";
            }
        }


        //EXIT AMOUNT PAID
        if ( id_payment_method !== EPaymentMethod.NO_PAGA && (!exit_amount_payed || isNaN(Number(exit_amount_payed)) && id_state !== EPartnerState.SOCIO_INVITADO)) {
            isValid = false;
            message += "- la cantidad pagada es requerida y debe ser un numero";
        }

        //OTHER PAID
        if (other_paid) {
            if (isNaN(Number(other_paid))) {
                isValid = false;
                message += "- el monto de otros pagos debe ser un numero";
            }
            if (other_paid_obs && !other_paid_obs.length) {
                isValid = false;
                message += "- la observacion de otros pagos es requerida";
            }
        }

        //ID PAYMENT METHOD
        if (!id_payment_method || isNaN(Number(id_payment_method))) {
            isValid = false;
            message += "- id_payment_method es requerido y debe ser un numero";
        } else {
            const paymentMethod = await PaymentMethod.findOne({ where: { id_payment_method: Number(id_payment_method) } });

            if (!paymentMethod) {
                isValid = false;
                message += "- El metodo de pago no existe";
            }
        }

        

        return [isValid, message];

    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const generarIdBasadoEnFecha = async (id_day: number, visit_date: Date, transaction?: Transaction): Promise<string> => {
    // Formatear la fecha como yymmdd
    const year = visit_date.getFullYear().toString().slice(-2); // últimos 2 dígitos del año
    const month = (visit_date.getMonth() + 1).toString().padStart(2, '0'); // mes con 2 dígitos
    const day = visit_date.getDate().toString().padStart(2, '0'); // día con 2 dígitos
    const yymmdd = year + month + day;
    
    // Crear el prefijo: Tarj + yymmdd
    const prefix = `Tarj${yymmdd}`;
    
    // Buscar el último id_bracelet_1 que empiece con el mismo prefijo
    const lastVisit = await Visit.findOne({
        where: {
            id_bracelet_1: {
                [Op.like]: `${prefix}-%`
            }
        },
        order: [['id_bracelet_1', 'DESC']],
        transaction
    });
    
    let sequenceNumber = 1; // Por defecto, empezar en 001
    
    if (lastVisit) {
        const lastId = lastVisit.toJSON().id_bracelet_1;
        // Extraer los últimos 3 dígitos después del guion (el número secuencial)
        if (lastId) {
            const parts = lastId.split('-');
            if (parts.length > 1) {
                const lastSequence = parts[parts.length - 1];
                const lastNumber = parseInt(lastSequence, 10);
                
                if (!isNaN(lastNumber)) {
                    sequenceNumber = lastNumber + 1;
                }
            }
        }
    }
    
    // Formatear el número secuencial con 3 dígitos (001, 002, etc.)
    const sequence = sequenceNumber.toString().padStart(3, '0');
    
    // Construir el ID completo: Tarj + yymmdd + - + XXX
    const id = `${prefix}-${sequence}`;
    
    return id;
}