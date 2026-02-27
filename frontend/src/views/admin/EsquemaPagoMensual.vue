<template>
  <div class="py-3 px-2">
    <v-card class="mb-4" elevation="2">
      <v-card-title class="orange white--text pa-4">
        <v-icon left>mdi-calendar-check</v-icon>
        ESQUEMA DE PAGO MENSUAL
      </v-card-title>
      <v-card-subtitle class="pa-4 pt-0 grey--text">
        Una sola grilla con estado (Abono vencido / Próximo a vencer / Vigente). Alta, registrar pago, no paga y editar vigentes.
      </v-card-subtitle>
    </v-card>

    <v-card v-if="loadingId" class="pa-4 text-center">
      <v-progress-circular indeterminate color="orange" size="36"></v-progress-circular>
      <div class="text-body-2 grey--text mt-2">Cargando...</div>
    </v-card>

    <template v-else-if="idMensual == null">
      <v-alert type="warning" prominent>
        No existe el tipo de visitante MENSUAL en la base de datos. Ejecute el script SQL insert-visit-type-mensual.sql
      </v-alert>
    </template>

    <template v-else>
      <!-- Alta / Renovación -->
      <v-card class="mb-4" outlined>
        <v-card-title class="subtitle-1 orange--text">Alta o renovación en el esquema</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="altaSearch"
                label="Buscar socio (alias, DNI, nombre)"
                outlined
                dense
                clearable
                hide-details
                @input="searchPartnerForAlta"
              ></v-text-field>
              <v-list v-if="altaSearchResults.length > 0" dense class="elevation-2" max-height="200" style="position: absolute; z-index: 10; width: 100%;">
                <v-list-item
                  v-for="p in altaSearchResults"
                  :key="p.id_partner"
                  @click="selectPartnerForAlta(p)"
                >
                  <v-list-item-content>
                    <v-list-item-title>{{ formatAlias(p.alias) }}</v-list-item-title>
                    <v-list-item-subtitle v-if="p.partner_dni">DNI {{ p.partner_dni }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-col>
            <v-col v-if="selectedPartnerAlta" cols="12" md="3">
              <v-text-field
                :value="formatDateForInput(santionDateAlta)"
                label="Vencimiento"
                type="date"
                outlined
                dense
                hide-details
                @input="santionDateAlta = $event"
              ></v-text-field>
            </v-col>
            <v-col v-if="selectedPartnerAlta" cols="12" md="2">
              <v-text-field
                v-model.number="amountAlta"
                label="Monto"
                type="number"
                min="0"
                step="0.01"
                outlined
                dense
                hide-details
              ></v-text-field>
            </v-col>
            <v-col v-if="selectedPartnerAlta" cols="12" md="3" class="d-flex align-center">
              <v-btn color="orange" dark :loading="savingAlta" @click="submitAlta">
                <v-icon left>mdi-content-save</v-icon>
                Guardar
              </v-btn>
              <v-btn text class="ml-2" @click="clearAlta">Cancelar</v-btn>
            </v-col>
          </v-row>
          <v-row v-if="selectedPartnerAlta" class="mt-0">
            <v-col cols="12">
              <span class="text-caption grey--text">Socio seleccionado: <strong>{{ formatAlias(selectedPartnerAlta.alias) }}</strong></span>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Una sola grilla -->
      <v-card v-if="loading" class="pa-8 text-center">
        <v-progress-circular indeterminate color="orange" size="48"></v-progress-circular>
        <div class="text-body-2 grey--text mt-2">Cargando socios MENSUAL...</div>
      </v-card>

      <v-card v-else outlined>
        <v-data-table
          :headers="headers"
          :items="partners"
          :items-per-page="15"
          no-data-text="Ningún socio en esquema mensual"
          dense
          class="elevation-0"
        >
          <template v-slot:item.estado="{ item }">
            <v-chip small :color="getEstado(item).color" dark>
              {{ getEstado(item).label }}
            </v-chip>
          </template>
          <template v-slot:item.alias="{ item }">
            <span class="font-weight-medium">{{ formatAlias(item.alias) }}</span>
          </template>
          <template v-slot:item.santion_date="{ item }">
            {{ formatDate(item.santion_date) }}
          </template>
          <template v-slot:item.suspension_reason="{ item }">
            $ {{ item.suspension_reason || '—' }}
          </template>
          <template v-slot:item.expultion_reason="{ item }">
            $ {{ item.expultion_reason || '—' }}
          </template>
          <template v-slot:item.observations="{ item }">
            <span class="text-caption" :title="item.observations">{{ truncate(item.observations, 35) }}</span>
          </template>
          <template v-slot:item.actions="{ item }">
            <div class="d-flex flex-wrap">
              <v-btn small color="primary" class="mr-1 mb-1" @click="openEditarVigente(item)">
                <v-icon x-small left>mdi-pencil</v-icon>
                Editar
              </v-btn>
              <v-btn small color="orange" dark class="mr-1 mb-1" @click="openRegistrarPago(item)">
                <v-icon x-small left>mdi-cash</v-icon>
                Registrar pago
              </v-btn>
              <v-btn small outlined color="grey" class="mb-1" @click="anotarNoPaga(item)">
                <v-icon x-small left>mdi-close-circle</v-icon>
                No paga
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </v-card>

      <!-- Dialog Registrar pago -->
      <v-dialog v-model="dialogRegistrarPago" max-width="400" persistent>
        <v-card>
          <v-card-title>Registrar pago</v-card-title>
          <v-card-text v-if="partnerRegistrarPago">
            <p class="mb-2"><strong>{{ formatAlias(partnerRegistrarPago.alias) }}</strong></p>
            <v-text-field
              v-model="registrarPagoDate"
              label="Nueva fecha de vencimiento"
              type="date"
              outlined
              dense
              class="mb-2"
            ></v-text-field>
            <v-text-field
              v-model.number="registrarPagoAmount"
              label="Monto"
              type="number"
              min="0"
              step="0.01"
              outlined
              dense
            ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="dialogRegistrarPago = false">Cancelar</v-btn>
            <v-btn color="orange" dark :loading="savingRegistrarPago" @click="submitRegistrarPago">
              Guardar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Dialog Editar vigente (vencimiento, último monto, acumulado) -->
      <v-dialog v-model="dialogEditarVigente" max-width="420" persistent>
        <v-card>
          <v-card-title>Editar datos del plan</v-card-title>
          <v-card-text v-if="partnerEditar">
            <p class="mb-3"><strong>{{ formatAlias(partnerEditar.alias) }}</strong></p>
            <v-text-field
              v-model="editarVencimiento"
              label="Vencimiento"
              type="date"
              outlined
              dense
              class="mb-2"
            ></v-text-field>
            <v-text-field
              v-model.number="editarUltimoMonto"
              label="Último monto"
              type="number"
              min="0"
              step="0.01"
              outlined
              dense
              class="mb-2"
            ></v-text-field>
            <v-text-field
              v-model.number="editarAcumulado"
              label="Acumulado"
              type="number"
              min="0"
              step="0.01"
              outlined
              dense
            ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="dialogEditarVigente = false">Cancelar</v-btn>
            <v-btn color="primary" :loading="savingEditar" @click="submitEditarVigente">
              Guardar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </template>
  </div>
</template>

<script>
const base = process.env.VUE_APP_DEGIRA || '';

export default {
  name: 'EsquemaPagoMensual',
  data() {
    return {
      loadingId: true,
      loading: false,
      idMensual: null,
      partners: [],
      headers: [
        { text: 'Estado', value: 'estado', sortable: false, width: '140' },
        { text: 'Socio', value: 'alias', sortable: true },
        { text: 'Vencimiento', value: 'santion_date', sortable: true },
        { text: 'Último monto', value: 'suspension_reason', sortable: false },
        { text: 'Acumulado', value: 'expultion_reason', sortable: false },
        { text: 'Observaciones', value: 'observations', sortable: false },
        { text: 'Acciones', value: 'actions', sortable: false, width: '280' },
      ],
      altaSearch: '',
      altaSearchResults: [],
      selectedPartnerAlta: null,
      santionDateAlta: null,
      amountAlta: 0,
      savingAlta: false,
      dialogRegistrarPago: false,
      partnerRegistrarPago: null,
      registrarPagoDate: null,
      registrarPagoAmount: 0,
      savingRegistrarPago: false,
      dialogEditarVigente: false,
      partnerEditar: null,
      editarVencimiento: null,
      editarUltimoMonto: 0,
      editarAcumulado: 0,
      savingEditar: false,
    };
  },
  computed: {
    hoy() {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d;
    },
    hoyMas3() {
      const d = new Date(this.hoy);
      d.setDate(d.getDate() + 3);
      return d;
    },
  },
  mounted() {
    this.fetchIdMensual();
  },
  methods: {
    getEstado(item) {
      const vto = item.santion_date ? new Date(item.santion_date) : null;
      if (!vto) return { label: 'Sin vto', key: 'vigente', color: 'grey' };
      if (vto < this.hoy) return { label: 'Abono vencido', key: 'vencido', color: 'red' };
      if (vto >= this.hoy && vto <= this.hoyMas3) return { label: 'Próximo a vencer', key: 'proximo', color: 'orange' };
      return { label: 'Vigente', key: 'vigente', color: 'green' };
    },
    getBody() {
      const user = this.$store.state.userLoged && this.$store.state.userLoged.data;
      return {
        id_user: user ? user.id_user : '',
        roles: user && user.roles ? user.roles : [],
      };
    },
    fetchIdMensual() {
      this.loadingId = true;
      const trySetFromResponse = (res) => {
        const data = res.data && res.data.data;
        const id = (data && data.id_visit_type_mensual != null)
          ? data.id_visit_type_mensual
          : (res.data && res.data.id_visit_type_mensual != null ? res.data.id_visit_type_mensual : null);
        if (id != null) {
          this.idMensual = id;
          this.loadPartners();
        }
        return id != null;
      };
      const done = () => { this.loadingId = false; };
      this.$http
        .get(base + 'partners/mensual-visit-type-id', { params: {} })
        .then((res) => {
          if (trySetFromResponse(res)) return done();
          return this.fetchIdFromVisitTypes().then(done);
        })
        .catch(() => this.fetchIdFromVisitTypes().finally(done));
    },
    fetchIdFromVisitTypes() {
      return this.$http
        .get(base + 'visits_types/get')
        .then((res) => {
          const list = res.data && res.data.data;
          if (Array.isArray(list)) {
            const mensual = list.find((v) => (v.description || '').toUpperCase() === 'MENSUAL');
            if (mensual && mensual.id_visit_type != null) {
              this.idMensual = mensual.id_visit_type;
              this.loadPartners();
            }
          }
        })
        .catch(() => {});
    },
    loadPartners() {
      if (this.idMensual == null) return;
      this.loading = true;
      this.$http
        .get(base + 'partners/list', {
          params: {
            page: 1,
            pageSize: 500,
            id_visit_type_usualy: this.idMensual,
          },
        })
        .then((res) => {
          const data = res.data;
          const rows = data && data.data;
          this.partners = Array.isArray(rows) ? rows : [];
        })
        .catch(() => {
          this.partners = [];
        })
        .finally(() => {
          this.loading = false;
        });
    },
    searchPartnerForAlta() {
      const q = (this.altaSearch || '').trim();
      if (q.length < 2) {
        this.altaSearchResults = [];
        return;
      }
      this.$http
        .get(base + 'partners/list', {
          params: { page: 1, pageSize: 20, search: q },
        })
        .then((res) => {
          const data = res.data && res.data.data;
          this.altaSearchResults = Array.isArray(data) ? data : [];
        })
        .catch(() => {
          this.altaSearchResults = [];
        });
    },
    selectPartnerForAlta(p) {
      this.selectedPartnerAlta = p;
      this.altaSearch = this.formatAlias(p.alias);
      this.altaSearchResults = [];
      const d = new Date();
      d.setDate(d.getDate() + 30);
      this.santionDateAlta = this.formatDateForInput(d);
      this.amountAlta = parseFloat(p.suspension_reason) || 0;
    },
    clearAlta() {
      this.selectedPartnerAlta = null;
      this.altaSearch = '';
      this.santionDateAlta = null;
      this.amountAlta = 0;
    },
    formatDateForInput(date) {
      if (!date) return '';
      const d = date instanceof Date ? date : new Date(date);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    },
    submitAlta() {
      if (!this.selectedPartnerAlta || this.amountAlta < 0) return;
      const santionDate = this.santionDateAlta ? new Date(this.santionDateAlta) : new Date();
      if (isNaN(santionDate.getTime())) {
        if (this.$root.$emit) this.$root.$emit('toast', { show: true, text: 'Fecha de vencimiento inválida', color: 'error' });
        return;
      }
      this.savingAlta = true;
      const amount = Number(this.amountAlta);
      const amountStr = String(amount);
      const prevAcum = this.selectedPartnerAlta.expultion_reason ? parseFloat(this.selectedPartnerAlta.expultion_reason) : 0;
      const isAlreadyMensual = this.selectedPartnerAlta.id_visit_type_usualy === this.idMensual;
      const newAcumulado = isAlreadyMensual && !isNaN(prevAcum) ? prevAcum + amount : amount;
      const body = {
        ...this.getBody(),
        id_visit_type_usualy: this.idMensual,
        santion_date: santionDate.toISOString(),
        suspension_reason: amountStr,
        expultion_reason: String(newAcumulado),
      };
      this.$http
        .put(base + 'partners/update/' + this.selectedPartnerAlta.id_partner, body)
        .then(() => {
          this.clearAlta();
          this.loadPartners();
          if (this.$root.$emit) this.$root.$emit('toast', { show: true, text: 'Guardado correctamente', color: 'success' });
        })
        .catch((err) => {
          const msg = (err.response && err.response.data && err.response.data.message) || 'Error al guardar';
          if (this.$root.$emit) this.$root.$emit('toast', { show: true, text: msg, color: 'error' });
        })
        .finally(() => {
          this.savingAlta = false;
        });
    },
    openRegistrarPago(partner) {
      this.partnerRegistrarPago = partner;
      const d = new Date();
      d.setDate(d.getDate() + 30);
      this.registrarPagoDate = this.formatDateForInput(d);
      this.registrarPagoAmount = parseFloat(partner.suspension_reason) || 0;
      this.dialogRegistrarPago = true;
    },
    submitRegistrarPago() {
      if (!this.partnerRegistrarPago) return;
      const santionDate = this.registrarPagoDate ? new Date(this.registrarPagoDate) : new Date();
      if (isNaN(santionDate.getTime())) {
        if (this.$root.$emit) this.$root.$emit('toast', { show: true, text: 'Fecha inválida', color: 'error' });
        return;
      }
      this.savingRegistrarPago = true;
      const amount = Number(this.registrarPagoAmount);
      const amountStr = String(amount);
      const prevAcum = this.partnerRegistrarPago.expultion_reason ? parseFloat(this.partnerRegistrarPago.expultion_reason) : 0;
      const isAlreadyMensual = this.partnerRegistrarPago.id_visit_type_usualy === this.idMensual;
      const newAcumulado = isAlreadyMensual && !isNaN(prevAcum) ? prevAcum + amount : amount;
      const body = {
        ...this.getBody(),
        id_visit_type_usualy: this.idMensual,
        santion_date: santionDate.toISOString(),
        suspension_reason: amountStr,
        expultion_reason: String(newAcumulado),
      };
      this.$http
        .put(base + 'partners/update/' + this.partnerRegistrarPago.id_partner, body)
        .then(() => {
          this.dialogRegistrarPago = false;
          this.partnerRegistrarPago = null;
          this.loadPartners();
          if (this.$root.$emit) this.$root.$emit('toast', { show: true, text: 'Pago registrado', color: 'success' });
        })
        .catch((err) => {
          const msg = (err.response && err.response.data && err.response.data.message) || 'Error';
          if (this.$root.$emit) this.$root.$emit('toast', { show: true, text: msg, color: 'error' });
        })
        .finally(() => {
          this.savingRegistrarPago = false;
        });
    },
    openEditarVigente(partner) {
      this.partnerEditar = partner;
      this.editarVencimiento = this.formatDateForInput(partner.santion_date);
      this.editarUltimoMonto = parseFloat(partner.suspension_reason) || 0;
      this.editarAcumulado = parseFloat(partner.expultion_reason) || 0;
      this.dialogEditarVigente = true;
    },
    submitEditarVigente() {
      if (!this.partnerEditar) return;
      const santionDate = this.editarVencimiento ? new Date(this.editarVencimiento) : new Date();
      if (isNaN(santionDate.getTime())) {
        if (this.$root.$emit) this.$root.$emit('toast', { show: true, text: 'Fecha de vencimiento inválida', color: 'error' });
        return;
      }
      if (this.editarUltimoMonto < 0 || this.editarAcumulado < 0) {
        if (this.$root.$emit) this.$root.$emit('toast', { show: true, text: 'Montos deben ser ≥ 0', color: 'error' });
        return;
      }
      this.savingEditar = true;
      const body = {
        ...this.getBody(),
        id_visit_type_usualy: this.idMensual,
        santion_date: santionDate.toISOString(),
        suspension_reason: String(this.editarUltimoMonto),
        expultion_reason: String(this.editarAcumulado),
      };
      this.$http
        .put(base + 'partners/update/' + this.partnerEditar.id_partner, body)
        .then(() => {
          this.dialogEditarVigente = false;
          this.partnerEditar = null;
          this.loadPartners();
          if (this.$root.$emit) this.$root.$emit('toast', { show: true, text: 'Datos actualizados', color: 'success' });
        })
        .catch((err) => {
          const msg = (err.response && err.response.data && err.response.data.message) || 'Error';
          if (this.$root.$emit) this.$root.$emit('toast', { show: true, text: msg, color: 'error' });
        })
        .finally(() => {
          this.savingEditar = false;
        });
    },
    anotarNoPaga(partner) {
      if (!partner || !partner.id_partner) return;
      this.$http
        .patch(base + 'partners/' + partner.id_partner + '/no-paga', this.getBody())
        .then(() => {
          this.loadPartners();
          if (this.$root.$emit) this.$root.$emit('toast', { show: true, text: 'Anotado: no paga', color: 'info' });
        })
        .catch((err) => {
          const msg = (err.response && err.response.data && err.response.data.message) || 'Error';
          if (this.$root.$emit) this.$root.$emit('toast', { show: true, text: msg, color: 'error' });
        });
    },
    formatAlias(alias) {
      if (!alias) return '—';
      return String(alias).replace(/---/g, ' ');
    },
    formatDate(date) {
      if (!date) return '—';
      return this.$moment ? this.$moment(date).format('DD/MM/YYYY') : String(date).slice(0, 10);
    },
    truncate(t, len) {
      if (!t) return '—';
      return t.length <= len ? t : t.slice(0, len) + '…';
    },
  },
};
</script>
