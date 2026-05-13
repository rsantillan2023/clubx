<template>
    <div class="exit-register-container">
        <!-- Header -->
        <v-row no-gutters class="mb-4">
            <v-col cols="12">
                <v-card class="header-card" elevation="2">
                    <v-card-title class="flex-column align-stretch pa-4">
                        <div class="d-flex align-center justify-space-between w-100 flex-nowrap">
                            <div class="d-flex align-center min-width-0 pr-2 flex-grow-1">
                                <v-icon color="orange" large class="mr-3 flex-shrink-0">mdi-exit-run</v-icon>
                                <h2 class="mb-0 orange--text font-weight-bold text-truncate">
                                    Registro de Salida
                                </h2>
                            </div>
                            <div
                                v-if="partner"
                                class="exit-header-monto-abonar orange--text font-weight-black text-end flex-shrink-0 align-self-center"
                            >
                                ${{ montoAbonarFormateado }}
                            </div>
                        </div>
                        <div
                            v-if="partner"
                            class="w-100 d-flex justify-end mt-1"
                        >
                            <span class="exit-header-monto-abonar-leyenda blue--text text--darken-2 font-weight-bold">
                                Monto a abonar
                            </span>
                        </div>
                        <div class="w-100 mt-2">
                            <div v-if="$vuetify.breakpoint.mdAndUp" class="text-caption grey--text mb-1">
                                Complete los datos para registrar la salida del socio
                            </div>
                        </div>
                    </v-card-title>
                </v-card>
            </v-col>
        </v-row>

        <v-row no-gutters v-if="partner">
            <!-- Socio + indicadores -->
            <v-col cols="12">
                <!-- Socio: una fila — nombre a la izquierda; tipo de visita y código a la derecha -->
                <div class="exit-partner-strip mb-4 px-1">
                    <div class="exit-partner-strip-inner d-flex flex-nowrap align-baseline justify-space-between">
                        <span class="exit-partner-strip-name orange--text font-weight-bold text-uppercase">
                            {{ exitPartnerPickerHeadTitle }}
                        </span>
                        <div class="exit-partner-strip-right d-flex flex-nowrap align-baseline justify-end text-end">
                            <span class="exit-partner-strip-vtype light-blue--text text--darken-2 font-weight-bold">
                                {{ partner.visit_type?.description || 'Tipo de Visita' }}
                            </span>
                            <span class="exit-partner-strip-sep grey--text" aria-hidden="true">·</span>
                            <span class="exit-partner-strip-bracelet">
                                {{ formatBracelet(partner.id_bracelet_1) }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Indicadores visita: una fila entre nombre y tarjeta detalle -->
                <div class="exit-visit-indicators-row mb-3 px-1">
                    <div class="exit-visit-indicators-inner d-flex flex-nowrap justify-space-between align-stretch">
                        <div class="exit-visit-indicator">
                            <v-icon color="orange" x-small class="mb-1">mdi-calendar</v-icon>
                            <div class="exit-visit-indicator-label">Fecha entrada</div>
                            <div class="exit-visit-indicator-value">
                                {{ partner.visit_date ? formatDate(partner.visit_date, 'DD/MM/YYYY') : (partner.hour_entry ? formatDate(partner.hour_entry, 'DD/MM/YYYY') : 'N/A') }}
                            </div>
                        </div>
                        <div class="exit-visit-indicator">
                            <v-icon color="orange" x-small class="mb-1">mdi-clock-outline</v-icon>
                            <div class="exit-visit-indicator-label">Hora</div>
                            <div class="exit-visit-indicator-value">{{ formateHour(partner.hour_entry) || 'N/A' }}</div>
                        </div>
                        <div class="exit-visit-indicator">
                            <v-icon color="orange" x-small class="mb-1">mdi-calendar-week</v-icon>
                            <div class="exit-visit-indicator-label">Día</div>
                            <div class="exit-visit-indicator-value">{{ formatDay(partner.id_day) || 'N/A' }}</div>
                        </div>
                        <div class="exit-visit-indicator">
                            <v-icon color="orange" x-small class="mb-1">mdi-calendar-clock</v-icon>
                            <div class="exit-visit-indicator-label">Últ. visita</div>
                            <div class="exit-visit-indicator-value">{{ partner.last_visit ? formatDate(partner.last_visit, 'DD/MM/YYYY') : 'N/A' }}</div>
                        </div>
                    </div>
                    <v-divider class="exit-visit-indicators-split"></v-divider>
                    <div class="exit-visit-indicators-inner exit-visit-indicators-inner--entry d-flex flex-nowrap justify-space-between align-stretch">
                        <div class="exit-visit-indicator">
                            <v-icon color="green" x-small class="mb-1">mdi-cash-check</v-icon>
                            <div class="exit-visit-indicator-label">Monto pagado entrada</div>
                            <div class="exit-visit-indicator-value green--text">${{ partner.entry_amount_paid || 0 }}</div>
                        </div>
                        <div class="exit-visit-indicator">
                            <v-icon color="green" x-small class="mb-1">mdi-cash-plus</v-icon>
                            <div class="exit-visit-indicator-label">Extra pagado entrada</div>
                            <div class="exit-visit-indicator-value green--text">${{ partner.extra_entry || 0 }}</div>
                        </div>
                        <div class="exit-visit-indicator exit-visit-indicator--notes">
                            <v-icon color="green" x-small class="mb-1">mdi-note-text</v-icon>
                            <div class="exit-visit-indicator-label">Obs. extra entrada</div>
                            <div class="exit-visit-indicator-value exit-visit-indicator-notes-value text-body-2">
                                {{ partner.extra_entry_obs || '—' }}
                            </div>
                        </div>
                    </div>
                    <v-divider class="exit-visit-indicators-split"></v-divider>
                    <!-- Consumos / mínimo (lo más relevante de la pantalla) -->
                    <div
                        class="exit-visit-indicators-inner exit-visit-indicators-inner--consumos d-flex flex-nowrap justify-space-between align-stretch"
                    >
                        <div
                            class="exit-visit-indicator exit-visit-indicator--consumo-main exit-visit-indicator--link"
                            role="button"
                            tabindex="0"
                            :aria-disabled="!(partner && partner.id_bracelet_1)"
                            aria-label="Ver consumos del socio"
                            title="Ver consumos"
                            @click="goToConsumedBracelet"
                            @keydown.enter.prevent="goToConsumedBracelet"
                            @keydown.space.prevent="goToConsumedBracelet"
                        >
                            <v-icon color="orange" small class="mb-1">mdi-cash</v-icon>
                            <div class="exit-visit-indicator-label">Consumo actual</div>
                            <div class="exit-visit-indicator-value orange--text font-weight-bold">${{ totalConsumoMostradoFormateado }}</div>
                        </div>
                        <div class="exit-visit-indicator exit-visit-indicator--consumo-main">
                            <v-icon color="deep-orange" small class="mb-1">mdi-package-variant</v-icon>
                            <div class="exit-visit-indicator-label">Descartables</div>
                            <div class="exit-visit-indicator-value deep-orange--text font-weight-bold">
                                <template v-if="consumeBreakdownLoaded">${{ consumoFueraMontoFormateado }}</template>
                                <template v-else><span class="grey--text">…</span></template>
                            </div>
                        </div>
                        <div
                            class="exit-visit-indicator exit-visit-indicator--minimo-wrap"
                            :class="{ 'exit-visit-indicator--minimo-alert': aplicaConsumoMinimo }"
                        >
                            <v-icon :color="aplicaConsumoMinimo ? 'error' : 'orange'" small class="mb-1">
                                mdi-chart-box-outline
                            </v-icon>
                            <div class="exit-visit-indicator-label">Valor mínimo consumo</div>
                            <div
                                class="exit-visit-indicator-value font-weight-bold"
                                :class="aplicaConsumoMinimo ? 'error--text' : 'orange--text'"
                            >
                                ${{ consumedMinFormateado }}
                            </div>
                        </div>
                        <div
                            class="exit-visit-indicator exit-visit-indicator--entrada-debe"
                            :class="{ 'exit-visit-indicator--entrada-debe-alert': mostrarDebeEntradaEstacionamiento }"
                        >
                            <v-icon
                                :color="mostrarDebeEntradaEstacionamiento ? 'error' : 'grey'"
                                small
                                class="mb-1"
                            >
                                mdi-cash-multiple
                            </v-icon>
                            <div class="exit-visit-indicator-label exit-visit-indicator-label--wrap">
                                Debe entrada / estacionamiento
                            </div>
                            <div
                                class="exit-visit-indicator-value font-weight-bold"
                                :class="mostrarDebeEntradaEstacionamiento ? 'error--text' : 'grey--text'"
                            >
                                ${{ pendienteEntradaEfectivoFormateado }}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Card «Detalles de la Visita»: oculto temporalmente (reactivar con showDetallesVisitaCard) -->
                <v-card
                    v-if="showDetallesVisitaCard"
                    class="mb-4"
                    elevation="2"
                    outlined
                >
                    <v-card-title class="orange white--text pa-3">
                        <v-icon left>mdi-calendar-clock</v-icon>
                        Detalles de la Visita
                    </v-card-title>
                    <v-card-text class="pa-4">
                        <!-- «Debe en consumos» (consumo actual / mínimo / descartables están en indicadores arriba) -->
                        <v-row dense class="mb-0 align-center flex-nowrap justify-center" style="flex-wrap: nowrap; overflow-x: auto;">
                            <v-col cols="auto" class="pa-1 flex-grow-0">
                                <div class="text-center" style="min-width: 75px;">
                                    <v-icon color="error" x-small>mdi-shopping</v-icon>
                                    <div class="text-caption error--text font-weight-medium" style="font-size: 0.65rem; line-height: 1.2;">Debe en Consumos</div>
                                    <div class="font-weight-bold error--text" style="font-size: 0.8rem; line-height: 1.2;">${{ partner.visit_amount_consumed || 0 }}</div>
                                </div>
                            </v-col>
                        </v-row>

                    </v-card-text>
                </v-card>
            </v-col>

            <!-- Registro de Cobro — fila aparte debajo de los indicadores -->
            <v-col cols="12" class="exit-register-cobro-wrap px-1">
                <v-card class="payment-card" elevation="2" outlined>
                    <v-card-title class="orange white--text pa-3">
                        <v-icon left>mdi-cash-register</v-icon>
                        Registro de Cobro
                    </v-card-title>
                    <v-card-text class="pa-4">
                        <div v-if="methods.length" class="exit-pay-methods-wrap mb-3">
                            <div class="text-caption grey--text mb-2 font-weight-medium">Método de pago</div>
                            <div class="exit-pay-methods-toggle d-flex flex-nowrap">
                                <v-btn
                                    v-for="m in methods"
                                    :key="m.id_payment_method"
                                    depressed
                                    type="button"
                                    class="exit-pay-method-btn text-none"
                                    :color="selectPayMethod === m.id_payment_method ? 'orange' : undefined"
                                    :dark="selectPayMethod === m.id_payment_method"
                                    :outlined="selectPayMethod !== m.id_payment_method"
                                    @click="selectPayMethod = m.id_payment_method"
                                >
                                    <span class="exit-pay-method-btn-text">{{ m.description }}</span>
                                </v-btn>
                            </div>
                        </div>

                        <v-divider class="my-3" v-if="selectPayMethod"></v-divider>

                        <div
                            v-if="selectPayMethod"
                            class="exit-registrar-actions mb-3"
                        >
                            <v-btn 
                                :loading="loading" 
                                color="red" 
                                large
                                dark 
                                class="font-weight-bold exit-registrar-actions__primary"
                                @click="showConfirmDialog">
                                <v-icon left>mdi-exit-run</v-icon>
                                Registrar Salida
                            </v-btn>
                            <v-btn
                                large
                                outlined
                                color="deep-orange darken-2"
                                class="font-weight-bold exit-registrar-actions__secondary text-none"
                                @click="openNoPagaObservadoDialog"
                            >
                                <v-icon left color="deep-orange darken-2">mdi-account-alert</v-icon>
                                <span class="exit-registrar-no-paga-label text-center">
                                    <span class="d-block">No paga</span>
                                    <span class="d-block text-caption font-weight-medium">Marcar como observado</span>
                                </span>
                            </v-btn>
                        </div>

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

        <v-dialog v-model="noPagaObservadoDialog" max-width="520" persistent scrollable>
            <v-card>
                <v-card-title class="deep-orange darken-2 white--text py-3">
                    <v-icon left color="white">mdi-account-alert</v-icon>
                    No paga / marcar como observado
                </v-card-title>
                <v-card-text class="pt-4">
                    <p v-if="partner" class="text-body-2 mb-3 orange--text font-weight-medium">
                        {{ exitPartnerPickerHeadTitle }}
                    </p>
                    <v-alert dense outlined type="info" class="mb-4 text-caption">
                        Se guardará el <strong>estado</strong> y las <strong>observaciones</strong> del socio, y después se <strong>anotará NO_PAGO</strong> en su ficha (mismo uso que Esquema mensual).
                    </v-alert>
                    <v-select
                        v-model="modalPartnerSelectedState"
                        :items="modalPartnerStates"
                        label="Estado del socio"
                        item-text="description"
                        item-value="id_state"
                        outlined
                        dense
                        :loading="modalPartnerStatesLoading"
                        :menu-props="{ offsetY: true, maxHeight: 280 }"
                    />
                    <v-textarea
                        v-model="modalPartnerObservations"
                        label="Observaciones del socio"
                        rows="4"
                        outlined
                        dense
                        hide-details="auto"
                    />
                </v-card-text>
                <v-card-actions class="pb-4 px-4">
                    <v-spacer></v-spacer>
                    <v-btn text color="grey" @click="noPagaObservadoDialog = false" :disabled="modalPartnerSaving">
                        Cancelar
                    </v-btn>
                    <v-btn color="deep-orange darken-2" dark :loading="modalPartnerSaving" @click="confirmNoPagaObservado">
                        <v-icon left>mdi-content-save</v-icon>
                        Guardar
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

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
                noPagaObservadoDialog: false,
                modalPartnerStates: [],
                modalPartnerStatesLoading: false,
                modalPartnerSaving: false,
                modalPartnerSelectedState: 4,
                modalPartnerObservations: '',
                /** SOCIO_OBSERVADO (coincide con backend EPartnerState) */
                SOCIO_OBSERVADO_ID: 4,
                consumeBreakdownLoaded: false,
                consumeTotalTicket: 0,
                consumeTotalDentroMinimo: 0,
                consumeTotalFueraMinimo: 0,
                /** Pantalla en construcción: tarjeta «Detalles de la Visita» */
                showDetallesVisitaCard: false,
                
            }
        },
        mounted() {
            this.loadPartnerData();
            this.getTipos();
            this.getPaymentMethod();
            this.loadVisitData();
            this.fetchConsumeBreakdown();
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
            /** Pendiente de entrada: had_to_paid menos entry_amount_paid y extra_entry (no negativo). */
            pendienteEntradaEfectivo() {
                if (!this.partner) return 0
                const had = parseFloat(this.partner.had_to_paid || 0)
                const entry = parseFloat(this.partner.entry_amount_paid || 0)
                const extra = parseFloat(this.partner.extra_entry || 0)
                if (Number.isNaN(had)) return 0
                return Math.max(0, had - entry - extra)
            },
            /** Mostrar «Debe entrada/estacionamiento» solo si queda pendiente (entrada + extra no cubren had_to_paid). */
            mostrarDebeEntradaEstacionamiento() {
                return this.pendienteEntradaEfectivo > 1e-6
            },
            /** Pendiente entrada ($) para indicadores */
            pendienteEntradaEfectivoFormateado() {
                const n = Number(this.pendienteEntradaEfectivo || 0)
                if (Number.isNaN(n)) return '0,00'
                return n.toLocaleString('es-AR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })
            },
            /** Total ticket (todos los productos); con desglose, coincide con la suma de get/consume. */
            totalConsumoMostrado() {
                if (!this.partner) return 0
                if (this.consumeBreakdownLoaded) return this.consumeTotalTicket
                return parseFloat(this.partner.total || 0)
            },
            /** Consumo que compara contra el mínimo (sin líneas «Fuera de consumo Minimo-»). */
            consumoDentroParaAlerta() {
                if (!this.partner) return 0
                if (this.consumeBreakdownLoaded) return this.consumeTotalDentroMinimo
                return parseFloat(this.partner.total || 0)
            },
            /** Descartables ($) para indicadores */
            consumoFueraMontoFormateado() {
                const n = Number(this.consumeTotalFueraMinimo || 0)
                if (Number.isNaN(n)) return '0,00'
                return n.toLocaleString('es-AR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })
            },
            /** Consumo actual ($) para indicadores */
            totalConsumoMostradoFormateado() {
                const n = Number(this.totalConsumoMostrado || 0)
                if (Number.isNaN(n)) return '0,00'
                return n.toLocaleString('es-AR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })
            },
            consumedMinFormateado() {
                const n = Number(this.consumedMin || 0)
                if (Number.isNaN(n)) return '0,00'
                return n.toLocaleString('es-AR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })
            },
            /** Aviso rojo: el consumo aplicable al mínimo no alcanza el mínimo del club. */
            aplicaConsumoMinimo() {
                if (!this.partner) return false
                const min = parseFloat(this.consumedMin || 0)
                if (!(min > 0)) return false
                return this.consumoDentroParaAlerta < min - 1e-6
            },
            /**
             * Base de consumo a cobrar al salir: si lo aplicable al mínimo &lt; mínimo → mínimo + fuera de mínimo;
             * si no → total del ticket (dentro + fuera).
             */
            montoBaseConsumoVisita() {
                const min = parseFloat(this.consumedMin || 0)
                if (!this.partner) return 0
                if (this.consumeBreakdownLoaded) {
                    const dentro = this.consumeTotalDentroMinimo
                    const fuera = this.consumeTotalFueraMinimo
                    const ticket = this.consumeTotalTicket
                    if (dentro < min - 1e-6) return min + fuera
                    return ticket
                }
                const t = parseFloat(this.partner.total || 0)
                if (t < min - 1e-6) return min
                return t
            },
            montoAbonar() {
                if (!this.partner) return 0
                let total = this.montoBaseConsumoVisita
                total += this.pendienteEntradaEfectivo
                if(this.items.other_exit_paid) total +=  parseFloat(this.items.other_exit_paid)
                if(this.methods.length > 0){
                    let pay_method_percent = this.methods.find((item) => item.id_payment_method == this.selectPayMethod).percent
                    if(parseFloat(pay_method_percent) > 0) total += total*parseFloat(pay_method_percent)
                    if(this.methods.find((item) => item.id_payment_method == this.selectPayMethod).id_payment_method == 5) total = 0
                }
                return total
            },
            /** Monto total a cobrar formateado para el encabezado */
            montoAbonarFormateado() {
                const n = Number(this.montoAbonar)
                if (Number.isNaN(n)) return '0,00'
                return n.toLocaleString('es-AR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })
            },
            
            difference(){
                let difference = this.montoAbonar
                if(this.montoAbonar && this.items.exit_amount_paid){
                    difference = this.montoAbonar - this.items.exit_amount_paid
                }
                return difference
            },
            /** Misma lógica que el picker en «Ver consumos»: alias visible o nombre del socio */
            exitPartnerPickerHeadTitle() {
                if (!this.partner) return '—'
                const aliasFmt = this.formatAlias(this.partner.alias)
                if (aliasFmt && String(aliasFmt).trim() !== '') return aliasFmt
                return this.partner.partner_name || '—'
            },
        },
        methods:{
            goToConsumedBracelet() {
                const id = this.partner && this.partner.id_bracelet_1
                if (id == null || String(id).trim() === '') return
                this.$router.push({
                    path: '/consumed',
                    query: { id_bracelet: String(id) },
                })
            },
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
                if (!vm.partner) return
                this.$http.get(process.env.VUE_APP_DEGIRA+"visits_types/get")
                .then((response)=>{
                    if(response){
                        const usual = vm.partner.id_visit_type_usualy
                        vm.visits = response.data.data.filter((item) => {
                            if (usual == null || usual === '') return true
                            if(usual == 1 || usual == 4){
                                return item.id_visit_type == usual
                            }
                            if(usual == 2){
                                return [1,2,4].includes(item.id_visit_type)
                            }
                            if(usual == 3) return true
                            return true
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
            /** Productos «fuera de mínimo»: prefijo en description o long_description (donde suelen cargarlo en catálogo). */
            isProductoFueraConsumoMinimo(product) {
                const prefixes = ['fuera de consumo minimo-', 'fuera de consumo mínimo-']
                const match = (s) => {
                    const t = String(s || '').trim().toLowerCase()
                    return prefixes.some((pre) => t.startsWith(pre))
                }
                return match(product.description) || match(product.long_description)
            },
            fetchConsumeBreakdown() {
                const id = this.partner && this.partner.id_bracelet_1
                if (!id) {
                    this.consumeBreakdownLoaded = false
                    return
                }
                this.$http.get(
                    process.env.VUE_APP_DEGIRA +
                        'consumptions/get/consume?id_bracelet=' +
                        encodeURIComponent(String(id))
                )
                    .then((res) => {
                        const products = (res.data && res.data.data && res.data.data.products) ? res.data.data.products : []
                        let totalTicket = 0
                        let totalFuera = 0
                        products.forEach((p) => {
                            const q = parseInt(p.quantity || 0, 10)
                            const line = parseFloat(p.price || 0) * q
                            totalTicket += line
                            if (this.isProductoFueraConsumoMinimo(p)) {
                                totalFuera += line
                            }
                        })
                        this.consumeTotalTicket = totalTicket
                        this.consumeTotalFueraMinimo = totalFuera
                        this.consumeTotalDentroMinimo = totalTicket - totalFuera
                        this.consumeBreakdownLoaded = true
                    })
                    .catch(() => {
                        this.consumeBreakdownLoaded = false
                    })
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
            /** Igual que ConsumedPickPartner: últimos dígitos del brazalete en la primera fila */
            formatBracelet(bracelet) {
                if (!bracelet) return '—'
                const s = String(bracelet)
                return s.length > 3 ? s.slice(-3) : s
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
            async openNoPagaObservadoDialog() {
                if (!this.partner || !this.partner.id_partner) {
                    eventBus.$emit('toast', {
                        show: true,
                        text: 'No hay datos del socio (id_partner) para actualizar.',
                        color: 'warning',
                    })
                    return
                }
                this.modalPartnerObservations =
                    this.partner.observations !== undefined && this.partner.observations !== null
                        ? String(this.partner.observations)
                        : ''
                this.modalPartnerSelectedState = this.SOCIO_OBSERVADO_ID
                this.noPagaObservadoDialog = true
                await this.getModalPartnerStatesList()
            },
            async getModalPartnerStatesList() {
                const base = process.env.VUE_APP_DEGIRA || ''
                const url = `${String(base).replace(/\/?$/, '/')}states/get`
                this.modalPartnerStatesLoading = true
                try {
                    const res = await this.$http.get(url)
                    let raw = []
                    const body = res && res.data ? res.data : null
                    if (Array.isArray(body)) raw = body
                    else if (body && Array.isArray(body.data)) raw = body.data
                    else if (body && body.data != null && !Array.isArray(body.data))
                        raw = [body.data]
                    this.modalPartnerStates = raw
                        .filter((x) => x && x.id_state != null)
                        .map((s) => ({
                            ...s,
                            id_state: Number(s.id_state),
                            description: s.description != null ? String(s.description) : '',
                        }))
                } catch (e) {
                    console.error('exitRegister states/get:', e)
                    this.modalPartnerStates = []
                    eventBus.$emit('toast', {
                        show: true,
                        text: 'No se pudieron cargar los estados.',
                        color: 'warning',
                    })
                } finally {
                    this.modalPartnerStatesLoading = false
                }
            },
            buildPartnerExitUpdatePayloadFromModal() {
                const p = this.partner
                const visitType = p.id_visit_type_usualy
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
                            ? this.$moment(p.affiliate_birthdate, 'YYYY-MM-DD HH:mm:ss').format(
                                  'DD/MM/YYYY'
                              )
                            : undefined,
                    affiliate_phone: visitType === 2 ? p.affiliate_phone : undefined,
                    id_visit_type_usualy: visitType,
                    id_state: Number(this.modalPartnerSelectedState),
                    observations: this.modalPartnerObservations,
                    suggest_membership_amount: p.suggest_membership_amount,
                }
            },
            applyModalStateToPartner() {
                const selected = this.modalPartnerStates.find(
                    (s) => Number(s.id_state) === Number(this.modalPartnerSelectedState)
                )
                if (!selected) return
                const idSt = Number(selected.id_state)
                this.partner.id_state = idSt
                const actions = selected.actions ||
                    (this.partner.state && this.partner.state.actions) || { description: '', id_action: null }
                this.partner.state = {
                    id_state: idSt,
                    description: selected.description,
                    actions,
                }
            },
            confirmNoPagaObservado() {
                if (!this.partner || !this.partner.id_partner) return
                if (this.modalPartnerSelectedState === null || this.modalPartnerSelectedState === '') {
                    eventBus.$emit('toast', { show: true, text: 'Seleccione un estado.', color: 'warning' })
                    return
                }
                const idPartner = Number(this.partner.id_partner)
                if (!idPartner || Number.isNaN(idPartner)) {
                    eventBus.$emit('toast', { show: true, text: 'id_partner inválido.', color: 'red' })
                    return
                }
                const partnersRoot = process.env.VUE_APP_PARTNERS || ''
                const patchUrl = `${String(partnersRoot).replace(/\/?$/, '/')}${idPartner}/no-paga`

                this.modalPartnerSaving = true
                const vm = this
                const putData = this.buildPartnerExitUpdatePayloadFromModal()
                this.$http
                    .put(`${process.env.VUE_APP_PARTNERS_UPDATE}/${idPartner}`, putData)
                    .then(() => vm.$http.patch(patchUrl, {}))
                    .then((patchRes) => {
                        vm.applyModalStateToPartner()
                        vm.partner.observations = vm.modalPartnerObservations || ''
                        const pack =
                            patchRes &&
                            patchRes.data &&
                            patchRes.data.data &&
                            patchRes.data.data.partner
                                ? patchRes.data.data.partner
                                : null
                        if (pack && pack.observations != null) vm.partner.observations = pack.observations

                        vm.$store.commit('setPartner', vm.partner)
                        vm.noPagaObservadoDialog = false
                        eventBus.$emit('toast', {
                            show: true,
                            text: 'Estado y observaciones guardados; anotado NO_PAGO.',
                            color: 'success',
                        })
                        vm.modalPartnerSaving = false
                    })
                    .catch((err) => {
                        console.log(err.response)
                        eventBus.$emit('toast', {
                            show: true,
                            text:
                                err.response && err.response.data && err.response.data.message
                                    ? err.response.data.message
                                    : 'No se pudo completar la acción',
                            color: 'red',
                        })
                        vm.modalPartnerSaving = false
                    })
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

                    const baseConsumo = this.montoBaseConsumoVisita
                    let exit_amount_paid = baseConsumo * (parseFloat(pay_method_percent) + 1)

                    const pendienteEntrada = this.pendienteEntradaEfectivo
                    exit_amount_paid += pendienteEntrada

                    let other_paid = (this.items.other_exit_paid) ? parseFloat(this.items.other_exit_paid) * (parseFloat(pay_method_percent) +1) : 0

                    if(this.methods.find((item) => item.id_payment_method == this.selectPayMethod).id_payment_method == 5){
                        exit_amount_paid = 0
                        other_paid = 0
                    }
                    
                    let debio_pagar_consumo = baseConsumo * (parseFloat(pay_method_percent) + 1) 

                    let debio_pagar_other_exit_paid = (this.items.other_exit_paid) ? parseFloat(this.items.other_exit_paid) *
                        (parseFloat(pay_method_percent) + 1) : 0

                    const had_to_paid_total = debio_pagar_consumo + debio_pagar_other_exit_paid + pendienteEntrada

                    let data = {
                        "id_state": "2",
                        "exit_visit_obs": this.items.exit_visit_obs,
                        "exit_amount_payed": exit_amount_paid,
                        "other_paid": other_paid,
                        "had_to_paid": had_to_paid_total,
                        "other_paid_obs": this.items.other_exit_paid_obs,
                        "id_payment_method": this.selectPayMethod,
                    }
                    this.$http.put(process.env.VUE_APP_DEGIRA+'visits/exit/'+this.partner.id_visit, data)
                        .then((response)=>{
                            if(response){
                                let dialog = { show: true, 
                                                title: "Se ha realizado el egreso correctamente", 
                                                type: 'success',
                                                goTo: {title: 'Volver', icon: "mdi-arrow-left", route: '/verConsumos'},
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

.exit-header-monto-abonar {
    font-size: clamp(1.35rem, 4.8vw, 2rem);
    line-height: 1.1;
    letter-spacing: -0.02em;
    white-space: nowrap;
}

.exit-header-monto-abonar-leyenda {
    font-size: clamp(0.92rem, 3vw, 1.05rem);
    line-height: 1.25;
    white-space: nowrap;
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

.exit-register-cobro-wrap {
    margin-top: 12px;
    padding-top: 20px;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
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

/* Bloque socio: nombre a la izquierda; tipo de visita · código agrupados a la derecha */
.exit-partner-strip-inner {
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

.exit-partner-strip-name {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: clamp(1.2rem, 5vw, 1.75rem);
    line-height: 1.15;
    text-align: left;
}

.exit-partner-strip-right {
    flex: 0 1 auto;
    min-width: 0;
    display: flex;
    align-items: baseline;
    justify-content: flex-end;
    gap: 10px;
    text-align: right;
}

.exit-partner-strip-vtype {
    flex: 0 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: clamp(1.05rem, 4.2vw, 1.45rem);
    line-height: 1.15;
    text-align: right;
}

.exit-partner-strip-bracelet {
    flex: 0 0 auto;
    font-size: clamp(1.2rem, 5vw, 1.75rem);
    font-weight: 800;
    line-height: 1.15;
    color: rgba(0, 0, 0, 0.87);
    text-align: right;
}

.exit-partner-strip-sep {
    flex-shrink: 0;
    font-weight: 700;
    font-size: clamp(1rem, 4vw, 1.35rem);
    line-height: 1;
    opacity: 0.4;
    user-select: none;
}

/* Fecha / hora / día / últ. visita — indicadores en una fila */
.exit-visit-indicators-row {
    border-radius: 8px;
    background-color: #fafafa;
    border-left: 3px solid #ff9800;
}

.exit-visit-indicators-inner {
    gap: 6px;
    padding: 10px 8px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

.exit-visit-indicators-inner--entry {
    padding-top: 10px;
    padding-bottom: 10px;
}

.exit-visit-indicators-split {
    margin: 0 10px;
    border-color: rgba(0, 0, 0, 0.12) !important;
}

.exit-visit-indicator--notes {
    flex: 1.35 1 0;
    min-width: 96px;
}

.exit-visit-indicator-notes-value {
    white-space: normal !important;
    word-break: break-word;
    font-weight: 600;
    line-height: 1.25;
    max-height: 4.8em;
    overflow-y: auto;
    color: rgba(0, 0, 0, 0.87);
}

.exit-visit-indicator {
    flex: 1 1 0;
    min-width: 72px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    text-align: center;
    padding: 4px 2px;
}

.exit-visit-indicator-label {
    font-size: 0.62rem;
    line-height: 1.15;
    color: rgba(0, 0, 0, 0.54);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin-bottom: 2px;
}

.exit-visit-indicator-value {
    font-size: clamp(0.72rem, 2.8vw, 0.85rem);
    font-weight: 700;
    line-height: 1.2;
    word-break: break-word;
}

/* Fila consumos / descartables / mínimo — más destacada */
.exit-visit-indicators-inner--consumos {
    background: rgba(255, 152, 0, 0.11);
    padding-top: 12px;
    padding-bottom: 12px;
    border-radius: 0 0 6px 6px;
}

.exit-visit-indicator--consumo-main .exit-visit-indicator-label {
    font-size: 0.68rem;
}

.exit-visit-indicator--consumo-main .exit-visit-indicator-value {
    font-size: clamp(0.88rem, 3.6vw, 1.12rem);
}

.exit-visit-indicator--minimo-wrap {
    flex: 1.12 1 0;
    min-width: 104px;
}

.exit-visit-indicator--minimo-wrap .exit-visit-indicator-value {
    font-size: clamp(0.82rem, 3.2vw, 1rem);
}

.exit-visit-indicator--minimo-alert {
    outline: 2px solid rgba(244, 67, 54, 0.42);
    outline-offset: 2px;
    border-radius: 6px;
}

.exit-visit-indicator-label--wrap {
    white-space: normal !important;
    line-height: 1.15;
    hyphens: auto;
}

.exit-visit-indicator--entrada-debe {
    flex: 1.08 1 0;
    min-width: 86px;
}

.exit-visit-indicator--entrada-debe-alert {
    outline: 2px solid rgba(244, 67, 54, 0.42);
    outline-offset: 2px;
    border-radius: 6px;
}

.exit-visit-indicator--link {
    cursor: pointer;
    transition: background-color 0.15s ease, box-shadow 0.15s ease;
    border-radius: 6px;
}

.exit-visit-indicator--link:hover {
    background-color: rgba(255, 152, 0, 0.12);
}

.exit-visit-indicator--link:focus {
    outline: 2px solid rgba(255, 152, 0, 0.55);
    outline-offset: 2px;
}

.exit-visit-indicator--link[aria-disabled='true'] {
    cursor: default;
    opacity: 0.55;
}

.exit-visit-indicator--link[aria-disabled='true']:hover {
    background-color: transparent;
}

/* Métodos de pago: una fila de botones altos, texto multilínea */
.exit-pay-methods-toggle {
    width: 100%;
    gap: 8px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
}

.exit-pay-methods-toggle ::v-deep .exit-pay-method-btn {
    flex: 1 1 0;
    min-width: 0;
    min-height: 76px !important;
    height: auto !important;
    padding-left: 6px !important;
    padding-right: 6px !important;
}

.exit-pay-methods-toggle ::v-deep .exit-pay-method-btn .v-btn__content {
    white-space: normal !important;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    text-align: center;
    padding: 10px 4px;
}

.exit-pay-method-btn-text {
    display: block;
    font-size: clamp(0.68rem, 2.8vw, 0.82rem);
    line-height: 1.28;
    font-weight: 700;
    letter-spacing: 0;
    word-break: break-word;
    hyphens: auto;
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

/* Registrar salida + No paga / observado — evita colisión con .d-flex.flex-wrap en mobile */
.exit-registrar-actions {
    display: flex;
    flex-wrap: nowrap;
    align-items: stretch;
    gap: 10px;
    width: 100%;
}

.exit-registrar-actions__primary {
    flex: 2 1 120px;
    min-height: 48px !important;
}

.exit-registrar-actions__secondary {
    flex: 1 1 118px;
    min-height: 48px !important;
}

.exit-registrar-actions__secondary ::v-deep .v-btn__content {
    justify-content: center;
}

.exit-registrar-no-paga-label {
    line-height: 1.2;
}

@media (max-width: 600px) {
    .exit-registrar-actions {
        flex-wrap: wrap;
        flex-direction: column;
    }

    .exit-registrar-actions__primary,
    .exit-registrar-actions__secondary {
        flex: 1 1 auto;
        width: 100%;
        max-width: none;
    }
}
</style>
