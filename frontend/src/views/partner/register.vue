<template>
    <div class="py-2">
        <v-form ref="form" class="px-md-8 px-3" >
        <!-- Selección rápida: Estado, Tipo Visitante, Método Pago -->
        <v-row no-gutters class="mb-2">
            <v-col cols="12" class="mb-2">
                <div class="text-caption orange--text font-weight-medium mb-1">Estado</div>
                <v-btn-toggle 
                    v-model="selectState" 
                    mandatory 
                    disabled
                    dense
                    class="flex-wrap"
                    style="width: 100%"
                >
                    <v-btn 
                        v-for="state in states" 
                        :key="state.id_state"
                        :value="state.id_state"
                        small
                        outlined
                        class="flex-grow-1"
                        style="min-width: 120px"
                    >
                        {{ state.description }}
                    </v-btn>
                </v-btn-toggle>
            </v-col>

            <v-col cols="12" class="mb-2">
                <div class="text-caption orange--text font-weight-medium mb-1">Tipo de Visitante <span class="red--text">*</span></div>
                <v-btn-toggle 
                    v-model="selectVisit" 
                    @change="getPrice"
                    dense
                    class="flex-wrap"
                    style="width: 100%"
                >
                    <v-btn 
                        v-for="visit in visits" 
                        :key="visit.id_visit_type"
                        :value="visit.id_visit_type"
                        small
                        outlined
                        class="flex-grow-1"
                        style="min-width: 120px"
                    >
                        {{ visit.description }}
                    </v-btn>
                </v-btn-toggle>
                <div v-if="!selectVisit" class="text-caption red--text mt-1">El campo es requerido</div>
            </v-col>

            <v-col cols="12" class="mb-2">
                <div class="text-caption orange--text font-weight-medium mb-1">Método de Pago <span class="red--text">*</span></div>
                <v-btn-toggle 
                    v-model="selectPayMethod" 
                    @change="getPrice"
                    dense
                    class="flex-wrap"
                    style="width: 100%"
                >
                    <v-btn 
                        v-for="method in methods" 
                        :key="method.id_payment_method"
                        :value="method.id_payment_method"
                        small
                        outlined
                        class="flex-grow-1"
                        style="min-width: 120px"
                    >
                        <span class="text-wrap text-center" style="font-size: 0.75rem">{{ method.description }}</span>
                    </v-btn>
                </v-btn-toggle>
            </v-col>
        </v-row>

        <!-- Información de pago compacta -->
        <v-row no-gutters class="mb-2" v-if="selectVisit && selectPayMethod">
            <v-col cols="12" md="2" class="text-center d-flex align-center justify-center mb-2" v-if="(this.$store.state.userLoged.clienteId != 2)">
                <v-icon size="30" color="orange">{{ ($vuetify.breakpoint.mdAndUp) ? "mdi-arrow-right-thick" : "mdi-arrow-down-thick"}}</v-icon>
            </v-col>

            <v-col cols="12" md="5" class="px-1 mb-2" v-if="(this.$store.state.userLoged.clienteId != 2)">
                <v-card outlined elevation="0" class="pb-0">
                    <v-card elevation="0" color="orange" dark class="rounded-b-0 py-1">
                        <div class="text-caption text-center">Ingrese monto real abonado</div>
                    </v-card>    
                    <div class="pa-1">
                        <v-text-field 
                            v-model="payment"
                            outlined
                            dense
                            hide-details="auto"
                            type="number"
                            :rules='[(v) => !!v || "El monto es requerido"]'>
                        </v-text-field>
                    </div>
                </v-card>
            </v-col>
        </v-row>
           
        <!-- ALIAS -->
        <v-row no-gutters class="mb-1">
            <v-col cols="12" class="text-center mb-1">
                <span class="text-body-2 orange--text font-weight-medium">ALIAS</span>
            </v-col>
        </v-row>
           
        <!-- Datos Miembro 1 -->
        <v-row no-gutters class="mb-1">
            <v-col cols="12" class="text-center">
                <span class="text-body-1 orange--text font-weight-medium">Datos Miembro 1</span>
            </v-col>
            <v-col cols="12" class="px-4 mb-1">
                <v-divider :thickness="1" color="orange"></v-divider>
            </v-col>
        </v-row>
    
        <!-- Fila 1: ALIAS, DNI, Nombre -->
        <v-row no-gutters class="mb-1">
            <v-col cols="12" md="4" class="px-1">
                <v-text-field 
                    label="Ingrese ALIAS"
                    outlined
                    dense
                    hide-details="auto"
                    v-model="nickname"
                    :rules='[(v) => !!v || "El campo es requerido"]'
                />
            </v-col>
            <v-col cols="12" md="4" class="px-1">
                <v-text-field
                    label="DNI"
                    outlined
                    dense
                    hide-details="auto"
                    v-model="dniPartner"
                    type="number"
                    :rules='[(v) => !!v || "El campo es requerido"]'
                >
                    <template v-slot:append>
                        <v-btn 
                            text 
                            x-small 
                            color="orange" 
                            @click.stop="dniPartner = generateNumberDNI()"
                            class="pa-0"
                            style="min-width: auto">
                            <v-icon x-small>mdi-smart-card-off</v-icon>
                        </v-btn>
                    </template>
                </v-text-field>
            </v-col>
            <v-col cols="12" md="4" class="px-1">
                <v-text-field
                    label="Nombre"
                    outlined
                    dense
                    hide-details="auto"
                    v-model="namePartner"
                    type="text"
                    :rules='[(v) => !!v || "El campo es requerido"]'
                />   
            </v-col>
        </v-row>
    
        <!-- Fila 2: Fecha de Nacimiento, Telefono, Observaciones -->
        <v-row no-gutters class="mb-1">
            <v-col cols="12" md="4" class="px-1">
                <DateInput 
                    :fecha="datePartner" 
                    :required="true" 
                    @changeDate="datePartner = $event" 
                    :validationAge="true"
                    label="Fecha de Nacimiento"
                />
            </v-col>
            <v-col cols="12" md="4" class="px-1">
                <v-text-field
                    label="Telefono"
                    outlined
                    dense
                    hide-details="auto"
                    type="number"
                    v-model="phonePartner"
                    :rules='[(v) => !!v || "El campo es requerido", (v) => (v != null && v.toString().length == 10) || "El teléfono debe contener 10 dígitos (Cod. Area + Nro de telefono)"]'
                />
            </v-col>
            <v-col cols="12" md="4" class="px-1">
                <v-textarea
                    label="Observaciones"
                    rows="2"
                    outlined
                    dense
                    hide-details="auto"
                    :rules='(selectPayMethod == 5) ? [(v) => !!v || "Este campo es requerido"] : []'
                    v-model="observations"
                />
            </v-col>
        </v-row>
        
                        
        <!-- Botón de alta y monto a pagar -->
        <v-row no-gutters class="mb-2">
            <v-col cols="12" md="6" class="px-1" v-if="selectVisit && selectPayMethod">
                <v-card outlined elevation="0" class="py-1">
                    <div class="text-caption text-center pb-0 black--text">El Socio debe abonar</div>
                    <div class="text-h6 text-center font-weight-bold black--text">$ {{total}}</div>
                </v-card>
                <v-card v-if="(payment && this.$store.state.userLoged.clienteId != 2)"
                    :style="`border: solid 2px ${(difference == 0) ? $vuetify.theme.defaults.light.teal : $vuetify.theme.defaults.light.orange}`" 
                    outlined 
                    elevation="0" 
                    class="mt-1 py-1">
                    <div class="text-caption text-center pb-0">Diferencia</div>
                    <div :class="`text-h6 text-center font-weight-bold ${(difference == 0) ? 'teal' : 'orange'}--text`">$ {{difference}}</div>
                </v-card>
            </v-col>
            <v-col cols="12" md="6" class="px-1" v-else>
                <v-card outlined elevation="0" class="py-1">
                    <div class="text-caption text-center pb-0 black--text">El Socio debe abonar</div>
                    <div class="text-h6 text-center font-weight-bold black--text">$ 0</div>
                </v-card>
            </v-col>
            <v-col cols="12" md="6" class="px-1 d-flex align-center">
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
                    // Validar campos de botoneras manualmente
                    if(!this.selectVisit){
                        eventBus.$emit('toast', { show: true, text: "Debe seleccionar un Tipo de Visitante", color: "red" })
                        return
                    }
                    if(!this.selectPayMethod){
                        eventBus.$emit('toast', { show: true, text: "Debe seleccionar un Método de Pago", color: "red" })
                        return
                    }
                    if(this.$refs.form.validate()){
                    let data = {
                        "alias": this.nickname,
                        "partner_dni": this.dniPartner,
                        "partner_name": this.namePartner,
                        "partner_birthdate": (this.datePartner) ? this.$moment(this.datePartner).format("DD/MM/YYYY") : undefined,
                        "partner_phone": this.phonePartner,
                        "affiliate_dni": undefined,
                        "affiliate_name": undefined,
                        "affiliate_birthdate": undefined,
                        "affiliate_phone": "", 
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
    