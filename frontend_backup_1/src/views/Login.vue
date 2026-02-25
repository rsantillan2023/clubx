<template>
  <v-card color="orange" dark elevation="0" height="100%" class="d-flex rounded-0 justify-center align-center">
    <v-card color="transparent" elevation="0" :max-width="($vuetify.breakpoint.mdAndUp) ? '500' : ''">
      <v-row class="justify-center align-center">
          <v-col cols="12" class="text-center py-0">
            <span class="font-weight-black" style="font-size: 2rem;">Club X</span>
          </v-col>
          
          <v-col cols="12" class="d-flex justify-center pt-0 align-center">
            <v-icon style="font-size: 8rem;">mdi-music-circle</v-icon>
          </v-col>

          <v-col cols="12" class="text-center py-0 mb-n2 mt-2">
            <span class="font-weight-thin" style="font-size: 1.5rem;">Iniciá Sesión</span>
          </v-col>

          <v-col cols="6" class="d-flex pl-15 pb-5 justify-center align-center">
            <v-divider :thickness="2" color="white"></v-divider>
          </v-col>

          <v-col cols="6" class="d-flex pr-15 pb-5 justify-center align-center">
            <v-divider :thickness="2" color="white"></v-divider>
          </v-col>

          <v-col cols="12">
            <v-form ref="formLogin">
              <v-row class="px-15" no-gutters>
                <v-col cols="12">
                  <v-text-field
                    prepend-inner-icon="mdi-account"
                    placeholder="Nombre de usuario"
                    outlined
                    dense
                    class="logininput"
                    v-model="username"
                  />
                </v-col>

                <v-col cols="12">
                  <v-text-field
                      prepend-inner-icon="mdi-key"
                      placeholder="Contraseña"
                      outlined
                      dense
                      v-model="password"
                      :type="showPassword?'text':'password'"
                      @click:append="showPassword = !showPassword"
                      @keydown.enter="login"
                      :append-icon="showPassword ? 'mdi-eye':'mdi-eye-off'" >
                    </v-text-field>
                </v-col>

                <v-col cols="12" class="d-flex justify-center mb-1" v-if="error">
                  <v-alert color="white" dense outlined type="error" icon="mdi-alert-octagon-outline">
                     {{error}}
                  </v-alert>
                </v-col>

                <v-col cols="12">
                  <v-btn large block :loading="loading" color="white" class="orange--text font-weight-bold" @click="login">
                    Iniciar Sesión
                  </v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-col>
      </v-row>
    </v-card>
  </v-card>
</template>

<script>
export default {
  name: "Login",
  data(){
    return{
      loading: false,
      error: null,
      showPassword: false,
      username: '',
      password: '',
    }
  },
  methods: {
    login() {
      if(this.username && this.password){
        this.loading = true;
        let vm = this;
        this.$http.post(`${process.env.VUE_APP_LOGIN_URI}`, {
            username: this.username,
            password: this.password
        })
        .then(response => {
          if (response) {
            const token = response.data.data.token;
            this.$store.commit('setToken', token);
            response.data.clienteId = 2 // cliente 1 = usa dos brazaletes - cliente 2 = usa 1 brazalete unico //
            vm.$store.commit('setSession', response.data)
            vm.$router.push({
              path: '/home'
            });
          }
        })
        .catch((error) => {
          console.log(error)
          this.error = error.response.data.message;
          this.loading = false;
        })
      }else{
        if(!this.username) this.error = "El usuario es requerido"
        if(!this.password) this.error = "La contraseña es requerida"
      }          
    },
  }
};
</script>