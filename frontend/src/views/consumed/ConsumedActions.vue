<template>
  <div class="consumed-actions-container">
    <v-row no-gutters class="px-md-15 px-3 mb-4">
      <!-- Los 5 botones siempre en el mismo renglón, responsive -->
      <v-col cols="12">
        <div class="buttons-container">
          <!-- Botón 1: Ver consumos de otros socios -->
          <div class="button-wrapper">
            <v-btn 
              color="orange"
              dark
              block
              :small="$vuetify.breakpoint.xs || $vuetify.breakpoint.sm"
              :large="$vuetify.breakpoint.mdAndUp"
              elevation="2"
              :loading="load"
              @click="$emit('clickVolver')"
              class="action-btn">
              <v-icon :left="$vuetify.breakpoint.mdAndUp" :size="$vuetify.breakpoint.xs || $vuetify.breakpoint.sm ? 14 : 20">mdi-magnify</v-icon>
              <span class="button-text">Ver consumos de otros socios</span>
            </v-btn>
          </div>

          <!-- Botón 2: Ver Socios en el Club -->
          <div class="button-wrapper">
            <v-btn 
              color="blue"
              dark
              block
              :small="$vuetify.breakpoint.xs || $vuetify.breakpoint.sm"
              :large="$vuetify.breakpoint.mdAndUp"
              elevation="2"
              @click="goToActiveVisits"
              class="action-btn">
              <v-icon :left="$vuetify.breakpoint.mdAndUp" :size="$vuetify.breakpoint.xs || $vuetify.breakpoint.sm ? 14 : 20">mdi-account-group</v-icon>
              <span class="button-text">Ver Socios en el Club</span>
            </v-btn>
          </div>

          <!-- Botón 3: Venta de Productos -->
          <div class="button-wrapper">
            <v-btn 
              color="green"
              dark
              block
              :small="$vuetify.breakpoint.xs || $vuetify.breakpoint.sm"
              :large="$vuetify.breakpoint.mdAndUp"
              elevation="2"
              @click="goToProductsSale"
              class="action-btn">
              <v-icon :left="$vuetify.breakpoint.mdAndUp" :size="$vuetify.breakpoint.xs || $vuetify.breakpoint.sm ? 14 : 20">mdi-currency-usd</v-icon>
              <span class="button-text">Venta de Productos</span>
            </v-btn>
          </div>

          <!-- Botón 4: Enviar WhatsApp -->
          <div v-if="items.length > 0 && roles.includes(1)" class="button-wrapper">
            <SendWhatsappButton 
              :phoneNumber="partner && partner.partner_phone ? partner.partner_phone : ''" 
              :text="textWhatsapp">
            </SendWhatsappButton>
          </div>

          <!-- Botón 5: Cerrar Cuenta y Cobrar -->
          <div v-if="items.length > 0 && HaveNoPayed && roles.includes(1)" class="button-wrapper">
            <v-btn 
              color="orange"
              dark
              block
              :small="$vuetify.breakpoint.xs || $vuetify.breakpoint.sm"
              :large="$vuetify.breakpoint.mdAndUp"
              elevation="2"
              :loading="loadB1"
              @click="goExit"
              class="action-btn">
              <v-icon :left="$vuetify.breakpoint.mdAndUp" :size="$vuetify.breakpoint.xs || $vuetify.breakpoint.sm ? 14 : 20">mdi-account-cash</v-icon>
              <span class="button-text">Cerrar Cuenta y Cobrar</span>
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import SendWhatsappButton from '../app/SendWhatsappButton'

export default {
  components: {
    SendWhatsappButton
  },
  props: {
    roles: { type: Array },
    items: { type: Array },
    partner: {},
    load: { type: Boolean, default: false },
    loadB1: { type: Boolean, default: false },
    total: { type: Number, default: 0 },
    HaveNoPayed: { type: Boolean, default: false },
    textWhatsapp: { type: String, default: '' }
  },
  methods: {
    goExit() {
      this.$emit('clickExit')
    },
    goToActiveVisits() {
      this.$router.push('/activeVisits')
    },
    goToProductsSale() {
      this.$router.push('/productsSale')
    },
    formatTotal(total) {
      if (!total && total !== 0) return '0'
      return total.toLocaleString('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })
    }
  }
}
</script>

<style scoped>
.consumed-actions-container {
  width: 100%;
}

.buttons-container {
  display: flex;
  flex-wrap: nowrap;
  width: 100%;
  gap: 8px;
}

.button-wrapper {
  flex: 1 1 0;
  min-width: 0;
}

.action-btn {
  transition: all 0.3s ease;
  font-weight: 600;
  letter-spacing: 0.3px;
  min-height: 48px;
  white-space: normal;
  word-wrap: break-word;
  overflow: hidden;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2) !important;
}

.button-text {
  font-size: inherit;
  line-height: 1.2;
}

/* Asegurar que SendWhatsappButton tenga el mismo tamaño */
::v-deep .whatsapp-btn {
  min-height: 48px;
  font-weight: 600;
  letter-spacing: 0.3px;
  white-space: normal;
  word-wrap: break-word;
  overflow: hidden;
}

/* Ajustes responsive para mantener todos en un renglón */
@media (max-width: 960px) {
  .button-text {
    font-size: 0.65rem;
  }
  
  .action-btn {
    min-height: 42px;
    padding: 4px 6px;
  }
  
  ::v-deep .whatsapp-btn {
    min-height: 42px;
    padding: 4px 6px;
    font-size: 0.65rem;
  }
}

@media (max-width: 600px) {
  .button-text {
    font-size: 0.55rem;
  }
  
  .action-btn {
    min-height: 38px;
    padding: 2px 4px;
  }
  
  ::v-deep .whatsapp-btn {
    min-height: 38px;
    padding: 2px 4px;
    font-size: 0.55rem;
  }
}

@media (max-width: 400px) {
  .button-text {
    font-size: 0.5rem;
  }
  
  .action-btn {
    min-height: 36px;
    padding: 2px 3px;
  }
  
  ::v-deep .whatsapp-btn {
    min-height: 36px;
    padding: 2px 3px;
    font-size: 0.5rem;
  }
}
</style>

