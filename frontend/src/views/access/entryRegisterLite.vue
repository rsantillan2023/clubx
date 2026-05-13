<template>
  <div class="py-5">
        <v-row class="justify-center px-5 mb-2" v-if="isPartnerObserved">
            <v-col cols="12" md="10">
                <v-alert type="info" dense outlined class="mb-3 observed-partner-alert">
                    <div class="observed-banner__line">
                        <div class="observed-banner__left d-flex flex-wrap align-center">
                            <span class="observed-banner__lead font-weight-medium">Socio observado —</span>
                            <v-icon small color="info" class="ml-1 mr-1 flex-shrink-0">{{ icon.icon }}</v-icon>
                            <span class="font-weight-medium">
                                {{ partner.state && partner.state.description ? partner.state.description : 'Socio observado' }}
                                —
                                {{ partner.state && partner.state.actions && partner.state.actions.description ? partner.state.actions.description : '' }}
                            </span>
                        </div>
                        <div class="observed-banner__chip-only">
                            <v-chip
                                x-small
                                :color="getLastVisitColor(partner.last_visit)"
                                text-color="white"
                                class="ma-0"
                            >
                                {{ partner.last_visit ? formatPartnerDate(partner.last_visit,'DD/MM/YYYY') : 'N/A' }}
                            </v-chip>
                        </div>
                    </div>
                </v-alert>
                <v-card outlined class="pa-3">
                    <v-row dense align="start">
                        <v-col cols="12" md="6">
                            <v-select
                                v-model="editPartnerState"
                                :items="states"
                                label="Cambiar estado"
                                item-text="description"
                                item-value="id_state"
                                dense
                                outlined
                                :menu-props="{ offsetY: true, maxHeight: 320 }"
                                hide-details="auto"
                            >
                                <template v-slot:selection="{ item }">
                                    <span v-if="item" :class="`${stateColorName(item.id_state)}--text font-weight-bold`">{{ item.description }}</span>
                                </template>
                                <template v-slot:item="{ item }">
                                    <span :class="`${stateColorName(item.id_state)}--text`">{{ item.description }}</span>
                                </template>
                            </v-select>
                            <div v-if="statesLoadedEmpty" class="text-caption red--text mt-1">No hay estados disponibles — verifique conexión o permisos</div>
                        </v-col>
                        <v-col cols="12" md="6">
                            <v-textarea
                                v-model="editPartnerObservations"
                                label="Observaciones del socio"
                                rows="3"
                                outlined
                                dense
                                hide-details="auto"
                            />
                        </v-col>
                        <v-col cols="12" class="d-flex justify-end">
                            <v-btn
                                color="info"
                                dark
                                :loading="savingPartnerObservations"
                                @click="savePartnerObservationState"
                            >
                                <v-icon left>mdi-content-save</v-icon>
                                Guardar estado y observaciones
                            </v-btn>
                        </v-col>
                    </v-row>
                </v-card>
            </v-col>
        </v-row>
        <v-row class="justify-center align-center py-2">
            <v-col cols="12" md="auto" class="text-center">
                <span class="orange--text text-uppercase headline">{{getCleanAlias}}</span>
            </v-col>
            <v-col cols="12" md="auto" class="text-center mt-2 mt-md-0">
                <v-row no-gutters class="justify-center">
                    <v-btn-toggle 
                        v-model="selectVisit"
                        mandatory
                        @change="getPrice"
                        color="orange"
                        class="flex-wrap"
                        :disabled="isMensualLocked">
                        <v-btn 
                            v-for="visit in visits" 
                            :key="visit.id_visit_type"
                            :value="visit.id_visit_type"
                            class="ma-1"
                            outlined>
                            {{visit.description}}
                        </v-btn>
                    </v-btn-toggle>
                </v-row>
                <div v-if="!selectVisit" class="text-caption red--text mt-1">El campo es requerido</div>
            </v-col>
            <v-col cols="12" md="auto" class="text-center mt-2 mt-md-0">
                <v-card outlined elevation="0" color="orange" dark class="d-inline-block">
                    <v-card-subtitle class="font-weight-thin pb-0" style="font-size: 0.9rem">El socio debe abonar</v-card-subtitle>
                    <p class="font-weight-bold pa-2" style="font-size: 1.2rem">$ {{total}}</p>
                </v-card>
            </v-col>
        </v-row>
       
        <v-form ref="form" class="px-5">
            <v-row no-gutters>
                
                <v-col cols="12" class="px-1 mb-3" v-if="partner">
                    <v-row no-gutters class="justify-center">
                        <v-btn-toggle 
                            v-model="selectPayMethod"
                            mandatory
                            @change="getPrice"
                            color="orange"
                            class="flex-wrap"
                            :disabled="partner.id_state == 8">
                            <v-btn 
                                v-for="method in methods" 
                                :key="method.id_payment_method"
                                :value="method.id_payment_method"
                                class="ma-1"
                                outlined
                                style="min-height: auto; padding: 8px 12px;">
                                <div class="d-flex flex-column align-center" style="line-height: 1.2; font-size: 0.75rem;">
                                    <span>{{getMethodLine1(method.description)}}</span>
                                    <span v-if="getMethodLine2(method.description)">{{getMethodLine2(method.description)}}</span>
                                </div>
                            </v-btn>
                        </v-btn-toggle>
                    </v-row>
                    <div v-if="!selectPayMethod" class="text-caption red--text mt-1 text-center">El metodo de pago es requerido</div>
                </v-col>

                <v-row no-gutters v-if="selectPayMethod != 5">
                    <v-col cols="12" class="px-1 mb-2">
                        <div class="entry-extras-inline d-flex flex-wrap align-center">
                            <v-checkbox
                                v-model="pagaEstacionamiento"
                                label="Paga estacionamiento"
                                color="orange"
                                hide-details
                                dense
                                class="mt-0 mr-4 entry-extras-inline__chk"
                                @change="onPagaEstacionamientoChange"
                            />
                            <v-checkbox
                                v-if="partner && partner.id_state != 8"
                                v-model="pagarALaSalida"
                                label="Pagar entrada a la salida"
                                color="orange"
                                hide-details
                                dense
                                class="mt-0 mr-4 entry-extras-inline__chk"
                                @change="onPagarALaSalidaChange"
                            />
                            <v-text-field
                                class="entry-extras-inline__amount flex-grow-1"
                                label="Registre aca si se cobro algun monto adicional"
                                outlined
                                dense
                                hide-details="auto"
                                v-model="items.other_paid"
                                type="number"
                            />
                        </div>
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

            <v-col cols="12" class="mt-2" v-if="(this.$store.state.userLoged.clienteId != 2)">
                <v-row class="justify-center align-center pb-3 px-16">
                    <v-col cols="12" md="4" class="text-center py-0 pb-2">
                        <v-card v-if="(items.entry_amount_paid != null && items.entry_amount_paid !== '') && !pagarALaSalida" 
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

                    <v-col cols="12" md="2" class="text-center py-0 pb-2" v-if="items.entry_amount_paid && !pagarALaSalida">
                        <v-icon size="50" color="orange">{{ ($vuetify.breakpoint.mdAndUp) ? "mdi-arrow-right-thick" : "mdi-arrow-down-thick"}}</v-icon>
                    </v-col>

                    <v-col cols="12" md="4" class="text-center py-0 pb-2" v-if="!pagarALaSalida">
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
                                    :rules='pagarALaSalida ? [] : [(v) => !!v || "El monto es requerido"]'
                                    >
                                </v-text-field>
                            </div>
                        </v-card>
                    </v-col>
                    <v-col cols="12" md="6" class="text-center py-0 pb-2" v-if="pagarALaSalida">
                        <v-alert type="warning" dense outlined>
                            El socio abonará la entrada ($ {{ total }}) al registrar la salida.
                        </v-alert>
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

            <v-col cols="12" class="px-1 pb-2">
                <div class="entry-obs-submit-inline d-flex flex-wrap">
                    <v-textarea
                        class="entry-obs-submit-inline__textarea"
                        label="Observaciones"
                        rows="3"
                        outlined
                        dense
                        hide-details="auto"
                        v-model="items.entry_visit_obs"
                        :rules='(selectPayMethod == 5) ? [(v) => !!v || "Este campo es requerido"] : []'
                    />
                    <div class="entry-obs-submit-inline__btn-wrap d-flex align-center justify-center">
                        <v-btn 
                            block
                            :loading="loading" 
                            color="orange" 
                            dark 
                            class="font-weight-bold" 
                            @click="entryRegisterLite">
                            Registrar Entrada Rápida
                        </v-btn>            
                    </div>
                </div>
            </v-col>


            <v-col v-if="errorMessage" cols="12">
                <v-alert color="red" :value="true" icon="mdi-alert-circle-outline">
                    {{ errorMessage }}
                </v-alert>
            </v-col>
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
                pagaEstacionamiento: false,
                pagarALaSalida: false,
                isMensualLocked: false,
                states: [],
                statesLoadAttempted: false,
                editPartnerState: null,
                editPartnerObservations: "",
                savingPartnerObservations: false,
                SOCIO_OBSERVADO_ID: 4,
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
        async mounted() {
            await this.loadPartnerData();
            // Verificar si existe el partner
            if(!this.partner){
                eventBus.$emit('toast', { show: true, text: 'No hay un socio seleccionado. Por favor, busque un socio primero.', color: "warning" })
                this.$router.push('/access')
                return
            }
            // Verificar si el socio ya está en el establecimiento (verificación adicional después de la async)
            if(this.partner.partner_in_establishment){
                eventBus.$emit('toast', { show: true, text: 'Este socio ya está en el establecimiento. No se puede registrar el ingreso nuevamente.', color: "warning" })
                this.$store.commit('setPartner', null)
                this.$router.push('/access')
                return
            }
            if (this.isPartnerObserved) {
                await this.getEstados();
                this.syncObservedPartnerEditFields();
            }
            this.getTipos();
            this.getPaymentMethod();
            if (this.partnerResolvedStateId === 8) this.selectPayMethod = 5
        },
        watch: {
            selectPayMethod(){
                if(this.selectPayMethod == 5){
                    this.items.other_paid = null
                    this.items.other_paid_obs = ""
                    this.pagaEstacionamiento = false
                    this.pagarALaSalida = false
                } else if (this.pagaEstacionamiento) {
                    this.getPriceEstacionamiento()
                }
            },
            'items.other_paid'(val){
                if(val == 0 || val == null) this.items.other_paid_obs = ""
            }
        },
        computed:{
            /** id_state efectivo en raíz del socio (la API/store a veces sólo usa partner.state.id_state).
             *  No usar Number(partner.id_state) directo sobre null: Number(null) === 0. */
            partnerResolvedStateId() {
                if (!this.partner) return null;
                const p = this.partner;
                const raw = p.id_state;
                if (
                    raw !== undefined &&
                    raw !== null &&
                    raw !== '' &&
                    String(raw).trim() !== ''
                ) {
                    const n = Number(raw);
                    if (!Number.isNaN(n)) return n;
                }
                if (p.state != null && p.state.id_state !== undefined && p.state.id_state !== null) {
                    const m = Number(p.state.id_state);
                    if (!Number.isNaN(m)) return m;
                }
                return null;
            },
            isPartnerObserved() {
                return this.partner != null && this.partnerResolvedStateId === this.SOCIO_OBSERVADO_ID;
            },
            statesLoadedEmpty() {
                return (
                    this.isPartnerObserved &&
                    this.statesLoadAttempted &&
                    Array.isArray(this.states) &&
                    this.states.length === 0
                );
            },
            getCleanAlias(){
                if(this.partner && this.partner.alias){
                    const alias = String(this.partner.alias)
                    return alias.replace(/---/g, ' ')
                }
                return ''
            },
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
            stateColorName(idState) {
                if (idState == null) return 'grey';
                switch (Number(idState)) {
                    case 1: case 2: case 3: case 8: return 'green';
                    case 4: return 'info';
                    case 5: case 6: case 7: return 'red';
                    default: return 'orange';
                }
            },
            formatPartnerDate(date, format) {
                if (date != null) {
                    String(date).replace(/(T)/, ' ');
                }
                return date ? this.$moment(date, 'YYYY-MM-DD HH:mm:ss').format(format) : '';
            },
            getDaysSinceLastVisit(lastVisitDate) {
                if (!lastVisitDate) return 'N/A';
                const lastVisit = this.$moment(lastVisitDate);
                const today = this.$moment();
                const daysDiff = today.diff(lastVisit, 'days');
                if (daysDiff === 0) return 'Hoy';
                if (daysDiff === 1) return 'Hace 1 día';
                return `Hace ${daysDiff} días`;
            },
            getLastVisitColor(lastVisitDate) {
                if (!lastVisitDate) return 'grey';
                const lastVisit = this.$moment(lastVisitDate);
                const today = this.$moment();
                const daysDiff = today.diff(lastVisit, 'days');
                if (daysDiff === 0) return 'green';
                if (daysDiff <= 7) return 'blue';
                if (daysDiff <= 30) return 'orange';
                return 'red';
            },
            syncObservedPartnerEditFields() {
                if (
                    !this.partner ||
                    this.partnerResolvedStateId !== this.SOCIO_OBSERVADO_ID
                )
                    return;
                this.editPartnerObservations =
                    this.partner.observations !== undefined && this.partner.observations !== null
                        ? String(this.partner.observations)
                        : '';
                this.editPartnerState =
                    this.partner.state && this.partner.state.id_state != null
                        ? Number(this.partner.state.id_state)
                        : this.partnerResolvedStateId;
            },
            getEstados() {
                const base = process.env.VUE_APP_DEGIRA || '';
                const url = `${String(base).replace(/\/?$/, '/')}states/get`;
                this.statesLoadAttempted = false;
                return this.$http
                    .get(url)
                    .then((response) => {
                        let raw = [];
                        const body = response && response.data ? response.data : null;
                        if (Array.isArray(body)) raw = body;
                        else if (body && Array.isArray(body.data)) raw = body.data;
                        else if (body && body.data != null && !Array.isArray(body.data))
                            raw = [body.data];
                        this.states = raw.map((s) => ({
                            ...s,
                            id_state:
                                s && (s.id_state != null ? Number(s.id_state) : NaN),
                            description: s && (s.description != null ? String(s.description) : ''),
                        })).filter((s) => !Number.isNaN(s.id_state));
                    })
                    .catch((err) => {
                        console.error('entryRegisterLite getEstados:', err);
                        this.states = [];
                        eventBus.$emit('toast', {
                            show: true,
                            text: 'No se pudieron cargar los estados para el socio observado.',
                            color: 'warning',
                        });
                    })
                    .finally(() => {
                        this.statesLoadAttempted = true;
                    });
            },
            buildPartnerUpdatePayload() {
                const p = this.partner;
                const visitType = p.id_visit_type_usualy;
                return {
                    alias: p.alias,
                    partner_dni: p.partner_dni,
                    partner_name: p.partner_name,
                    partner_birthdate: p.partner_birthdate
                        ? this.$moment(p.partner_birthdate, 'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY')
                        : undefined,
                    partner_phone: p.partner_phone || null,
                    affiliate_dni: visitType === 2 ? p.affiliate_dni : undefined,
                    affiliate_name: visitType === 2 ? p.affiliate_name : undefined,
                    affiliate_birthdate:
                        visitType === 2 && p.affiliate_birthdate
                            ? this.$moment(p.affiliate_birthdate, 'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY')
                            : undefined,
                    affiliate_phone: visitType === 2 ? p.affiliate_phone : undefined,
                    id_visit_type_usualy: visitType,
                    id_state: Number(this.editPartnerState),
                    observations: this.editPartnerObservations,
                    suggest_membership_amount: p.suggest_membership_amount,
                };
            },
            savePartnerObservationState() {
                if (!this.partner || !this.partner.id_partner) return;
                this.savingPartnerObservations = true;
                const vm = this;
                const data = this.buildPartnerUpdatePayload();
                this.$http
                    .put(`${process.env.VUE_APP_PARTNERS_UPDATE}/${this.partner.id_partner}`, data)
                    .then(async (response) => {
                        if (response) {
                            eventBus.$emit('toast', {
                                show: true,
                                text: 'Estado y observaciones actualizados',
                                color: 'success',
                            });
                            await vm.verifyPartnerStatus();
                            vm.syncObservedPartnerEditFields();
                            if (vm.partnerResolvedStateId === 8) vm.selectPayMethod = 5;
                            vm.getPrice();
                        }
                        vm.savingPartnerObservations = false;
                    })
                    .catch((error) => {
                        console.log(error.response);
                        eventBus.$emit('toast', {
                            show: true,
                            text: error.response && error.response.data && error.response.data.message
                                ? error.response.data.message
                                : 'No se pudo actualizar el socio',
                            color: 'red',
                        });
                        vm.savingPartnerObservations = false;
                    });
            },
            getMethodLine1(text){
                if(!text) return ''
                // Dividir por el paréntesis o por espacios largos
                const parenIndex = text.indexOf('(')
                if(parenIndex !== -1){
                    return text.substring(0, parenIndex).trim()
                }
                // Si no hay paréntesis, dividir por espacios
                const words = text.split(' ')
                if(words.length > 2){
                    return words.slice(0, Math.ceil(words.length / 2)).join(' ')
                }
                return text
            },
            getMethodLine2(text){
                if(!text) return ''
                // Dividir por el paréntesis
                const parenIndex = text.indexOf('(')
                if(parenIndex !== -1){
                    return text.substring(parenIndex).trim()
                }
                // Si no hay paréntesis, dividir por espacios
                const words = text.split(' ')
                if(words.length > 2){
                    return words.slice(Math.ceil(words.length / 2)).join(' ')
                }
                return ''
            },
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
                if (this.pagaEstacionamiento) this.getPriceEstacionamiento()
            },
            getPriceEstacionamiento() {
                if (!this.selectVisit || !this.selectPayMethod || this.partner.id_state == 8) return
                const vm = this
                this.$http.get(process.env.VUE_APP_DEGIRA+"price/get?id_visit_type="+this.selectVisit+"&id_payment_method="+this.selectPayMethod+"&id_receivable_concept=3")
                    .then((response) => {
                        if (response && response.data && response.data.data) {
                            vm.items.other_paid = response.data.data.totalWithPercentage
                            vm.items.other_paid_obs = "ESTACIONAMIENTO"
                        }
                    })
                    .catch(() => {
                        vm.items.other_paid = null
                        vm.items.other_paid_obs = ""
                    })
            },
            onPagaEstacionamientoChange(checked) {
                if (checked) {
                    this.getPriceEstacionamiento()
                } else {
                    if (this.items.other_paid_obs === "ESTACIONAMIENTO") {
                        this.items.other_paid = null
                        this.items.other_paid_obs = ""
                    }
                }
            },
            onPagarALaSalidaChange(checked) {
                if (checked) {
                    this.items.entry_amount_paid = 0
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
                        const all = response.data.data || []
                        const mensualType = all.find((v) => (v.description || '').toUpperCase() === 'MENSUAL')
                        const idMensual = mensualType ? mensualType.id_visit_type : null
                        if (idMensual != null && vm.partner && vm.partner.id_visit_type_usualy === idMensual) {
                            vm.visits = [mensualType]
                            vm.selectVisit = idMensual
                            vm.isMensualLocked = true
                        } else {
                            vm.visits = all.filter((v) => (v.description || '').toUpperCase() !== 'MENSUAL')
                            vm.selectVisit = vm.partner.id_visit_type_usualy
                            vm.isMensualLocked = false
                        }
                        vm.getPrice()
                    }
                })
            },
            async loadPartnerData(){
                this.partner = this.$store.state.partner;
                this.normalizePartnerRootState(this.partner);
                console.log(this.partner, "partner")
                // Si hay un partner, verificar su estado actual desde el backend
                if (
                    this.partner &&
                    (this.partner.id_partner ||
                        this.partner.partner_dni ||
                        this.partner.affiliate_dni)
                ) {
                    await this.verifyPartnerStatus()
                }
            },
            verifyPartnerStatus(){
                let vm = this
                const idP =
                    vm.partner &&
                    vm.partner.id_partner != null &&
                    String(vm.partner.id_partner).trim() !== ''
                        ? Number(vm.partner.id_partner)
                        : NaN;
                const dniRaw = vm.partner.partner_dni || vm.partner.affiliate_dni
                const dniStr =
                    dniRaw != null && String(dniRaw).trim() !== '' ? String(dniRaw).trim() : ''

                const qs = new URLSearchParams()
                qs.set('page', '1')
                qs.set('pageSize', '10')

                const hasPid = Number.isFinite(idP) && idP > 0
                if (hasPid) qs.set('id_partner', String(idP))

                if (dniStr !== '') qs.set('dni', dniStr)

                /** Sin id_partner ni dni no hay manera segura de verificar contra el servidor */
                if (!hasPid && dniStr === '') return Promise.resolve(true)

                return this.$http
                    .get(`${process.env.VUE_APP_PARTNERS}?${qs.toString()}`)
                        .then((res) => {
                            if(res && res.data && res.data.data){
                                const currentPartner = res.data.data
                                if (
                                    hasPid &&
                                    currentPartner &&
                                    Number(currentPartner.id_partner) !== idP
                                ) {
                                    console.warn(
                                        'entryRegisterLite verifyPartnerStatus: respuesta con id_partner distinto, se conserva socio del store.'
                                    )
                                    return true
                                }
                                vm.normalizePartnerRootState(currentPartner)
                                // Si el socio ya está en el establecimiento, actualizar el partner y redirigir
                                if(currentPartner.partner_in_establishment){
                                    vm.partner = currentPartner
                                    vm.$store.commit('setPartner', currentPartner)
                                    eventBus.$emit('toast', { show: true, text: 'Este socio ya está en el establecimiento. No se puede registrar el ingreso nuevamente.', color: "warning" })
                                    vm.$router.push('/access')
                                    return false // Indica que no debe continuar
                                } else {
                                    // Actualizar el partner con los datos más recientes
                                    vm.partner = currentPartner
                                    vm.normalizePartnerRootState(vm.partner)
                                    vm.$store.commit('setPartner', currentPartner)
                                    if (vm.partnerResolvedStateId === vm.SOCIO_OBSERVADO_ID) {
                                        if (!vm.states || vm.states.length === 0) {
                                            vm.getEstados().then(() => vm.syncObservedPartnerEditFields())
                                        } else {
                                            vm.syncObservedPartnerEditFields()
                                        }
                                    }
                                    return true // Indica que puede continuar
                                }
                            }
                            return true
                        })
                        .catch((err) => {
                            console.log('Error al verificar estado del socio:', err)
                            return true // En caso de error, permitir continuar
                        });
            },
            /** Replica id_state en la raíz del objeto socio si falta ahí pero viene dentro de state. */
            normalizePartnerRootState(partnerObj) {
                if (!partnerObj) return;
                const raw = partnerObj.id_state;
                const rootMissing =
                    raw === undefined ||
                    raw === null ||
                    raw === '' ||
                    String(raw).trim() === '';
                if (!rootMissing) return;
                const nested =
                    partnerObj.state != null ? Number(partnerObj.state.id_state) : NaN;
                if (!Number.isNaN(nested)) {
                    this.$set(partnerObj, 'id_state', nested);
                }
            },
            icon(){
              let icon = {icon: 'mdi-qrcode-scan', color: 'orange'}
              if(this.partner != null){
                  if(this.partner){
                      switch (this.partnerResolvedStateId) {
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
            showConfirmationDialog() {
                // Preparar el mensaje coloquial
                const alias = this.getCleanAlias
                const monto = this.total > 0 ? `$${this.total}` : '$0'
                const mensaje = `¿Confirma el ingreso de ${alias} y que ha cobrado ${monto}?`
                
                const dialog = {
                    show: true,
                    title: "Confirmar Ingreso",
                    type: 'warning',
                    isHtml: false,
                    closeDialog: true,
                    text: mensaje,
                    goTo: [
                        {
                            title: 'Confirmar',
                            icon: "mdi-check-circle",
                            route: null,
                            action: () => {
                                this.proceedWithRegistration()
                            }
                        },
                        {
                            title: 'Cancelar',
                            icon: "mdi-close-circle",
                            route: null,
                            action: () => {
                                const closeDialog = { show: false, title: "", text: "", type: 'success' }
                                eventBus.$emit('ConfirmDialog', closeDialog)
                            }
                        }
                    ]
                }
                
                eventBus.$emit('ConfirmDialog', dialog)
            },
            entryRegisterLite() {
                // Verificar si el socio ya está en el establecimiento antes de registrar
                if(this.partner && this.partner.partner_in_establishment){
                    eventBus.$emit('toast', { show: true, text: 'Este socio ya está en el establecimiento. No se puede registrar el ingreso nuevamente.', color: "warning" })
                    this.$store.commit('setPartner', null)
                    this.$router.push('/access')
                    return
                }
                if(!this.selectVisit){
                    eventBus.$emit('toast', { show: true, text: 'Debe seleccionar un tipo de visitante', color: "red" })
                    return
                }
                if(!this.selectPayMethod){
                    eventBus.$emit('toast', { show: true, text: 'Debe seleccionar un metodo de pago', color: "red" })
                    return
                }
                if (this.pagarALaSalida) {
                    this.items.entry_amount_paid = 0
                }
                if(this.$refs.form.validate()){
                    if (this.pagarALaSalida) {
                        this.showPagarALaSalidaConfirmDialog()
                    } else {
                        this.showConfirmationDialog()
                    }
                }
            },
            showPagarALaSalidaConfirmDialog() {
                const monto = this.total > 0 ? this.total : 0
                const dialog = {
                    show: true,
                    title: "Confirmar: pagar entrada a la salida",
                    type: 'warning',
                    isHtml: false,
                    closeDialog: true,
                    text: `El socio no abonará la entrada ahora. El monto de $${monto} quedará pendiente y deberá pagarse al registrar la salida. ¿Confirmar registro de entrada?`,
                    goTo: [
                        {
                            title: 'Sí, registrar entrada',
                            icon: "mdi-check-circle",
                            route: null,
                            action: () => {
                                const closeDialog = { show: false, title: "", text: "", type: 'success' }
                                eventBus.$emit('ConfirmDialog', closeDialog)
                                this.proceedWithRegistration()
                            }
                        },
                        {
                            title: 'Cancelar',
                            icon: "mdi-close-circle",
                            route: null,
                            action: () => {
                                const closeDialog = { show: false, title: "", text: "", type: 'success' }
                                eventBus.$emit('ConfirmDialog', closeDialog)
                            }
                        }
                    ]
                }
                eventBus.$emit('ConfirmDialog', dialog)
            },
            proceedWithRegistration() {
                // Cerrar el diálogo de confirmación
                const closeDialog = { show: false, title: "", text: "", type: 'success' }
                eventBus.$emit('ConfirmDialog', closeDialog)
                
                // Proceder con el registro
                this.loading = true
                let vm = this
                let pay_method_percent = this.methods.find((item) => item.id_payment_method == this.selectPayMethod).percent
                let entry_amount_paid = this.price
                let other_paid = (this.items.other_paid) ? parseFloat(this.items.other_paid) * (parseFloat(pay_method_percent) + 1): 0
                if(this.methods.find((item) => item.id_payment_method == this.selectPayMethod).id_payment_method == 5){
                    entry_amount_paid = 0
                    other_paid = 0
                }
                if (this.pagarALaSalida) {
                    entry_amount_paid = 0
                    other_paid = 0
                }
                const entry_visit_obs = this.pagarALaSalida
                    ? (this.items.entry_visit_obs ? 'PAGAR_AL_SALIR — ' + this.items.entry_visit_obs : 'PAGAR_AL_SALIR')
                    : this.items.entry_visit_obs
                // had_to_paid: total que debe abonar (entrada + extras con recargo). Si "pagar a la salida", ese total queda pendiente.
                const had_to_paid_val = this.pagarALaSalida
                    ? (this.items.other_paid ? this.price + parseFloat(this.items.other_paid) * (parseFloat(pay_method_percent) + 1) : this.price)
                    : ((this.items.other_paid) ? this.price + parseFloat(this.items.other_paid) * (parseFloat(pay_method_percent) + 1) : this.price)
                let data = {
                    "id_partner": this.partner.id_partner,
                    "id_state": this.partner.id_state,
                    "id_visit_type": this.selectVisit,
                    "other_visit_obs" : this.items.other_visit_obs,
                    "entry_visit_obs" : entry_visit_obs,
                    "other_paid_obs": (other_paid && !this.pagarALaSalida) ? this.items.other_paid_obs : "",
                    "entry_amount_paid" : entry_amount_paid,
                    "id_bracelet_1": '',
                    "id_bracelet_2": '', 
                    "id_payment_method": this.selectPayMethod, 
                    "had_to_paid": had_to_paid_val,
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
                                                    {title: 'Buscar otro socio', icon: "mdi-account-search", route: '/partnerSearch'}
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
                                // Limpiar el partner del store después de registrar exitosamente
                                vm.$store.commit('setPartner', null)
                            }
                            vm.loading = false
                        })
                        .catch((error)=>{
                            console.log(error.response)
                            console.log(error.response.data.message)
                            eventBus.$emit('toast', { show: true, text: error.response.data.message, color: "red" })
                            vm.loading = false
                        })
            },
        }
    }
</script>

<style scoped>
.observed-banner__line {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem 0.75rem;
    line-height: 1.35;
    width: 100%;
    box-sizing: border-box;
}
.observed-banner__left {
    flex: 1 1 0;
    min-width: 0;
    gap: 0.25rem 0.35rem;
}
.observed-banner__chip-only {
    flex: 0 0 auto;
    margin-left: auto;
}
@media (max-width: 599px) {
    .observed-banner__line {
        flex-wrap: wrap;
    }
    .observed-banner__chip-only {
        width: 100%;
        margin-left: 0;
        display: flex;
        justify-content: flex-end;
    }
}
.observed-banner__lead {
    white-space: nowrap;
}
.observed-partner-alert >>> .v-alert__wrapper {
    width: 100%;
}
.observed-partner-alert >>> .v-alert__content {
    flex: 1 1 0%;
    min-width: 0;
}
.entry-extras-inline {
    gap: 0.25rem 1rem;
    row-gap: 0.5rem;
}
.entry-extras-inline__amount {
    min-width: 12rem;
    flex: 1 1 200px;
    max-width: 100%;
}
.entry-obs-submit-inline {
    gap: 0 0.75rem;
    row-gap: 0.65rem;
    align-items: stretch;
}
.entry-obs-submit-inline__textarea {
    flex: 1 1 18rem;
    min-width: 0;
    max-width: 100%;
}
.entry-obs-submit-inline__btn-wrap {
    flex: 0 0 auto;
    width: 100%;
}
@media (min-width: 960px) {
    .entry-obs-submit-inline {
        flex-wrap: nowrap;
        align-items: center;
    }
    .entry-obs-submit-inline__btn-wrap {
        width: auto;
        justify-content: flex-start;
        min-width: 14rem;
    }
}
</style>