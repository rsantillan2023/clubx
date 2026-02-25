<template>
  <v-container>
    <v-row 
      v-for="group in groupedButtons" 
      :key="group.order" 
      style="display: flex; align-items: stretch; margin-bottom: 16px;"
    >
      <v-col 
        v-for="button in group.buttons" 
        :key="button.id_operation_type" 
        cols="6" 
        md="3"
      >
        <v-card 
          elevation="4" 
          outlined 
          @click="$router.push(button.path)" 
          class="rounded-lg d-flex justify-center align-center text-center" 
          :style="`height: 100px; border-color: ${getColorValue(group.colorIndex)} !important;`"
        >
          <v-card-text 
            :class="`${getColorForGroup(group.colorIndex)}--text pa-2`"
          >
            <v-icon 
              size="28" 
              :class="`${getColorForGroup(group.colorIndex)}--text pb-1`"
            >
              {{ button.icon }}
            </v-icon>
            <div 
              :class="`text-caption ${getColorForGroup(group.colorIndex)}--text`"
            >
              {{ button.description }}
            </div>
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
      colors: [
        'orange',
        'blue',
        'green',
        'purple',
        'red',
        'teal',
        'indigo',
        'pink',
        'cyan',
        'amber',
        'deep-orange',
        'light-blue',
        'lime',
        'brown',
        'grey'
      ],
      shuffledColors: [],
    };
  },
  computed: {
    groupedButtons() {
      // Agrupar botones por el campo order
      const grouped = {};
      
      this.buttons.forEach(button => {
        // Usar null o 0 como clave si no tiene order definido
        const orderKey = button.order !== null && button.order !== undefined ? button.order : 'sin-order';
        
        if (!grouped[orderKey]) {
          grouped[orderKey] = [];
        }
        grouped[orderKey].push(button);
      });
      
      // Ordenar los grupos por el valor de order y convertirlos en array
      const sortedKeys = Object.keys(grouped).sort((a, b) => {
        // Manejar el caso de 'sin-order'
        if (a === 'sin-order') return 1;
        if (b === 'sin-order') return -1;
        return parseInt(a) - parseInt(b);
      });
      
      // Convertir a array de objetos con grupo e índice para facilitar el acceso al color
      return sortedKeys.map((key, index) => ({
        order: key,
        buttons: grouped[key],
        colorIndex: index
      }));
    }
  },
  mounted() {
    this.getData();
  },
  methods: {
    shuffleColors() {
      // Mezclar aleatoriamente el array de colores
      this.shuffledColors = [...this.colors].sort(() => Math.random() - 0.5);
    },
    getData() {
      let id_user = this.$store.state.userLoged.data.id_user; 
      console.log('roles ',this.$store.state.userLoged.data.roles);
      // Mezclar colores aleatoriamente cada vez que se cargan los botones
      this.shuffleColors();
      this.$http.get(`${process.env.VUE_APP_BUTTONS}?id_user=${id_user}`)
        .then(response => {
          this.buttons = response.data.data;
          let routes = response.data.data.map((item) => { return item.path })

          //seteo las rutas heredadas para dejar acceder
          if(routes.includes('/access')) routes = routes.concat(['/entryRegister', '/entryRegisterLite', '/activeVisits', '/membershipReactivation', '/registerPartner','/registerPartnerLite'])
          if(routes.includes('/accessMembership')) routes = routes.concat(['/entryRegister', '/entryRegisterLite', '/activeVisits', '/membershipReactivation', '/registerPartner','/registerPartnerLite'])
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
    getColorForGroup(colorIndex) {
      // Usar el índice del grupo para obtener el color de la lista mezclada aleatoriamente
      // Si hay más grupos que colores, ciclar usando módulo
      return this.shuffledColors[colorIndex % this.shuffledColors.length] || this.colors[colorIndex % this.colors.length];
    },
    getColorValue(colorIndex) {
      // Obtener el valor real del color desde el tema de Vuetify
      const colorName = this.getColorForGroup(colorIndex);
      const theme = this.$vuetify.theme.currentTheme;
      // Si el color existe en el tema, usarlo; si no, usar el color por defecto de Vuetify
      return theme[colorName] || this.$vuetify.theme.currentTheme.primary;
    }
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