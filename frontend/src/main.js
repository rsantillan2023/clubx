import Vue from "vue";
import App from "./App.vue";
import vuetify from "./plugins/vuetify";
import router from "./router";
import axios from "./middlewares/index";
import moment from "moment";
import store from "./store";
import * as Sentry from "@sentry/vue";
import { BrowserTracing } from "@sentry/tracing";
import * as VueGoogleMaps from "vue2-google-maps";

if (process.env.VUE_APP_ENVIROMENT == "production") {
  Sentry.init({
    Vue,
    dsn: "https://8e2d08e353f542368167a2da11fd9800@o1170818.ingest.sentry.io/6264694",
    integrations: [
      new BrowserTracing({
        routingInstrumentation: Sentry.vueRouterInstrumentation(router),
        tracingOrigins: ["pwa-sport.yomob-sooft.com"],
      }),
    ],
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 0.2,
    logErrors: true,
  });

  Sentry.setContext("user", {
    userName: store.state.user?.Usu_Nombre,
    loggedInStatus: store.state.user?.loggedInStatus,
    authToken: store.state.user?.authToken,
    currentVersion: store.state.currentVersion,
    promptInstall: store.state.promptInstall,
    referer: store.state.referer,
    view: store.state.view,
  });
}

Vue.config.productionTip = false;
Vue.prototype.$http = axios;

// Custom css
import "@/assets/global.css";
import "@/assets/ios.css";

Vue.use(require("vue-moment"));

Vue.use(VueGoogleMaps, {
  load: {
    key: process.env.VUE_APP_GOOGLE_MAPS_KEY,
    libraries: "places"
  }
});

// Directives
import longClick from "./directives/longclick.js";
import longPress from "./directives/longPress.js";
const longClickInstance = longClick({ delay: 400, interval: 50 });
const longPressInstance = longPress();
Vue.directive("longclick", longClickInstance);
Vue.directive("longpress", longPressInstance);

moment.updateLocale("es", {
  relativeTime: {
    future: "en %s",
    past: "%s atrás",
    s: "unos pocos segundos",
    ss: "%d segundos",
    m: "un minuto",
    mm: "%d minutos",
    h: "una hora",
    hh: "%d horas",
    d: "un día",
    dd: "%d días",
    w: "una semana",
    ww: "%d semanas",
    M: "mes",
    MM: "%d meses",
    y: "un año",
    yy: "%d años",
  },
});

new Vue({
  vuetify,
  store: store,
  router,
  render: (h) => h(App),
}).$mount("#app");
