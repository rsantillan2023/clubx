import { FindAndCountOptions, Includeable, Op, OrderItem, Transaction } from 'sequelize';
import Operation from '../../../../database/schemas/degira/models/operation.model';
import Partner from '../../../../database/schemas/degira/models/partner.model';
import ProductService from '../../../../database/schemas/degira/models/product_service.model';
import Ticket from '../../../../database/schemas/degira/models/ticket.model';
import TicketDetails from '../../../../database/schemas/degira/models/ticket_details.model';
import Visit from '../../../../database/schemas/degira/models/visit.model';
import VisitType from '../../../../database/schemas/degira/models/visit_type.model';
import { argentinianDate, errorHandler, getOrderItemConsume, getPagination, maxLimitHour, minLimitHour } from '../../helpers';
import { EOpertationType } from '../operations_types/types';
import { consumptionValidator } from './middlewares';
import { EMinimumConsumption, IConsumptionAPI, IConsumptionParams, IPartnerAPI, ITicketAPI } from './types';
import { EDays } from '../days/types';


const visitTypeIncludeable: Includeable = {
    model: VisitType,
    as: 'visit_type',
};

const partnerIncludeable: Includeable = {
    model: Partner,
    as: 'partner',
};


const productIncludeable: Includeable = {
    model: ProductService,
    as: 'product_service',
};

const ticketDetailsIncludeable: Includeable = {
    model: TicketDetails,
    as: 'ticket_details',
    include: [productIncludeable],
};

const ticketsIncludeable: Includeable = {
    model: Ticket,
    as: 'tickets',
    include: [ticketDetailsIncludeable],
};

export const getConsumptionsByBracelet = async (
    consumptioParams: IConsumptionParams,
    transaction?: Transaction
) => {
    try {

        const { id_bracelet, sortBy, sortDesc } = consumptioParams;

        let criteria = 'ASC';

        if (sortDesc == 1) {
            criteria = 'DESC'
        }

        let order: OrderItem[] = getOrderItemConsume(sortBy, sortDesc);


        const visitsRaw = await Visit.findAll({
            where: {
                [Op.or]: [
                    { id_bracelet_1: id_bracelet },
                    { id_bracelet_2: id_bracelet },
                ],
                /* hour_entry: {
                    [Op.gte]: minTimeLimit,
                    [Op.lte]: maxTimeLimit,
                },
                hour_exit: null, */
            },
            include: [partnerIncludeable, ticketsIncludeable, visitTypeIncludeable],
            transaction,
            order
        });


        if (!visitsRaw) {
            return null;
        }



        const visits: IConsumptionAPI[] = visitsRaw.map((visit: any) => {
            const mappedTickets: ITicketAPI[] = visit.tickets.map((ticket: any) => ({
                ...ticket.toJSON(),
                ticket_details: ticket.ticket_details.map((ticketDetail: any) => ticketDetail.toJSON()),
            }));

            const mappedPartner: IPartnerAPI = visit.partner.toJSON();


            return {
                ...visit.toJSON(),
                visit_type: {
                    ...visit.visit_type.toJSON(),
                },
                partner: {
                    ...visit.partner.toJSON(),
                    id_bracelet_1: visit.id_bracelet_1, // Agrega id_bracelet_1
                    id_bracelet_2: visit.id_bracelet_2, // Agrega id_bracelet_2
                },
                tickets: mappedTickets,
            };
        });

        const products: any[] = [];

        visits.forEach((visit) => {
            visit.tickets.forEach((ticket) => {
                const { ticket_date, ticket_amount, observations } = ticket;
                const correctBracelet = `${id_bracelet}` === `${ticket.id_bracelet}` ? visit.id_bracelet_1 : visit.id_bracelet_2;
                ticket.ticket_details.forEach((ticketDetail) => {
                    const { quantity, id_ticket_detail, payed } = ticketDetail;
                    const productService = ticketDetail.product_service;
                    products.push({
                        id_ticket_detail,
                        id_product_service: productService.id_product_service,
                        description: productService.description,
                        available: productService.available,
                        observations,
                        long_description: productService.long_description,
                        quantity,
                        price: productService.price,
                        url_image: productService.url_image,
                        id_bracelet: correctBracelet,
                        ticket_date,
                        ticket_amount,
                        payed,
                    });
                });
            });
        });


        const result = {
            id_visit: visits[0]?.id_visit,
            visit_type: visits[0]?.visit_type,
            partner: visits[0]?.partner,
            products
        };

        await transaction?.commit();

        return result;


    } catch (error) {
        if (transaction) {
            await transaction.rollback();
        }
        throw error;
    }
};


export const getFeaturedProductsList = async (
    consumptionParams: IConsumptionParams,
    transaction?: Transaction
) => {

    try {

        const { page, pageSize } = consumptionParams;

        let findOptions: FindAndCountOptions = { 
            where: {
                available: {
                    [Op.ne]: 0  // Solo productos con available diferente de 0
                }
            },
            order: [['featured', 'DESC']] 
        }

        if (page && pageSize) {
            const { limit, offset } = getPagination(page, pageSize);
            findOptions = { ...findOptions, offset, limit, transaction };
        }

        const products = await ProductService.findAll(findOptions);

        if (!products) {
            return null;
        }



        await transaction?.commit();

        return products;


    } catch (error) {
        if (transaction) {
            await transaction.rollback();
        }
        throw error;
    }

}

export const getMinimumConsumption = async () => {
    try {
        const product = await ProductService.findByPk(EMinimumConsumption.MINIMUM_CONSUMPTION);

        if (!product) {
            return null;
        }

        return product;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const createOrNullConsumption = async (
    id_user: number,
    roles: number[],
    cart: any[],
    total_consumed: number,
    id_bracelet: string,
    ticket_observations: string,
    id_ticket_detail?: number,
    transaction?: Transaction
) => {
    try {
        const [isValid, message] = await consumptionValidator(cart, total_consumed, id_bracelet, id_ticket_detail);
        
        
        if (!isValid) {
            return errorHandler(400, message);
        }
        
        if (!id_ticket_detail) {
            //Crear ticket
            
            const visit = await Visit.findOne({
                where: {
                    [Op.or]: [
                        { id_bracelet_1: id_bracelet },
                        { id_bracelet_2: id_bracelet },
                    ],
                    hour_exit: null,
                },
                include: [partnerIncludeable, ticketsIncludeable],
                transaction,
                order: [['visit_date', 'DESC']],
            });

            if (!visit) {
                return errorHandler(400, 'No se encontró la visita');
            }

            const { id_visit, visit_amount_consumed, id_partner } = visit.toJSON();

            const partner = await Partner.findByPk(id_partner, { transaction });

            if (!partner) {
                return errorHandler(400, 'No se encontró el socio');
            }

            const { partner_name, affiliate_birthdate, partner_phone, affiliate_phone } = partner.toJSON();

            const ticket = await Ticket.create({
                id_bracelet,
                id_visit,
                ticket_date: argentinianDate(new Date()),
                ticket_amount: total_consumed,
                observations: ticket_observations,
            }, { transaction });

            if (!ticket) {
                return errorHandler(400, 'No se pudo crear el ticket');
            }
            //Crear ticket_detail

            const { id_ticket, observations } = ticket.toJSON();

            const ticketDetails = cart.map((product: any) => {
                const { id_product_service, cantidad } = product;
                return {
                    id_ticket,
                    id_product_service,
                    quantity: cantidad,
                    unit_price: product.price,
                    payed: false,
                    state: 'NO PAGADO',
                }
            });

            const createdTicketDetails = await TicketDetails.bulkCreate(ticketDetails, { transaction });

            if (!createdTicketDetails) {
                return errorHandler(400, 'No se pudo crear el ticket_detail');
            }
            //Actualizar visit

            const updatedVisit = await Visit.update({
                visit_amount_consumed: visit_amount_consumed ? Number(total_consumed) + Number(visit_amount_consumed) : total_consumed,
            }, {
                where: {
                    id_visit
                },
                transaction
            });

            if (!updatedVisit) {
                return errorHandler(400, 'No se pudo actualizar la visita');
            }


            //Actualizar product_service

            const updatedProducts = await Promise.all(cart.map(async (product: any) => {
                const { id_product_service, cantidad } = product;
                const productService = await ProductService.findOne({
                    where: {
                        id_product_service
                    },
                    transaction
                });

                if (!productService) {
                    return errorHandler(400, 'No se encontró el producto');
                }

                const { available } = productService.toJSON();


                const updatedProduct = await ProductService.update({
                    available: available - cantidad
                }, {
                    where: {
                        id_product_service
                    },
                    transaction
                });

                if (!updatedProduct) {
                    return errorHandler(400, 'No se pudo actualizar el producto');
                }

                return updatedProduct;
            }));

            if (updatedProducts.some((product: any) => product instanceof Error)) {
                return errorHandler(400, 'No se pudo actualizar el producto');
            }

            //Crear operation

            let visitDate = argentinianDate(new Date());

            let day = new Date(visitDate).getDay();
            if (visitDate.getHours() < 8) {
                // If the hour of entry is before 8am, it belongs to the previous day
                day = day === 0 ? 6 : day - 1;
                visitDate = new Date(visitDate.getFullYear(), visitDate.getMonth(), visitDate.getDate() - 1);
            }
            let dayVisit;
            if (day === 0) {
                dayVisit = EDays.Domingo;
            } else if (day === 1) {
                dayVisit = EDays.Lunes;
            } else if (day === 2) {
                dayVisit = EDays.Martes;
            } else if (day === 3) {
                dayVisit = EDays.Miercoles;
            } else if (day === 4) {
                dayVisit = EDays.Jueves;
            } else if (day === 5) {
                dayVisit = EDays.Viernes;
            } else if (day === 6) {
                dayVisit = EDays.Sabado;
            } else {
                dayVisit = EDays.CualquierDia;
            }

            const operation = await Operation.create({
                id_user,
                id_role: roles[0],
                operation_date: argentinianDate(new Date()),
                id_operation_type: EOpertationType.CONSUMOS,
                operation_log: `Consumo de productos: ${cart.map((product: any) => product.description).join(', ')}`,
                operation_metadata: JSON.stringify({
                    id_ticket,
                    id_ticket_detail: createdTicketDetails.map((ticketDetail: any) => ticketDetail.id_ticket_detail),
                    id_visit,
                    id_bracelet,
                    ticket_amount: total_consumed,
                    ticket_observation: ticket_observations,
                    products: cart.map((product: any) => {
                        const { id_product_service, quantity, price } = product;
                        return {
                            id_product_service,
                            quantity,
                            price
                        }
                    }),
                    operation_amount: total_consumed,
                }),
                id_visit,
                id_partner,
                id_day: dayVisit,
                operation_amount: total_consumed,
            }, { transaction });

            if (!operation) {
                return errorHandler(400, 'No se pudo crear la operación');
            }

            await transaction?.commit();

            return {
                id_ticket,
                id_ticket_detail: createdTicketDetails.map((ticketDetail: any) => ticketDetail.id_ticket_detail),
                ticket_detail: ticketDetails,
                partner_name,
                partner_phone,
                id_visit,
                id_bracelet,
                ticket_amount: total_consumed,
                ticket_observation: observations,
                products: cart.map((product: any) => {
                    const { id_product_service, cantidad, price, description, long_description, url_image } = product;
                    return {
                        id_product_service,
                        cantidad,
                        price,
                        description,
                        long_description,
                        url_image
                    }
                }),
                operation_amount: total_consumed,
            }


        } else {

            const ticketDetail = await TicketDetails.findOne({
                where: {
                    id_ticket_detail
                },
                transaction
            });

            if (!ticketDetail) {
                return errorHandler(400, 'No se encontró el ticket_detail');
            }

            const { id_ticket, id_product_service, quantity, unit_price } = ticketDetail.toJSON();

            const ticket = await Ticket.findOne({
                where: {
                    id_ticket
                },
                transaction
            });

            if (!ticket) {
                return errorHandler(400, 'No se encontró el ticket');
            }

            const { id_visit, ticket_amount } = ticket.toJSON();

            if (!id_visit) {
                return errorHandler(400, 'No se encontró la visita');
            }

            const visit = await Visit.findOne({
                where: {
                    id_visit
                },
                transaction
            });

            if (!visit) {
                return errorHandler(400, 'No se encontró la visita');
            }

            const { visit_amount_consumed, id_partner } = visit.toJSON();

            const cancelTicket = await Ticket.create({
                id_bracelet,
                id_visit,
                ticket_date: argentinianDate(new Date()),
                ticket_amount: total_consumed,
                observations: ticket_observations,
            }, { transaction });

            if (!cancelTicket) {
                return errorHandler(400, 'No se pudo crear el ticket');
            }

            const { id_ticket: id_cancel_ticket } = cancelTicket.toJSON();

            const cancelTicketDetail = cart.map((product: any) => {
                const { id_product_service, cantidad } = product;
                return {
                    id_ticket: id_cancel_ticket,
                    id_product_service,
                    quantity: cantidad,
                    unit_price: product.price,
                    state: "NC",
                }
            });

            const createdCancelTicketDetails = await TicketDetails.bulkCreate(cancelTicketDetail, { transaction });

            const updatedTicketDetail = await TicketDetails.update({
                state: "ANULADO",
                payed: null,
            }, {
                where: {
                    id_ticket_detail
                },
                transaction
            });

            if (!updatedTicketDetail) {
                return errorHandler(400, 'No se pudo actualizar el ticket_detail');
            }

            if (!createdCancelTicketDetails) {
                return errorHandler(400, 'No se pudo crear el ticket_detail');
            }

            const updatedVisit = await Visit.update({
                visit_amount_consumed: visit_amount_consumed ? Number(total_consumed) + Number(visit_amount_consumed) : total_consumed,
            }, {
                where: {
                    id_visit
                },
                transaction
            });

            if (!updatedVisit) {
                return errorHandler(400, 'No se pudo actualizar la visita');
            }

            const updatedProducts = await Promise.all(cart.map(async (product: any) => {
                const { id_product_service, cantidad } = product;
                const productService = await ProductService.findOne({
                    where: {
                        id_product_service
                    },
                    transaction
                });

                if (!productService) {
                    return errorHandler(400, 'No se encontró el producto');
                }

                const { available } = productService.toJSON();


                const updatedProduct = await ProductService.update({
                    available: available - cantidad
                }, {
                    where: {
                        id_product_service
                    },
                    transaction
                });

                if (!updatedProduct) {
                    return errorHandler(400, 'No se pudo actualizar el producto');
                }

                return updatedProduct;
            }));

            if (updatedProducts.some((product: any) => product instanceof Error)) {
                return errorHandler(400, 'No se pudo actualizar el producto');
            }

            let visitDate = argentinianDate(new Date());
            let day = new Date(visitDate).getDay();
            if (visitDate.getHours() < 8) {
                // If the hour of entry is before 8am, it belongs to the previous day
                day = day === 0 ? 6 : day - 1;
                visitDate = new Date(visitDate.getFullYear(), visitDate.getMonth(), visitDate.getDate() - 1);
            }
            let dayVisit;
            if (day === 0) {
                dayVisit = EDays.Domingo;
            } else if (day === 1) {
                dayVisit = EDays.Lunes;
            } else if (day === 2) {
                dayVisit = EDays.Martes;
            } else if (day === 3) {
                dayVisit = EDays.Miercoles;
            } else if (day === 4) {
                dayVisit = EDays.Jueves;
            } else if (day === 5) {
                dayVisit = EDays.Viernes;
            } else if (day === 6) {
                dayVisit = EDays.Sabado;
            } else {
                dayVisit = EDays.CualquierDia;
            }

            const operation = await Operation.create({
                id_user,
                id_role: roles[0],
                operation_date: argentinianDate(new Date()),
                id_operation_type: EOpertationType.CONSUMOS,
                operation_log: `Cancelacion de productos: ${cart.map((product: any) => product.description).join(', ')}`,
                operation_metadata: JSON.stringify({
                    id_ticket,
                    id_ticket_detail,
                    id_visit,
                    id_bracelet,
                    ticket_amount,
                    ticket_observation: ticket_observations,
                    products: cart.map((product: any) => {
                        const { id_product_service, cantidad, price } = product;
                        return {
                            id_product_service,
                            quantity: cantidad,
                            price
                        }
                    }),
                    operation_amount: total_consumed,
                }),
                id_visit,
                id_partner,
                id_day: dayVisit,
                operation_amount: total_consumed,
            }, { transaction });

            if (!operation) {
                return errorHandler(400, 'No se pudo crear la operación');
            }

            await transaction?.commit();

            return {
                id_ticket,
                id_ticket_detail: createdCancelTicketDetails.map((ticketDetail: any) => ticketDetail.id_ticket_detail),
                ticket_detail: createdCancelTicketDetails,
                id_visit,
                id_bracelet,
                ticket_amount: total_consumed,
                ticket_observation: ticket_observations,
                products: cart.map((product: any) => {
                    const { id_product_service, cantidad, price, description, long_description, url_image } = product;
                    return {
                        id_product_service,
                        cantidad,
                        price,
                        description,
                        long_description,
                        url_image
                    }
                }),
                operation_amount: total_consumed,

            }
        }


    } catch (error) {
        if (transaction) {
            await transaction.rollback();
        }
        throw error;
    }
}

const getStartOfToday = () => {
    const now = new Date();
    return argentinianDate(new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()));
};

const getStartOfTomorrow = () => {
    const now = new Date();
    return argentinianDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1))
};

const getStartOfYesterday = () => {
    const now = new Date();
    return argentinianDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))
};



/* import { FindAndCountOptions, Includeable, Op, Transaction } from "sequelize";
import Operation from "../../../../database/schemas/degira/models/operation.model";
import ProductService from "../../../../database/schemas/degira/models/product_service.model";
import Visit from "../../../../database/schemas/degira/models/visit.model";
import { argentinianDate, errorHandler, getPagination } from "../../helpers";
import { ERoles } from "../roles/types";
import { consumptionValidator } from "./middlewares";
import { EOpertationType, IConsumptionPost, IConsumptionAPI, IConsumptionParams } from "./types";


const productIncludeable: Includeable = {
    model: ProductService,
    as: 'product_service',
}

export const getConsumptionsList = async (
    consumptionParams: IConsumptionParams,
    transaction?: Transaction
) => {

    try {
        const { page, pageSize } = consumptionParams;
        const include: Includeable[] = [productIncludeable];

        let findOptions: FindAndCountOptions = { include };

        if (page && pageSize) {
            const { limit, offset } = getPagination(page, pageSize);
            findOptions = { ...findOptions, offset, limit, transaction };
        }

        const consumptions = await BraceletConsumption.findAndCountAll(findOptions);

        await transaction?.commit();

        return consumptions;
    } catch (error) {
        if (transaction) {
            await transaction.rollback();
        }
        throw error;
    }
}

export const getConsumptionsById = async (id_bracelet: string, transaction?: Transaction) => {
    try {
        const consumption = await BraceletConsumption.findAll({
            where: { id_bracelet: id_bracelet },
            include: [productIncludeable],
            transaction,
        });

        if (!consumption) {
            return null
        }
        
        //buscar la visita que tenga el id_bracelet_1 o id_bracelet_2 igual al id_bracelet que se le pasa por parametro

        const visit = await Visit.findOne({
            where: {
                [Op.or]: [
                    { id_bracelet_1: id_bracelet },
                    { id_bracelet_2: id_bracelet },
                ],
            },
            transaction,
        });

        const {
            id_partner
        } = visit?.toJSON() || {};

        

        await transaction?.commit();


        return consumption;
    } catch (error) {
        console.log(error);
        if (transaction) {
            await transaction.rollback();
        }
        throw error;
    }
}


export const createConsumption = async (
    roles: number[],
    id_user: number,
    id_product_service: number,
    quantity: number,
    observation: string,
    id_bracelet: string,
    transaction?: Transaction
): Promise<IConsumptionPost> => {
    const [isValid, message] = await consumptionValidator(id_product_service, quantity, observation, id_bracelet);

    if (!isValid) {
        errorHandler(400, message);
    }

    try {

        const product = await ProductService.findByPk(id_product_service, { transaction });

        const {
            available,
            price,
        } = product?.toJSON() || {};

        if (available) {


            const newQuantity = available - quantity;

            await ProductService.update(
                { available: newQuantity },
                { where: { id_product_service }, transaction }
            );

        }

        const amount = price ? price * quantity : 0;

        const visit = await Visit.findOne({
            where: {
                [Op.or]: [
                    { id_bracelet_1: id_bracelet },
                    { id_bracelet_2: id_bracelet },
                ],
            },
            transaction,
        });

        const { id_visit, visit_amount_consumed, id_partner } = visit?.toJSON() || {};

        let newVisitAmountConsumed = 0;
        if (visit_amount_consumed && Number(visit_amount_consumed) > 0) {
            newVisitAmountConsumed = amount + Number(visit_amount_consumed);
        }

        await Visit.update(
            { visit_amount_consumed: newVisitAmountConsumed },
            { where: { id_visit }, transaction }
        );

        const consumption = await BraceletConsumption.create({
            id_product_service,
            amount,
            quantity,
            observation,
            id_bracelet,
            date_consumption: new Date(),
        }, {
            transaction
        });

        await Operation.create({
            id_user,
            id_visit,
            id_partner,
            id_operation_type: EOpertationType.CONSUMOS,
            operation_amount: amount,
            operation_date: new Date(),
            operation_log: `Consumo de Producto: ${JSON.stringify(consumption.toJSON())}`,
            operation_metadata: JSON.stringify({
                id_product_service,
                quantity,
                observation,
                id_bracelet,
                date_consumption: argentinianDate(new Date()),
                id_role: roles
            }),
            id_role: roles[0]
        }, {
            transaction
        });

        await transaction?.commit();

        return { ...consumption.toJSON() as IConsumptionPost }
    } catch (error) {
        if (transaction) {
            await transaction.rollback();
        }
        throw error;
    }
} */