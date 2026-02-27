import { Op } from 'sequelize';
import Partner from '../../../../database/schemas/degira/models/partner.model';
import PaymentMethod from '../../../../database/schemas/degira/models/payment_method.model.interface';
import State from '../../../../database/schemas/degira/models/states.model';
import VisitType from '../../../../database/schemas/degira/models/visit_type.model';
import { EPartnerState, IPostPartner } from './types';
import { EPaymentMethod } from '../payment_method/types';

export const postPartnerValidator = async (
  alias: string,
  partner_dni: string,
  partner_name: string,
  partner_birthdate: string,
  partner_phone: string,
  affiliate_dni: string,
  affiliate_name: string,
  affiliate_birthdate: string,
  affiliate_phone: string,
  id_visit_type_usualy: number,
  id_state: number,
  observations: string,
  suggest_membership_amount: number,
  id_payment_method: number,
): Promise<[boolean, string]> => {
  try {
    let isValid: boolean = true;
    let message: string = '';
    //ALIAS
    if (!alias && !alias.length) {
      isValid = false;
      message = 'El alias es requerido';
    }
    //PARTNER_DNI
    if (!partner_dni && !partner_dni.length) {
      isValid = false;
      message += '- El DNI del socio es requerido';
    } else if (partner_dni) {
      const partner = await Partner.findOne({
        where: {
          [Op.or]: [{ partner_dni }, { affiliate_dni: partner_dni }],
        }
      });
      if (partner) {
        isValid = false;
        message += '- El DNI del socio ya existe en otro socio o es un afiliado';
      }
    }
    //PARTNER_NAME
    if (!partner_name && !partner_name.length) {
      isValid = false;
      message += '- El nombre del socio es requerido';
    }
    //PARTNER_BIRTHDATE
    if (!partner_birthdate && !partner_birthdate.length) {
      isValid = false;
      message += '- La fecha de nacimiento del socio es requerida';
    } else if (partner_birthdate) {
      const newDate = partner_birthdate.split('/');
      const date = new Date(newDate[1] + '/' + newDate[0] + '/' + newDate[2]);
      if (date.toString() === 'Invalid Date') {
        isValid = false;
        message += '- La fecha de nacimiento del socio es inválida';
      } else {
        const currentDate = new Date();
        const age = (currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 365);
        if (age < 18) {
          isValid = false;
          message += '- El socio debe ser mayor de edad';
        }
      }
    }
    //PARTNER_PHONE
    if (!partner_phone && !partner_phone.length) {
      isValid = false;
      message += '- El teléfono del socio es requerido';
    } else if (partner_phone) {
      const partner = await Partner.findOne({
        where: {
          [Op.or]: [{ partner_phone }, { affiliate_phone: partner_phone }],
        }
      });
      if (partner) {
        isValid = false;
        message += '- El teléfono del socio ya existe en otro socio o es un afiliado';
      }
    }
    if (affiliate_dni && affiliate_dni.length) {
      //AFFILIATE_DNI
      if (!affiliate_dni && !affiliate_dni.length) {
        isValid = false;
        message += '- El DNI del afiliado es requerido';
      } else if (affiliate_dni) {

        if (Number(affiliate_dni) === Number(partner_dni)) {

          isValid = false;
          message += '- Los DNI de Socio y Afiliado deben ser diferentes';
        }

        const partner = await Partner.findOne({
          where: {
            [Op.or]: [{ partner_dni: affiliate_dni }, { affiliate_dni }],
          }
        });
        if (partner) {
          isValid = false;
          message += '- El DNI del afiliado ya existe en otro socio o es un afiliado';
        }

      }
      //AFFILIATE_NAME
      if (!affiliate_name && !affiliate_name.length) {
        isValid = false;
        message += '- El nombre del afiliado es requerido';
      }
      //AFFILIATE_BIRTHDATE
      if (!affiliate_birthdate && !affiliate_birthdate === undefined) {
        isValid = false;
        message += '- La fecha de nacimiento del afiliado es requerida';
      } else if (affiliate_birthdate) {
        const newDate = affiliate_birthdate.split('/');
        const date = new Date(newDate[1] + '/' + newDate[0] + '/' + newDate[2]);
        if (date.toString() === 'Invalid Date') {
          isValid = false;
          message += '- La fecha de nacimiento del afiliado es inválida';
        } else {
          const currentDate = new Date();
          const age = (currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 365);
          if (age < 18) {
            isValid = false;
            message += '- El afiliado debe ser mayor de edad';
          }
        }
      }

      //AFFILIATE_PHONE
      if (affiliate_phone) {
        const partner = await Partner.findOne({
          where: {
            [Op.or]: [{ partner_phone: affiliate_phone }, { affiliate_phone }],
          }
        });
        if (partner) {
          isValid = false;
          message += '- El teléfono del afiliado ya existe en otro socio o es un afiliado';
        }
      }
    }


    //ID_VISIT_TYPE_USUALLY
    if (!id_visit_type_usualy && id_visit_type_usualy > 0) {
      isValid = false;
      message += '- Visit type is required or not valid';
    } else if (id_visit_type_usualy) {
      const visitType = await VisitType.findByPk(id_visit_type_usualy);
      if (!visitType) {
        isValid = false;
        message += '- El tipo de visita no es válido';
      }
    }
    //ID_STATE

    if (!id_state && id_state > 0) {
      isValid = false;
      message += '- El estado es requerido o no es válido';
    } else if (id_state) {
      const state = await State.findByPk(id_state);
      if (!state) {
        isValid = false;
        message = '- El estado no es válido';
      }
    }
    //SUGGEST_MEMBERSHIP_AMOUNT
    if (id_payment_method !== EPaymentMethod.NO_PAGA && (!suggest_membership_amount && id_state !== EPartnerState.SOCIO_INVITADO)) {
      isValid = false;
      message += ' El monto de la cuota sugerida es requerido';
    } else if (suggest_membership_amount < 0 && id_state !== EPartnerState.SOCIO_INVITADO) {
      isValid = false;
      message += ' El monto de la cuota sugerida no puede ser negativo';
    }

    //ID_PAYMENT_METHOD

    if (!id_payment_method && id_payment_method > 0) {
      isValid = false;
      message += '- El método de pago es requerido o no es válido';
    } else if (id_payment_method) {
      const paymentMethod = await PaymentMethod.findByPk(id_payment_method);
      if (!paymentMethod) {
        isValid = false;
        message = '- El método de pago no es válido';
      }
    }

    return [isValid, message];
  } catch (error) {
    console.log(error);
    return [false, ''];
  }
};

export const putPartnerValidator = async (
  id_partner: string,
  alias: string | undefined,
  partner_dni: string | undefined,
  partner_name: string | undefined,
  partner_birthdate: string | undefined,
  partner_phone: string | undefined,
  affiliate_dni: string | undefined,
  affiliate_name: string | undefined,
  affiliate_birthdate: string | undefined,
  affiliate_phone: string | undefined,
  id_visit_type_usualy: number | undefined,
  id_state: number | undefined,
  suspension_reason: string | undefined,
  expultion_reason: string | undefined,
): Promise<[boolean, string]> => {
  try {
    let isValid: boolean = true;
    let message: string = '';

    //ID_PARTNER
    if (!id_partner && !id_partner.length) {
      isValid = false;
      message = 'El socio es requerido';
    } else if (id_partner) {
      const partner = await Partner.findByPk(id_partner);
      if (!partner) {
        isValid = false;
        message = 'El socio no existe';
      }
    }

    //ALIAS
    if (alias) {
      if (!alias.length) {
        isValid = false;
        message += '- El alias es requerido';
      }
    }

    //PARTNER_DNI
    if (partner_dni && partner_dni.length) {
      if (!partner_dni.length) {
        isValid = false;
        message += '- Partner DNI is required';
      } else if (isNaN(Number(partner_dni))) {
        isValid = false;
        message += '- el DNI del socio debe ser numérico';
      }
    }

    //PARTNER_NAME
    if (partner_name) {
      if (!partner_name.length) {
        isValid = false;
        message += '- El nombre es requerido';
      }
    }

    //PARTNER_BIRTHDATE
    /* if (partner_birthdate) {
      if (!partner_birthdate.length) {
        isValid = false;
        message += '- La fecha de nacimiento del socio es requerida';
      } else if (partner_birthdate) {
        const newDate = partner_birthdate.split('/');
        const date = new Date(newDate[1] + '/' + newDate[0] + '/' + newDate[2]);
        if (date.toString() === 'Invalid Date') {
          isValid = false;
          message += '- La fecha de nacimiento del socio es inválida';
        } else {
          const currentDate = new Date();
          const age = (currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 365);
          if (age < 18) {
            isValid = false;
            message += '- El socio debe ser mayor de edad';
          }
        }
      }
    }
 */
    //PARTNER_PHONE
    if (partner_phone) {
      if (!partner_phone.length) {
        isValid = false;
        message += '- El teléfono del socio es requerido';
      }
    }

    //AFFILIATE_DNI
    if (affiliate_dni && partner_dni && String(affiliate_dni).trim() && String(partner_dni).trim() && Number(affiliate_dni) === Number(partner_dni)) {
      isValid = false;
      message += '- El DNI del afiliado no puede ser igual al del socio';
    }

    /* if (affiliate_dni && affiliate_dni.length) {
      //AFFILIATE_DNI
      if (!affiliate_dni && !affiliate_dni.length) {
        isValid = false;
        message += '- El DNI del afiliado es requerido';
      } else if (isNaN(Number(affiliate_dni))) {
        isValid = false;
        message += '- El DNI del afiliado debe ser numérico';
      } else if(Number(affiliate_dni) === Number(partner_dni)){
        isValid = false;
        message += '- El DNI del afiliado no puede ser igual al del socio';
      }
    } */

    //AFFILIATE_NAME
    if (affiliate_name) {
      if (!affiliate_name.length) {
        isValid = false;
        message += '- El nombre del afiliado es requerido';
      }
    }

    //AFFILIATE_BIRTHDATE
    /* if (affiliate_birthdate) {
      if (!affiliate_birthdate.length) {
        isValid = false;
        message += '- La fecha de nacimiento del afiliado es requerida';
      } else if (affiliate_birthdate) {
        const newDate = affiliate_birthdate.split('/');
        const date = new Date(newDate[1] + '/' + newDate[0] + '/' + newDate[2]);
        if (date.toString() === 'Invalid Date') {
          isValid = false;
          message += '- La fecha de nacimiento del afiliado es inválida';
        } else {
          const currentDate = new Date();
          const age = (currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 365);
          if (age < 18) {
            isValid = false;
            message += '- El afiliado debe ser mayor de edad';
          }
        }
      }
    } */

    //AFFILIATE_PHONE

    if (affiliate_phone) {
      if (!affiliate_phone.length) {
        isValid = false;
        message += '- El teléfono del afiliado es requerido';
      }
    }

    //ID_VISIT_TYPE_USUALLY
    if (id_visit_type_usualy) {
      if (isNaN(Number(id_visit_type_usualy))) {
        isValid = false;
        message += '- El tipo de visita es requerido o no válido';
      } else if (id_visit_type_usualy) {
        const visitType = await VisitType.findByPk(id_visit_type_usualy);
        if (!visitType) {
          isValid = false;
          message += '- El tipo de visita no existe';
        }
      }
    }

    //ID_STATE
    if (id_state) {
      if (isNaN(Number(id_state))) {
        isValid = false;
        message += '- El estado del socio es requerido o no válido';
      } else if (id_state) {
        const state = await State.findByPk(id_state);
        if (!state) {
          isValid = false;
          message = 'El estado del socio no existe';
        }/*  else if (id_state === EPartnerState.SOCIO_EXPULSADO) {
          if (!expultion_reason) {
            isValid = false;
            message = 'La razón de expulsión es requerida';
          }
        } else if (id_state === EPartnerState.SOCIO_SUSPENDIDO) {
          if (!suspension_reason) {
            isValid = false;
            message = 'La razón de suspensión es requerida';
          }
        } */
      }
    }




    return [isValid, message];
  } catch (error) {
    console.log(error);
    return [false, ''];
  }
};
