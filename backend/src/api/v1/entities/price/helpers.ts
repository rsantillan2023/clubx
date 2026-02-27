import PaymentMethod from "../../../../database/schemas/degira/models/payment_method.model.interface";
import Price from "../../../../database/schemas/degira/models/price.model";
import { argentinianDate, getPagination, errorHandler, getVisitDate } from "../../helpers";
import { EDays } from "../days/types";
import { IPrice, IPriceListParams, IBulkPriceUpdate } from "./types";
import { FindAndCountOptions, Op, OrderItem, Transaction, WhereOptions } from "sequelize";
import Operation from "../../../../database/schemas/degira/models/operation.model";
import { EOpertationType } from "../operations_types/types";
import Day from "../../../../database/schemas/degira/models/day.model";
import VisitType from "../../../../database/schemas/degira/models/visit_type.model";
import ReceivableConcept from "../../../../database/schemas/degira/models/receivable_concepts.model";

export const priceSearcher = async (price: IPrice) => {
    try {
        const { id_visit_type, id_payment_method, id_receivable_concept } = price;

        const visitDate = argentinianDate(new Date());

        const day = visitDate.getDay();

        const hour = visitDate.getHours();

        let dayVisit;

        const startHour = 20;
        const endHour = 8;


        if ((day === 0 && hour >= startHour) || (day === 1 && hour <= endHour)) {
            dayVisit = EDays.Domingo;
        } else if ((day === 1 && hour >= startHour) || (day === 2 && hour <= endHour)) {
            dayVisit = EDays.Lunes;
        } else if ((day === 2 && hour >= startHour) || (day === 3 && hour <= endHour)) {
            dayVisit = EDays.Martes;
        } else if ((day === 3 && hour >= startHour) || (day === 4 && hour <= endHour)) {
            dayVisit = EDays.Miercoles;
        } else if ((day === 4 && hour >= startHour) || (day === 5 && hour <= endHour)) {
            dayVisit = EDays.Jueves;
        } else if ((day === 5 && hour >= startHour) || (day === 6 && hour <= endHour)) {
            dayVisit = EDays.Viernes;
        } else if ((day === 6 && hour >= startHour) || (day === 0 && hour <= endHour)) {
            dayVisit = EDays.Sabado;
        } else {
            // Fuera de la franja especial
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
            }
        }

        if (id_receivable_concept == 1) {
            dayVisit = EDays.CualquierDia;
        }

        // Workaround MENSUAL: precios solo para id_day = 8 (Cualquier día)
        const visitTypeRow = await VisitType.findByPk(id_visit_type);
        if (visitTypeRow && (visitTypeRow.get('description') as string) === 'MENSUAL') {
            dayVisit = EDays.CualquierDia;
        }


        const priceFinder = await Price.findOne({
            where: {
                id_visit_type,
                id_receivable_concept,
                id_day: dayVisit,
            },
        })

        const total = priceFinder?.toJSON().total_amount;

        const paymentMethod = await PaymentMethod.findOne({
            where: {
                id_payment_method,
            }
        })

        const paymentMethodPercentage = paymentMethod?.toJSON().percent;

        const numberPaymentMethodPercentage = Number(paymentMethodPercentage);
        const numberTotal = Number(total);

        let totalWithPercentage;
        if (paymentMethodPercentage && total) {
            totalWithPercentage = numberTotal + (numberTotal * numberPaymentMethodPercentage);
        } else {
            totalWithPercentage = numberTotal;
        }

        return {
            totalWithPercentage,
        }

    } catch (error) {
        console.log(error);
        throw error;
    }
}

// Obtener lista de precios con filtros
export const getPricesList = async (
    params: IPriceListParams,
    transaction?: Transaction
) => {
    try {
        const { page, pageSize, sortBy, sortDesc, id_day, id_visit_type, id_receivable_concept } = params;

        const whereConditionsArray: any[] = [];

        // Filtros
        if (id_day !== undefined && id_day !== null) {
            whereConditionsArray.push({ id_day });
        }

        if (id_visit_type !== undefined && id_visit_type !== null) {
            whereConditionsArray.push({ id_visit_type });
        }

        if (id_receivable_concept !== undefined && id_receivable_concept !== null) {
            whereConditionsArray.push({ id_receivable_concept });
        }

        // Construir whereConditions
        const whereConditions: WhereOptions = whereConditionsArray.length > 0
            ? (whereConditionsArray.length === 1 ? whereConditionsArray[0] : { [Op.and]: whereConditionsArray })
            : {};

        // Ordenamiento
        let order: OrderItem[] = [['id_price', 'DESC']];
        if (sortBy) {
            const direction = sortDesc ? 'DESC' : 'ASC';
            const sortFieldMap: { [key: string]: string } = {
                'id_price': 'id_price',
                'id_day': 'id_day',
                'id_visit_type': 'id_visit_type',
                'id_receivable_concept': 'id_receivable_concept',
                'total_amount': 'total_amount',
            };
            
            const actualSortBy = sortFieldMap[sortBy] || 'id_price';
            order = [[actualSortBy, direction]];
        }

        // Paginación - Sin includes para evitar problemas, los datos relacionados se pueden obtener después si es necesario
        let findOptions: FindAndCountOptions = {
            where: whereConditions,
            order,
        };

        if (page && pageSize) {
            const { limit, offset } = getPagination(page, pageSize);
            findOptions = {
                ...findOptions,
                offset,
                limit,
            };
        }

        const prices = await Price.findAndCountAll({
            ...findOptions,
            raw: false, // Mantener instancias para poder convertirlas
        });

        // Convertir las instancias de Sequelize a objetos planos
        const plainPrices = {
            count: prices.count,
            rows: prices.rows.map(price => price.toJSON()),
        };

        return plainPrices;
    } catch (error) {
        throw error;
    }
};

// Actualización masiva de precios
export const bulkUpdatePrices = async (
    data: IBulkPriceUpdate,
    id_user: number,
    roles: number[],
    transaction?: Transaction
) => {
    try {
        const { ids, updateType, value } = data;

        if (!ids || ids.length === 0) {
            return errorHandler(400, 'Debe seleccionar al menos un precio');
        }

        if (value === undefined || value === null) {
            return errorHandler(400, 'El valor es requerido');
        }

        // Obtener precios actuales
        const prices = await Price.findAll({
            where: {
                id_price: { [Op.in]: ids },
            },
            transaction,
        });

        if (prices.length === 0) {
            return errorHandler(404, 'No se encontraron precios');
        }

        const updates: any[] = [];
        const oldPrices: any = {};

        for (const price of prices) {
            const currentPrice = parseFloat(price.get('total_amount') as string) || 0;
            oldPrices[price.get('id_price') as number] = currentPrice;

            let newPrice = currentPrice;

            switch (updateType) {
                case 'percentage':
                    // Porcentaje: aumentar o disminuir por porcentaje
                    newPrice = currentPrice * (1 + value / 100);
                    break;
                case 'absolute':
                    // Absoluto: establecer un valor fijo
                    newPrice = value;
                    break;
                case 'relative':
                    // Relativo: sumar o restar un valor
                    newPrice = currentPrice + value;
                    break;
                default:
                    return errorHandler(400, 'Tipo de actualización inválido');
            }

            // Asegurar que el precio no sea negativo
            if (newPrice < 0) {
                newPrice = 0;
            }

            updates.push({
                id: price.get('id_price') as number,
                oldPrice: currentPrice,
                newPrice: parseFloat(newPrice.toFixed(2)),
            });
        }

        // Actualizar todos los precios
        for (const update of updates) {
            await Price.update(
                { total_amount: update.newPrice },
                {
                    where: { id_price: update.id },
                    transaction,
                }
            );
        }

        const dayOfWeek = getVisitDate(new Date());

        // Registrar operación
        await Operation.create({
            id_user,
            id_operation_type: EOpertationType.ACTUALIZACION_MASIVA_PRECIOS,
            operation_log: JSON.stringify({
                action: 'BULK_UPDATE_PRICES',
                updateType,
                value,
                updates,
            }),
            operation_metadata: JSON.stringify({
                action: 'BULK_UPDATE_PRICES',
                ids,
                updateType,
                value,
                oldPrices,
                operation_date: argentinianDate(new Date()),
                id_role: roles,
            }),
            id_role: roles && roles.length > 0 ? roles[0] : undefined,
            operation_date: argentinianDate(new Date()),
            id_day: dayOfWeek,
        }, { transaction });

        return {
            message: `${updates.length} precio(s) actualizado(s) correctamente`,
            updated: updates,
        };
    } catch (error) {
        throw error;
    }
};

// Actualizar un precio individual
export const updatePrice = async (
    id_price: number,
    total_amount: number,
    id_user: number,
    roles: number[],
    transaction?: Transaction
) => {
    try {
        if (!id_price) {
            return errorHandler(400, 'El ID del precio es requerido');
        }

        if (total_amount === undefined || total_amount === null || total_amount < 0) {
            return errorHandler(400, 'El monto total debe ser un valor válido mayor o igual a 0');
        }

        // Verificar que el precio existe
        const price = await Price.findOne({
            where: { id_price },
            transaction,
        });

        if (!price) {
            return errorHandler(404, 'Precio no encontrado');
        }

        const oldPrice = parseFloat(price.get('total_amount') as string) || 0;

        // Actualizar el precio
        await Price.update(
            { total_amount: parseFloat(total_amount.toFixed(2)) },
            {
                where: { id_price },
                transaction,
            }
        );

        const dayOfWeek = getVisitDate(new Date());

        // Registrar operación (id_role debe ser number; roles ya viene como number[] desde el controller)
        await Operation.create({
            id_user,
            id_operation_type: EOpertationType.GESTION_PRECIOS,
            operation_log: JSON.stringify({
                action: 'UPDATE_PRICE',
                id_price,
                oldPrice,
                newPrice: parseFloat(total_amount.toFixed(2)),
            }),
            operation_metadata: JSON.stringify({
                action: 'UPDATE_PRICE',
                id_price,
                oldPrice,
                newPrice: parseFloat(total_amount.toFixed(2)),
                operation_date: argentinianDate(new Date()),
                id_role: roles,
            }),
            id_role: roles && roles.length > 0 ? roles[0] : undefined,
            operation_date: argentinianDate(new Date()),
            id_day: dayOfWeek,
        }, { transaction });

        return {
            message: 'Precio actualizado correctamente',
            id_price,
            oldPrice,
            newPrice: parseFloat(total_amount.toFixed(2)),
        };
    } catch (error) {
        throw error;
    }
};