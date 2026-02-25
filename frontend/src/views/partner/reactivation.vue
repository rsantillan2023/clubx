<template>
<div class="py-8 px-10">
    <v-row no-gutters v-if="partner">
        <v-col cols="12">
            <v-row class="justify-center">Alias 
                <span class="ml-1 orange--text font-weight-bold text-uppercase">{{partner.alias}}</span>
            </v-row>

            <v-row class="justify-center pb-5">Tipo de Visita 
            <span class="ml-1 orange--text font-weight-bold text-uppercase">{{partner.visit_type.description}}</span>
            </v-row>

            <v-row>
                <v-col cols="12" :md="(partner.visit_type.id_visit_type == 2) ? 6 : 12">
                    <v-card class="pa-2" outlined elevation="0">
                        <span class="orange--text font-weight-bold text-caption mt-n4 py-0 px-2" style="position: absolute; background: #fff;">Socio</span>

                        <div class="pa-2 text-body-2">   
                            <p class="mb-0"><b>Nombre: </b> {{ partner.partner_name }}</p>
                            <p class="mb-0"><b>DNI: </b> {{ partner.partner_dni }}</p>
                            <p class="mb-0"><b>Fecha de Nacimiento: </b> {{ formatDate(partner.partner_birthdate, 'DD/MM/YYYY') }}</p>
                            <p class="mb-0"><b>Teléfono: </b> {{ partner.partner_phone }}</p>
                        </div>
                    </v-card>
                </v-col>

                <v-col cols="12" :md="(partner.visit_type.id_visit_type == 2) ? 6 : 12">
                    <v-card class="pa-2 mb-3" outlined elevation="0" v-if="partner.visit_type.id_visit_type == 2">
                        <span class="orange--text font-weight-bold text-caption mt-n4 py-0 px-2" style="position: absolute; background: #fff;">Afiliado</span>

                        <div class="pa-2 text-body-2">   
                            <p class="mb-0"><b>Nombre: </b> {{ partner.affiliate_name }}</p>
                            <p class="mb-0"><b>DNI: </b> {{ partner.affiliate_dni }}</p>
                            <p class="mb-0"><b>Fecha de Nacimiento: </b> {{ formatDate(partner.affiliate_birthdate, 'DD/MM/YYYY') }}</p>
                            <p class="mb-0"><b>Teléfono: </b> {{ partner.affiliate_phone }}</p>
                        </div>
                    </v-card>
                </v-col>
            </v-row>
            
            <v-row class="justify-center">
                <v-col cols="12" md="6" >
                    <v-select @input="getPrice"
                            v-model="selectPayMethod"
                            :items="methods"
                            label="Metodo de pago"
                            :rules='[(v) => !!v || "El metodo de pago es requerido"]'
                            dense
                            outlined
                            item-text="description"
                            item-value="id_payment_method"
                    ></v-select>  
                </v-col>
            </v-row>
      </v-col>
    </v-row>

    <v-row class="justify-center text-center align-center font-weight-bold text-body-2 px-1 mb-5">
       <p><v-icon color="orange" left>mdi-information-outline </v-icon>
        Socio no frecuente: pague 1/2 membresía recupere su caracter de socio normal</p>
    </v-row>

    <v-form ref="form">
        <v-row class="justify-center align-center pb-5 px-16">
            <v-col cols="12" md="4" class="text-center py-0 pb-2">

                <v-card outlined elevation="0" color="orange" dark>
                    <v-card-subtitle  class="font-weight-thin pb-0" style="font-size: 1rem">El Socio debe abonar</v-card-subtitle>
                    <p class="font-weight-thin-bold " style="font-size: 1rem" v-if="!loadingPrice">$ {{total}}</p>
                    <v-row class="justify-center mb-1" no-gutters v-else>
                            <v-progress-circular
                                indeterminate
                                size="20"
                                color="white"
                            ></v-progress-circular>
                    </v-row>
                </v-card>

                <v-card outlined elevation="0" class="mt-1" v-if="(payment && this.$store.state.userLoged.clienteId !=2)"
                :style="`border: solid 3px ${(difference == 0) ? $vuetify.theme.defaults.light.teal : $vuetify.theme.defaults.light.orange}`">

                    <v-card-subtitle 
                        class="font-weight-light pb-0" 
                        style="font-size: 1rem">Diferencia
                    </v-card-subtitle>
                        <p :class="`font-weight-bold ${(difference == 0) ? 'teal' : 'orange'}--text`" style="font-size: 1rem">$ {{difference}}</p>
                </v-card>
            </v-col>

            <v-col cols="12" md="2" class="text-center py-0 pb-2" v-if="(this.$store.state.userLoged.clienteId !=2)">
                <v-icon size="50" color="orange">{{ ($vuetify.breakpoint.mdAndUp) ? "mdi-arrow-right-thick" : "mdi-arrow-down-thick"}}</v-icon>
            </v-col>

            <v-col cols="12" md="4" class="text-center py-0 pb-2" v-if="(this.$store.state.userLoged.clienteId !=2)">
                <v-card outlined elevation="0" class="pb-0">
                    <v-card elevation="0" color="orange" dark class="rounded-b-0">
                        <v-card-subtitle class="font-weight-thin" style="font-size: 1rem">Ingrese monto real abonado</v-card-subtitle>
                    </v-card>  
                      
                   <div class="pa-2">
                        <v-text-field 
                            v-model="payment"
                            outlined
                            dense
                            type="number"
                            :rules='[(v) => !!v || "El monto es requerido"]'
                            >
                        </v-text-field>
                    </div>
                </v-card>
            </v-col>
        </v-row>

        <v-row>
            <v-col cols="12" class="mt-n4">
                <v-row class="justify-center align-center text-center py-0 pb-1 mt-2">
                    <v-col cols="12" class="pb-0">
                        <span class="font-weight-thin orange--text " style="font-size: 1.3rem">Observaciones</span>
                    </v-col>
            
                    <v-col cols="6" class="d-flex pl-15 pb-5 justify-center align-center">
                        <v-divider :thickness="2" color="orange"></v-divider>
                    </v-col>
                        
                    <v-col cols="6"  class="d-flex pr-15 pb-5 justify-center align-center ">
                        <v-divider :thickness="2" color="orange"></v-divider>
                    </v-col>
                </v-row>
            </v-col>

            <v-col cols="12" class="px-1">
                <v-textarea
                    label="Observaciones"
                    rows="3"
                    outlined
                    dense
                    :rules='(selectPayMethod == 5) ? [(v) => !!v || "Este campo es requerido"] : []'
                    v-model="observaciones"
                />
            </v-col>
        </v-row>
       
        <v-row no-gutters class="justify-center px-1">
            <v-btn color="orange" dark @click="updatePartner" :loading="loading">
                Reactivar Membresía
            </v-btn>
        </v-row>
    </v-form>
</div>
</template>


<script>
import eventBus from "../../event-bus";
export default{
    data(){
        return{
            partner: null,
            payment: null,
            visits: [],
            methods: [],
            loading: false,
            selectPayMethod: 1,
            price: 0,
            observaciones: "",
            loadingPrice: false

        }
    },
    beforeMount(){
        this.getTipos()
        this.partner = this.$store.state.partner
        this.getPaymentMethod()
    },
    computed:{
        total() {
                let total = this.price / 2
                if(this.methods.length > 0){
                    if(this.methods.find((item) => item.id_payment_method == this.selectPayMethod).id_payment_method == 5) total = 0
                }
                return total
            },

        difference(){
            let difference = this.price
            if(this.price && this.payment){
                difference = this.price - this.payment
            }
            return difference
        }
    },
    methods:{
        updatePartner() {
            if(this.$refs.form.validate()){
                let vm = this;
                this.loading = true;
                let data = {
                    id_state: 2,
                    id_partner: (vm.partner) ? vm.partner.id_partner : '',
                    reactivation_amount: this.total,
                    reactivation_obs: this.observaciones,
                    id_payment_method: this.selectPayMethod,
                    had_to_paid: this.price/2,
                }
                this.$http.put(`${process.env.VUE_APP_DEGIRA}partners/reactive/${data.id_partner}`, data)
                    .then((response) => {
                        if(response){
                            let dialog = {  show: true, 
                                            title: "La membresía se ha reactivado correctamente", 
                                            type: 'success',
                                            isHtml: true,
                                            text: [ {label: 'Alias', 
                                                     value: response.data.data.alias, 
                                                     show: true
                                                    },
                                                    {label: 'Tipo de visitante', 
                                                         value: vm.visits.find((vst) => vm.partner.id_visit_type_usualy==vst.id_visit_type).description,
                                                         show: true
                                                    },
                                                    {label: 'Metodo de Pago', 
                                                         value: vm.methods.find((method)=> vm.selectPayMethod == method.id_payment_method).method,
                                                         show: true
                                                    },
                                                    {label: 'Monto que debio abonar', 
                                                         value: '$'+vm.price/2,
                                                         show: true
                                                    },
                                                    {label: 'Monto abonado', 
                                                     value: '$'+vm.total, 
                                                     show: true
                                                    },
                                                    {label: 'Observaciones', 
                                                     value: vm.observaciones, 
                                                     show: (vm.observaciones)
                                                    },
                                                ]
                                        }
                            eventBus.$emit('ConfirmDialog', dialog)
                        }
                        vm.loading = false;
                    })
                    .catch((error) => {
                        console.log(error)
                        eventBus.$emit('toast', { show: true, text: "No se ha podido reactivar la membresia", color: "red" })
                        vm.loading = false;
                    })
            }
          },
          formatDate(date, format){
              return (date) ? this.$moment(date).format(format) : ''
          },
          getTipos(){
                let vm = this
                this.$http.get(process.env.VUE_APP_DEGIRA+"visits_types/get")
                .then((response)=>{
                    if(response){
                        vm.visits = response.data.data
                        vm.getPrice()
                    }
                })
          },
          getPrice(){
                    if(this.selectPayMethod){
                        let vm = this
                        this.loadingPrice = true
                        this.$http.get(process.env.VUE_APP_DEGIRA+"price/get?id_visit_type="+this.partner.id_visit_type_usualy+"&id_payment_method="+this.selectPayMethod+"&id_receivable_concept=1")
                        .then((response)=>{
                            if(response){
                                vm.price = response.data.data.totalWithPercentage
                                vm.loadingPrice = false
                            }
                        })
                    }
            },

            getPaymentMethod(){
                let vm = this
                this.$http.get(process.env.VUE_APP_DEGIRA+"payment_method/get")
                .then((response)=>{
                    if(response){
                        vm.methods = response.data.data.map((item) => {
                            item.description = item.method
                            if(parseFloat(item.percent) > 0 || item.id_payment_method == 1)
                                 {item.description += " ("+ parseFloat(item.percent)*100 +"% de recargo)"
                                }else
                                 {(item.description += " (Ingresar motivo en observaciones)")}
                            return item
                        })
                    }
                })
            },
    }
  }
</script> 