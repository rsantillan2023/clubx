<template>
<v-row class="justify-center" no-gutters>
    <div class="detail-consumed-container">
        <v-card elevation="2" outlined class="pa-2 mb-2 consumos-card">
            <div class="consumos-title-container">
                <span class="orange--text font-weight-bold text-caption consumos-title">Consumos</span>
            </div>
            <div class="py-3 consumos-list">
                <v-row no-gutters v-for="consumo, n in consumos" :key="'cons'+n" class="text-body-2 align-center mb-1">
                    <v-col cols="8" class="pr-1">
                        <span class="text--secondary cantidad-number">{{consumo.cantidad}}</span>
                        <span class="consumo-description">{{consumo.description}}</span>
                    </v-col>
                    <v-col cols="4" class="text-end font-weight-bold price-text">${{formatNumber(parseFloat(consumo.price) * parseInt(consumo.cantidad))}}</v-col>
                </v-row>
            </div>

            <v-divider class="my-2"></v-divider>

            <v-row no-gutters class="font-weight-bold align-center">
                <v-col cols="6">Total</v-col>
                <v-col cols="6" class="text-end orange--text total-price">${{formatNumber(total)}}</v-col>
            </v-row>
        </v-card>

        <div class="detail-bracelet-section">
            <div class="detail-bracelet-gap-row" aria-hidden="true"></div>
            <v-autocomplete
                ref="braazalete"
                label="Socio"
                :items="items"
                dense
                outlined
                :menu-props="{ maxHeight: 320, offsetY: true }"
                v-model="id_bracelet"
                item-text="option"
                item-value="id_bracelet"
                :rules="[(v) => !!v || 'Indique el socio']"
                class="detail-bracelet-autocomplete"
                hide-details="auto"
            ></v-autocomplete>
            <div class="detail-bracelet-gap-row" aria-hidden="true"></div>
        </div>

        <v-textarea
            label="Observaciones"
            rows="3"
            outlined
            dense
            v-model="observations"
            class="mb-2"
            hide-details
        />

        <v-btn 
            :dark="(id_bracelet != null)" color="orange" 
            block 
            :disabled="(id_bracelet == null)" 
            :loading="loading" 
            @click="send"
            class="detail-btn-confirm">
             <v-icon left small>mdi-receipt-text-plus</v-icon> Confirmar Venta
        </v-btn>

        <div class="detail-secondary-actions">
            <v-row dense no-gutters class="detail-four-actions-row">
                <v-col cols="6" class="detail-action-col">
                    <v-btn 
                        outlined 
                        color="orange" 
                        block 
                        @click="dialogConfirm = true" 
                        :disabled="loading"
                        small
                        class="detail-secondary-action-btn">
                        <v-icon small class="detail-action-btn-icon">mdi-cart-arrow-right</v-icon>
                        <span class="detail-action-btn-label">Iniciar otra venta</span>
                    </v-btn>
                </v-col>
                <v-col cols="6" class="detail-action-col">
                    <v-btn 
                        v-if="showContinueShoppingInActions"
                        dark 
                        color="orange" 
                        block 
                        small
                        class="detail-secondary-action-btn detail-continue-sale-btn"
                        @click="$emit('continueShopping')">
                        <v-icon small class="detail-action-btn-icon">mdi-cart-arrow-down</v-icon>
                        <span class="detail-action-btn-label">Seguir vendiendo a este socio</span>
                    </v-btn>
                    <v-btn 
                        v-else
                        outlined 
                        color="orange" 
                        block 
                        @click="goToConsumed" 
                        :disabled="loading"
                        small
                        class="detail-secondary-action-btn">
                        <v-icon small class="detail-action-btn-icon">mdi-receipt-text</v-icon>
                        <span class="detail-action-btn-label">Ver Consumos de Socios</span>
                    </v-btn>
                </v-col>
            </v-row>
        </div>
        
        <v-dialog 
          v-model="dialogConfirm" max-width="500px">
            <v-card>
              <v-card-title>
                <v-spacer></v-spacer>
                  <v-btn 
                    x-small 
                    icon 
                    @click="dialogConfirm=false">
                        <v-icon >mdi-close</v-icon>
                  </v-btn>
              </v-card-title>

                <div class="text-center py-5 px-4">
                    <span style="font-size: 1rem">Va a iniciar otra venta. Se perderán los datos cargados en esta venta (productos en el carrito y observaciones). ¿Desea continuar?</span>
                </div>

              <v-card-actions>
                <v-spacer></v-spacer>
                    <v-btn 
                        color="orange" 
                        text 
                        small 
                        dark 
                        @click="dialogConfirm = false">Volver
                    </v-btn>
                  <v-btn 
                        small 
                        dark 
                        color="orange" 
                        elevation="0" 
                        @click="confirmStartAnotherSale">Sí, iniciar otra venta
                    </v-btn>
              </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</v-row>
</template>

<script>
    import eventBus from '../../../event-bus'
    export default{
        props: {
            consumos: {type: Array},
            total: {},
            initialIdBracelet: {
                type: [String, Number],
                default: null,
            },
            saleBanner: {
                type: Object,
                default: null,
            },
            /** Solo en modal móvil de venta: botón derecho «Seguir vendiendo…» cierra el modal (emit continueShopping). */
            showContinueShoppingInActions: {
                type: Boolean,
                default: false,
            },
        },
        data(){
            return{
                id_bracelet: null,
                observations: '',
                dialogConfirm: false,
                loading: false,
                items: [],
                roles: [],
            }
        },
        beforeMount(){
            this.$store.state.userLoged.data.roles.map( (UserRole) => {
                this.roles.push(UserRole.id_role)
            })
            this.getVisits()
        },
        watch: {
            initialIdBracelet() {
                this.applyPresetBracelet()
            },
        },
        methods:{
            formatNumber(num) {
                if (!num && num !== 0) return '0';
                return num.toLocaleString('es-AR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            },
            formatBracelet(bracelet) {
                if (bracelet == null || bracelet === '') return '—';
                const braceletStr = String(bracelet);
                return braceletStr.length > 3 ? braceletStr.slice(-3) : braceletStr;
            },
            formatAlias(alias) {
                if (!alias) return '';
                return String(alias).replace(/---/g, ' ');
            },
            /** Columna 1 de la tabla «Cargar consumos» (Alias). */
            pickTableCampo1Alias(item) {
                const raw = item.partner && item.partner.alias;
                const a = this.formatAlias(raw);
                const t = (a && a.trim()) ? a.trim() : '';
                return t !== '' ? t : '—';
            },
            visitTypeDescription(item) {
                const vt = item.visit_type;
                if (!vt) return '—';
                if (Array.isArray(vt)) {
                    const first = vt[0];
                    return first && first.description ? String(first.description).trim() : '—';
                }
                return vt.description ? String(vt.description).trim() : '—';
            },
            /** Columnas 1, 4 y 5 de la tabla «Cargar consumos»: Alias · Tipo visita · Tarjeta. */
            braceletOptionLabel(item, idBracelet) {
                const c1 = this.pickTableCampo1Alias(item);
                const c4 = this.visitTypeDescription(item);
                const c5 = this.formatBracelet(idBracelet);
                return `${c1} · ${c4} · Tarj. ${c5}`;
            },
            optionLabelFromBanner(braceletKey) {
                const b = this.saleBanner;
                const key = braceletKey != null ? String(braceletKey).trim() : '';
                if (!b) return key ? `Tarjeta ${key}` : '—';
                const c1 = (b.alias && String(b.alias).trim()) || '—';
                const c4 = (b.visitType && String(b.visitType).trim()) || '—';
                const card = (b.card && String(b.card).trim()) || this.formatBracelet(key);
                return `${c1} · ${c4} · Tarj. ${card}`;
            },
            getVisits() {
            let vm = this

            // El endpoint ahora devuelve { data: rows, totalCount: count } directamente
            this.$http.get(process.env.VUE_APP_DEGIRA+"partners/inside?sortBy=id_bracelet_1&sortDesc=false")
            .then((response)=>{
              if(response && response.data && response.data.data){
                vm.items = []
                // response.data.data es un array de visitas directamente
                response.data.data.map((item) => {
                    if (item.id_bracelet_1 && item.partner && item.partner.partner_name) {
                        vm.items.push({
                            id_bracelet : item.id_bracelet_1,
                            option : vm.braceletOptionLabel(item, item.id_bracelet_1),
                        })
                    }

                    if (item.id_bracelet_2 && item.partner && item.partner.affiliate_name){
                        vm.items.push({
                            id_bracelet : item.id_bracelet_2,
                            option : vm.braceletOptionLabel(item, item.id_bracelet_2),
                        })
                    }

                    return item
                })
                console.log('Brazaletes cargados:', vm.items.length);
              } else {
                console.warn('No se recibieron datos del endpoint');
              }
              vm.applyPresetBracelet()
            })
            .catch((error) => {
              console.error('Error al cargar brazaletes:', error);
              console.error('Error response:', error.response);
            })

      },
            applyPresetBracelet() {
                const preset = this.initialIdBracelet
                if (preset == null || preset === '') return
                const key = String(preset).trim()
                if (!key) return
                let match = this.items.find((i) => String(i.id_bracelet) === key)
                if (!match) {
                    match = {
                        id_bracelet: key,
                        option: this.optionLabelFromBanner(key),
                    }
                    this.items.unshift(match)
                }
                this.id_bracelet = match.id_bracelet
            },
            textWhatsapp(data){
                let text = '_Hola '+ data.partner_name+'_' + '! Realizaste el siguiente consumo '
                text += '*Brazalete Nº ' + data.id_bracelet +':* '
                data.products.map((item) => {
                    text = text + item.description + ' x' + item.cantidad + ' '
                })
                    
                text = text + '| TU CONSUMO TOTAL ES: ' + '*$' + data.ticket_amount+'*'+' |'
                return text
           
            },

            cancel(){
                this.$emit('cancelOrder');
                if (this.$refs.braazalete && typeof this.$refs.braazalete.reset === 'function') {
                    this.$refs.braazalete.reset()
                }
                this.dialogConfirm=false;
            },
            confirmStartAnotherSale(){
                this.$emit('cancelOrder');
                if (this.$refs.braazalete && typeof this.$refs.braazalete.reset === 'function') {
                    this.$refs.braazalete.reset()
                }
                this.observations = '';
                this.id_bracelet = null;
                this.dialogConfirm = false;
                this.$router.push('/productsSalePickPartner');
            },
            goToConsumed(){
                this.$router.push('/consumed');
            },
            send(){
                // Validar que id_bracelet no sea null o undefined
                if (!this.id_bracelet) {
                    eventBus.$emit('toast', { show: true, text: "Debe seleccionar un número de tarjeta", color: "red" })
                    return
                }
                
                let data =  {cart: this.consumos,
                             total_consumed: this.total,
                             id_bracelet : String(this.id_bracelet),
                             ticket_observations: this.observations
                         }
                let vm = this
                this.loading = true
                this.$http.post(`${process.env.VUE_APP_DEGIRA}consumptions/create`, data)
                .then((response) => {
                    if(response){
                        let dialog = {  show: true, 
                                        title: "Venta Confirmada", 
                                        type: 'success',
                                        cardNumber: response.data.data.id_bracelet,
                                        sendToWhatsapp : vm.roles.includes(1) ? true : false,
                                        whatsappData: {
                                            textWhatsappDialog: this.textWhatsapp(response.data.data), 
                                            phoneNumber: response.data.data.partner_phone
                                        },
                                        closeDialog: true,
                                        continueSellingRoute: '/productsSalePickPartner',
                                        isHtml: true,
                                        text: [ {label: '', 
                                                 value: response.data.data.products, 
                                                 show: true,
                                                 cardConsumed: true,
                                                },
                                                {label: 'Total', 
                                                 value: '$'+response.data.data.ticket_amount, 
                                                 show: true
                                                },
                                                {label: 'Observaciones', 
                                                 value: response.data.data.ticket_observation, 
                                                 show: (response.data.data.ticket_observation)
                                                },
                                            ]
                                    }
                        eventBus.$emit('ConfirmDialog', dialog)
                        vm.cancel()
                    }
                    vm.loading=false
                })
                .catch((error) => {
                    console.log(error.response)
                    eventBus.$emit('toast', { show: true, text: (error.response.data.message) ? error.response.data.message :  "No se ha podido generar el consumo", color: "red" })
                    vm.loading=false
                })
            }
        }
    }
</script>

<style scoped>
.detail-consumed-container {
    width: 100%;
    max-width: 100%;
}

.detail-bracelet-section {
    margin-top: 4px;
    margin-bottom: 4px;
}

.detail-bracelet-gap-row {
    height: 14px;
}

.detail-bracelet-autocomplete {
    margin-bottom: 0 !important;
}

.detail-bracelet-autocomplete ::v-deep .v-select__selections {
    overflow: visible !important;
    flex-wrap: wrap !important;
    max-width: 100%;
}

.detail-bracelet-autocomplete ::v-deep .v-select__selection,
.detail-bracelet-autocomplete ::v-deep .v-select__selection--comma {
    font-size: 1.125rem !important;
    font-weight: 700 !important;
    white-space: normal !important;
    line-height: 1.25 !important;
}

.detail-bracelet-autocomplete ::v-deep input {
    font-size: 1.125rem !important;
    font-weight: 700 !important;
}

.detail-bracelet-autocomplete ::v-deep .v-list-item .v-list-item__title {
    font-size: 1.05rem !important;
    font-weight: 700 !important;
    white-space: normal !important;
    line-height: 1.25 !important;
}

.detail-btn-confirm {
    margin-bottom: 0;
}

@media (max-width: 959px) {
    .detail-btn-confirm.v-btn {
        min-height: 54px !important;
        padding-top: 14px !important;
        padding-bottom: 14px !important;
        font-weight: 700 !important;
    }
}

.detail-secondary-actions {
    margin-top: 22px;
}

@media (min-width: 960px) {
    .detail-secondary-actions {
        margin-top: 16px;
    }
}

.detail-four-actions-row {
    margin-left: 0 !important;
    margin-right: 0 !important;
}

.detail-action-col {
    padding: 4px !important;
    min-width: 0;
}

.detail-secondary-action-btn {
    height: auto !important;
    white-space: normal !important;
    min-height: 76px !important;
    padding-left: 4px !important;
    padding-right: 4px !important;
    max-width: 100%;
    overflow: hidden;
}

.detail-secondary-action-btn ::v-deep .v-btn__content {
    flex-direction: column !important;
    justify-content: center !important;
    align-items: center !important;
    white-space: normal !important;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    align-self: stretch;
}

.detail-action-btn-icon {
    flex-shrink: 0;
    margin-right: 0 !important;
    margin-bottom: 6px !important;
}

.detail-action-btn-label {
    font-size: 0.62rem !important;
    font-weight: 700 !important;
    line-height: 1.15;
    text-align: center;
    word-break: break-word;
    overflow-wrap: anywhere;
    hyphens: auto;
    max-width: 100%;
    width: 100%;
    box-sizing: border-box;
    padding: 0 2px;
}

@media (min-width: 600px) {
    .detail-action-btn-label {
        font-size: 0.68rem !important;
    }
}

@media (min-width: 960px) {
    .detail-secondary-action-btn {
        min-height: 84px !important;
    }

    .detail-action-btn-label {
        font-size: 0.74rem !important;
    }
}

.consumos-card {
    width: 100%;
    max-width: 100%;
    position: relative;
}

.consumos-title-container {
    position: relative;
    margin-bottom: 8px;
    padding-top: 4px;
}

.consumos-title {
    position: absolute;
    top: -8px;
    left: 8px;
    background: #fff;
    padding: 0 8px;
    z-index: 1;
}

.consumos-list {
    max-height: 200px;
    overflow-y: auto;
    overflow-x: hidden;
}

.consumos-list::-webkit-scrollbar {
    width: 4px;
}

.consumos-list::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
}

.consumos-list::-webkit-scrollbar-thumb {
    background: #FF9800;
    border-radius: 10px;
}

.cantidad-number {
    margin-right: 6px;
    font-weight: bold;
}

.consumo-description {
    font-size: 0.85rem;
    word-break: break-word;
}

.price-text {
    font-size: 0.8rem !important;
}

.total-price {
    font-size: 1rem !important;
}

/* Asegurar que los campos se vean completos */
.detail-consumed-container ::v-deep .v-input {
    font-size: 0.875rem;
}

.detail-consumed-container ::v-deep .v-text-field {
    margin-bottom: 8px;
}

.detail-consumed-container ::v-deep .v-textarea {
    margin-bottom: 8px;
}

.detail-consumed-container ::v-deep .v-autocomplete__menu {
    max-height: 320px !important;
}

/* Responsive para pantallas pequeñas */
@media (max-width: 959px) {
    .detail-consumed-container {
        width: 100%;
        padding: 0 8px;
    }
    
    .consumos-list {
        max-height: 150px;
    }
}
</style>