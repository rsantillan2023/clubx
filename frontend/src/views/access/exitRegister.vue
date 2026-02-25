<template>
    <div class="exit-register-container">
        <!-- Header con título y botones de navegación -->
        <v-row no-gutters class="mb-4">
            <v-col cols="12">
                <v-card class="header-card" elevation="2">
                    <v-card-title class="d-flex justify-space-between align-center pa-4">
                        <div class="d-flex align-center">
                            <v-icon color="orange" large class="mr-3">mdi-exit-run</v-icon>
                            <div>
                                <h2 class="mb-0 orange--text font-weight-bold">Registro de Salida</h2>
                                <div class="d-flex align-center flex-wrap">
                                    <span class="text-caption grey--text">Complete los datos para registrar la salida del socio</span>
                                    <span 
                                        v-if="partner && partner.total < consumedMin" 
                                        class="text-caption red--text font-weight-bold ml-2">
                                        El socio consumió ${{ partner.total }}, pero el consumo mínimo es ${{ consumedMin }}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="d-flex flex-wrap">
                            <v-btn 
                                small 
                                outlined 
                                color="orange" 
                                class="mr-2 mb-2"
                                @click="$router.push('/activeVisits')">
                                <v-icon left small>mdi-arrow-left</v-icon>
                                Visitas Activas
                            </v-btn>
                            <v-btn 
                                small 
                                outlined 
                                color="orange" 
                                class="mb-2"
                                @click="$router.push('/access')">
                                <v-icon left small>mdi-qrcode-scan</v-icon>
                                Acceso
                            </v-btn>
                        </div>
                    </v-card-title>
                </v-card>
            </v-col>
        </v-row>

        <v-row no-gutters v-if="partner">
            <!-- Información Principal del Socio -->
            <v-col cols="12" md="8" class="pr-md-2">
                <!-- Card de Identificación -->
                <v-card class="mb-4" elevation="2" outlined>
                    <v-card-title class="orange white--text pa-3">
                        <v-icon left>mdi-account-circle</v-icon>
                        Información del Socio
                    </v-card-title>
                    <v-card-text class="pa-4">
                        <v-row>
                            <v-col cols="12" class="pb-2">
                                <div class="d-flex align-center flex-wrap">
                                    <span class="text-h5 orange--text font-weight-bold text-uppercase mr-3">
                                        {{formatAlias(partner.alias)}}
                                    </span>
                                    <v-chip color="orange" text-color="white" class="mr-3">
                                        <v-icon left small>mdi-tag</v-icon>
                                        {{partner.visit_type?.description || 'Tipo de Visita'}}
                                    </v-chip>
                                    <span class="text-body-1 grey--text mr-3">
                                        {{partner.partner_name}}
                                    </span>
                                    <v-chip 
                                        v-if="partner.state"
                                        small 
                                        :color="getStateColor(partner.state.id_state)" 
                                        text-color="white" 
                                        class="mr-3">
                                        {{partner.state.description}}
                                    </v-chip>
                                    <span class="text-body-2 grey--text">
                                        Número de tarjeta: 
                                        <v-chip small color="orange" text-color="white" class="ml-1">
                                            {{partner.id_bracelet_1}}
                                        </v-chip>
                                    </span>
                                </div>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>

                <!-- Card de Información de la Visita -->
                <v-card class="mb-4" elevation="2" outlined>
                    <v-card-title class="orange white--text pa-3">
                        <v-icon left>mdi-calendar-clock</v-icon>
                        Detalles de la Visita
                    </v-card-title>
                    <v-card-text class="pa-4">
                        <!-- Primera fila: Fechas y Día -->
                        <v-row dense class="mb-2">
                            <v-col cols="6" md="3">
                                <div class="text-center">
                                    <v-icon color="orange" class="mb-1">mdi-calendar</v-icon>
                                    <div class="text-caption grey--text">Fecha de Entrada</div>
                                    <div class="font-weight-bold">{{partner.visit_date ? formatDate(partner.visit_date, 'DD/MM/YYYY') : (partner.hour_entry ? formatDate(partner.hour_entry, 'DD/MM/YYYY') : 'N/A')}}</div>
                                </div>
                            </v-col>
                            <v-col cols="6" md="3">
                                <div class="text-center">
                                    <v-icon color="orange" class="mb-1">mdi-clock-outline</v-icon>
                                    <div class="text-caption grey--text">Hora de Entrada</div>
                                    <div class="font-weight-bold">{{formateHour(partner.hour_entry) || 'N/A'}}</div>
                                </div>
                            </v-col>
                            <v-col cols="6" md="3">
                                <div class="text-center">
                                    <v-icon color="orange" class="mb-1">mdi-calendar-week</v-icon>
                                    <div class="text-caption grey--text">Día de Visita</div>
                                    <div class="font-weight-bold">{{formatDay(partner.id_day) || 'N/A'}}</div>
                                </div>
                            </v-col>
                            <v-col cols="6" md="3">
                                <div class="text-center">
                                    <v-icon color="orange" class="mb-1">mdi-calendar-clock</v-icon>
                                    <div class="text-caption grey--text">Última Visita</div>
                                    <div class="font-weight-bold">{{partner.last_visit ? formatDate(partner.last_visit, 'DD/MM/YYYY') : 'N/A'}}</div>
                                </div>
                            </v-col>
                        </v-row>

                        <v-divider class="my-3"></v-divider>

                        <!-- Segunda fila: Consumos -->
                        <v-row dense class="mb-2">
                            <v-col cols="6" md="3">
                                <div class="text-center">
                                    <v-icon color="orange" class="mb-1">mdi-cash</v-icon>
                                    <div class="text-caption grey--text">Consumo Actual</div>
                                    <div class="font-weight-bold orange--text">${{ partner.total || 0 }}</div>
                                </div>
                            </v-col>
                            <v-col cols="6" md="3">
                                <div class="text-center">
                                    <v-icon color="orange" class="mb-1">mdi-cash-multiple</v-icon>
                                    <div class="text-caption grey--text">Consumo Mínimo</div>
                                    <div class="font-weight-bold orange--text">${{ consumedMin }}</div>
                                </div>
                            </v-col>
                            <v-col cols="6" md="3">
                                <div class="text-center">
                                    <v-icon color="blue" class="mb-1">mdi-shopping</v-icon>
                                    <div class="text-caption grey--text">Consumo en Visita</div>
                                    <div class="font-weight-bold blue--text">${{ partner.visit_amount_consumed || 0 }}</div>
                                </div>
                            </v-col>
                        </v-row>

                        <v-divider class="my-3"></v-divider>

                        <!-- Tercera fila: Pagos de Entrada -->
                        <v-row dense class="mb-2">
                            <v-col cols="12">
                                <div class="text-subtitle-2 orange--text mb-2">
                                    <v-icon small left>mdi-login</v-icon>
                                    Pagos de Entrada
                                </div>
                            </v-col>
                            <v-col cols="6" md="4">
                                <div class="text-center">
                                    <v-icon color="green" class="mb-1">mdi-cash-check</v-icon>
                                    <div class="text-caption grey--text">Monto Pagado Entrada</div>
                                    <div class="font-weight-bold green--text">${{ partner.entry_amount_paid || 0 }}</div>
                                </div>
                            </v-col>
                            <v-col cols="6" md="4">
                                <div class="text-center">
                                    <v-icon color="green" class="mb-1">mdi-cash-plus</v-icon>
                                    <div class="text-caption grey--text">Extra Pagado Entrada</div>
                                    <div class="font-weight-bold green--text">${{ partner.extra_entry || 0 }}</div>
                                </div>
                            </v-col>
                            <v-col cols="12" md="4" v-if="partner.extra_entry_obs">
                                <div class="text-center">
                                    <v-icon color="green" class="mb-1">mdi-note-text</v-icon>
                                    <div class="text-caption grey--text">Obs. Extra Entrada</div>
                                    <div class="font-weight-bold text-body-2">{{ partner.extra_entry_obs }}</div>
                                </div>
                            </v-col>
                        </v-row>

                        <v-divider class="my-3" v-if="partner.entry_visit_obs"></v-divider>

                        <!-- Observaciones de Entrada -->
                        <v-row v-if="partner.entry_visit_obs" class="mb-2">
                            <v-col cols="12">
                                <v-alert type="info" dense outlined>
                                    <div class="d-flex align-center">
                                        <v-icon small left>mdi-information</v-icon>
                                        <div>
                                            <strong>Observaciones de Entrada:</strong> {{ partner.entry_visit_obs }}
                                        </div>
                                    </div>
                                </v-alert>
                            </v-col>
                        </v-row>

                    </v-card-text>
                </v-card>
            </v-col>

            <!-- Sección de Cobro -->
            <v-col cols="12" md="4" class="pl-md-2">
                <v-card class="payment-card" elevation="2" outlined>
                    <v-card-title class="orange white--text pa-3">
                        <v-icon left>mdi-cash-register</v-icon>
                        Registro de Cobro
                    </v-card-title>
                    <v-card-text class="pa-4">
                        <v-row no-gutters v-if="selectPayMethod != 5">
                            <v-col cols="12" class="mb-3">
                                <v-select 
                                    v-model="selectPayMethod"
                                    :items="methods"
                                    label="Método de pago"
                                    :rules='[(v) => !!v || "El metodo de pago es requerido"]'
                                    dense
                                    outlined
                                    prepend-inner-icon="mdi-credit-card"
                                    item-text="description"
                                    item-value="id_payment_method"
                                    hide-details
                                ></v-select>  
                            </v-col>
                        </v-row>

                        <v-divider class="my-3" v-if="selectPayMethod"></v-divider>

                        <v-card 
                            v-if="selectPayMethod" 
                            color="orange" 
                            dark 
                            class="mb-3 text-center pa-4"
                            elevation="3">
                            <div class="text-caption mb-1">El Socio debe abonar</div>
                            <div class="text-h4 font-weight-bold">$ {{montoAbonar}}</div>
                        </v-card>

                        <v-btn 
                            v-if="selectPayMethod"
                            :loading="loading" 
                            color="orange" 
                            large
                            dark 
                            block
                            class="font-weight-bold mb-3"
                            @click="showConfirmDialog">
                            <v-icon left>mdi-exit-run</v-icon>
                            Registrar Salida
                        </v-btn>

                        <v-divider class="my-3" v-if="selectPayMethod"></v-divider>

                        <v-row no-gutters v-if="selectPayMethod != 5">
                            <v-col cols="12" class="mb-3" v-if="(selectVisit && selectPayMethod)">
                                <v-text-field
                                    label="Agregar monto adicional"
                                    outlined
                                    dense
                                    prepend-inner-icon="mdi-cash-plus"
                                    v-model="items.other_exit_paid"
                                    type="number"
                                    hide-details
                                />
                            </v-col>
        
                            <v-col cols="12" class="mb-3" v-if="items.other_exit_paid">
                                <v-text-field
                                    label="Concepto del pago adicional"
                                    outlined
                                    dense
                                    prepend-inner-icon="mdi-text"
                                    v-model="items.other_exit_paid_obs"
                                    :rules="(items.other_exit_paid) ? [(v) => !!v || 'El campo es requerido'] : []"
                                    hide-details
                                />
                            </v-col>
                        </v-row>

                        <v-textarea
                            v-if="selectPayMethod"
                            label="Observaciones"
                            rows="3"
                            outlined
                            dense
                            prepend-inner-icon="mdi-note-text"
                            :rules='(selectPayMethod == 5) ? [(v) => !!v || "Este campo es requerido"] : []'
                            v-model="items.exit_visit_obs"
                            hide-details
                        ></v-textarea>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <v-row no-gutters v-if="errorMessage">
            <v-col cols="12">
                <v-alert color="red" :value="true" icon="mdi-alert-circle-outline" class="mb-4">
                    DEMO
                </v-alert>
            </v-col>
        </v-row>

        <!-- Diálogo de Confirmación -->
        <v-dialog v-model="confirmDialog" max-width="500" persistent>
            <v-card>
                <v-card-title class="orange white--text">
                    <v-icon left color="white">mdi-alert-circle</v-icon>
                    Confirmar Registro de Salida
                </v-card-title>
                <v-card-text class="pt-4">
                    <p class="text-body-1 mb-3">
                        ¿Está seguro que desea registrar la salida del socio?
                    </p>
                    <v-divider class="my-3"></v-divider>
                    <div v-if="partner" class="text-body-2">
                        <div class="mb-2">
                            <strong>Socio:</strong> {{ partner.alias || partner.partner_name }}
                        </div>
                        <div class="mb-2">
                            <strong>Monto a abonar:</strong> 
                            <span class="orange--text font-weight-bold">${{ montoAbonar }}</span>
                        </div>
                        <div v-if="selectPayMethod && methods.length > 0">
                            <strong>Método de pago:</strong> 
                            {{ methods.find(m => m.id_payment_method == selectPayMethod)?.method || 'N/A' }}
                        </div>
                    </div>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn 
                        text 
                        color="grey" 
                        @click="confirmDialog = false"
                        :disabled="loading">
                        Cancelar
                    </v-btn>
                    <v-btn 
                        color="orange" 
                        dark 
                        @click="confirmExit"
                        :loading="loading">
                        <v-icon left>mdi-check</v-icon>
                        Confirmar
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Botones de Acción -->
        <v-row no-gutters class="mt-4">
            <v-col cols="12">
                <v-card elevation="2" class="pa-4">
                    <div class="d-flex flex-wrap justify-center align-center">
                        <v-btn 
                            v-if="partner && partner.total > 0"
                            large
                            outlined
                            color="orange" 
                            class="mr-2 mb-2"
                            @click="$router.push(`/consumed?id_bracelet=${partner.id_bracelet_1}`)">
                            <v-icon left>mdi-eye</v-icon>
                            Ver Consumos
                        </v-btn>
                        <v-btn 
                            large
                            outlined
                            color="orange" 
                            class="mr-2 mb-2"
                            @click="$router.push('/productsSale')">
                            <v-icon left>mdi-currency-usd</v-icon>
                            Venta de Productos
                        </v-btn>
                        <v-btn 
                            large
                            outlined
                            color="orange" 
                            class="mr-2 mb-2"
                            @click="$router.push('/lockers')">
                            <v-icon left>mdi-hanger</v-icon>
                            Guardarropas
                        </v-btn>
                        <v-btn 
                            large
                            outlined
                            color="orange" 
                            class="mr-2 mb-2"
                            @click="$router.push('/devolution')">
                            <v-icon left>mdi-undo</v-icon>
                            Devoluciones
                        </v-btn>
                    </div>
                </v-card>
            </v-col>
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
                confirmDialog: false,
                
            }
        },
        mounted() {
            this.loadPartnerData();
            this.getTipos();
            this.getPaymentMethod();
            this.loadVisitData();
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
            loadVisitData(){
                // La información de la visita debería estar disponible en el objeto partner
                // que se guarda desde activeVisits. Si no está, se mostrará N/A en los campos.
                // Este método puede ser usado para cargar datos adicionales si es necesario en el futuro.
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
            formatDay(id_day){
                if(id_day == 1) return 'Domingo'
                if(id_day == 2) return 'Lunes'
                if(id_day == 3) return 'Martes'
                if(id_day == 4) return 'Miércoles'
                if(id_day == 5) return 'Jueves'
                if(id_day == 6) return 'Viernes'
                if(id_day == 7) return 'Sábado'
                return 'N/A'
            },
            formatAlias(alias){
                if (!alias) return '';
                return String(alias).replace(/---/g, ' ');
            },
            getStateColor(id_state){
                const colors = {
                    1: 'green',    // Activo
                    2: 'green',    // En el club
                    3: 'green',    // Otro estado activo
                    4: 'blue',     // Pendiente
                    5: 'red',      // Suspendido
                    6: 'red',      // Expulsado
                    7: 'red',      // Otro estado negativo
                    8: 'green'     // Otro estado positivo
                }
                return colors[id_state] || 'grey'
            },
            showConfirmDialog(){
                this.confirmDialog = true
            },
            confirmExit(){
                this.confirmDialog = false
                this.exitRegister()
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

<style scoped>
.exit-register-container {
    padding: 16px;
    max-width: 1400px;
    margin: 0 auto;
}

.header-card {
    border-radius: 8px;
}

.info-card {
    border-radius: 4px;
    transition: box-shadow 0.2s;
}

.info-card:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.info-item {
    display: flex;
    align-items: center;
    min-height: 32px;
}

.info-section {
    padding: 12px;
    margin-bottom: 8px;
    background-color: #fafafa;
    border-radius: 6px;
    border-left: 3px solid #ff9800;
    transition: all 0.2s;
}

.info-section:hover {
    background-color: #f5f5f5;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.info-label {
    display: flex;
    align-items: center;
    margin-bottom: 6px;
    color: #666;
    font-size: 0.85rem;
}

.info-value {
    font-size: 1rem;
    color: #333;
    font-weight: 500;
    word-break: break-word;
}

.payment-card {
    position: sticky;
    top: 16px;
    border-radius: 8px;
}

@media (max-width: 960px) {
    .payment-card {
        position: relative;
        top: 0;
    }
    
    .exit-register-container {
        padding: 8px;
    }
}

.v-card {
    border-radius: 8px;
}

.v-card-title {
    border-radius: 8px 8px 0 0;
}

/* Mejoras de espaciado */
.v-card-text {
    padding: 16px;
}

/* Asegurar que los botones se vean bien en móvil */
@media (max-width: 600px) {
    .d-flex.flex-wrap {
        flex-direction: column;
    }
    
    .d-flex.flex-wrap .v-btn {
        width: 100%;
        margin-right: 0 !important;
    }
}
</style>
