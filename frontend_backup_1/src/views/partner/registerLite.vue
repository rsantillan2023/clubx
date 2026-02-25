<template>
    <div class="py-8">
        <v-form ref="form" class="px-md-15 px-5" >
        <v-row no-gutters>

            <v-col cols="12" md="6" class="px-1">
                <v-select 
                    @input="getPrice"
                    v-model="selectVisit"
                    :items="visits"
                    label="Tipo de Visitante"
                    :rules='[(v) => !!v || "El campo es requerido"]'
                    dense
                    outlined
                    item-text="description"
                    item-value="id_visit_type"
                ></v-select>  
            </v-col>

            <v-col cols="12" md="6" class="px-1">
                <v-select 
                    @input="getPrice"
                    v-model="selectPayMethod"
                    :items="methods"
                    label="Metodo de Pago"
                    :rules='[(v) => !!v || "El metodo de pago es requerido"]'
                    dense
                    outlined
                    item-text="description"
                    item-value="id_payment_method"
                ></v-select>  
            </v-col>

            <v-row class="justify-center align-center pb-2 px-16" v-if="selectVisit && selectPayMethod" >
                <v-col cols="12" md="4" class="text-center py-0 pb-2" >

                    <v-card outlined elevation="0" color="orange" dark>
                        <v-card-subtitle  class="font-weight-thin pb-0" style="font-size: 1rem">El Socio debe abonar</v-card-subtitle>
                        <p class="font-weight-thin-bold " style="font-size: 1rem">$ {{total}}</p>
                    </v-card>

                    <v-card v-if="(payment && this.$store.state.userLoged.clienteId != 2)"
                        :style="`border: solid 3px ${(difference == 0) ? $vuetify.theme.defaults.light.teal : $vuetify.theme.defaults.light.orange}`" 
                        outlined 
                        elevation="0" 
                        class="mt-1">

                        <v-card-subtitle class="font-weight-light pb-0" style="font-size: 1rem">Diferencia</v-card-subtitle>
                        <p :class="`font-weight-bold ${(difference == 0) ? 'teal' : 'orange'}--text`" style="font-size: 1rem">$ {{difference}}</p>
                    </v-card>
                </v-col>

                <v-col cols="12" md="2" class="text-center py-0 pb-2" v-if="(this.$store.state.userLoged.clienteId != 2)" >
                    <v-icon size="50" color="orange">{{ ($vuetify.breakpoint.mdAndUp) ? "mdi-arrow-right-thick" : "mdi-arrow-down-thick"}}</v-icon>
                </v-col>

                <v-col cols="12" md="4" class="text-center py-0 pb-2" v-if="(this.$store.state.userLoged.clienteId != 2)">
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
                                :rules='[(v) => !!v || "El monto es requerido"]'>
                            </v-text-field>
                        </div>
                    </v-card>
                </v-col>
            </v-row>
        </v-row>
           
        <v-row class="justify-center align-center pb-2">
            <v-col cols="12" class="text-center py-0 pb-2">
                <span class="font-weight-thin orange--text" style="font-size: 1.2rem">ALIAS</span>
            </v-col>
        </v-row>
            
        <v-row no-gutters class="justify-center align-center">
            <v-col cols="12" md="6" class="px-1 d-flex justify-center align-center " >
                <v-text-field 
                    label="Ingrese ALIAS"
                    outlined
                    v-model="nickname"
                    :rules='[(v) => !!v || "El campo es requerido"]'
                />
            </v-col>
        </v-row>
        
        <v-row class="justify-center align-center pb-8 text-center py-0 mt-2">
            <v-col cols="12">
                <span class="font-weight-thin orange--text " style="font-size: 1.3rem;">Otra Información</span>
            </v-col>
    
            <v-col cols="6" class="d-flex pl-15 justify-center align-center">
                <v-divider :thickness="2" color="orange"></v-divider>
            </v-col>
                
            <v-col cols="6" class="d-flex pr-15 justify-center align-center ">
                <v-divider :thickness="2" color="orange"></v-divider>
            </v-col>
        </v-row>
    
        <v-row no-gutters>
            <v-col cols="12" class="px-1">
                <v-textarea
                label="Observaciones"
                rows="3"
                outlined
                dense
                :rules='(selectPayMethod == 5) ? [(v) => !!v || "Este campo es requerido"] : []'
                v-model="observations"
                />
            </v-col>
        </v-row>
                        
        <v-row class="justify-center align-center">
            <v-col cols="12" md="4">
                <v-btn  
                    block 
                    :loading="loading" 
                    color="orange" 
                    dark
                    class="font-weight-bold" 
                    @click="createPartner">GUARDAR ALTA RÁPIDA
                </v-btn>
            </v-col>
        </v-row>
        
    </v-form>            
    </div> 
    </template>
    
    <script>
   /*  import DateInput from '../app/DateInput' */
    import eventBus from '../../event-bus'
        export default{
            components: {
               /*  DateInput */
            },
            data(){
                return {
                    selectVisit: null,
                    selectPayMethod: 1,
                    visits: [],
                    methods:[],
                    states:[],
                    selectState: 2,
                    nickname: "",
                    observations: "",
                    date: null,
                    modal: null,
                    loading: false,
                    loadPM: false,
                    dataDNI: null,
                    payment: null,
                    memb_amount_paid: null,
                    price: 0,
                    formValid: false,
                }
            },
            beforeMount(){
                
                this.getTipos() 
                this.getPaymentMethod()
            },
            computed:{
                total() {
                let total = this.price
                if(this.methods.find((item) => item.id_payment_method == this.selectPayMethod).id_payment_method == 5) total = 0
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
            getPrice(){
                if(this.selectVisit && this.selectPayMethod){
                    let vm = this
                    this.$http.get(process.env.VUE_APP_DEGIRA+"price/get?id_visit_type="+this.selectVisit+"&id_payment_method="+this.selectPayMethod+"&id_receivable_concept=1")
                    .then((response)=>{
                        if(response){
                            vm.price = response.data.data.totalWithPercentage
                        }
                    })
                }
            },
            generateNumberDNI(){
                   return this.$moment().format('YYYYMMDDHHmmSS');
            },
            generateNumberPhone(){
                   return this.$moment().format('SSmmHHDDMMYY');
            },
            createPartner() {
                if(this.$refs.form.validate()){
                    let data = {
                        "alias": this.nickname,
                        "partner_dni": this.generateNumberDNI(),
                        "partner_name": this.nickname,
                        "partner_birthdate": "01/01/2000",
                        "partner_phone": this.generateNumberPhone(),
                        "affiliate_dni": (this.selectVisit == 2) ? this.generateNumberDNI()+'1' : undefined,
                        "affiliate_name": (this.selectVisit == 2) ? this.nickname : undefined,
                        "affiliate_birthdate": (this.selectVisit == 2) ? "01/01/2000" : undefined,
                        "affiliate_phone": (this.selectVisit == 2) ? "" : "", 
                        "id_visit_type_usualy": this.selectVisit,
                        "id_state": this.selectState, 
                        "observations": this.observations,
                        "suggest_membership_amount": this.total,
                        "id_payment_method": this.selectPayMethod,
                        "had_to_paid": this.price,
                    }
                    this.loading= true
                    let vm = this
                    this.$http.post(process.env.VUE_APP_REGISTER, data)
                    .then((response)=>{
                        console.log(response.data.data.suggest_membership_amount)
                        if(response){
                            vm.$store.commit('setPartner', response.data.data.partner)       
                            let dialog = {  show: true, 
                                            title: "El socio se ha registrado correctamente", 
                                            type: 'success',
                                            isHtml: true,
                                            goTo: {title: 'Entrada Rápida', icon: "mdi-cash-fast", route: '/entryRegisterLite'},
                                            text: [ {label: 'Alias', 
                                                     value: response.data.data.partner.alias, 
                                                     show: true
                                                    },
                                                    {label: 'Tipo de visita', 
                                                     value: vm.visits.find((vst) => vm.selectVisit == vst.id_visit_type).description, 
                                                     show: true
                                                    },
                                                    {label: 'Metodo de Pago', 
                                                    value: vm.methods.find((mth) => vm.selectPayMethod == mth.id_payment_method).method, 
                                                    show: true
                                                    },
                                                    {label: 'Monto que debió abonar', 
                                                    value: '$'+vm.price,
                                                    show: true
                                                    },
                                                    {label: 'Monto que abono', 
                                                     value: '$'+response.data.data.suggest_membership_amount, 
                                                     show: true
                                                    },
                                                    {label: 'Observaciones', 
                                                     value: response.data.data.partner.observations, 
                                                     show: (response.data.data.partner.observations)
                                                    },
                                                ]
                                        }
                            eventBus.$emit('ConfirmDialog', dialog)
                            vm.$refs.form.reset()
                        }
                        vm.loading=false
                    })
                    .catch((error)=>{
                        console.log(error.response.data)
                        eventBus.$emit('toast', { show: true, text: (error.response.data.message) ? error.response.data.message :  "No se ha podido registrar al miembro", color: "red" })
                        vm.loading=false
                    })
                }
    
            }
        }
    }
    </script>
    