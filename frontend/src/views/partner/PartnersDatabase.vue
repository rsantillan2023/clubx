<template>
  <v-container fluid class="pa-3">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4 orange--text">Base de datos de socios</h1>
      </v-col>
    </v-row>

    <!-- Filtros y búsqueda -->
    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-text-field
          v-model="searchText"
          label="Buscar (DNI, Nombre, Alias, Teléfono)"
          outlined
          dense
          clearable
          append-icon="mdi-magnify"
          @keyup.enter="loadPartners"
          @click:clear="loadPartners"
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="filters.id_state"
          :items="states"
          item-text="description"
          item-value="id_state"
          label="Estado"
          outlined
          dense
          multiple
          chips
          small-chips
          deletable-chips
          @change="loadPartners"
        >
          <template v-slot:append-item>
            <v-divider></v-divider>
            <v-list-item @click="clearStatesFilter">
              <v-list-item-content>
                <v-list-item-title class="text-center orange--text">
                  <v-icon left small>mdi-close-circle</v-icon>
                  Deseleccionar Todos
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </template>
        </v-select>
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="filters.id_visit_type_usualy"
          :items="visitTypes"
          item-text="description"
          item-value="id_visit_type"
          label="Tipo de Visita"
          outlined
          dense
          clearable
          @change="loadPartners"
        ></v-select>
      </v-col>
      <v-col cols="12" md="2" class="d-flex align-center">
        <v-btn
          color="orange"
          dark
          block
          @click="loadPartners"
          :loading="loading"
        >
          <v-icon left>mdi-reload</v-icon>
          Actualizar
        </v-btn>
      </v-col>
    </v-row>

    <!-- Grilla de datos -->
    <v-row>
      <v-col cols="12" class="table-col-full-width">
        <v-card outlined class="overflow-x-auto">
          <v-data-table
            :headers="headers"
            :items="partners"
            :loading="loading"
            :server-items-length="totalCount"
            :options.sync="options"
            :footer-props="{
              'items-per-page-text': 'Registros por Página',
              'items-per-page-all-text': 'Todos',
            }"
            dense
            fixed-header
            no-data-text="No hay socios registrados"
            class="elevation-1 compact-table"
          >
            <template v-slot:item.id_partner="{ item }">
              <strong>{{ item.id_partner }}</strong>
            </template>

            <template v-slot:item.partner_birthdate="{ item }">
              {{ formatDate(item.partner_birthdate) }}
            </template>

            <template v-slot:item.partner_discharge_date="{ item }">
              {{ formatDate(item.partner_discharge_date) }}
            </template>

            <template v-slot:item.id_state="{ item }">
              <v-chip
                small
                :color="getStateColor(item.state?.id_state)"
                dark
              >
                {{ item.state?.description || 'N/A' }}
              </v-chip>
            </template>

            <template v-slot:item.id_visit_type_usualy="{ item }">
              {{ item.visit_type?.description || 'N/A' }}
            </template>

            <template v-slot:item.observations="{ item }">
              <span 
                v-if="item.observations" 
                @click="openObservationsDialog(item)"
                style="cursor: pointer; text-decoration: underline; color: #1976d2;"
                :title="item.observations.length > 40 ? 'Click para ver completo' : ''"
              >
                {{ truncateText(item.observations, 40) }}
              </span>
              <span v-else>-</span>
            </template>

            <template v-slot:item.actions="{ item }">
              <div class="d-flex flex-wrap align-center justify-start actions-cell">
                <div class="action-btn-block">
                  <v-btn
                    color="orange"
                    dark
                    icon
                    x-small
                    class="ma-1"
                    @click="goTo('/editPartner', item)"
                  >
                    <v-icon small>mdi-pencil</v-icon>
                  </v-btn>
                  <span class="action-label">Edit</span>
                </div>
                <div v-if="isNormalState(item) && !isPartnerInEstablishment(item)" class="action-btn-block">
                  <v-btn
                    color="orange"
                    dark
                    icon
                    x-small
                    class="ma-1"
                    @click="goTo('/entryRegisterLite', item)"
                  >
                    <v-icon small>mdi-cash-fast</v-icon>
                  </v-btn>
                  <span class="action-label">Entrar</span>
                </div>
                <div v-if="item.state && item.state.id_state === 5" class="action-btn-block">
                  <v-btn
                    color="orange"
                    dark
                    icon
                    x-small
                    class="ma-1"
                    @click="goTo('/membershipReactivation', item)"
                  >
                    <v-icon small>mdi-account-reactivate</v-icon>
                  </v-btn>
                  <span class="action-label">Membr</span>
                </div>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog para mostrar observaciones completas -->
    <v-dialog v-model="observationsDialog" max-width="600px">
      <v-card>
        <v-card-title class="headline orange--text">
          Observaciones
        </v-card-title>
        <v-card-text class="pt-4">
          <div v-if="selectedObservations" class="text-body-1" style="white-space: pre-wrap; word-wrap: break-word;">
            {{ selectedObservations }}
          </div>
          <div v-else class="text-body-1 grey--text">
            Sin observaciones
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="orange" text @click="observationsDialog = false">
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
export default {
  name: 'PartnersDatabase',
  data() {
    return {
      partners: [],
      loading: false,
      totalCount: 0,
      searchText: '',
      filters: {
        id_state: [],
        id_visit_type_usualy: null,
      },
      states: [],
      visitTypes: [],
      observationsDialog: false,
      selectedObservations: '',
      options: {
        page: 1,
        itemsPerPage: 100,
        sortBy: ['id_partner'],
        sortDesc: [true],
      },
      headers: [
        { text: 'ID', value: 'id_partner', sortable: true, width: '60px' },
        { text: 'Alias', value: 'alias', sortable: true, width: '100px' },
        { text: 'DNI Socio', value: 'partner_dni', sortable: true, width: '100px' },
        { text: 'Nombre Socio', value: 'partner_name', sortable: true, width: '120px' },
        { text: 'F. Nac. Socio', value: 'partner_birthdate', sortable: true, width: '100px' },
        { text: 'Tel. Socio', value: 'partner_phone', sortable: true, width: '100px' },
        { text: 'Estado', value: 'id_state', sortable: true, width: '100px' },
        { text: 'Tipo Visita', value: 'id_visit_type_usualy', sortable: true, width: '100px' },
        { text: 'Fecha Alta', value: 'partner_discharge_date', sortable: true, width: '100px' },
        { text: 'Observaciones', value: 'observations', sortable: false, width: '150px' },
        { text: 'Acciones', value: 'actions', sortable: false, width: '220px', align: 'left' },
      ],
    };
  },
  mounted() {
    this.loadStates();
    this.loadVisitTypes();
    this.loadPartners();
  },
  watch: {
    options: {
      handler() {
        this.loadPartners();
      },
      deep: true,
    },
  },
  methods: {
    async loadPartners() {
      this.loading = true;
      try {
        const params = {
          page: this.options.page,
          pageSize: this.options.itemsPerPage,
          sortBy: this.options.sortBy[0] || 'id_partner',
          sortDesc: this.options.sortDesc[0] !== false,
          search: this.searchText || '',
        };

        if (this.filters.id_state && this.filters.id_state.length > 0) {
          // Enviar el array de estados - axios lo convertirá correctamente
          params.id_state = this.filters.id_state;
        }

        if (this.filters.id_visit_type_usualy) {
          params.id_visit_type_usualy = this.filters.id_visit_type_usualy;
        }

        const response = await this.$http.get(
          `${process.env.VUE_APP_DEGIRA}partners/list`,
          { params }
        );

        if (response && response.data) {
          this.partners = response.data.data || [];
          this.totalCount = response.data.totalCount || 0;
        }
      } catch (error) {
        console.error('Error al cargar socios:', error);
        this.$store.commit('showSnackbar', {
          text: 'Error al cargar los socios',
          color: 'error',
        });
      } finally {
        this.loading = false;
      }
    },
    async loadStates() {
      try {
        const response = await this.$http.get(
          `${process.env.VUE_APP_DEGIRA}states/get`
        );
        if (response && response.data) {
          this.states = response.data.data || [];
        }
      } catch (error) {
        console.error('Error al cargar estados:', error);
      }
    },
    async loadVisitTypes() {
      try {
        const response = await this.$http.get(
          `${process.env.VUE_APP_DEGIRA}visits_types/get`
        );
        if (response && response.data) {
          this.visitTypes = response.data.data || [];
        }
      } catch (error) {
        console.error('Error al cargar tipos de visita:', error);
      }
    },
    formatDate(date) {
      if (!date) return '-';
      return this.$moment(date).format('DD/MM/YYYY');
    },
    getStateColor(idState) {
      const colorMap = {
        1: 'success',      // SOCIO_VIP - Verde
        2: 'primary',      // SOCIO_NORMAL - Azul
        3: 'purple',       // SOCIO_TURISTA - Morado
        4: 'warning',      // SOCIO_OBSERVADO - Naranja/Amarillo
        5: 'grey',         // SOCIO_NO_FRECUENTE - Gris
        6: 'error',        // SOCIO_EXPULSADO - Rojo
        7: 'deep-orange',  // SOCIO_SUSPENDIDO - Naranja oscuro
        8: 'info',         // SOCIO_INVITADO - Cian/Azul claro
      };
      return colorMap[idState] || 'grey';
    },
    truncateText(text, maxLength) {
      if (!text) return '';
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    },
    openObservationsDialog(item) {
      this.selectedObservations = item.observations || '';
      this.observationsDialog = true;
    },
    clearStatesFilter() {
      this.filters.id_state = [];
      this.loadPartners();
    },
    /** Navegar a una ruta con el socio en el store (como en partnerSearch). */
    goTo(path, item) {
      this.$store.commit('setPartner', item);
      this.$router.push(path);
    },
    /** Estados que pueden registrar ingreso: VIP, Normal, Turista, Observado, Invitado (1,2,3,4,8). */
    isNormalState(item) {
      const id = item?.state?.id_state;
      return id != null && [1, 2, 3, 4, 8].includes(Number(id));
    },
    /** Si el socio está actualmente en el club (la lista puede no traer este dato). */
    isPartnerInEstablishment(item) {
      return item && item.partner_in_establishment === true;
    },
  },
};
</script>

<style scoped>
.table-col-full-width {
  max-width: 100%;
  overflow-x: auto;
}

.text-truncate {
  display: inline-block;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Estilos para hacer la tabla más compacta */
.compact-table ::v-deep .v-data-table__wrapper {
  font-size: 0.65rem;
  overflow-x: auto;
}

.compact-table ::v-deep .v-data-table {
  min-width: 100%;
}

.compact-table ::v-deep th {
  font-size: 0.65rem !important;
  padding: 6px 3px !important;
  font-weight: 600;
}

.compact-table ::v-deep td {
  font-size: 0.65rem !important;
  padding: 4px 3px !important;
}

.compact-table ::v-deep .v-chip {
  font-size: 0.6rem !important;
  height: 18px !important;
  padding: 0 4px !important;
}

.compact-table ::v-deep .v-data-table__mobile-row {
  font-size: 0.65rem;
}

.actions-cell {
  min-width: 200px;
}

.action-btn-block {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  margin: 0 2px;
}

.action-label {
  font-size: 0.5rem;
  line-height: 1.1;
  color: #666;
}
</style>

