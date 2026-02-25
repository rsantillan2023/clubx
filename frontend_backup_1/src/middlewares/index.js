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
    return config;
}, function (err) {
    return Promise.reject(err);
});

export default axios;