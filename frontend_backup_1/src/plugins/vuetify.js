import Vue from 'vue';
import Vuetify from 'vuetify/lib';
import '@mdi/font/css/materialdesignicons.css'
import colors from 'vuetify/lib/util/colors';

Vue.use(Vuetify);

export default new Vuetify({
  icons:{
    iconfont:"mdi"
  },
  theme: {
    options: {
      customProperties: true,
    },
    themes: {
      light: {
        primary: '#ce5044',
        secondary: colors.grey.darken1,
        accent: colors.shades.black,
        error: colors.red.base,
        orange: '#ce5044',
        purple: '#7052fb',
        sooft: "#44355f",
        belgrano: "#199FDF",
        yomob: "#8300ff",
        consultauser: "#ebe7fd",
        consultaadmin: "#f0f0f0",
        bottomTabActiveColor:'#0096E3',
        green: '#2b8a06',
        red: '#E21519',
        teal: '#009688'
      },
      dark: {
        primary: colors.blue.lighten3,
        anchor: "#fff",
        yomob: "#8300ff",
        consultauser: "#000000",
        consultaadmin: "#000038",
      },
    }
  }
});
