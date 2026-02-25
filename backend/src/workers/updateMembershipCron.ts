import { updatePartnerMembership } from '../api/v1/entities/partners/helpers';
import cron from 'node-cron';

const updateMembershipCron = cron.schedule('30 9 * * *', async () => {
  console.log('Iniciando actualización de membresías de socios...');
  try {
    const result = await updatePartnerMembership();
    console.log('Finalizó el proceso de actualización de membresías de socios...');
  } catch (error) {
    console.error('Error al actualizar membresías de socios:', error);
  }
}, {
  scheduled: false  // Prevents the cron job from starting automatically
});

export default updateMembershipCron;
