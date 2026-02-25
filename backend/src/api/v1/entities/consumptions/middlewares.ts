import { Op } from "sequelize";
import ProductService from "../../../../database/schemas/degira/models/product_service.model";
import TicketDetails from "../../../../database/schemas/degira/models/ticket_details.model";
import Visit from "../../../../database/schemas/degira/models/visit.model";
import { argentinianDate, maxLimitHour, minLimitHour } from "../../helpers";

export const consumptionValidator = async (
    cart: any[],
    total_consumed: number,
    id_bracelet: string,
    id_ticket_detail?: number,
): Promise<[boolean, string]> => {
    try {
        let isValid = true;
        let message = '';

        let today = argentinianDate(new Date());


        //ID_BRACELET
        if (!id_bracelet || (typeof id_bracelet === 'string' && id_bracelet.trim() === '') || id_bracelet === 'NaN' || id_bracelet === 'null' || id_bracelet === 'undefined') {
            isValid = false;
            message = 'El id de la pulsera es requerido';
        } else {
            const bracelet = await Visit.findOne({
                where: {
                    [Op.or]: [
                        { id_bracelet_1: id_bracelet },
                        { id_bracelet_2: id_bracelet },
                    ],
                    hour_exit: null,
                },
            });

            if (!bracelet) {
                isValid = false;
                message = 'La pulsera no es válida o no se encuentra en el Club';
            }
        }
        if (id_ticket_detail === 0) {
            //Total Consumed
            if (!total_consumed) {
                isValid = false;
                message = 'El total consumido es requerido';
            } else if (total_consumed < 0) {
                isValid = false;
                message = 'El total consumido no puede ser negativo';
            }


            //Cart
            if (!cart) {
                isValid = false;
                message = 'El carrito es requerido';
            } else if (cart.length === 0) {
                isValid = false;
                message = 'El carrito no puede estar vacío';
            } else {
                const validationPromise = cart.map(async (item: any) => {
                    const { id_product_service, cantidad, price } = item;
                    if (!id_product_service) {
                        isValid = false;
                        message = 'El id del producto es requerido';
                    } else if (!cantidad) {
                        isValid = false;
                        message = 'La cantidad es requerida';
                    } else if (!price) {
                        isValid = false;
                        message = 'El precio es requerido';
                    } else {
                        const product = await ProductService.findOne({
                            where: {
                                id_product_service,
                            },
                        });
                        
                        if (product?.toJSON() === undefined) {
                            isValid = false;
                            message = 'El producto con el id ' + id_product_service + ' no existe';
                        }

                        if (cantidad < 0) {
                            isValid = false;
                            message = 'La cantidad no puede ser negativa';
                        }
                        
                        // Validación de stock desactivada temporalmente
                        // let available = product?.toJSON().available;
                        // if (available !== undefined && available < cantidad) {
                        //     isValid = false;
                        //     message = 'La cantidad no puede ser mayor a la disponible';
                        // }
                    }
                });
                await Promise.all(validationPromise);
            }
        } else {
            //ID_TICKET_DETAIL
            const ticketDetail = await TicketDetails.findOne({
                where: {
                    id_ticket_detail,
                },
            });

            if (!ticketDetail) {
                isValid = false;
                message = 'El ticket no es válido';
            }

            //TOTAL_CONSUMED

            if (!total_consumed) {
                isValid = false;
                message = 'El total consumido es requerido';
            } else if (total_consumed > 0) {
                isValid = false;
                message = 'El total consumido debe ser negativo';
            }

            //CART
            if (!cart) {
                isValid = false;
                message = 'El carrito es requerido';
            } else if (cart.length === 0) {
                isValid = false;
                message = 'El carrito no puede estar vacío';
            } else {
               const cartValidator = cart.map(async (item: any) => {
                    const { id_product_service, cantidad, price } = item;
                    if (!id_product_service) {
                        isValid = false;
                        message = 'El id del producto es requerido';
                    } else if (!cantidad) {
                        isValid = false;
                        message = 'La cantidad es requerida';
                    } else if (cantidad > 0) {
                        isValid = false;
                        message = 'La cantidad debe ser negativa';
                    } else if (!price) {
                        isValid = false;
                        message = 'El precio es requerido';
                    } else if (price > 0) {
                        isValid = false;
                        message = 'El precio debe ser negativo';
                    } else {
                        const product = await ProductService.findOne({
                            where: {
                                id_product_service,
                            },
                        });

                        if (!product) {
                            isValid = false;
                            message = 'El producto no es válido';
                        }
                        
                    }
                });
                await Promise.all(cartValidator);
            }

        }
        return [isValid, message];
    } catch (error) {
        console.log(error);
        throw error;
    }
}
