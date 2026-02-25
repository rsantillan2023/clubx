import { fixEmptyEntryRegister } from '../api/v1/entities/visits/helpers';
import cron from 'node-cron';

const partnersWithoutVisitsCron = cron.schedule('0 9 * * *', async () => {
  console.log('Iniciando proceso de creacion de visitas faltantes...');
  try {
    const result = await fixEmptyEntryRegister();        
    console.log('Finalizó el proceso de creacion de visitas faltantes...');
  } catch (error) {
    console.error('Error al crear las visitas faltantes:', error);
  }
}, {
  scheduled: false  // Prevents the cron job from starting automatically
});

export default partnersWithoutVisitsCron;
