<template>
  <div class="py-5 px-2">
    <v-row v-if="items.length == 0" class="justify-center mb-5">
      <v-icon color="orange" size="100">mdi-hanger</v-icon>
    </v-row>

    <v-row v-if="items.length == 0" class="justify-center px-md-15 px-3" no-gutters>
      <v-col :cols="($vuetify.breakpoint.mdAndUp) ? 10 : 8" class="pr-4">
        <v-text-field 
          ref="searchBrazalete"
          label="Numero de brazalete"
          outlined
          dense
          clearable
          v-model="brazalete"
          @keydown.enter="Searchitems(brazalete)"
          type="number"
          :rules='[(v) => !!v || "El campo es requerido"]'>
        </v-text-field>            
      </v-col>

      <v-col :cols="($vuetify.breakpoint.mdAndUp) ? 2 :4" class="px-0">
        <v-btn 
        color="orange"
        dark
        :loading="load"
        @click="Searchitems(brazalete)">
          <v-icon left>mdi-magnify</v-icon>Buscar  
        </v-btn>
      </v-col>
    </v-row>

      <!-- ---------------------------------------------------- MODO APP ---------------------------------------------------------- -->

    <div v-if="items.length == 0 && !$vuetify.breakpoint.mdAndUp">

      <v-card v-for="visita,n in visitas" :key="'visitas'+n" 
        class="pa-2 my-4 pt-2" 
        :style="'border: solid 1px ' + $vuetify.theme.defaults.light.orange" 
        outlined>
        <v-row class="text-center" no-gutters>

            <v-col cols="12" class="mb-2 d-flex justify-center">
                <p class="mb-0"><b>ALIAS:</b> {{visita.partner.alias}} </p>
            </v-col>

            <v-col cols="4" class="text-caption">
              <p class="mb-0 text-center"><b>Brazalete 1:</b> {{visita.id_bracelet_1}}</p>
            </v-col>

            <v-col cols="4" class="mb-2 pl-2 d-flex justify-center">
              <v-icon
              medium
              text
              @click="Searchitems(visita.id_bracelet_1)"
              color="orange">mdi-magnify
              </v-icon>
            </v-col>

            <v-col cols="4" class="text-caption">
              <p class="mb-0 text-center"><b>Brazalete 2:</b> {{visita.id_bracelet_2}}</p>
            </v-col>

            <v-col cols="12" class="text-caption">
              <p class="mb-0 text-center"><b>Tipo de Visita:</b> {{visita.visit_type.description}}</p>
            </v-col>
        </v-row>
    </v-card>
  </div>

<!-- ------------------------------------------------ MODO ESCRITORIO -------------------------------------------------------------- -->

    <v-card v-if="items.length == 0 && $vuetify.breakpoint.mdAndUp" outlined elevation="0">
      <v-data-table 
        height="26rem"
        :headers="headers"
        :items="visitas"
        calculate-widths
        fixed-header
        hide-default-footer
        :items-per-page="-1" 
        :loading="load"
        no-data-text="No hay consumos">

          <template v-slot:item.actions="{item}" >
            <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                    <v-icon size="20" class="mx-1" color="orange" 
                            @click="Searchitems(item.id_bracelet_1)"
                            v-bind="attrs" v-on="on">
                        mdi-magnify
                    </v-icon>
                </template>
                <span>Consultar consumos del socio</span>
            </v-tooltip>
          </template>
      </v-data-table>
    </v-card>

    <div v-if="items.length > 0">
        <DevolutionsLarge 
          v-if="$vuetify.breakpoint.mdAndUp" 
          :items="itemsClean"
          :roles="roles" 
          :brazalete="brazalete" 
          :tipoVisita="tipoVisita"
          :partner="partner"
          @clickVolver="items= []"
          @clickAnular="itemDelete = $event; dialogDelete = true"
          @searchBrazalete="brazalete = $event; Searchitems(brazalete)">
        </DevolutionsLarge>

        <DevolutionsSmall 
          v-else :items="itemsClean" 
          :roles="roles" 
          :brazalete="brazalete" 
          :tipoVisita="tipoVisita"
          :partner="partner"
          @clickVolver="items= []"
          @clickAnular="itemDelete = $event; dialogDelete = true">
      </DevolutionsSmall>
    </div>
      
    <v-dialog 
      v-model="dialogDelete" max-width="500px">
        <v-card v-if="itemDelete !== null">

          <v-toolbar color="orange" class="rounded-b-0" dark elevation="0">
            <v-icon class="mx-1">mdi-delete</v-icon>
            <span class="font-weight-bold">Anular Consumo</span>

            <v-spacer></v-spacer>

            <v-btn icon x-small @click="closeDelete" class="mr-1">
                <v-icon>mdi-close</v-icon>
            </v-btn>

          </v-toolbar>
            
          <v-form class="px-3 py-5 text-center" ref="motivoAnulacion">
            <v-textarea
                class="mt-3"
                label="Motivo de Anulación"
                rows="2"
                outlined
                dense
                :rules='[(v) => !!v || "El campo es requerido"]'
                v-model="motivo"
              />
              <span style="font-size: 15px">¿Está seguro que desea anular este item?</span>
          </v-form>

          <v-card-actions>
            <v-spacer></v-spacer>
              <v-btn 
                color="orange" 
                text 
                small 
                dark 
                @click="closeDelete" 
                :disabled="loadAnulacion">Cancelar
              </v-btn>

              <v-btn 
                small 
                dark 
                color="orange" 
                elevation="0" 
                @click="deleteItem" 
                :loading="loadAnulacion">SI, Anular
              </v-btn>
          </v-card-actions>
        </v-card>
    </v-dialog>
  </div>
</template>

<script>
import eventBus from '../../event-bus'
import DevolutionsLarge from './DevolutionsLarge.vue'
import DevolutionsSmall from './DevolutionsSmall.vue'


export default {
  components: {DevolutionsLarge, DevolutionsSmall},

  data: () => ({
    itemDelete: null,
    dialog: false,
    dialogDelete: false,
    load: false,
    loadB1: false,
    loadB2: false,
    loadAnulacion: false,
    brazalete: null,
    motivo: "",
    tipoVisita: 2,
    selectCantidad: 1,
    roles: [],
    items: [],
    partner: null,
    visitas: [],
    headers: [
      { text: 'ALIAS', value: 'partner.alias', align: 'center' },
      { text: 'Brazalete 1', value: 'id_bracelet_1', align: 'center' },
      { text: 'Brazalete 2', value: 'id_bracelet_2', align: 'center' },
      { text: 'Tipo de Visita', value: 'visit_type.description', align: 'center' },
      { text: '', value: 'actions' , align: 'center', width: '130'},
    ],
    
    
  }),

  computed: {
    cantidad () {
      console.log(this.itemDelete)
      let existentes= this.itemDelete.quantity
      let options = []
      for(var i = 1; i <= existentes; i++) {
        options.push(i)
      }
      return options

    },
    itemsClean(){
      return this.items.filter((item) => item.quantity > 0)
    }
  },

  watch: {
    dialog (val) {
      val || this.close()
    },
    dialogDelete (val) {
      val || this.closeDelete()
      if(!val){
          this.$refs.motivoAnulacion.reset()
      } else {this.selectCantidad = 1}
    },
    options: {
          handler () {
              if(this.options.sortBy.length > 0) {
                  this.getVisits()
              }
          },
          deep: true,
      },
  },

  beforeMount (){
      this.$store.state.userLoged.data.roles.map( (UserRole) => {
          this.roles.push(UserRole.id_role)
      })
      if(this.$route.query.id_bracelet){
        this.brazalete = this.$route.query.id_bracelet
        this.Searchitems(this.brazalete)
      }
      
      this.getVisits()
  },

  methods: {
    Searchitems (brazalete) {
      if(brazalete){
        let vm = this
        this.load = true
          this.$http.get(process.env.VUE_APP_DEGIRA+"consumptions/get/consume?id_bracelet="+brazalete)
          .then((response)=>{
            if(response.data.data.products.length > 0){
              vm.items = response.data.data.products.filter((item) => {
                if(item.id_product_service > 10000) return item
              })
              if(vm.items.length == 0 ){
                eventBus.$emit('toast', { show: true, text: "No hay consumos de guardaropa para este Nro de Brazalete", color: "red" })
              }else {
                vm.partner = response.data.data.partner
                vm.partner.id_visit = response.data.data.id_visit
                vm.partner.visit_type = response.data.data.visit_type
              }
              
              } else {
                vm.items = [] 
                vm.partner =  null
                eventBus.$emit('toast', { show: true, text: "No hay consumos para este Nro de Brazalete", color: "red" })
              }
                vm.load = false
          })
      } else eventBus.$emit('toast', { show: true, text: "Ingrese Nro de Brazalete", color: "red" })
    },

    editItem (item) {
      this.editedIndex = this.items.indexOf(item)
      this.editedItem = Object.assign({}, item)
      this.dialog = true
    },

    deleteItem () {
      console.log(this.itemDelete)
      let data = {
          "cart": [ {...this.itemDelete,
                      cantidad: this.itemDelete.quantity*-1, 
                      price : parseFloat(this.itemDelete.price) * -1
                    } ],
          "total_consumed": parseFloat(this.itemDelete.price)* this.selectCantidad *-1,
          "id_bracelet" : this.itemDelete.id_bracelet,
          "ticket_observations": this.motivo,
          'id_ticket_detail': this.itemDelete.id_ticket_detail
      }
      this.loadAnulacion = true
      let vm = this
      this.$http.post(process.env.VUE_APP_DEGIRA+"consumptions/create",data)
      .then((response) => { 
          if(response){
            vm.Searchitems(vm.itemDelete.id_bracelet)
            vm.dialogDelete = false
            let dialog = {  show: true, 
                            title: "Consumo eliminado correctamente", 
                            type: 'success',
                            isHtml: true,
                            goToHome: false,
                            closeDialog: true,
                            text: [ {label: 'Brazalete', 
                                      value: response.data.data.id_bracelet, 
                                      show: true
                                    },
                                    {label: 'Consumo Eliminado', 
                                      value: response.data.data.products[0].description + ' x'+ response.data.data.products[0].cantidad * -1 + ' u.', 
                                      show: true
                                    },
                                    {label: 'Motivo de Anulacion', 
                                      value: response.data.data.ticket_observation,  
                                      show: true
                                    },
                                ]
                          }
              eventBus.$emit('ConfirmDialog', dialog)
          }
          vm.loadAnulacion = false
      }).catch((error)=>{
          console.log(error.response)
          eventBus.$emit('toast', { show: true, text: (error.response.data.message) ? error.response.data.message :  "No se ha podido eliminar el consumo", color: "red" })
          vm.loadAnulacion=false
      })
      
    },

    close () {
      this.dialog = false
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem)
        this.editedIndex = -1
      })
    },

    closeDelete () {
      this.dialogDelete = false
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem)
        this.editedIndex = -1
      })
    },

    save () {
      if (this.editedIndex > -1) {
        Object.assign(this.items[this.editedIndex], this.editedItem)
      } else {
        this.items.push(this.editedItem)
      }
      this.close()
    },

    getVisits() {
      let vm = this
        this.load = true
        //process.env.VUE_APP_DEGIRA+"partners/inside?page="+this.options.page+"&cantPage="+this.options.cantPage+"&sortBy="+this.options.sortBy[0]+"&sortDesc="+this.options.sortDesc[0]
          this.$http.get(process.env.VUE_APP_DEGIRA+"partners/inside")
          .then((response)=>{
            if(response){
              vm.visitas = (response.data.data) ? response.data.data.visits : []
              } 
              vm.load = false
          })

    },
  },
}
</script>