<template>
  <div>
  <v-footer app padless class="custom-footer">
    <v-bottom-navigation :value="actual_route" grow color="orange" icon>
      <v-btn value="home" icon @click="redirectToHome()">
        <v-icon>mdi-home</v-icon>
      </v-btn>

      <v-btn icon @click="showDialog = true">
        <v-icon>mdi-logout-variant</v-icon>
      </v-btn>
    </v-bottom-navigation>
  </v-footer>

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
    name: "Footer",
    data() {
      return {
        showDialog: false,
      };
    },
    computed:{
      actual_route(){
        return (['home','register','nearby', 'account'].includes(this.$route.name)) ? this.$route.name : null
      }
    },
    methods: {
      redirectToHome() {
        this.$router.push({ path: '/home' });
      },
      redirectToRegister(){
        this.$router.push({ path: '/registerPartner' });
      },
      logout(){
        this.$store.dispatch('logout')
        // Poner alert antes de salir
        .then(() => {
          this.$router.push('/login')
        })
      }
    }
}
</script>

<style>
.custom-footer {
  position: fixed;
  bottom: 0;
}
</style>