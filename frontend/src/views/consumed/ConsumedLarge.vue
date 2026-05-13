<template>
  <div class="py-5 px-2">
    <!-- 1. Los 5 campos informativos juntos (sin nombres de campos, solo valores) -->
    <div v-if="items.length > 0" class="px-md-15 px-5 mb-4">
      <v-card outlined 
        class="pa-2" 
        elevation="2"
        :style="'border: 2px solid ' + $vuetify.theme.defaults.light.orange">
        <div class="info-fields-row">
          <!-- 1. Alias (sin "---") -->
          <div class="info-field-item">
            <p class="mb-0 font-weight-bold orange--text">{{formatAlias(partner.alias)}}</p>
          </div>

          <!-- 2. Nombre -->
          <div class="info-field-item">
            <p class="mb-0 font-weight-bold">{{partner.partner_name}}</p>
          </div>

          <!-- 3. Tipo de Visita -->
          <div class="info-field-item">
            <p class="mb-0 font-weight-bold">{{partner.visit_type.description}}</p>
          </div>

          <!-- 4. Tarjeta de Consumo -->
          <div class="info-field-item">
            <p class="mb-0 font-weight-bold orange--text">{{partner.id_bracelet_1}}</p>
          </div>

          <!-- 5. ID de Visita -->
          <div class="info-field-item">
            <p class="mb-0 font-weight-bold">#{{partner.id_visit}}</p>
          </div>
        </div>
      </v-card>
    </div>

    <!-- 2. Total Consumos Preponderante -->
    <div v-if="items.length > 0" class="px-md-15 px-5 mb-4">
      <v-card 
        class="total-card-prominent text-center pa-4" 
        elevation="4"
        :style="'border: 3px solid ' + $vuetify.theme.defaults.light.orange + '; background: linear-gradient(135deg, #fff5e6 0%, #ffffff 100%);'">
        <v-card-subtitle 
          class="pb-2 font-weight-bold text--secondary" 
          style="font-size: 1rem; letter-spacing: 1px;">
          TOTAL CONSUMOS
        </v-card-subtitle>
        <p class="font-weight-bold orange--text mb-0" style="font-size: 2.5rem; line-height: 1.2;">
          $ {{formatTotal(total)}}
        </p>
      </v-card>
    </div>

    <!-- 3. Misma barra de acciones que ConsumedSmall / ConsumedActions -->
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
      @clickExit="goExit">
    </ConsumedActions>

      <div
        v-if="items.length > 0 && partner"
        class="salida-club-wrap px-md-15 px-5 mb-4"
      >
        <v-btn
          block
          depressed
          dark
          color="deep-orange darken-2"
          class="salida-club-btn"
          @click="goExit"
        >
          SALIDA DEL CLUB
        </v-btn>
      </div>
       
      <div class="px-md-15 px-5 pb-2 pt-2 d-flex align-center justify-space-between flex-wrap">
        <span class="orange--text font-weight-bold " style="font-size: 1.1rem;">Detalle de consumos realizados</span>
        <v-btn
          color="green"
          dark
          small
          @click="$emit('exportExcel')"
          :loading="loadExcel"
        >
          <v-icon left small>mdi-file-excel</v-icon>
          Exportar Excel
        </v-btn>
      </div>

      <div
        v-if="bulkSelectEnabled && items.length > 0"
        class="px-md-15 px-5 pb-3 d-flex align-center justify-space-between flex-wrap"
      >
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
          color="deep-orange darken-2"
          dark
          small
          class="flex-shrink-0 ml-md-4 mt-2 mt-md-0"
          :disabled="!selectionDetailIds.length"
          @click="$emit('bulk-anular')"
        >
          <v-icon left small>mdi-delete-sweep</v-icon>
          Anular ({{ selectionDetailIds.length }})
        </v-btn>
      </div>

      <v-card outlined elevation="0">
          <v-data-table
          :headers="headers"
          :items="items"
          calculate-widths
          hide-default-footer
          :items-per-page="-1" 
          :loading="load"
          no-data-text="No hay consumos">

            <template v-slot:header.bulk_sel>
              <v-checkbox
                v-if="bulkSelectEnabled && anulableTicketDetailIds.length"
                :ripple="false"
                dense
                hide-details
                class="mt-0 pt-0"
                color="orange"
                :input-value="bulkHeaderChecked"
                :indeterminate="bulkHeaderIndeterminate"
                aria-label="Seleccionar todos los consumos anulables"
                @change="$emit('toggle-all-detail-select')"
              />
              <span v-else-if="bulkSelectEnabled" class="grey--text text--caption">—</span>
            </template>

            <template v-slot:item.bulk_sel="{ item }">
              <v-checkbox
                v-if="rowEligibleForBulk(item)"
                :ripple="false"
                dense
                hide-details
                color="orange"
                class="mt-0 pt-0"
                :input-value="selectionDetailIds.includes(item.id_ticket_detail)"
                aria-label="Marcar para anular"
                @change="$emit('toggle-detail-select', item.id_ticket_detail)"
              />
            </template>

            <template v-slot:item.actions="{ item }">
              <v-icon
                v-if="item.payed == 0 && item.quantity > 0 && (roles.includes(1) || roles.includes(2) || roles.includes(3))"
                small
                color="orange"
                @click="$emit('clickAnular', item)">mdi-delete
              </v-icon>
            </template>

            <template v-slot:item.ticket_date="{item}">
              {{ parseHour(item.ticket_date) }}
            </template>

            <template v-slot:item.id="{index}">
              {{ index+1 }}
            </template>

            <template v-slot:item.estado="{item}">
                <span v-if="item.payed == 0" class="orange--text">No Pagado</span>
                <span v-if="item.payed == 1" class="teal--text">Pagado</span>
                <span v-if="item.payed == null">Anulado</span>
            </template>

            <template v-slot:item.monto="{item}">
              <span class="text-right d-block">${{ formatNumber(parseFloat(item.price) * parseInt(item.quantity)) }}</span>
            </template>

            <template v-slot:item.price="{item}">
              <span class="text-right d-block">${{ formatNumber(parseFloat(item.price)) }}</span>
            </template>
        </v-data-table>
      </v-card>
    </div>
</template>

<script>
  import ConsumedActions from './ConsumedActions.vue'
  export default {
    components:{
      ConsumedActions
    },
    props: {
      roles: { type: Array },
      items: { type: Array },
      selectionDetailIds: { type: Array, default: () => [] },
      brazalete: {},
      tipoVisita: {},
      partner: {},
      loadExcel: { type: Boolean, default: false },
    },
    data: () => ({
      load: false,
      loadB1: false,
      loadB2: false,
      nrobrazalete: null,
      headers: [
        { text: '', value: 'bulk_sel', align: 'center', width: '56', sortable: false },
        { text: '#', value: 'id', align: 'center'},
        { text: 'Descripcion', value: 'description', align: 'center' },
        { text: 'Hora de consumo', value: 'ticket_date', align: 'center' },
        { text: 'Tarjeta de Consumo Asociada', value: 'id_bracelet' , align: 'center'},
        { text: 'Precio Unitario', value: 'price', align: 'right'},
        { text: 'Cantidad', value: 'quantity', align: 'center' },
        { text: 'Monto', value: 'monto' , align: 'right'},
        { text: 'Estado', value: 'estado' , align: 'center'},
        { text: 'Observacion', value: 'observations' , align: 'center'},
        { text: "", value: "actions", align: "center"},

      ],
      
    }),
    beforeMount () {
      this.nrobrazalete = this.brazalete
    },

    computed: {
      bulkSelectEnabled () {
        return this.roles && (this.roles.includes(1) || this.roles.includes(2) || this.roles.includes(3))
      },
      anulableTicketDetailIds () {
        if (!this.items || !this.bulkSelectEnabled) return []
        return this.items
          .filter((item) => this.rowEligibleForBulk(item))
          .map((i) => i.id_ticket_detail)
          .filter((id) => id != null)
      },
      bulkHeaderChecked () {
        const ids = this.anulableTicketDetailIds
        return ids.length > 0 && ids.every((id) => this.selectionDetailIds.includes(id))
      },
      bulkHeaderIndeterminate () {
        const ids = this.anulableTicketDetailIds
        const n = ids.filter((id) => this.selectionDetailIds.includes(id)).length
        return n > 0 && n < ids.length
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

    methods: {
      rowEligibleForBulk (item) {
        return (
          item.payed == 0 &&
          item.quantity > 0 &&
          this.roles &&
          (this.roles.includes(1) || this.roles.includes(2) || this.roles.includes(3))
        )
      },
      formatAlias(alias) {
        if (!alias) return '';
        return String(alias).replace(/---/g, ' ');
      },
      formatNumber(num) {
        if (!num && num !== 0) return '0'
        return num.toLocaleString('es-AR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        })
      },
      formatTotal(total) {
        if (!total && total !== 0) return '0'
        return total.toLocaleString('es-AR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        })
      },
      goExit() {
        const data = Object.assign({}, this.partner, { total: this.total })
        this.$store.commit('setPartner', data)
        this.$router.push('/exitRegister')
      },
      
      parseHour(date){
            if(date != null){ 
                date.replace(/(T)/, ' ');
                date.substr(0, 19);
            }
            return (date != null) ? this.$moment(date, 'YYYY-MM-DD HH:mm:ss').format('HH:mm') : '';
        }, 

        parseDate(date){
            if(date != null){ 
                date.replace(/(T)/, ' ');
                date.substr(0, 19);
            }
            return (date != null) ? this.$moment(date, 'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY') : '';
        },  

       
    }
  }
</script>

<style scoped>
.info-fields-row {
  display: flex;
  flex-wrap: nowrap;
  width: 100%;
  align-items: center;
}

.info-field-item {
  flex: 1 1 0;
  min-width: 0;
  padding: 8px 4px;
  text-align: center;
  border-right: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-field-item:last-child {
  border-right: none;
}

.info-field-item p {
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

@media (max-width: 960px) {
  .info-fields-row {
    flex-wrap: wrap;
  }
  
  .info-field-item {
    flex: 0 0 50%;
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .info-field-item:nth-child(2n) {
    border-left: 1px solid #e0e0e0;
  }
  
  .info-field-item:last-child {
    border-left: none;
  }
}

.info-field {
  padding: 8px 4px;
  min-height: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.v-col:not(:last-child) .info-field {
  border-right: 1px solid #e0e0e0;
}

.total-card-prominent {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
  }
  50% {
    box-shadow: 0 6px 20px rgba(255, 152, 0, 0.5);
  }
}

.salida-club-wrap {
  width: 100%;
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
}

.salida-club-btn {
  min-height: 52px !important;
  font-size: 1rem !important;
  font-weight: 700 !important;
  letter-spacing: 0.02em;
}
</style>