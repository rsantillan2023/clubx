<template>
  <v-container>
    <v-row style="display: flex; align-items: stretch;">
      <v-col v-for="button in buttons" :key="button.id_operation_type" cols="6" md="3">
        <v-card elevation="4" outlined @click="$router.push(button.path)" class="rounded-lg d-flex justify-center align-center text-center" style="height: 130px;">
          <v-card-text class="orange--text">
            <v-icon size="40" class="orange--text pb-4">{{ button.icon }}</v-icon>
            <h4>{{ button.description }}</h4>
          </v-card-text>
        </v-card>
      </v-col>
      
      <!-- Botón para Nueva Vista de Operaciones -->
      <v-col cols="6" md="3">
        <v-card 
          elevation="4" 
          outlined 
          @click="$router.push('/new-operations')" 
          class="rounded-lg d-flex justify-center align-center text-center" 
          style="height: 130px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"
        >
          <v-card-text class="white--text">
            <v-icon size="40" class="white--text pb-4">mdi-chart-line-variant</v-icon>
            <h4 class="white--text">Nuevas Operaciones</h4>
            <v-chip 
              color="success" 
              text-color="white" 
              x-small 
              class="mt-2"
            >
              NUEVO
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>
      
      <!-- Botón para Gestión de Socios -->
      <v-col cols="6" md="3">
        <v-card 
          elevation="4" 
          outlined 
          @click="$router.push('/partners')" 
          class="rounded-lg d-flex justify-center align-center text-center" 
          style="height: 130px; background: linear-gradient(135deg, #10b981 0%, #059669 100%);"
        >
          <v-card-text class="white--text">
            <v-icon size="40" class="white--text pb-4">mdi-account-group</v-icon>
            <h4 class="white--text">Socios</h4>
            <v-chip 
              color="info" 
              text-color="white" 
              x-small 
              class="mt-2"
            >
              NUEVO
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>


<script>
export default {
  name: "Dasboard",
  data() {
    return {
      //userRole: null,
      buttons: [],
    };
  },
  mounted() {
    this.getData();
  },
  methods: {
    getData() {
      let id_user = this.$store.state.userLoged.data.id_user; 
      console.log('roles ',this.$store.state.userLoged.data.roles);
      this.$http.get(`${process.env.VUE_APP_BUTTONS}?id_user=${id_user}`)
        .then(response => {
          this.buttons = response.data.data;
          let routes = response.data.data.map((item) => { return item.path })

          //seteo las rutas heredadas para dejar acceder
          if(routes.includes('/access')) routes = routes.concat(['/entryRegister', '/entryRegisterLite', '/activeVisits', '/membershipReactivation', '/registerPartner','/registerPartnerLite'])
          if(routes.includes('/activeVisits')) routes = routes.concat(['/consumed'])
          if(routes.includes('/consumed')) routes = routes.concat(['/exitRegister'])

          //limpio duplicados
          let routes_clean = routes.filter((item,index)=>{
            return routes.indexOf(item) === index;
          })

          //seteo en el store las rutas a las q puede acceder el usuario
          this.$store.commit('SetRoutesAccess', routes_clean)
        })
        .catch(error => {
          console.log(error)
        });
    },
  },
};
</script>

<style>
.card {
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 20px;
}

.text {
  text-align: center;
  font-size: 16px;
  color: white;
  margin-top: 5px;
  padding: 20px;
}
</style>