<template>
    <div class="px-md-15 px-3">
        <v-row no-gutters class="justify-center">
            <v-btn 
                color="orange"
                dark
                :loading="load"
                @click="$emit('clickVolver')">
                    <v-icon left>mdi-magnify</v-icon>Hacer otra busqueda
            </v-btn>
        </v-row>

        <div v-if="items.length > 0">
            <v-card outlined 
                class="pa-1 my-4" 
                color="transparent"
                :style="'border: solid 2px' + $vuetify.theme.defaults.light.orange + '!important'" >

                <v-row class="d-flex justify-center align-center py-1">
                    <v-icon color="orange" size=40 >{{ (partner.visit_type.id_visit_type
                        ==2) ? "mdi-account-multiple-check" : "mdi-account-check"}}</v-icon>
                </v-row>

                <v-row class="justify-center ma-0 py-2"> 
                    Alias 
                    <span class="ml-1 orange--text font-weight-bold text-uppercase">{{partner.alias}}</span>
                </v-row>

                <v-col class="py-0">
                    <v-row>
                        <v-col cols="12" class="pb-0">
                            <div class="px-1 text-body-2 text-star black--text"> 
                                <p class="mb-0"><b class="orange--text">{{(selectVisit == 2 && this.$store.state.userLoged.clienteId !=2) ? 'Brazaletes:' : 'Brazalete:'}} 
                                    </b>{{partner.id_bracelet_1}}
                                        <span v-if="partner.id_bracelet_2">- 
                                            {{partner.id_bracelet_2}}
                                        </span>
                                </p>
                                <p class="mb-0"><b class="orange--text">Tipo de Membresia: </b>{{partner.visit_type.description}}</p>  
                            </div>
                        </v-col>
                    </v-row>

                    <div class="d-flex justify-end">
                        <v-btn 
                            class="font-weight-bold"
                            small
                            text
                            @click="showVerMas= true"
                            color="orange">Ver Mas
                        </v-btn>
                    </div>
                </v-col>
            </v-card>
        </div>

        <v-col cols="12" v-if="items.length > 0">
            <p class="d-flex justify-center font-weight-bold mb-0" style="font-size: 1rem">Total Consumos </p>
            <p class="font-weight-bold orange--text mb-1 d-flex justify-center" style="font-size: 1.5rem">$ {{total}}</p>
        </v-col>

        <v-row v-if="items.length > 0" class="justify-end align-center pa-0 ma-0">
       
            <v-col cols="12" v-if="HaveNoPayed && roles.includes(1)" >
                <v-btn 
                    block
                    small
                    color="orange"
                    dark
                    :loading="loadB1"
                    @click="goExit">
                    <v-icon left>mdi-account-cash</v-icon>Cerrar Cuenta y Cobrar
                </v-btn>
            </v-col>

            <v-col cols="12" v-if="roles.includes(1)">
                <SendWhatsappButton 
                    :phoneNumber="partner.partner_phone" 
                    :text="textWhatsapp">
                </SendWhatsappButton>
            </v-col>
        </v-row>

        <v-row v-if="items.length > 0">
            <v-col cols="12" class="d-flex justify-center orange--text px-5 pb-5 pt-0" style="font-size: 1.2rem">
                <span >Consumos Realizados</span>
            </v-col>
        </v-row>

        <v-card v-if="items.length > 0" outlined elevation="0" class="pa-1">
            <v-card elevation='0' class="ma-0 pa-2 text-caption" v-for="item,n in items" :key="'item'+n">
                <v-row no-gutters class="px-2">

                    <v-col cols="6" class="font-weight-bold orange--text">
                        #<span>{{n+1}}</span>
                    </v-col>

                    <v-col cols="6" class="d-flex justify-end">
                        <v-icon 
                            v-if="item.payed == 0 && item.quantity > 0 && (roles.includes(1))" 
                            @click="$emit('clickAnular', item)"
                            color="orange">
                            mdi-delete
                        </v-icon>
                    </v-col>
                </v-row>

                <v-row no-gutters class="px-2">
                    <v-col cols="6">
                        <span>{{parseHour(item.ticket_date)}}hs.</span>
                    </v-col>
                    <v-col cols="6">
                        <span class="mr-1">Brazalete:</span>
                        <span>{{item.id_bracelet}}</span>
                    </v-col>
                </v-row>

                <v-row no-gutters class="px-2">
                    <v-col cols="12">
                        <span class="font-weight-bold">{{item.description}}</span>
                    </v-col>
                </v-row>

                <v-row no-gutters class="px-2">
                    <v-col cols="6">
                        <span>${{parseInt(item.price)}} x {{item.quantity}}u</span>
                    </v-col>
                    <v-col cols="6">
                        <span class="font-weight-bold">Monto: </span>
                        <span class="font-weight-bold orange--text" >${{parseFloat(item.price)*parseInt(item.quantity)}}</span>
                    </v-col>
                    <v-col cols="12">
                        <span class="font-weight-bold">Observacion: {{item.observations}}</span>
                    </v-col>
                </v-row>

                <v-row no-gutters class="px-2">
                    <v-col cols="12" class="d-flex justify-center">
                        <v-card  
                        class="pt-2 font-weight-bold"
                        elevation="0" 
                        color="transparent" 
                        dark 
                        outlined>
                            <span v-if="item.payed == 0" class="orange--text">No Pagado</span>
                            <span v-if="item.payed == 1" class="teal--text">Pagado</span>
                            <span v-if="item.payed == null" class="black--text">Anulado</span>
                        </v-card>
                    </v-col>
                </v-row>

                <v-col cols="12" class="d-flex pb-5 justify-center align-center">
                    <v-divider :thickness="2" :style="'border: solid 1px ' + $vuetify.theme.defaults.light.orange"></v-divider>
                </v-col>
            </v-card>
        </v-card>

            <v-dialog v-model="showVerMas">
                <v-card class="px-3 pb-2">
                    <v-card-title>
                        <v-spacer></v-spacer>
                        <v-btn x-small icon @click="showVerMas=false">
                            <v-icon >mdi-close</v-icon>
                        </v-btn>
                    </v-card-title>

                    <v-row class="justify-center pb-5">
                        <v-icon color="orange" size=60 >
                            {{ (partner.visit_type.id_visit_type ==2 ) ? "mdi-account-multiple-check" : "mdi-account-check"}}
                        </v-icon>
                    </v-row>

                    <v-card class="pa-2 mb-3" outlined elevation="0">
                        <span class="orange--text font-weight-bold text-caption mt-n4 py-0 px-2" style="position: absolute; background: #fff;">Socio
                        </span>
    
                        <div class="pa-2 text-body-2">   
                            <p class="mb-0"><b>Nombre: </b>{{partner.partner_name}}</p>
                            <p class="mb-0"><b>DNI: </b>{{partner.partner_dni}}</p>
                           <!--  <p class="mb-0"><b>Fecha de Nacimiento: </b>{{partner.partner_birthdate}}</p> -->
                            <p class="mb-0"><b>Teléfono: </b>{{partner.partner_phone}}</p>
                        </div>
                      </v-card>

                    <v-card v-if="partner.visit_type.id_visit_type ==2" class="pa-2 mb-3" outlined elevation="0">
                    <span class="orange--text font-weight-bold text-caption mt-n4 py-0 px-2" style="position: absolute; background: #fff;">Afiliado
                    </span>

                        <div class="pa-2 text-body-2">   
                            <p class="mb-0"><b>Nombre: </b>{{partner.affiliate_name}}</p>
                            <p class="mb-0"><b>DNI: </b>{{partner.affiliate_dni}}</p>
                            <!--  <p class="mb-0"><b>Fecha de Nacimiento: </b>{{partner.affiliate_birthdate}}</p> -->
                            <p class="mb-0"><b>Teléfono: </b>{{partner.affiliate_phone}}</p>
                        </div>
                    </v-card>
                </v-card>
            </v-dialog>
         </div>
</template>

<script>
import SendWhatsappButton from '../app/SendWhatsappButton'
export default {
    components:{
        SendWhatsappButton
    },
    data: () => ({
        loadB1: false,
        loadB2: false,
        showVerMas: false,
        load: false
    }),

    props: {
      roles: { type: Array}, 
      items: { type: Array},
      brazalete: {},
      tipoVisita: {},
      partner: {},
      
    },

    methods: {
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
        goExit() {
        let data = this.partner
        data.total = this.total

        this.$store.commit('setPartner', data)

        this.$router.push('/exitRegister')
        },
      
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
      },
      textWhatsapp(){
        if(this.items.length > 0 && this.partner){
          let text = '_Hola '+this.partner.partner_name+'_' + '! Realizaste los siguientes consumos '
          let brazaletes = []
          this.items.map((item) => {
            if (!brazaletes.includes(item.id_bracelet)) {
              brazaletes.push(item.id_bracelet)
            }
          })

          text += '*Brazalete Nº ' + brazaletes[0] +':* '
          this.items.filter((item) => {
            if (item.id_bracelet == brazaletes[0])
            text = text + item.description + ' x' + item.quantity + ' '
          })
            if (brazaletes.length > 1) {
              text += '*Brazalete Nº ' + brazaletes[1] +':* '
              this.items.filter((item) => {
              if (item.id_bracelet == brazaletes[1])
              text = text + item.description + ' x' + item.quantity + ' '
          })
            }
          text = text + '| TU CONSUMO TOTAL ES: ' + '*$' + this.total+'*'+' |'
          return text
        } else return ''
      },
    },
}
</script>

