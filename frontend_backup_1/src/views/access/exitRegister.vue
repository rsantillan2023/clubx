<template>
    <div class="py-8 px-10">
        <v-row  no-gutters v-if="partner">
            <v-col cols="12"> 

                <v-row class="justify-center"> 
                      Alias 
                      <span class="ml-1 orange--text font-weight-bold text-uppercase">{{partner.alias}}</span>
                </v-row>

                <v-row class="justify-center pb-5"> 
                    Tipo de Visita 
                    <span class="ml-1 orange--text font-weight-bold text-uppercase">{{partner.visit_type.description}}</span>
                </v-row>

                <v-row>
                    <v-col cols="12" :md="(selectVisit == 2) ? 6 : 12">
                        <v-card class="pa-2 text-start" outlined elevation="0">
                            <span class="orange--text font-weight-bold text-caption mt-n4 py-0 px-2" style="position: absolute; background: #fff;">Socio</span>

                            <div class="pa-2 text-body-2">  
                                <p class="mb-0"><b>Nombre: </b>{{partner.partner_name}}</p>
                                <p class="mb-0"><b>DNI: </b> {{partner.partner_dni}}</p>
                                <p class="mb-0"><b>Teléfono: </b>{{partner.partner_phone}}</p>
                                <p class="mb-0"><b>Fecha de Nacimiento: </b> {{formatDate(partner.partner_birthdate, 'DD/MM/YYYY')}}</p>
                                <p class="mb-0"><b>Brazalete: </b> {{partner.id_bracelet_1}}</p>
                            </div>
                        </v-card>
                    </v-col>

                    <v-col cols="12" :md="(selectVisit == 2) ? 6 : 12">
                        <v-card class="pa-2 text-start" outlined elevation="0" v-if="selectVisit == 2 && partner.id_visit_type_usualy == 2">
                            <span class="orange--text font-weight-bold text-caption mt-n4 py-0 px-2" style="position: absolute; background: #fff;">Afiliado</span>

                            <div class="pa-2 text-body-2">  
                                <p class="mb-0"><b>Nombre: </b>{{partner.affiliate_name}}</p>
                                <p class="mb-0"><b>DNI: </b> {{partner.affiliate_dni}}</p>
                                <p class="mb-0"><b>Teléfono: </b>{{partner.affiliate_phone}}</p>
                                <p class="mb-0"><b>Fecha de Nacimiento: </b> {{formatDate(partner.affiliate_birthdate, 'DD/MM/YYYY')}}</p>
                                <p class="mb-0"><b>Brazalete: </b> {{partner.id_bracelet_2}}</p>
                            </div>
                        </v-card>  
                    </v-col>   
                </v-row>
            </v-col>
        </v-row>
        
        <v-row no-gutters  class="px-5">
            <v-row class="justify-center align-center text-center py-0 pb-3">
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
              
            <v-col cols="12" class="px-1">
                <p class="pb-1 text-center">
                    <v-icon color="orange" left>mdi-information-outline </v-icon>
                El socio consumio <b class="orange--text">${{ partner.total }}</b><span v-if="partner.total < consumedMin">, pero el consumo minimo es <b class="orange--text">${{ consumedMin }} </b></span>
                </p>

                <v-row no-gutters v-if="selectPayMethod != 5">
                    <v-col cols="12" :md="(items.other_exit_paid) ? 4 : 6" class="px-1" v-if="(selectVisit && selectPayMethod)">
                        <v-text-field
                            label="Registre aca si se cobro algun monto adicional"
                            outlined
                            dense
                            v-model="items.other_exit_paid"
                            type="number"
                        />
                    </v-col>
        
                    <v-col cols="12" :md="(items.other_exit_paid) ? 4 : 12" class="px-1" v-if="items.other_exit_paid">
                        <v-text-field
                            label="Concepto del pago adicional"
                            outlined
                            dense
                            v-model="items.other_exit_paid_obs"
                            :rules="(items.other_exit_paid) ? [(v) => !!v || 'El campo es requerido'] : []"
                        />
                    </v-col>

                    <v-col cols="12" :md="(items.other_exit_paid) ? 4 : 6">
                        <v-select v-model="selectPayMethod"
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

                <v-row class="align-center pb-5 " v-if="selectPayMethod" >
                    <v-col cols="12" md="4" class="text-center py-0" >

                        <v-card outlined elevation="0" color="orange" dark class="pb-5 align-center">
                            <v-card-subtitle  class="font-weight-thin pb-0" style="font-size: 1.2rem">El Socio debe abonar</v-card-subtitle>
                            <p class="font-weight-thin-bold mb-0" style="font-size: 1.2rem">$ {{montoAbonar}}</p>
                        </v-card>

                    </v-col>

                    <v-col cols="12" md="8" class="text-center py-0">
                        <span class="font-weight-thin orange--text " style="font-size: 1.3rem">Observaciones</span>
                        <v-textarea
                        label="Observaciones"
                        rows="3"
                        outlined
                        dense
                        :rules='(selectPayMethod == 5) ? [(v) => !!v || "Este campo es requerido"] : []'
                        v-model="items.exit_visit_obs">
                    </v-textarea>
                    </v-col>

                </v-row>
            </v-col>

            <v-col v-if="errorMessage" cols="12">
                <v-alert color="red" :value="true" icon="mdi-alert-circle-outline">
                    DEMO
                </v-alert>
            </v-col>
        </v-row>

        <v-row no-gutters class="justify-center px-1">
            <v-btn 
            class="mx-4" 
            small 
            dark 
            large
            color="orange" 
            @click="$router.push(`/consumed?id_bracelet=${partner.id_bracelet_1}`)">
            Ver consumos
                <v-icon right>mdi-eye</v-icon>
        </v-btn>
        <v-btn 
            :loading="loading" 
            color="orange" 
            large
            dark 
            class="font-weight-bold" 
            @click="exitRegister">
            Registrar Salida
            <v-icon right>mdi-exit-run</v-icon>
        </v-btn>   
            
           
        </v-row>      
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
                pay_method_entry: [],
                modal: null,
                loading: false,
                selectVisit: null,
                selectPayMethod: 1,
                other_visit_obs: "",
                partner: null,
                consumedMin: 0,
                items: {
                    exit_visit_obs: "",
                    exit_amount_paid: null,
                    other_exit_paid: null,
                    other_exit_paid_obs: "",
                },
                errorMessage: false,
                
            }
        },
        mounted() {
            this.loadPartnerData();
            this.getTipos();
            this.getPaymentMethod();
           
        },
        beforeMount() {
            console.log('partner exit', this.$store.state.partner)
            this.partner = this.$store.state.partner
            this.getConsumedMin()
        },
        watch: {
            selectPayMethod(){
                if(this.selectPayMethod == 5){
                    this.items.other_exit_paid = null
                    this.items.other_exit_paid_obs = ""
                }
            },
            'items.other_exit_paid'(val){
                if(val == 0 || val == null) this.items.other_exit_paid_obs = ""
            }
        },
        computed:{
            montoAbonar() {
                let total = (parseFloat(this.partner.total) < parseFloat(this.consumedMin)) ? this.consumedMin : this.partner.total
                if(this.items.other_exit_paid) total +=  parseFloat(this.items.other_exit_paid)
                if(this.methods.length > 0){
                    let pay_method_percent = this.methods.find((item) => item.id_payment_method == this.selectPayMethod).percent
                    if(parseFloat(pay_method_percent) > 0) total += total*parseFloat(pay_method_percent)
                    if(this.methods.find((item) => item.id_payment_method == this.selectPayMethod).id_payment_method == 5) total = 0
                }
                return total
            },
            
            difference(){
                let difference = this.montoAbonar
                if(this.montoAbonar && this.items.exit_amount_paid){
                    difference = this.montoAbonar - this.items.exit_amount_paid
                }
                return difference
            }
        },
        methods:{
            getConsumedMin(){
                let vm = this
                this.$http.get(process.env.VUE_APP_DEGIRA+"consumptions/get/minimum")
                .then((response)=>{
                    if(response){
                        vm.consumedMin = parseFloat(response.data.data.price)
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
            
            getTipos(){
                let vm = this
                this.$http.get(process.env.VUE_APP_DEGIRA+"visits_types/get")
                .then((response)=>{
                    if(response){
                        vm.visits = response.data.data.filter((item) => {
                            if(vm.partner.id_visit_type_usualy == 1 || vm.partner.id_visit_type_usualy == 4){
                                if(item.id_visit_type == vm.partner.id_visit_type_usualy) return item
                            }

                            if(vm.partner.id_visit_type_usualy == 2){
                                if([1,2,4].includes(item.id_visit_type)) return item
                            }

                            if(vm.partner.id_visit_type_usualy == 3) return item

                        })
                        vm.selectVisit = vm.partner.id_visit_type_usualy
                    }
                })
            },
            loadPartnerData(){
                this.partner = this.$store.state.partner;
                console.log(this.partner, "partner")
            },
            formatDate(date, format){
                if(date != null){ 
                    date.replace(/(T)/, ' ');
                    date.substr(0, 19);
                }
                return (date) ? this.$moment(date).format(format) : ''
            },
            formateHour(date){
                    if(date != null){ 
                        date.replace(/(T)/, ' ');
                        date.substr(0, 19);
                    }
                    return (date != null) ? this.$moment(date, 'YYYY-MM-DD HH:mm:ss').format('HH:mm') : '';
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
            exitRegister() {
                if((this.$store.state.userLoged.clienteId != 2 && this.montoAbonar == this.items.exit_amount_paid) || this.$store.state.userLoged.clienteId == 2){
                    this.loading= true

                    let vm = this

                    let pay_method_percent = this.methods.find((item) => item.id_payment_method == this.selectPayMethod).percent

                    let exit_amount_paid = (parseFloat(this.partner.total) < parseFloat(this.consumedMin)) ? parseFloat(this.consumedMin) * (parseFloat(pay_method_percent) + 1) : parseFloat(this.partner.total) * (parseFloat(pay_method_percent) +1)

                    let other_paid = (this.items.other_exit_paid) ? parseFloat(this.items.other_exit_paid) * (parseFloat(pay_method_percent) +1) : 0

                    if(this.methods.find((item) => item.id_payment_method == this.selectPayMethod).id_payment_method == 5){
                        exit_amount_paid = 0
                        other_paid = 0
                    }
                    
                    let debio_pagar_consumo = (parseFloat(this.partner.total) < parseFloat(this.consumedMin)) ? 
                        parseFloat(this.consumedMin) * (parseFloat(pay_method_percent)  + 1)  : 
                        parseFloat(this.partner.total) * (parseFloat(pay_method_percent)  + 1) 

                    let debio_pagar_other_exit_paid = (this.items.other_exit_paid) ? parseFloat(this.items.other_exit_paid) *
                        (parseFloat(pay_method_percent) + 1) : 0

                    let data = {
                        "id_state": "2",
                        "exit_visit_obs": this.items.exit_visit_obs,
                        "exit_amount_payed": exit_amount_paid,
                        "other_paid": other_paid,
                        "had_to_paid": debio_pagar_consumo + debio_pagar_other_exit_paid,
                        "other_paid_obs": this.items.other_exit_paid_obs,
                        "id_payment_method": this.selectPayMethod,
                    }
                    this.$http.put(process.env.VUE_APP_DEGIRA+'visits/exit/'+this.partner.id_visit, data)
                        .then((response)=>{
                            if(response){
                                let dialog = { show: true, 
                                                title: "Se ha realizado el egreso correctamente", 
                                                type: 'success',
                                                goTo: {title: 'Volver', icon: "mdi-arrow-left", route: '/activeVisits'},
                                                goToHome: false,
                                                isHtml: true,
                                                text: [ {label: 'Alias', 
                                                         value: vm.partner.alias, 
                                                         show: true
                                                        },
                                                        {label: 'Fecha de salida', 
                                                         value: vm.formatDate(response.data.data.hour_exit, "DD/MM/YYYY"), 
                                                         show: true
                                                        },
                                                        {label: 'Hora de salida', 
                                                         value: vm.formateHour(response.data.data.hour_exit), 
                                                         show: true
                                                        },
                                                        {label: 'Brazalete Socio', 
                                                         value: response.data.data.id_bracelet_1, 
                                                         show: true
                                                        },
                                                        {label: 'Brazalete Afiliado', 
                                                         value: response.data.data.id_bracelet_2, 
                                                         show: (response.data.data.id_bracelet_2 )
                                                        },
                                                        {label: 'Metodo de Pago', 
                                                         value: vm.methods.find((mth) => vm.selectPayMethod == mth.id_payment_method).method, 
                                                         show: true
                                                        },
                                                        {label: 'Monto de Consumos', 
                                                         value: '$'+response.data.data.exit_amount_payed, 
                                                         show: true
                                                        },
                                                        {label: 'Monto Adicional', 
                                                         value: '$'+data.other_paid+' por concepto de ' + response.data.data.other_paid_obs, 
                                                         show: (response.data.data.other_paid)
                                                        },
                                                        {label: 'Monto que debió abonar', 
                                                        value: '$'+ data.had_to_paid,
                                                        show: true
                                                        },
                                                        {label: 'Monto que abono', 
                                                        value: '$'+ vm.montoAbonar,
                                                        show: true
                                                        },
                                                        {label: 'Observaciones', 
                                                         value: response.data.data.exit_visit_obs,
                                                         show: (response.data.data.exit_visit_obs)
                                                        }
                                                    ]
                                            }
                                eventBus.$emit('ConfirmDialog', dialog)
                                vm.$refs.form.reset()
                            }
                            vm.loading=false
                    })
                    .catch((error)=>{
                        console.log(error)
                        eventBus.$emit('toast', { show: true, text: error.response.data.message, color: "red" })
                        vm.loading=false
                    })
                }else eventBus.$emit('toast', { show: true, text: "El monto pagado debe ser el sugerido", color: "red" })
            }
        },
    }
    
</script>
