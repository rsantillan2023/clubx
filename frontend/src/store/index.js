import Vue from "vue";
import Vuex from "vuex";
import moment from "moment";

moment.locale("es-us");

//new
import VuexPersistence from "vuex-persist";
import localForage from "localforage";
import axios from 'axios';

const vuexLocal = new VuexPersistence({
  storage: window.localStorage,
});

Vue.use(Vuex);

const store = new Vuex.Store({
  plugins: [vuexLocal.plugin],
  getters: {
    getDriver: () => localForage,
    isLoggedIn: (state) => state.isLoged,
    routesAccess: (state) => state.routesAccess,
    userToken: (state) => state.token,
    authStatus: (state) => state.user.loggedInStatus,
    isDarkMode: (state) => state.darkTheme,
  },
  state: {
    isLoged: false,
    userLoged: null,
    partner: null,
    token: null,
    idRol: null,
    darkTheme: false,
    openNew: false,
    PayProceded: false,
    scrollPublications: null,
    scrollDashboard: null,
    currentPub: null,
    listPublications: null,
    currentTicket: null,
    listTickets: null,
    scrollTickets: null,
    notificationTextInfo: [],
    notificationTextError: [],
    routesAccess: [],
    cronIsWorking: false,
    online: true, // saber si el dispositivo esta online
    searchText: "", // texto a buscar en la pagina de search
    lastPage: null, // ultima pagina que visito
    skipSpinnerPage: null, // ultima pagina que visito
    cache: null,
    loadingPost: false, // si esta cargando post
    promptInstall: false, // si instalo la pwq
    promptInstallDate: null, // fecha que instalo la pwa
    newVersionAvailable: null, //Usado para mostrar una nueva version
    currentVersion: 0, //usado para ir seteando la version por medio de storage
  },
  mutations: {
    setSession(state, values) {
      state.isLoged = true;
      state.userLoged = values;
    },
    SetRoutesAccess(state, values) {
      state.routesAccess = values;
    },
    clearSession(state) {
      state.isLoged = false;
      state.userLoged = null;
    },
    //
    setPartner(state, values) {
      state.partner = true;
      state.partner = values;
    },
    clearPartner(state) {
      state.partner = false;
      state.partner = null;
    },
    //
    setToken(state, token) {
      state.token = token;
    },
    clearToken(state) {
      state.token = null;
    },
    setDark(state, value) {
      state.darkTheme = value;
    },
    setPayProceded(state, value) {
      state.PayProceded = value;
    },
    setAddNewCard(state, value) {
      state.addNewCard = value;
    },
    setIdCardDA(state, value) {
      state.idCardDA = value;
    },
    setCardNumberDA(state, value) {
      state.cardNumberDA = value;
    },
    openPublish(state, backup){
      state.currentPub = backup.pub;
      state.listPublications = backup.list;
      state.scrollPublications = backup.scroll;
    },
    clearMessagesOld(state) {
      state.notificationTextInfo = [];
      state.notificationTextError = [];
    },
    setNotificationTextError(state, value) {
      state.notificationTextError.push(value);
      setTimeout(function () {
        const indexOfObject = state.notificationTextError.findIndex(
          (object) => {
            return object == value;
          }
        );
        state.notificationTextError.splice(indexOfObject, 1);
      }, 10000);
    },
    setNotificationTextInfo(state, value) {
      state.notificationTextInfo.push(value);
      setTimeout(function () {
        const indexOfObject = state.notificationTextInfo.findIndex((object) => {
          return object == value;
        });
        state.notificationTextInfo.splice(indexOfObject, 1);
      }, 10000);
    },
    setCron(state, value) {
      state.cronIsWorking = value;
    },
    setCurrentVersion(state, value) {
      state.currentVersion = value;
      state.newVersionAvailable = null;
    },
    setNewVersionAvailable(state, value) {
      state.newVersionAvailable = value;
    },
    setAllowPersist(state, value) {
      state.user.persist = value;
    },
    setNewPost(state, payload) {
      state.user.newPost = payload;
    },
    removePushBox(state, key) {
      if (
        state.user.pushBox != undefined &&
        state.user.pushBox[key] !== undefined
      ) {
        state.user.pushBox[key] = null;
      }
    },
    addPushBox(state, payload) {
      if (
        state.user.pushBox == undefined ||
        state.user.pushBox.nuevaNoticia == undefined
      ) {
        state.user.pushBox = {
          nuevaNoticia: [],
          notification: [],
          Consultas: [],
        };
      }
      //manejo de push con objetos
      //console.log('state.user.pushBox',state.user.pushBox);
      if (
        state.user.pushBox[payload["notification"].Men_Seccion] == undefined ||
        state.user.pushBox[payload["notification"].Men_Seccion] == null
      ) {
        state.user.pushBox[payload["notification"].Men_Seccion] = [
          payload["object"],
        ];
        console.log(
          "No existe ",
          payload["notification"].Men_Seccion,
          [payload["object"]],
          "123"
        );
        if (
          window.top.scrollY > 200 &&
          state.view == "Main" &&
          payload["notification"].Men_Seccion == "nuevaNoticia"
        ) {
          //Si esta lejos del top
          state.user.newPost = true;
        }
      } else {
        var has = state.user.pushBox[payload["notification"].Men_Seccion].find(
          (x) => x.Pub_Id === payload["object"].Pub_Id
        );
        if (has === undefined || has.Pus_Id === undefined) {
          console.log(
            "No existe ",
            payload["notification"].Men_Seccion,
            payload["object"].Pub_Id,
            "321"
          );
          state.user.pushBox[payload["notification"].Men_Seccion].push(
            payload["object"]
          );
          if (
            window.top.scrollY > 200 &&
            state.view == "Main" &&
            payload["notification"].Men_Seccion == "nuevaNoticia"
          ) {
            //Si esta lejos del top
            state.user.newPost = true;
          }
        } else {
          console.log("SI existe object", payload["object"].Pub_Id);
        }
      }

      if (state.user.pushBox["notification"] == undefined) {
        //Fix datos
        payload["notification"].Des_Estado = 2;
        payload["notification"].Pus_FechaEnvio =
          moment().format("DD/MM/YYYY hh:mm");
        state.user.pushBox["notification"] = [payload["notification"]];
        store.commit("counterUp");
      } else {
        var hasNoti = state.user.pushBox["notification"].find(
          (x) => x.Pus_Id === payload["notification"].Pus_Id
        );
        if (hasNoti === undefined || hasNoti.Pus_Id === undefined) {
          console.log("No existe noti2", payload["notification"].Pus_Id);
          //Fix datos
          payload["notification"].Des_Estado = 2;
          payload["notification"].Pus_FechaEnvio =
            moment().format("DD/MM/YYYY hh:mm");
          state.user.pushBox["notification"].push(payload["notification"]);
          store.commit("counterUp");
        } else {
          console.log("SI existe noti", payload["notification"]);
        }
      }

      //state.user.pushBox =  {};
    },
    setBadget(state) {
      if ("setAppBadge" in navigator) {
        if (state.user.notificationsCounter > 0) {
          navigator
            .setAppBadge(state.user.notificationsCounter)
            .catch((error) => {
              console.log(error);
            });
        } else {
          console.log("limpiando badget");
          navigator.clearAppBadge().catch((error) => {
            console.log(error);
          });
        }
      }
    },
    counterUp(state) {
      state.user.notificationsCounter++;
      if (state.user.notificationsCounter > 99) {
        state.user.notificationsView = "+99";
      } else {
        state.user.notificationsView = state.user.notificationsCounter;
      }
      store.commit("setBadget");
    },
    counterDown(state) {
      state.user.notificationsCounter--;
      if (state.user.notificationsCounter > 99) {
        state.user.notificationsView = "+99";
      } else {
        state.user.notificationsView = state.user.notificationsCounter;
      }
      store.commit("setBadget");
    },
    setNotificationCounter(state, notificationsCounter) {
      state.user.notificationsCounter = notificationsCounter;
      if (notificationsCounter > 99) {
        state.user.notificationsView = "+99";
      } else {
        state.user.notificationsView = notificationsCounter;
      }
    },
    setProfileName(state, payload) {
      state.user.Usu_Nombre = payload.Usu_Nombre;
      state.user.Usu_Apellido = payload.Usu_Apellido;
    },
    setProfilePic(state, payload) {
      state.user.Usu_Imagen = payload;
    },
    setPostLoaded(state, payload) {
      state.postLoaded = payload;
    },
    setEmpData(state, emp) {
      state.user.Emp_Data = emp;
    },
    setReferer(state, referer) {
      state.referer = referer;
    },
    setOnline(state, online) {
      state.online = online;
    },
    setPromptInstall(state, promptInstall) {
      state.promptInstall = promptInstall;
    },
    setPromptInstallDate(state, promptInstallDate) {
      state.promptInstallDate = promptInstallDate;
    },
    setPhoneRegisteredInDb(state, phoneRegisteredInDb) {
      state.phoneRegisteredInDb = phoneRegisteredInDb;
    },
    setLastPage(state, lastPage) {
      state.lastPage = lastPage;
    },
    setSkipSpinnerPage(state, lastPage) {
      state.skipSpinnerPage = lastPage;
    },
    setLoadingPost(state, loadingPost) {
      state.loadingPost = loadingPost;
    },
    setSearchText(state, text) {
      state.searchText = text;
    },
    setCache(state, cache) {
      state.cache = cache;
    },
    clearCache(state) {
      state.cache = null;
    },
    setView(state, view) {
      console.log("estaba", state.view);
      console.log("se ve", view);
      state.lastPage = state.view;
      state.view = view;
    },
    setLastScroll: function (state, scroll) {
      state.scroll.page = scroll.page;
      state.scroll.scroll = scroll.scroll;
    },
    addWebToken: function (state, webToken) {
      // alert('webToken'+ JSON.stringify(webToken.data)+"muta");
      state.user = webToken.data;
      state.user.emp_id = webToken.data.Emp_Id;
      state.user.usu_token = webToken.data.Usu_Token;
      state.user.usu_id = webToken.data.Usu_Id;
      //state.cache = webToken.data.Emp_Data;
      state.user.loggedInStatus = true;
      // alert("muto a"+JSON.stringify(state.user));
    },
    addUserApp: function (state, userApp) {
      // console.log("alexis");
      state.userApp = userApp;
    },
    addPartnerInfo: function (state, partnerInfo) {
      // console.log("alexis");
      state.partnerInfo = partnerInfo;
    },
    addMercadopagoInfo: function (state, mercadoPago) {
      // console.log("alexis");
      state.mercadoPago = mercadoPago;
    },
    refresh: function (state, webToken) {
      state.user.emp_id = webToken.data.Emp_Id;
      state.user.Usu_Nombre = webToken.data.Usu_Nombre;
      state.user.Usu_Imagen = webToken.data.Usu_Imagen;
      state.user.menuPublic = webToken.data.menuPublic;
      state.user.menu = webToken.data.menu;
      state.user.Emp_Data.MetadataJson = webToken.data.Metadata;
      state.user.notificationsEnquiry = webToken.data.notificationsEnquiry;
    },
    removeWebToken: function (state) {
      state.user = {
        userName: "",
        loggedInStatus: false,
        authToken: "",
        Emp_Data: {},
      };
      state.phoneRegisteredInDb = false;
      state.loadingPost = false;
      state.surveys = {};
      state.pages = {};
    },
  },
  actions: {
    //no asincrona borrar
    login({ commit }, { username, password }) {
      return axios.post(process.env.VUE_APP_LOGIN_URI, {
        username: username,
        password: password
      })
      .then(response => {
        if (response.status === 200) {
          commit('setSession', response.data)
        } 
      })
      .catch(error => {
        console.log(error)
      })
    },
    logout({ commit }) {
      commit('clearSession')
    }
  }
});

export default store;
