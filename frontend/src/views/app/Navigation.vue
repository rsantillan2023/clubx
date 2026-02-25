<template>
  <v-card height="100%" width="256" class="mx-auto card-nav">
    <v-navigation-drawer permanent >
      <!--<template v-slot:prepend>
        <v-list-item two-line>
          <v-list-item-avatar>
            <img :src="logo">
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>{{ empresa }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </template>-->

      <v-list dense>
        <div v-for="( item,index ) in itemsMenu" :key="'mn'+index">
          
          <v-list-item exact router :to="item.to" v-if="item.submenus.length == 0" color="primary">
            <v-list-item-action class="pa-0" >
              <v-icon class="primary--text text--darken-1">{{item.icon}}</v-icon>
            </v-list-item-action>

            <v-list-item-content class="primary--text text--darken-1">
              <v-list-item-title>{{item.title}}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
            
          <div v-else>
            <v-list-group v-model="item.active">

                <template v-slot:activator>
                  
                      <v-list-item-action class="pa-0">
                          <v-icon class="primary--text text--darken-1">{{item.icon}}</v-icon>
                      </v-list-item-action>
                      <v-list-item-content class="primary--text text--darken-1" v-bind="attrs" v-on="on">
                        <v-list-item-title v-text="item.title"></v-list-item-title>
                      </v-list-item-content>
                    </template>
                    

                <v-list-item
                  v-for="( option, index ) in item.submenus"
                  :key="'smn'+index"
                  router exact :to="option.to"
                >
                  
                      <v-list-item-action>
                        <v-icon x-small class="primary--text text--darken-1" >{{option.icon}}</v-icon>
                      </v-list-item-action>
                      <v-list-item-content class="primary--text text--darken-1" v-bind="attrs" v-on="on">
                        <v-list-item-title  v-text="option.title"></v-list-item-title>
                      </v-list-item-content>
                    
                </v-list-item>
            </v-list-group>
          </div>
      </div>
      </v-list>
    </v-navigation-drawer>
  </v-card>
</template>

<script>
  export default {
    data () {
      return {
        // logo: require('@/assets/logo_yo.png'),
        //logo: process.env.VUE_APP_URL_YO + this.$store.state.user.Emp_Imagen,
        //empresa: this.$store.state.user.Emp_Nombre,
        right: null,
        itemsMenu: [
            { title: 'Inicio', icon: 'mdi-home', to: '/', submenus:[]},
            { title: 'Buscar', icon: 'mdi-account-search-outline', to: '/partnerSearch', submenus:[]},
            /*{ title: 'Configuración',
              icon: 'mdi-cog-outline',
              submenus:[
                { title: 'Tipos de Cuestionarios', to:'/typeQuestionnaires'},
                { title: 'Categorías de Preguntas', to:'/questionCategories'},
                { title: 'Tipos de Instalaciones', to:'/installationsTypes'},
                { title: 'Feriados', to:'/holidays'},
                { title: 'Canales', to:'/channels'},
              ]
            },*/
            //{ title: 'Control de Migración de Datos', icon: 'mdi-file', to: '/imports', submenus:[] },
        ]
      }
    },
    beforeMount(){
      console.log('User ', this.$store.state.user);
    }
  }
</script>

<style>
  .card-nav .mdi-chevron-down::before {
    color: #4e39de;
  }
</style>
