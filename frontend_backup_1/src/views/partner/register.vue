<template>
    <div class="py-8">
        <v-form ref="form" class="px-md-15 px-5" >
        <v-row no-gutters>
            <v-col cols="12" md="4" class="px-1">
                <v-select 
                    v-model="selectState"
                    :items="states"
                    label="Estado"
                    item-text="description"
                    item-value="id_state"
                    :rules='[(v) => !!v || "El campo es requerido"]'
                    dense
                    outlined
                    disabled
                ></v-select> 
            </v-col>

            <v-col cols="12" md="4" class="px-1">
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

            <v-col cols="12" md="4" class="px-1">
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
           
        <v-row class="justify-center align-center text-center py-0 pb-8 mt-2">
            <v-col cols="12">
                <span class="font-weight-thin orange--text" style="font-size: 1.3rem">Datos Miembro 1</span>
            </v-col>
    
            <v-col cols="6" class="d-flex pl-15 pb-5 justify-center align-center">
                <v-divider :thickness="2" color="orange"></v-divider>
            </v-col>
                
            <v-col cols="6"  class="d-flex pr-15 pb-5 justify-center align-center ">
                <v-divider :thickness="2" color="orange"></v-divider>
            </v-col>
        </v-row>
    
        <v-row no-gutters>
            <v-col cols="10" md="4" class="px-1">
                <v-text-field
                    label="DNI"
                    outlined
                    dense
                    v-model="dniPartner"
                    type="number"
                    :rules='(selectVisit === 2) ? [(v) => !!v || "El campo es requerido", (v) => v != dniAffiliate || "El DNI debe ser distinto al del miembro 2"] : [(v) => !!v || "El campo es requerido"]'
                />
            </v-col>

            <v-col cols="2" md="2">
                <v-btn 
                    text 
                    small 
                    color="orange" 
                    class="mt-2" 
                    @click="dniPartner = generateNumberDNI()">
                        <v-icon left>mdi-smart-card-off</v-icon>
                        <span v-if="$vuetify.breakpoint.mdAndUp">SIN DNI</span>
                </v-btn>
            </v-col>
            
            <v-col cols="12" md="6" class="px-1">
                <v-text-field
                    label="Nombre"
                    outlined
                    dense
                    v-model="namePartner"
                    type="text"
                    :rules='[(v) => !!v || "El campo es requerido"]'
                />   
            </v-col>
        </v-row>
    
        <v-row no-gutters>
            <v-col cols="12" md="6" class="px-1">

                <DateInput 
                :fecha="datePartner" 
                :required="true" 
                @changeDate="datePartner = $event" 
                :validationAge="true"
                label="Fecha de Nacimiento"
                />

            </v-col>
    
            <v-col cols="12" md="6" class="px-1">
                <v-text-field
                label="Telefono"
                outlined
                dense
                type="number"
                v-model="phonePartner"
                :rules='[(v) => !!v || "El campo es requerido", (v) => (v != null && v.toString().length == 10) || "El teléfono debe contener 10 dígitos (Cod. Area + Nro de telefono)"]'
            />
            </v-col>
        </v-row>
        
        <v-row class="justify-center align-center text-center py-0 pb-8 mt-2" v-if="selectVisit === 2">
            <v-col cols="12">
                <span class="font-weight-thin orange--text" style="font-size: 1.3rem;">Datos Miembro 2</span>
            </v-col>
    
            <v-col cols="6" class="d-flex pl-15 justify-center align-center">
                <v-divider :thickness="2" color="orange"></v-divider>
            </v-col>
                
            <v-col cols="6" class="d-flex pr-15 justify-center align-center ">
                <v-divider :thickness="2" color="orange"></v-divider>
            </v-col>
        </v-row>
                        
        <v-row no-gutters v-if="selectVisit === 2">
            <v-col cols="10" md="4" class="px-1">  
                <v-text-field 
                label="DNI"
                outlined
                dense
                v-model="dniAffiliate"
                type="number"
                :rules='[(v) => !!v || "El campo es requerido", (v) => v != dniPartner || "El DNI debe ser distinto al del miembro 1"]'
                 />
            </v-col>

            <v-col cols="2" md="2">
                <v-btn text small color="orange" class="mt-2" @click="dniAffiliate = generateNumberDNI()">
                    <v-icon left>mdi-smart-card-off</v-icon>
                    <span v-if="$vuetify.breakpoint.mdAndUp">SIN DNI</span>
                </v-btn>
            </v-col>

            <v-col cols="12" md="6" class="px-1"> 
                <v-text-field
                label="Nombre"
                outlined
                dense
                v-model="nameAffiliate"
                :rules='[(v) => !!v || "El campo es requerido"]'
                />
            </v-col>
        </v-row>

        <v-row no-gutters v-if="selectVisit === 2">
            <v-col cols="12" md="6" class="px-1">

                <DateInput 
                :fecha="dateAffiliate" 
                :required="true" 
                @changeDate="dateAffiliate = $event" 
                :validationAge="true"
                />

            </v-col>
    
            <v-col cols="12" md="6" class="px-1">
                <v-text-field
                label="Telefono"
                outlined
                dense
                type="number"
                v-model="phoneAffiliate"
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
            <v-col cols="4">
                <v-btn  
                    block 
                    :loading="loading" 
                    color="orange" 
                    dark
                    class="font-weight-bold" 
                    @click="createPartner">DAR DE ALTA
                </v-btn>
            </v-col>
        </v-row>
        
    </v-form>            
    </div> 
    </template>
    
    <script>
    import DateInput from '../app/DateInput'
    import eventBus from '../../event-bus'
        export default{
            components: {
                DateInput
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
                    dniPartner: null,
                    namePartner: "",
                    datePartner: null,
                    phonePartner: null,
                    dniAffiliate: null,
                    nameAffiliate: null,
                    dateAffiliate: null,
                    phoneAffiliate: "",
                    observations: "",
                    date: null,
                    modal: null,
                    loading: false,
                    loadPM: false,
                    dataDNI: null,
                    payment: null,
                    memb_amount_paid: null,
                    price: 0,
                }
            },
            beforeMount(){
                this.getEstados()
                this.getTipos() 
                this.getPaymentMethod()
                this.dataDNI = (this.$route.query.dni != null) ? JSON.parse(this.$route.query.dni) : null
                if(this.dataDNI != null) this.setDataDNI()
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
                generateNumberDNI(){
                   return this.$moment().format('YYYYMMDDHHmmSS');
                },
                setDataDNI(){
                    this.dniPartner = (this.dataDNI.identification) ? this.dataDNI.identification : null
                    this.namePartner = this.dataDNI.name ? this.dataDNI.name : ""
                    this.lastnamePartner = this.dataDNI.surname ? this.dataDNI.surname : ""
                    this.datePartner = this.dataDNI.date_birth ? this.dataDNI.date_birth : null
                },
                getEstados(){
                    let vm = this
                    this.$http.get(process.env.VUE_APP_DEGIRA+"states/get")
                    .then((response)=>{
                        if(response){
                            vm.states = response.data.data
                        }
                    })
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
                formateDate(date){
                    if(date != null){ 
                        date.replace(/(T)/, ' ');
                        date.substr(0, 19);
                    }
                    return (date != null) ? this.$moment(date, 'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY') : '';
                }, 
                createPartner() {
                    if(this.$refs.form.validate()){
                    let data = {
                        "alias": this.nickname,
                        "partner_dni": this.dniPartner,
                        "partner_name": this.namePartner,
                        "partner_birthdate": (this.datePartner) ? this.$moment(this.datePartner).format("DD/MM/YYYY") : undefined,
                        "partner_phone": this.phonePartner,
                        "affiliate_dni": (this.selectVisit == 2) ? this.dniAffiliate : undefined,
                        "affiliate_name": (this.selectVisit == 2) ? this.nameAffiliate : undefined,
                        "affiliate_birthdate": (this.selectVisit == 2 && this.dateAffiliate) ? this.$moment(this.dateAffiliate).format("DD/MM/YYYY") : undefined,
                        "affiliate_phone": (this.selectVisit == 2) ? this.phoneAffiliate : "", 
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
                        if(response){
                            
                            let dialog = {  show: true, 
                                            title: "El socio se ha registrado correctamente", 
                                            type: 'success',
                                            isHtml: true,
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
                                                    {label: 'Nombre', 
                                                     value: response.data.data.partner.partner_name, 
                                                     title: 'Socio', 
                                                     show: true
                                                    },
                                                    {label: 'DNI', 
                                                     value: response.data.data.partner.partner_dni, 
                                                     show: true
                                                    },
                                                    {label: 'Fecha de Nacimiento', 
                                                     value: this.formateDate(response.data.data.partner.partner_birthdate), 
                                                     show: true
                                                    },
                                                    {label: 'Teléfono', 
                                                     value: response.data.data.partner.partner_phone, 
                                                     show: (response.data.data.partner.partner_phone)
                                                    },
                                                    {label: 'Nombre', 
                                                     value: response.data.data.partner.affiliate_name, 
                                                     title: 'Afiliado', 
                                                     show: (vm.selectVisit== 2)
                                                    },
                                                    {label: 'DNI', 
                                                     value: response.data.data.partner.affiliate_dni, 
                                                     show: (vm.selectVisit== 2)
                                                    },
                                                    {label: 'Fecha de Nacimiento', 
                                                     value: this.formateDate(response.data.data.partner.affiliate_birthdate), 
                                                     show: (vm.selectVisit== 2)
                                                    },
                                                    {label: 'Teléfono', 
                                                     value: response.data.data.partner.affiliate_phone, 
                                                     show: (vm.selectVisit== 2 && response.data.data.partner.affiliate_phone)
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
                        console.log(error.response)
                        eventBus.$emit('toast', { show: true, text: (error.response.data.message) ? error.response.data.message :  "No se ha podido registrar al miembro", color: "red" })
                        vm.loading=false
                    })
                }
    
                }
            }
        }
    </script>
    