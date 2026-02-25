import { QueryTypes } from "sequelize";
import { DEGIRA_DB } from "../../../../database/connection";
import { IPartnerParams } from "./types";

export const getPartnersList = async (params: IPartnerParams) => {
  const { page = 1, pageSize = 10, sortBy = 'created_at', sortDesc = true, searcher = '', status = '', fechas = '' } = params;
  
  try {
    // Construir la consulta SQL con placeholders de MySQL (?)
    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    
    if (searcher) {
      whereClause += ` AND (partner_dni LIKE ? OR alias LIKE ? OR partner_name LIKE ? OR affiliate_dni LIKE ? OR affiliate_name LIKE ?)`;
      queryParams.push(`%${searcher}%`, `%${searcher}%`, `%${searcher}%`, `%${searcher}%`, `%${searcher}%`);
    }
    
    if (status) {
      whereClause += ` AND id_state = ?`;
      queryParams.push(status);
    }
    
    if (fechas) {
      const [startDate, endDate] = fechas.split('~');
      if (startDate && endDate) {
        whereClause += ` AND created_at BETWEEN ? AND ?`;
        queryParams.push(startDate, endDate);
      }
    }
    
    // Consulta para contar total
    const countQuery = `SELECT COUNT(*) as total FROM partners ${whereClause}`;
    const countResult = await DEGIRA_DB.query(countQuery, {
      replacements: queryParams,
      type: QueryTypes.SELECT
    });
    const totalCount = (countResult[0] as any).total;
    
    // Consulta para obtener datos con paginación
    const offset = (page - 1) * pageSize;
    const limit = pageSize === -1 ? totalCount : pageSize;
    
    // Validar y sanitizar sortBy para prevenir SQL injection
    const allowedSortFields = ['id_partner', 'dni', 'alias', 'email', 'phone', 'id_state', 'created_at', 'updated_at'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    
    const orderDirection = sortDesc ? 'DESC' : 'ASC';
    // Mapear nombres de columnas para el ORDER BY
    const columnMapping: { [key: string]: string } = {
      'id_partner': 'id_partner',
      'dni': 'partner_dni',
      'alias': 'alias',
      'email': 'partner_name', // No hay email, usar partner_name como alternativa
      'phone': 'partner_phone',
      'id_state': 'id_state',
      'created_at': 'partner_discharge_date', // Usar partner_discharge_date como fecha de creación
      'updated_at': 'partner_discharge_date'
    };
    const actualSortBy = columnMapping[safeSortBy] || 'partner_discharge_date';
    
    const dataQuery = `
      SELECT 
        p.id_partner,
        p.partner_dni as dni,
        p.alias,
        p.partner_name,
        p.partner_phone as phone,
        p.affiliate_dni,
        p.affiliate_name,
        p.affiliate_phone,
        p.id_state,
        p.partner_discharge_date as created_at,
        p.partner_discharge_date as updated_at,
        COALESCE(v.visits_count, 0) as visits_count
      FROM partners p
      LEFT JOIN (
        SELECT id_partner, COUNT(*) as visits_count
        FROM visits
        GROUP BY id_partner
      ) v ON p.id_partner = v.id_partner
      ${whereClause}
      ORDER BY p.${actualSortBy} ${orderDirection}
      LIMIT ? OFFSET ?
    `;
    
    const dataParams = [...queryParams, limit, offset];
    
    const dataResult = await DEGIRA_DB.query(dataQuery, {
      replacements: dataParams,
      type: QueryTypes.SELECT
    });
    
    return {
      data: dataResult,
      totalCount: totalCount,
      pageCount: Math.ceil(totalCount / limit),
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit)
    };
  } catch (error: any) {
    console.error('Error getting partners list:', error);
    // Proporcionar un mensaje de error más descriptivo
    const errorMessage = error.message || 'Error desconocido al obtener la lista de partners';
    const errorToThrow: any = new Error(errorMessage);
    errorToThrow.code = 400;
    throw errorToThrow;
  }
};

export const getPartnersInsideList = async (params: any) => {
  // Por ahora devolver datos simulados para partners/inside
  // hasta que se determine la estructura real de la base de datos
  const mockPartnersInside = [
    {
      id_partner: 1,
      dni: "12345678",
      alias: "Juan Pérez",
      id_bracelet_1: "B001",
      visit_type: { description: "Entrada" },
      created_at: new Date("2024-01-15")
    },
    {
      id_partner: 2,
      dni: "87654321", 
      alias: "María García",
      id_bracelet_1: "B002",
      visit_type: { description: "Entrada" },
      created_at: new Date("2024-01-20")
    }
  ];
  
  return {
    data: mockPartnersInside,
    totalCount: mockPartnersInside.length,
    pageCount: 1,
    currentPage: 1,
    totalPages: 1
  };
};
