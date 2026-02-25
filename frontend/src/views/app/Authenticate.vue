<template>
   <v-app>
      <v-container bg fill-height grid-list-md text-xs-center v-if="showMesssage">
        <v-layout row wrap align-center>
          <v-flex>
            <v-card class="elevation-12" >
              <v-toolbar color="secondary" dark>
                <v-toolbar-title>
                  <v-icon dark right>
                    mdi-cancel
                  </v-icon>
                  Atención
                </v-toolbar-title>
                <v-spacer></v-spacer>
              </v-toolbar>
            <v-card-text>
              <h3> {{ error }} </h3>
            </v-card-text>
            </v-card>
          </v-flex>
        </v-layout>
      </v-container>
  </v-app>
</template>

<script>
import eventBus from "../../event-bus.js"
export default {
  name: "Authenticate",
  props:{
    token: {type: String},
    usu_id: {type: String},
  },
  data(){
    return{
      emp_id:null,
      error:null,
      showMesssage:false
    }
  },
  mounted() {
    this.authenticate();
  },
  methods: {
   async authenticate () {
     eventBus.$emit("loadPage", {show: true, message: 'Autenticando Credenciales'});
     if (this.token != undefined && this.usu_id != undefined) {
        const payload = {
        token: this.token,
        usu_id: this.usu_id,
      }

      try {
        const response = await this.$store.dispatch('login', payload)

        if(response.status === 'error'){
            this.error = response.message;
            this.showMesssage = true;
        }
        eventBus.$emit("loadPage", {show: false, message: ''});

      } catch (error) {
        console.log(error);
        eventBus.$emit("loadPage", {show: false, message: ''});
      }
     }

    }
  }
}
</script>