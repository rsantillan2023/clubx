<template>
    <div class="px-md-15 px-3">
        <div v-if="items.length > 0">
            <div class="partner-summary-mobile py-3 px-1 my-4">
                <!-- Solo nombre · tipo visita · últimos 3 dígitos (sin # visita ni línea de tarjeta) -->
                <div class="partner-head-row-simple">
                    <span class="partner-name-big orange--text font-weight-bold">{{ partnerHeadName }}</span>
                    <span class="partner-vtype-big">{{ partnerVisitDescription }}</span>
                    <span class="partner-bracelet-big">{{ formatBracelet(partner.id_bracelet_1) }}</span>
                </div>
                <v-divider class="my-3" />
                <div class="partner-total-inline d-flex justify-space-between align-baseline">
                    <span class="font-weight-bold text-body-1">Total consumos</span>
                    <span class="font-weight-bold orange--text partner-total-inline-money">$ {{ total }}</span>
                </div>
            </div>
        </div>

        <div class="mb-3">
            <ConsumedActions
                :roles="roles"
                :items="items"
                :partner="partner"
                :load="load"
                :loadB1="loadB1"
                :total="total"
                :HaveNoPayed="HaveNoPayed"
                :textWhatsapp="textWhatsapp"
                @clickVolver="$emit('clickVolver')"
                @clickExit="goExit"
            />
        </div>

        <div v-if="items.length > 0 && partner" class="salida-club-mobile-wrap px-1 mb-3">
            <v-btn
                block
                depressed
                dark
                color="deep-orange darken-2"
                class="salida-club-mobile-btn"
                @click="goExit"
            >
                SALIDA DEL CLUB
            </v-btn>
        </div>

        <v-row v-if="items.length > 0" class="mt-6">
            <v-col cols="12" class="d-flex justify-center px-5 pb-2 pt-0">
                <span class="orange--text" style="font-size: 1.2rem; font-weight: bold;">Consumos Realizados</span>
            </v-col>
        </v-row>

        <div v-if="bulkSelectEnabled && items.length > 0" class="d-flex flex-wrap align-center justify-space-between px-3 pb-3 w-100">
            <div class="d-flex align-center flex-shrink-0" style="gap: 2px;">
                <v-btn small text color="orange" class="px-2" min-width="0" @click="$emit('toggle-all-detail-select')">
                    <v-icon left small>{{ bulkHeaderChecked ? 'mdi-checkbox-marked-outline' : 'mdi-checkbox-blank-outline' }}</v-icon>
                    Anular todas
                </v-btn>
                <v-btn small text color="grey darken-2" class="px-2" min-width="0" :disabled="!selectionDetailIds.length" @click="$emit('clear-detail-selection')">
                    Limpiar
                </v-btn>
            </div>
            <v-btn
                small
                dark
                depressed
                color="deep-orange darken-2"
                class="flex-shrink-0 ml-2 mt-1 mt-sm-0"
                :disabled="!selectionDetailIds.length"
                @click="$emit('bulk-anular')"
            >
                <v-icon left small>mdi-delete-sweep</v-icon>
                Anular ({{ selectionDetailIds.length }})
            </v-btn>
        </div>

        <div v-if="items.length > 0" class="consumed-items-wrap px-1">
            <div v-for="(item, n) in items" :key="'item' + n" class="consumed-item-mobile py-3">
                <!-- Fila 1: (# · hora · producto) | monto unitario centrado | total a la derecha -->
                <div
                    class="consumed-item-row-top consumed-item-grid-top"
                    :class="{ 'ci-anulado-strike': item.payed === null }"
                >
                    <div class="ci-left-cluster">
                        <v-checkbox
                            v-if="rowEligibleForBulk(item)"
                            :ripple="false"
                            dense
                            hide-details
                            color="orange"
                            class="ci-bulk-checkbox pa-0 ma-0 mr-1"
                            style="flex-shrink: 0;"
                            :input-value="selectionDetailIds.includes(item.id_ticket_detail)"
                            aria-label="Marcar para anular"
                            @change="$emit('toggle-detail-select', item.id_ticket_detail)"
                        />
                        <v-btn
                            v-if="
                                item.payed == 0 &&
                                    item.quantity > 0 &&
                                    (roles.includes(1) || roles.includes(2) || roles.includes(3))
                            "
                            icon
                            color="orange"
                            class="ci-delete-btn ci-delete-leading"
                            aria-label="Anular consumo"
                            @click.stop="$emit('clickAnular', item)"
                        >
                            <v-icon color="orange" size="28">mdi-delete</v-icon>
                        </v-btn>
                        <span class="ci-num orange--text font-weight-bold">#{{ n + 1 }}</span>
                        <span class="ci-time">{{ parseHour(item.ticket_date) }}hs.</span>
                        <span class="ci-desc font-weight-medium">{{ item.description }}</span>
                    </div>
                    <span class="ci-unit-center">${{ parseInt(item.price) }} × {{ item.quantity }}u</span>
                    <span class="ci-line-total-right orange--text font-weight-bold">${{ lineItemTotal(item) }}</span>
                </div>
                <div v-if="item.payed === 1 || item.payed === null" class="ci-estado-row mt-1">
                    <span v-if="item.payed === 1" class="teal--text font-weight-bold text-caption">Pagado</span>
                    <span v-else class="red--text font-weight-bold text-caption">Anulado</span>
                </div>
                <div
                    v-if="item.observations != null && String(item.observations).trim() !== ''"
                    class="ci-obs text-caption grey--text text--darken-2 mt-2"
                    :class="{ 'ci-anulado-strike': item.payed === null }"
                >
                    {{ item.observations }}
                </div>
                <v-divider v-if="n < items.length - 1" class="mt-3 mb-0" />
            </div>
        </div>
    </div>
</template>

<script>
import ConsumedActions from './ConsumedActions.vue'
export default {
    components:{
        ConsumedActions
    },
    data: () => ({
        loadB1: false,
        loadB2: false,
        load: false
    }),

    props: {
      roles: { type: Array }, 
      items: { type: Array },
      selectionDetailIds: { type: Array, default: () => [] },
      brazalete: {},
      tipoVisita: {},
      partner: {},
      loadExcel: { type: Boolean, default: false },
    },

    methods: {
        rowEligibleForBulk (item) {
            return (
                item.payed == 0 &&
                item.quantity > 0 &&
                this.roles &&
                (this.roles.includes(1) || this.roles.includes(2) || this.roles.includes(3))
            )
        },
        formatTotal(total) {
            if (!total && total !== 0) return '0'
            return total.toLocaleString('es-AR', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            })
        },
        parseHour(date){
            if(date != null){ 
                date.replace(/(T)/, ' ');
                date.substr(0, 19);
            }
            return (date != null) ? this.$moment(date, 'YYYY-MM-DD HH:mm:ss').format('HH:mm') : '';
        },
        formatBracelet(bracelet) {
            if (!bracelet) return '—';
            const braceletStr = String(bracelet);
            return braceletStr.length > 3 ? braceletStr.slice(-3) : braceletStr;
        },
        lineItemTotal(item) {
            return parseFloat(item.price || 0) * parseInt(item.quantity || 0, 10);
        },
        parseDate(date){
            if(date != null){ 
                date.replace(/(T)/, ' ');
                date.substr(0, 19);
            }
            return (date != null) ? this.$moment(date, 'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY') : '';
        }, 
        goExit() {
        const data = Object.assign({}, this.partner, { total: this.total })
        this.$store.commit('setPartner', data)
        this.$router.push('/exitRegister')
        },
      
    },
    

    computed: {
      bulkSelectEnabled () {
        return this.roles && (this.roles.includes(1) || this.roles.includes(2) || this.roles.includes(3))
      },
      bulkHeaderChecked () {
        if (!this.items || !this.bulkSelectEnabled) return false
        const ids = this.items
          .filter((item) => this.rowEligibleForBulk(item))
          .map((i) => i.id_ticket_detail)
          .filter((id) => id != null)
        return ids.length > 0 && ids.every((id) => this.selectionDetailIds.includes(id))
      },
      partnerHeadName() {
        if (!this.partner) return '—';
        const alias = this.partner.alias;
        if (alias != null && String(alias).trim() !== '') {
          return String(alias).replace(/---/g, ' ');
        }
        return this.partner.partner_name || '—';
      },
      partnerVisitDescription() {
        if (!this.partner || !this.partner.visit_type) return '';
        return this.partner.visit_type.description || '';
      },
      total () {
        let total = 0
        this.items.map( (item) => {
            if(item.payed != null) total = total + (parseFloat(item.price) * parseInt(item.quantity))
        })
        return total
      },
      HaveNoPayed(){
        let have = false
        this.items.map((item) => {
            if(item.payed == 0) have = true
        })

        return have
      },
      textWhatsapp(){
        if(this.items.length > 0 && this.partner){
          let text = '_Hola '+this.partner.partner_name+'_' + '!\n\n'
          text += 'Realizaste los siguientes consumos:\n\n'
          
          let tarjetas = []
          this.items.map((item) => {
            if (!tarjetas.includes(item.id_bracelet)) {
              tarjetas.push(item.id_bracelet)
            }
          })

          text += '*Tarjeta de Consumo Nº ' + tarjetas[0] +':*\n'
          let itemsTarjeta1 = []
          this.items.filter((item) => {
            if (item.id_bracelet == tarjetas[0]) {
              itemsTarjeta1.push(item)
            }
          })
          itemsTarjeta1.forEach((item, index) => {
            const montoItem = parseFloat(item.price) * parseInt(item.quantity)
            text += '• ' + item.description + ' x' + item.quantity + ' = $' + this.formatTotal(montoItem)
            if (index < itemsTarjeta1.length - 1) text += '\n'
          })
          
          if (tarjetas.length > 1) {
            text += '\n\n*Tarjeta de Consumo Nº ' + tarjetas[1] +':*\n'
            let itemsTarjeta2 = []
            this.items.filter((item) => {
              if (item.id_bracelet == tarjetas[1]) {
                itemsTarjeta2.push(item)
              }
            })
            itemsTarjeta2.forEach((item, index) => {
              const montoItem = parseFloat(item.price) * parseInt(item.quantity)
              text += '• ' + item.description + ' x' + item.quantity + ' = $' + this.formatTotal(montoItem)
              if (index < itemsTarjeta2.length - 1) text += '\n'
            })
          }
          
          text += '\n\n━━━━━━━━━━━━━━━━━━━━\n'
          text += '💰 *TOTAL: $' + this.formatTotal(this.total) + '*'
          
          return text
        } else return ''
      },
    },
}
</script>

<style scoped>
.partner-head-row-simple {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    min-width: 0;
}

.partner-name-big {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 1.18rem;
    line-height: 1.25;
}

.partner-vtype-big {
    flex: 0 1 auto;
    max-width: 42%;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 1.08rem;
    line-height: 1.25;
    font-weight: 700;
    color: rgba(0, 0, 0, 0.52);
    text-transform: uppercase;
    letter-spacing: 0.02em;
}

.partner-bracelet-big {
    flex: 0 0 auto;
    font-size: 1.18rem;
    font-weight: 700;
    line-height: 1;
    color: rgba(0, 0, 0, 0.87);
}

.partner-total-inline-money {
    font-size: 1.35rem;
    line-height: 1.2;
}

.salida-club-mobile-wrap {
    width: 100%;
    max-width: 340px;
    margin-left: auto;
    margin-right: auto;
}

.salida-club-mobile-btn {
    min-height: 52px !important;
    font-size: 1rem !important;
    font-weight: 700 !important;
    letter-spacing: 0.02em;
}

.consumed-items-wrap {
    width: 100%;
}

.consumed-item-mobile {
    width: 100%;
}

.consumed-item-grid-top {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: 8px;
    width: 100%;
    min-width: 0;
    font-size: 0.82rem;
    line-height: 1.35;
}

.ci-left-cluster {
    grid-column: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}

.ci-unit-center {
    grid-column: 2;
    justify-self: center;
    white-space: nowrap;
    font-weight: 600;
}

.ci-line-total-right {
    grid-column: 3;
    justify-self: end;
    white-space: nowrap;
    font-size: 0.88rem;
}

.consumed-item-row-top {
    margin-bottom: 6px;
}

.ci-delete-leading {
    flex-shrink: 0;
    margin-right: -4px !important;
}

.ci-delete-btn {
    min-width: 44px !important;
    min-height: 44px !important;
    width: 44px !important;
    height: 44px !important;
}

.ci-delete-btn ::v-deep .v-btn__content {
    padding: 0;
}

.ci-delete-btn ::v-deep .v-icon {
    font-size: 28px !important;
}

.ci-num {
    flex-shrink: 0;
}

.ci-time {
    flex-shrink: 0;
    color: rgba(0, 0, 0, 0.62);
}

.ci-desc {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.ci-estado-row {
    text-align: right;
    line-height: 1.35;
}

.ci-anulado-strike {
    text-decoration: line-through !important;
    text-decoration-thickness: from-font;
    opacity: 0.88;
}

.ci-obs {
    line-height: 1.35;
}
</style>
