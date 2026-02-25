<template>
  <div class="py-5">
        <v-row class="justify-center py-2 headline">Alias 
          <span class="ml-1 orange--text  text-uppercase headline">{{partner.alias}}</span>
        </v-row>
       
        <v-row class="justify-center align-center text-center py-0 pb-3 mt-2">

            <v-col cols="12" class="pb-0">
                <span class="font-weight-thin orange--text " style="font-size: 1.3rem">Cobro</span>
            </v-col>
    
            <v-col cols="6" class="d-flex pl-15 pb-5 justify-center align-center">
                <v-divider :thickness="2" color="orange"></v-divider>
            </v-col>
                
            <v-col cols="6"  class="d-flex pr-15 pb-5 justify-center align-center ">
                <v-divider :thickness="2" color="orange"></v-divider>
            </v-col>
        </v-row>
       
        <v-form ref="form" class="px-5">
            <v-row no-gutters>
                <v-col cols="12" md="6" class="px-1">
                    <v-select @input="getPrice"
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
                
                <v-col cols="12" md="6" class="px-1" v-if="partner">
                    <v-select @input="getPrice"
                                v-model="selectPayMethod"
                                :items="methods"
                                label="Metodo de pago"
                                :rules='[(v) => !!v || "El metodo de pago es requerido"]'
                                dense
                                outlined
                                item-text="description"
                                item-value="id_payment_method"
                                :disabled="partner.id_state == 8"
                            ></v-select>  
                </v-col>

                <v-row no-gutters v-if="selectPayMethod != 5">
                    <v-col cols="12" :md="(items.other_paid) ? 6 : 12" class="px-1">
                        <v-text-field
                            label="Registre aca si se cobro algun monto adicional"
                            outlined
                            dense
                            v-model="items.other_paid"
                            type="number"
                        />
                    </v-col>
        
                    <v-col cols="12" :md="(items.other_paid) ? 6 : 12" class="px-1" v-if="items.other_paid">
                        <v-text-field
                            label="Concepto del pago adicional"
                            outlined
                            dense
                            v-model="items.other_paid_obs"
                            :rules="(items.other_paid) ? [(v) => !!v || 'El campo es requerido'] : []"
                        />
                    </v-col>
                </v-row>


<!-- ----------------------- CLIENTE 2 BRAZALETES = 1 / CLIENTE BRAZALETE UNICO = 2 ---------------------------------------- -->            

            <v-col cols="12" class="mt-2">
                <v-row class="justify-center align-center pb-5 px-16" v-if="(this.$store.state.userLoged.clienteId == 2)">
                    <v-col cols="12" md="4" class="text-center py-0 pb-2">
                        <v-card outlined elevation="0" color="orange" dark>
                            <v-card-subtitle  class="font-weight-thin pb-0" style="font-size: 1rem">El socio debe abonar</v-card-subtitle>
                            <p class="font-weight-thin-bold " style="font-size: 1rem">$ {{total}}</p>
                        </v-card>
                    </v-col>
                </v-row> 

                <v-row class="justify-center align-center pb-5 px-16" v-if="(this.$store.state.userLoged.clienteId != 2)">

                    <v-col cols="12" md="4" class="text-center py-0 pb-2">
                        <v-card outlined elevation="0" color="orange" dark>
                            <v-card-subtitle  class="font-weight-thin pb-0" style="font-size: 1rem">El socio debe abonar</v-card-subtitle>
                            <p class="font-weight-thin-bold " style="font-size: 1rem">$ {{total}}</p>
                        </v-card>

                        <v-card v-if="(items.entry_amount_paid)" 
                        :style="`border: solid 3px ${(difference == 0) ? $vuetify.theme.defaults.light.teal : $vuetify.theme.defaults.light.orange}`" 
                        outlined 
                        elevation="0" 
                        class="mt-1" 
                        >
                            <v-card-subtitle 
                                class="font-weight-light pb-0" 
                                style="font-size: 1rem">Diferencia
                            </v-card-subtitle>
                            <p :class="`font-weight-bold ${(difference == 0) ? 'teal' : 'orange'}--text`" style="font-size: 1rem">$ {{difference}}</p>
                        </v-card>
                    </v-col>

                    <v-col cols="12" md="2" class="text-center py-0 pb-2" >
                        <v-icon size="50" color="orange">{{ ($vuetify.breakpoint.mdAndUp) ? "mdi-arrow-right-thick" : "mdi-arrow-down-thick"}}</v-icon>
                    </v-col>

                    <v-col cols="12" md="4" class="text-center py-0 pb-2" v-if="(this.$store.state.userLoged.clienteId != 2)">
                        <v-card outlined elevation="0" class="pb-0">
                            <v-card elevation="0" color="orange" dark class="rounded-b-0">
                                <v-card-subtitle class="font-weight-thin" style="font-size: 1rem">Ingrese monto real abonado</v-card-subtitle>
                            </v-card>    
                            <div class="pa-2">
                                <v-text-field 
                                    v-model="items.entry_amount_paid"
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
               
            </v-col>

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
                    v-model="items.entry_visit_obs"
                    :rules='(selectPayMethod == 5) ? [(v) => !!v || "Este campo es requerido"] : []'
                />
            </v-col>


            <v-col v-if="errorMessage" cols="12">
                <v-alert color="red" :value="true" icon="mdi-alert-circle-outline">
                    {{ errorMessage }}
                </v-alert>
            </v-col>
        </v-row>

        <v-row no-gutters class="justify-center px-1">
            <v-btn 
                :loading="loading" 
                color="orange" 
                dark 
                class="font-weight-bold" 
                @click="entryRegisterLite">
                Registrar Entrada Rápida
            </v-btn>            
        </v-row>
    </v-form>            
  </div> 
</template>

<script>
import eventBus from '../../event-bus'
    export default{
        components: {
        },
        data(){
            return {
                visits: [],
                methods: [],
                modal: null,
                loading: false,
                selectVisit: null,
                selectPayMethod: 1,
                other_visit_obs: "",
                partner: null,
                errorMessage: false,
                price: 0,
                items: {
                    visit_date: "",
                    other_visit_obs: "",
                    entry_visit_obs: "",
                    entry_amount_paid: null,
                    other_paid: null,
                    other_paid_obs: "", 
                    id_bracelet_1: "",
                    id_bracelet_2: ""
                },
            }
        },
        mounted() {
            this.loadPartnerData();
            this.getTipos();
            this.getPaymentMethod();
            if(this.partner.id_state == 8) this.selectPayMethod = 5
        },
        watch: {
            selectPayMethod(){
                if(this.selectPayMethod == 5){
                    this.items.other_paid = null
                    this.items.other_paid_obs = ""
                }
            },
            'items.other_paid'(val){
                if(val == 0 || val == null) this.items.other_paid_obs = ""
            }
        },
        computed:{
            total() {
                let total = this.price
                if(this.items.other_paid) total +=  parseFloat(this.items.other_paid)
                if(this.methods.length > 0){
                    let pay_method_percent = this.methods.find((item) => item.id_payment_method == this.selectPayMethod).percent
                    if(parseFloat(pay_method_percent) > 0) total += this.items.other_paid*parseFloat(pay_method_percent)
                    if(this.methods.find((item) => item.id_payment_method == this.selectPayMethod).id_payment_method == 5) total = 0
                }
                return total
            },
            difference(){
                let difference = this.price
                if(this.price && this.items.entry_amount_paid){
                    difference = this.price - this.items.entry_amount_paid
                }
                return difference
            }
        },
        methods:{
            getPrice(){
                if(this.partner.id_state == 8){
                    this.price = 0
                }else {
                        let vm = this
                        this.$http.get(process.env.VUE_APP_DEGIRA+"price/get?id_visit_type="+this.selectVisit+"&id_payment_method="+this.selectPayMethod+"&id_receivable_concept=2")
                        .then((response)=>{
                            if(response){
                                vm.price = response.data.data.totalWithPercentage
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
            getTipos(){
                let vm = this
                this.$http.get(process.env.VUE_APP_DEGIRA+"visits_types/get")
                .then((response)=>{
                    if(response){
                        vm.visits = response.data.data
                        vm.selectVisit = vm.partner.id_visit_type_usualy
                        vm.getPrice()
                    }
                })
            },
            loadPartnerData(){
                this.partner = this.$store.state.partner;
                console.log(this.partner, "partner")
            },
            icon(){
              let icon = {icon: 'mdi-qrcode-scan', color: 'orange'}
              if(this.partner != null){
                  if(this.partner){
                      switch (this.partner.state.id_state) {
                          case 1: case 2: case 3: case 8:
                              icon = { color: 'green', icon: 'mdi-check-circle' }
                              break;
                          case 4:
                              icon = { color: 'info', icon: 'mdi-check-circle' }
                              break;
                          case 5: case 6: case 7:
                              icon = { color: 'red', icon: 'mdi-close-circle' }
                              break;
                      }
                  }else icon = { color: 'red', icon: 'mdi-close-circle' }
              }
              return icon
            },
            formateHour(date){
                if(date != null){ 
                    date.replace(/(T)/, ' ');
                    date.substr(0, 19);
                }
                return (date != null) ? this.$moment(date, 'YYYY-MM-DD HH:mm:ss').format('HH:mm') : '';
            }, 
            entryRegisterLite() {
                if(this.$refs.form.validate()){
                    this.loading= true
                    let vm = this
                    let pay_method_percent = this.methods.find((item) => item.id_payment_method == this.selectPayMethod).percent
                    let entry_amount_paid = this.price
                    let other_paid = (this.items.other_paid) ? parseFloat(this.items.other_paid) * (parseFloat(pay_method_percent) + 1): 0
                    if(this.methods.find((item) => item.id_payment_method == this.selectPayMethod).id_payment_method == 5){
                        entry_amount_paid = 0
                        other_paid = 0
                    }
                    let data = {
                        "id_partner": this.partner.id_partner,
                        "id_state": this.partner.id_state,
                        "id_visit_type": this.selectVisit,
                        "other_visit_obs" : this.items.other_visit_obs,
                        "entry_visit_obs" : this.items.entry_visit_obs,
                        "other_paid_obs": (other_paid) ? this.items.other_paid_obs : "",
                        "entry_amount_paid" : entry_amount_paid,
                        "id_bracelet_1": '',
                        "id_bracelet_2": '', 
                        "id_payment_method": this.selectPayMethod, 
                        "had_to_paid": (this.items.other_paid) ? this.price + parseFloat(this.items.other_paid) * (parseFloat(pay_method_percent) + 1): this.price,
                        "other_paid": other_paid,   
                    }
                    this.$http.post(process.env.VUE_APP_VISITS+'fast-entry', data)
                        .then((response)=>{
                            if(response){
                                let dialog = { show: true, 
                                                title: "La visita se ha registrado correctamente", 
                                                type: 'success',
                                                isHtml: true,
                                                goTo: [
                                                    {title: 'Alta Rápida', icon: "mdi-account-settings", route: '/registerPartnerLite'},
                                                    {title: 'Busqueda de socio', icon: "mdi-account-search", route: '/partnerSearch'}
                                                ],
                                                text: [ {label: 'Alias', 
                                                         value: vm.partner.alias, 
                                                         show: true
                                                        },
                                                        {label: 'Tipo de visita', 
                                                         value: vm.visits.find((vst) => vm.selectVisit==vst.id_visit_type).description, 
                                                         show: true
                                                        },
                                                        {label: 'Hora de entrada', 
                                                         value: this.formateHour(response.data.data.hour_entry), 
                                                         show: true
                                                        },
                                                        {label: 'Brazalete 1', 
                                                         value: response.data.data.id_bracelet_1, 
                                                         show: true
                                                        },
                                                        {label: 'Brazalete 2', 
                                                         value: response.data.data.id_bracelet_2, 
                                                         show: (response.data.data.id_bracelet_2)
                                                        },
                                                        {label: 'Metodo de Pago', 
                                                         value: vm.methods.find((mth) => response.data.data.id_payment_method == mth.id_payment_method).method, 
                                                         show: true
                                                        },
                                                        {label: 'Monto de entrada', 
                                                         value: '$'+response.data.data.entry_amount_paid, 
                                                         show: true
                                                        },
                                                        {label: 'Monto Adicional', 
                                                         value: '$'+response.data.data.other_paid+' por concepto de ' + response.data.data.other_paid_obs, 
                                                         show: (response.data.data.other_paid)
                                                        },
                                                        {label: 'Monto que debió abonar', 
                                                        value: '$'+ data.had_to_paid,
                                                        show: true
                                                        },
                                                        {label: 'Monto que abono', 
                                                        value: '$'+ vm.total,
                                                        show: true
                                                        },
                                                        {label: 'Observaciones', 
                                                         value: response.data.data.entry_visit_obs, 
                                                         show: (response.data.data.entry_visit_obs)
                                                        }
                                                    ]
                                            }
                                eventBus.$emit('ConfirmDialog', dialog)
                                vm.$refs.form.reset()
                            }
                            vm.loading=false
                    })
                    .catch((error)=>{
                        console.log(error.response)
                        console.log(error.response.data.message)
                        eventBus.$emit('toast', { show: true, text: error.response.data.message, color: "red" })
                        vm.loading=false
                    })

                }
            },
        }
    }
</script>

