import { FindAndCountOptions, Includeable, Op, OrderItem, WhereOptions } from "sequelize";
import Operation from "../../../../database/schemas/degira/models/operation.model";
import OperationType from "../../../../database/schemas/degira/models/operation_type.model";
import Partner from "../../../../database/schemas/degira/models/partner.model";
import PaymentMethod from "../../../../database/schemas/degira/models/payment_method.model.interface";
import Role from "../../../../database/schemas/degira/models/rol.model";
import User from "../../../../database/schemas/degira/models/user.model";
import Visit from "../../../../database/schemas/degira/models/visit.model";
import { getOrderOperations, getPagination } from "../../helpers";
import { IOperationParams } from "./types";
import Day from "../../../../database/schemas/degira/models/day.model";
import VisitType from "../../../../database/schemas/degira/models/visit_type.model";

const visitTypeIncludeable: Includeable = {
    model: VisitType,
    as: "visit_type",
}
    

const partnerIncludeable: Includeable = {
    model: Partner,
    as: "partner",
}

const visitIncludable: Includeable = {
    model: Visit,
    as: "visit",
    include: [visitTypeIncludeable]
}

const paymentMethodIncludable: Includeable = {
    model: PaymentMethod,
    as: "payment_method",
}

const userIncludeable: Includeable = {
    model: User,
    as: "user",
    attributes: { exclude: ["password"] },
}

const operationTypeIncludeable: Includeable = {
    model: OperationType,
    as: "operation_type",
}

const roleIncludeable: Includeable = {
    model: Role,
    as: "role",
}

const dayIncludeable: Includeable = {
    model: Day,
    as: "day",
    required: false,  // Permite que id_day sea NULL
}



export const getAllOperations = async (
    operationParams: IOperationParams,
) => {
    try {

        const { page, pageSize, sortBy, sortDesc, searcher, tipoOperacion, fechas } = operationParams;


        let order: OrderItem[] = getOrderOperations(sortBy, sortDesc);

        let where: WhereOptions = {};

        const include: Includeable[] = [
            visitIncludable,
            paymentMethodIncludable,
            partnerIncludeable,
            userIncludeable,
            operationTypeIncludeable,
            roleIncludeable,
            dayIncludeable,
        ];

        let findOptions: FindAndCountOptions = { include, order };


        if (page && pageSize) {
            if (pageSize !== -1) {
                const { limit, offset } = getPagination(page, pageSize)
                findOptions = { ...findOptions, offset, limit };
            }
        }

        if (fechas && fechas.includes('[') && fechas.includes(']')) {
            const fechasArray = fechas.replace('[', '').replace(']', '').split(',');
            const fechasArrayWithoutQuotes = fechasArray.map((element) => {
                return element.trim().replace(/['"]+/g, '');
            });
            where = {
                ...where,
                operation_date: {
                    [Op.between]: [new Date(fechasArrayWithoutQuotes[0]), new Date(fechasArrayWithoutQuotes[1])],
                },
            };
        } else if (fechas) {
            where = {
                ...where,
                operation_date: { [Op.like]: `%${new Date(fechas)}%` }
            }
        }

        if (searcher) {
            where = {
                ...where,
                [Op.or]: [
                    { id_operation: { [Op.like]: `%${searcher}%` } },
                    { operation_amount: { [Op.like]: `%${searcher}%` } },
                    { id_visit: { [Op.like]: `%${searcher}%` } },
                    { '$operation_type.description$': { [Op.like]: `%${searcher}%` } },
                    { '$user.username$': { [Op.like]: `%${searcher}%` } },
                    { '$role.description$': { [Op.like]: `%${searcher}%` } },
                    { '$partner.partner_name$': { [Op.like]: `%${searcher}%` } },
                    { '$payment_method.method$': { [Op.like]: `%${searcher}%` } },
                ]
            }
        }

        //Si tipoOperacion existe y a su vez es un array de ids debe de hacer un Op.in

        if (tipoOperacion && tipoOperacion.includes('[') && tipoOperacion.includes(']')) {
            const tipoOperacionArray = tipoOperacion.replace('[', '').replace(']', '').split(',');
            const tipoOperacionArrayWithoutQuotes = tipoOperacionArray.map((element) => {
                return element.trim().replace(/['"]+/g, '');
            });
            where = {
                ...where,
                id_operation_type: {
                    [Op.in]: tipoOperacionArrayWithoutQuotes,
                },
            };
        } else if (tipoOperacion) {
            where = {
                ...where,
                id_operation_type: tipoOperacion
            }
        }

        findOptions = {
            ...findOptions,
            where
        }

        const operations = await Operation.findAndCountAll(findOptions);

        return operations;

    } catch (error: any) {
        throw error;
    }

}