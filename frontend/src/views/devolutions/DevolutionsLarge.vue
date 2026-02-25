<template>
  <div class="py-5 px-2">
    <v-row  no-gutters class="px-md-15 px-5">
      <v-col cols="4" class="d-flex justify-center align-center">
        <v-btn 
          color="orange"
          dark
          block
          :loading="load"
          @click="$emit('clickVolver')">
            <v-icon left>mdi-arrow-left</v-icon>Volver
        </v-btn>
      </v-col>

      
      <!-- <v-col cols="3" class="px-1 d-flex align-center pt-2">
        <v-text-field 
        ref="searchBrazalete"
        label="Numero de brazalete"
        outlined
        dense
        clearable
        v-model="nrobrazalete"
        @keydown.enter="$emit('searchBrazalete', nrobrazalete)"
        type="number"
        :rules='[(v) => !!v || "El campo es requerido"]'>
        </v-text-field>      
      </v-col>

      <v-col cols="2" class="pl-1 pt-2">
        <v-btn 
          color="orange"
          dark
          :loading="load"
          @click="$emit('searchBrazalete', nrobrazalete)">
            <v-icon left>mdi-magnify</v-icon>Buscar
          </v-btn>
      </v-col> -->

      <v-col cols="4" class="px-5">
        <v-card  
          class="text-center" 
          outlined 
          elevation="0" 
          :style="'border: solid 2px ' + $vuetify.theme.defaults.light.orange">
          <v-card-subtitle  class="pb-0 font-weight-bold" style="font-size: 1rem">Total Consumos</v-card-subtitle>
          <p class="font-weight-bold orange--text mb-1" style="font-size: 1.5rem">$ {{total}}</p>
        </v-card>
      </v-col>

      <v-col cols="4">

        <SendWhatsappButton v-if="roles.includes(1)"/>

        <v-btn 
          v-if="HaveNoPayed && roles.includes(1)"
          small
          block
          color="orange"
          dark
          :loading="loadB1"
          class="ma-1"
          @click="goExit">
            <v-icon left>mdi-account-cash</v-icon>Cerrar Cuenta y Cobrar
        </v-btn>
      </v-col>
    </v-row>
      
    <div v-if="items.length > 0" class="px-md-15 px-5">
      <v-card outlined class="pa-2 my-4 pt-2" color="transparent">
        <v-row no-gutters class="align-center pa-1">

          <v-col :cols="(partner.visit_type.id_visit_type ==2) ? 4 : 6" class="d-flex align-center justify-center">
            <v-icon class="ma-0 pa-0 text-start" size="50" color="orange" >mdi-account</v-icon>

              <div class="pa-0  text-body-2 text-start black--text">   
                <p class="mb-0"><b>Nombre Socio: </b>{{partner.partner_name}}</p>
                <p class="mb-0"><b>DNI: </b>{{partner.partner_dni}}</p>
                <p class="mb-0"><b>Brazalete: </b> {{partner.id_bracelet_1}}</p>
              </div>
          </v-col>

          <v-col :cols="(partner.visit_type.id_visit_type ==2) ? 4 : 6">

            <div class="pa-0  text-body-2 text-center black--text"> 
              <p class="mb-0"><b class="orange--text">Tipo de Membresia: </b>{{partner.visit_type.description}}</p>
              <p class="mb-0"><b class="orange--text">ALIAS: </b>{{partner.alias}}</p>
            </div>
          </v-col>
                            
          <v-col v-if="partner.visit_type.id_visit_type ==2" cols="4" class="d-flex align-center justify-center">             
            <v-icon class="ma-0 pa-0 text-start" size="50" color="orange" >mdi-account</v-icon> 

              <div class="pa-0  text-body-2 text-start black--text">                            
                <p class="mb-0"><b>Nombre Afiliado: </b>{{partner.affiliate_name}}</p>                        
                <p class="mb-0"><b>DNI: </b>{{partner.affiliate_dni}}</p>
                <p class="mb-0"><b>Brazalete: </b>{{partner.id_bracelet_2}}</p>                 
              </div>
          </v-col>
        </v-row>
      </v-card>
    </div>
     
    <div class="pl-4 pb-5">
      <span class="orange--text font-weight-bold ">Detalle de consumos realizados</span>
    </div>

    <v-card outlined elevation="0">
      <v-data-table
      :headers="headers"
      :items="items"
      calculate-widths
      hide-default-footer
      :items-per-page="-1" 
      :loading="load"
      no-data-text="No hay consumos">

        <template v-slot:item.actions="{ item }">
             
          <v-icon
            v-if="item.payed == 0 && item.quantity > 0 && (roles.includes(1) || roles.includes(4))"
            small
            color="orange"
            @click="$emit('clickAnular', item)">mdi-delete
          </v-icon>

        </template>

        <template v-slot:item.ticket_date="{item}">
          {{ parseHour(item.ticket_date) }}
        </template>

        <template v-slot:item.id="{index}">
          {{ index+1 }}
        </template>

        <template v-slot:item.estado="{item}">
            <span v-if="item.payed == 0" class="orange--text">No Pagado</span>
            <span v-if="item.payed == 1" class="teal--text">Pagado</span>
            <span v-if="item.payed == null">Anulado</span>
          </template>

        <template v-slot:item.monto="{item}">
        ${{ parseFloat(item.price)* parseInt(item.quantity) }}
        </template>

        <template v-slot:item.price="{item}">
        ${{ parseInt(item.price) }}
        </template>
            
      </v-data-table>
    </v-card>
  </div>
</template>

<script>
import SendWhatsappButton from '../app/SendWhatsappButton'
export default {
  components:{
    SendWhatsappButton
  },
  props: {
    roles: { type: Array}, 
    items: { type: Array},
    brazalete: {},
    tipoVisita: {},
    partner: {},
    
  },
  data: () => ({
    load: false,
    loadB1: false,
    loadB2: false,
    nrobrazalete: null,
    headers: [
      
      { text: '#', value: 'id', align: 'center'},
      { text: 'Descripcion', value: 'description', align: 'center' },
      { text: 'Hora de consumo', value: 'ticket_date', align: 'center' },
      { text: 'Brazalete Asociado', value: 'id_bracelet' , align: 'center'},
      { text: 'Precio Unitario', value: 'price', align: 'center'},
      { text: 'Cantidad', value: 'quantity', align: 'center' },
      { text: 'Monto', value: 'monto' , align: 'center'},
      { text: 'Estado', value: 'estado' , align: 'center'},
      { text: 'Observacion', value: 'observations' , align: 'center'},
      { text: "Acciones", value: "actions", align: "center"},

    ],
    
  }),
  beforeMount () {
    this.nrobrazalete = this.brazalete
  },

  computed: {
    total () {
      let total = 0
      this.items.map( (item) => {
          if(item.payed != null) total = total + (parseFloat(item.price) * parseInt(item.quantity))
      })
      return total
    },
    HaveNoPayed(){
      let have = false
      this.items.map((item) => {
          if(item.payed == 0) have = true
      })

      return have
    }
  },

  methods: {
    goExit() {
      let data = this.partner
      data.total = this.total

      this.$store.commit('setPartner', data)

      this.$router.push('/exitRegister')
    },
    
    parseHour(date){
          if(date != null){ 
              date.replace(/(T)/, ' ');
              date.substr(0, 19);
          }
          return (date != null) ? this.$moment(date, 'YYYY-MM-DD HH:mm:ss').format('HH:mm') : '';
      }, 

      parseDate(date){
          if(date != null){ 
              date.replace(/(T)/, ' ');
              date.substr(0, 19);
          }
          return (date != null) ? this.$moment(date, 'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY') : '';
      },  
  },

       
}
</script>