<template>
  <div>
    <v-app-bar app color="orange" dark hide-toolbar>
      <v-row class="align-center">
        <v-col cols="3" class="d-flex align-center">
          <v-icon @click="redirectToHome()" class="mr-2">mdi-home</v-icon>
          <v-icon style="font-size: 2.5rem;" v-if="$route.name == 'dashboard' || $route.name == 'Unauthorized'">mdi-music-circle</v-icon>
          <v-icon @click="goBack()"  v-else>mdi-arrow-left</v-icon>
        </v-col>
        <v-col cols="6" class="d-flex align-center justify-center">
          <v-icon style="font-size: 2.5rem;" v-if="$route.name != 'dashboard' && $route.name != 'Unauthorized'">mdi-music-circle</v-icon>
          <div class="align-self-center">
            <div v-if="title" class="text-center font-weight-black ml-1" style="font-size: 1.6rem;"> {{ title }}</div>
            <div v-else class="text-center font-weight-black" style="font-size: 1.6rem;">Club X</div>

            <div style="font-size: 0.8rem; text-align: center;" v-if="$store.state.userLoged">¡Hola {{ $store.state.userLoged.data.name }}!</div>
          </div>
        </v-col>
        <v-col cols="3" class="d-flex justify-end align-center">
          <v-icon @click="showDialog = true" class="mr-2">mdi-logout-variant</v-icon>
          <v-icon @click="$router.push('/account')">mdi-account</v-icon>
        </v-col>
      </v-row>
    </v-app-bar>

    <v-dialog v-model="showDialog" persistent max-width="500px">
        <v-card>
          <v-card-title>Cerrar sesión</v-card-title>
          <v-card-text>¿Está seguro de que desea cerrar la sesión?</v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" text @click="showDialog = false">Cancelar</v-btn>
            <v-btn color="primary" text @click="logout">Aceptar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
  </div>
</template>

<script>
export default{
    name: "HeadView",
    props:{
        userName: {type: String}
    },
    data() {
      return {
        showDialog: false,
      };
    },
    computed:{
      title(){
        console.log(this.$route)
        return (this.$route.meta.title) ? this.$route.meta.title : null
      }
    },
    methods: {
      goBack() {
        this.$router.go(-1)
      },
      redirectToHome() {
        if (this.$route.path === '/home') return;
        this.$router.push({ path: '/home' });
      },
      logout(){
        this.$store.dispatch('logout')
        .then(() => {
          this.$router.push('/login')
        })
      }
    }
}
</script>

