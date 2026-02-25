import store from '../store'
import axios from 'axios';

axios.defaults.headers['Content-Type'] = 'application/json;charset=utf-8';

axios.interceptors.response.use(
function(response){
    //console.log('version', parseInt(response.headers.version));
    return (response) ? response : null;
}, function(error){
        console.log(error)
    if (error.response.status === 401) {
        store.dispatch("logout");
        setTimeout(function () {
            window.location.href = '/';
          }, 1000);
        return Promise.resolve();
    }else{
        return Promise.reject(error);
    }
});

axios.interceptors.request.use(function (config) {
    config.headers['authorization'] = `${store.state.token}`;
    
    // Reemplazar localhost/127.0.0.1 con el hostname actual para acceso desde red
    if (config.url) {
        const currentHost = window.location.hostname;
        // Solo reemplazar si no es localhost (para evitar loops)
        if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
            // Reemplazar http://localhost o https://localhost
            config.url = config.url.replace(/https?:\/\/localhost/g, `http://${currentHost}`);
            config.url = config.url.replace(/https?:\/\/127\.0\.0\.1/g, `http://${currentHost}`);
            // También reemplazar localhost sin protocolo (por si acaso)
            config.url = config.url.replace(/localhost/g, currentHost);
            config.url = config.url.replace(/127\.0\.0\.1/g, currentHost);
        }
    }
    
    // Log para debugging - solo para requests de roles
    if (config.url && config.url.includes('/users/') && config.url.includes('/roles') && config.method === 'post') {
        console.log('=== AXIOS INTERCEPTOR - REQUEST ===');
        console.log('URL:', config.url);
        console.log('Method:', config.method);
        console.log('Data (raw):', config.data);
        console.log('Data (type):', typeof config.data);
        console.log('Data (JSON):', JSON.stringify(config.data));
        console.log('Headers:', config.headers);
    }
    
    return config;
}, function (err) {
    return Promise.reject(err);
});

// Importar interceptor offline (intercepta automáticamente todas las llamadas HTTP)
import './offline-interceptor';

export default axios;