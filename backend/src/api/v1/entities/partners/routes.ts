import { Router } from 'express';
import { adminRoleValidator, cajaRoleValidator, jwtValidator, validRole } from '../../middlewares';
import { getPartnerByDni, getPartnerInside, getPartnerSearcher, membershipReactivation, partnerMembershipChecker, postPartnerDischarge, updatePartner, postPartnerLiteDischarge, getPartners, getHistoricalVisitsController, getHistogramController, getDatesWithVisitsController, getVisitsWithConsumptionsController, getDatesWithConsumptionsController, getMensualVisitTypeIdController, postMensualSchemeController, patchPartnerNoPagaController } from './controllers';

const routes = Router();

routes.get('/', [jwtValidator, adminRoleValidator,cajaRoleValidator,validRole], getPartnerByDni);

routes.get('/search', [jwtValidator, adminRoleValidator,cajaRoleValidator, validRole], getPartnerSearcher);

routes.get('/inside', [jwtValidator, adminRoleValidator,cajaRoleValidator, validRole], getPartnerInside);

routes.post('/discharge', [jwtValidator, adminRoleValidator,cajaRoleValidator, validRole], postPartnerDischarge);

routes.put('/update/:id_partner', [jwtValidator, adminRoleValidator,cajaRoleValidator, validRole], updatePartner);

routes.put('/reactive/:id_partner', [jwtValidator, adminRoleValidator,cajaRoleValidator, validRole], membershipReactivation)

routes.put('/partner-check', partnerMembershipChecker)

routes.post('/lite-discharge', [jwtValidator, adminRoleValidator,cajaRoleValidator, validRole], postPartnerLiteDischarge)

routes.get('/list', [jwtValidator, adminRoleValidator, cajaRoleValidator, validRole], getPartners)

routes.get('/historical', [jwtValidator, adminRoleValidator, cajaRoleValidator, validRole], getHistoricalVisitsController)

routes.get('/histogram', [jwtValidator, adminRoleValidator, cajaRoleValidator, validRole], getHistogramController)

routes.get('/dates-with-visits', [jwtValidator, adminRoleValidator, cajaRoleValidator, validRole], getDatesWithVisitsController)

routes.get('/visits-consumptions', [jwtValidator, adminRoleValidator, cajaRoleValidator, validRole], getVisitsWithConsumptionsController)

routes.get('/dates-with-consumptions', [jwtValidator, adminRoleValidator, cajaRoleValidator, validRole], getDatesWithConsumptionsController)

// Esquema de pago mensual (solo admin)
routes.get('/mensual-visit-type-id', [jwtValidator, adminRoleValidator, validRole], getMensualVisitTypeIdController)
routes.post('/mensual-scheme', [jwtValidator, adminRoleValidator, validRole], postMensualSchemeController)
routes.patch('/:id_partner/no-paga', [jwtValidator, adminRoleValidator, validRole], patchPartnerNoPagaController)

export = routes;
