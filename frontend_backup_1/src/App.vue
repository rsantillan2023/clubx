<template>
  <v-app id="inspire">
    <v-main>
      <HeadView @openDrawer="drawer = !drawer" v-if="!$route.meta.hiddeHeadAndFooter"/>
        <v-snackbar
          v-model="snackbar.show"
          :color="snackbar.color"
          timeout="3000"
          class="text-center"

        >
          {{ snackbar.text }}
        </v-snackbar>

        <router-view
          @goTo="goTo($event)"
          @goBack="goBack($event)"
          ref="routeRef"
          :class="($vuetify.breakpoint.mdAndUp && !$route.meta.hiddeHeadAndFooter) ? 'px-15' : ''"
        ></router-view>

      <Footer v-if="!$route.meta.hiddeHeadAndFooter" />

      <!--<v-navigation-drawer v-model="drawer" v-if="drawer && !$route.meta.hiddeHeadAndFooter" app class="navigation-custom">
        <Navigation></Navigation>
      </v-navigation-drawer>-->


      <!--Dialog para avisos-->
      <v-dialog v-model="dialog.show" persistent max-width="400">
        <v-card class="rounded-lg text-center pa-5" v-if="dialog.show">
          <ModalConfirm :type="dialog.type" 
                        :text="dialog.text" 
                        :title="dialog.title"
                        :goTo="dialog.goTo"
                        :sendToWhatsapp="dialog.sendToWhatsapp"
                        :whatsappData="dialog.whatsappData"
                        :isHtml="(dialog.isHtml)"
                        :goToHome="dialog.goToHome"
                        :closeDialog="dialog.closeDialog">
          </ModalConfirm>
        </v-card>
      </v-dialog>
    </v-main>
  </v-app>
</template>

<script>
import eventBus from "./event-bus";
import { isIos } from "./helpers/index";
import Footer from "./views/app/Footer.vue";
import HeadView from "./views/app/HeadView.vue";
//import Navigation from "./views/app/Navigation.vue";
import ModalConfirm from "./views/app/ModalConfirm.vue";
export default {
  components: {
    HeadView,
    Footer,
    //Navigation,
    ModalConfirm
  },
  name: "App",
  mounted() {
    // Creamos los eventos que debe leer desde react native
    if (window.ReactNativeWebView) {
      window.removeEventListener("message", this.webViewEventHandler); //android
      document.removeEventListener("message", this.webViewEventHandler); //ios
      window.addEventListener("message", this.webViewEventHandler); //android
      document.addEventListener("message", this.webViewEventHandler); //ios
    }
    let vm = this;
    eventBus.$on("toast", function (data) {
      vm.snackbar = data;
    });

    eventBus.$on("ConfirmDialog", function (data) {
      vm.dialog = data;
    });

    eventBus.$on("goTo", function (view) {
      vm.goTo(view);
    });
    eventBus.$on("goBack", function () {
      vm.goBack();
    });
    this.drawer = this.$vuetify.breakpoint.mdAndUp
  },
  data: () => ({
    drawer: true,
    closeApp: false,
    metadata: null,
    loadDone: false,
    snackbar: { show: false, text: "", color: "red" },
    dialog: { show: false, text: "", title: "", type: 'success' },
    host: "https://" + window.location.host,
  }),
  watch: {},
  methods: {
    closeNotice() {
      // if(this.noticeDialog.redirect){
      //     if(this.noticeDialog.redirect == 'reactNavigate'){
      //         let navigate = this.noticeDialog.navigate;
      //         if(navigate.type != 2){
      //           if(navigate.url != '' && navigate.url != null && navigate.url != undefined)
      //               reactNavigate(navigate.url, navigate.type, navigate.inapp, navigate.screen, navigate.title);
      //             else this.dialog = true;
      //         }else eventBus.$emit('goTo', {view: `/${navigate.url}`});
      //     }else this.goTo({view: this.noticeDialog.redirect});
      // }
      // this.noticeDialog = { show: false, text: "", color: "red" };
    },
    webViewEventHandler(event) {
      const { origin = "", data: { result = "" } = {} } = event;
      if (origin === "dniScanner") {
        console.log("Aca llega el escaneo del dni", result); // NATI -> Aca llama al evento correspondiente
        eventBus.$emit('readDNI', result);
      }
    },
    goToQS(path, query) {
      this.$router.push({ path, query });
    },
    goTo(view) {
      if (view.view.includes("publications"))
        this.$store.commit("setCurrentCategory", parseInt(view.catId));
      this.$router.push(view.view);
    },
    goBack() {
      if (
        this.$store.state.view == "Publish" &&
        this.$store.state.currentPub != null &&
        this.$store.state.listPublications != null &&
        this.$store.state.scrollPublications != null
      ) {
        //Si viene de abrir una publicacion y esta el backup de la pagina /publications
        eventBus.$emit("closeNew");
      }
      this.$store.state.lastPage === "Spinner"
        ? this.$router.push({ name: this.$store.state.skipSpinnerPage })
        : this.$router.go(-1);
    },
    async initAll() {
      this.$store.commit("setLoadingPost", false);
      //Fix para safari
      if (isIos()) {
        document.body.addEventListener("touchmove", function (event) {
          event.preventDefault();
        });
      }
    },
    loadEventsPwa() {
      if ("serviceWorker" in navigator) {
        window.addEventListener("load", function () {
          navigator.serviceWorker.register("firebase-messaging-sw.js").then(
            function (/*serviceWorker*/) {
              // Si es exitoso
              //vm.serviceWorker = serviceWorker;
              //console.log("SW registrado firebase-messaging-sw.js", registration);
            },
            function (err) {
              // Si falla
              console.log("SW fallo", err);
            }
          );
        });
      }
      this.initAll();
    },
  },
  computed: {
    realHost() {
      return window.location.host;
    },
  },
};
</script>
<style>
* {
  font-family: "Nunito", sans-serif;
}
</style>