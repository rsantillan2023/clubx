<template>
  <div>
    <v-btn @click="showDialog = true" color="primary">Salir<v-icon>mdi-logout</v-icon></v-btn>

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
export default {
  name: "Logout",
  data() {
    return {
      showDialog: false,
    };
  },
  methods: {
    logout() {
      this.$store.dispatch('logout')
        .then(() => {
          // redirige usuario al login.
          this.$router.push('/login')
        })
    }
  }
}
</script>