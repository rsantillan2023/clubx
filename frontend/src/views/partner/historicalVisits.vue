<template>
    <div class="py-3 px-2">
        <!-- Selector de fecha y botón de histograma -->
        <v-card class="mb-4" elevation="1" style="border-radius: 12px;">
            <v-card-text class="pa-4">
                <v-row align="center">
                    <v-col cols="12" md="4">
                        <v-menu
                            ref="menu"
                            v-model="menu"
                            :close-on-content-click="false"
                            :return-value.sync="selectedDate"
                            transition="scale-transition"
                            offset-y
                            min-width="290px"
                        >
                            <template v-slot:activator="{ on, attrs }">
                                <div class="date-selector-wrapper">
                                    <v-text-field
                                        :value="formattedDate"
                                        label="Seleccionar Fecha"
                                        placeholder="Haga clic para elegir una fecha"
                                        readonly
                                        filled
                                        rounded
                                        dense
                                        class="date-input-field"
                                        v-bind="attrs"
                                        v-on="on"
                                        @click="menu = true"
                                    >
                                        <template v-slot:prepend-inner>
                                            <v-icon 
                                                color="orange" 
                                                size="24"
                                                class="calendar-icon"
                                                v-bind="attrs"
                                                v-on="on"
                                                @click.stop="menu = true"
                                            >
                                                mdi-calendar
                                            </v-icon>
                                        </template>
                                        <template v-slot:append>
                                            <v-btn
                                                icon
                                                small
                                                color="orange"
                                                v-bind="attrs"
                                                v-on="on"
                                                @click.stop="menu = true"
                                                class="calendar-button"
                                            >
                                                <v-icon>mdi-calendar-arrow-right</v-icon>
                                            </v-btn>
                                        </template>
                                    </v-text-field>
                                </div>
                            </template>
                            <v-date-picker
                                v-model="selectedDate"
                                no-title
                                scrollable
                                locale="es-AR"
                                color="orange"
                                :events="dateEvents"
                                event-color="green"
                                @input="onDateSelected"
                            >
                                <v-spacer></v-spacer>
                                <v-btn text color="grey" @click="menu = false">Cancelar</v-btn>
                                <v-btn text color="orange" @click="onDateChange">Aceptar</v-btn>
                            </v-date-picker>
                        </v-menu>
                    </v-col>
                    <v-col cols="12" md="8" class="d-flex align-center justify-end">
                        <v-btn
                            color="purple"
                            dark
                            rounded
                            @click="openHistogramModal"
                            class="mr-2"
                            elevation="2"
                        >
                            <v-icon left>mdi-chart-bar</v-icon>
                            Ver Histograma
                        </v-btn>
                        <v-btn
                            color="green"
                            dark
                            rounded
                            @click="archiveXLS"
                            :loading="loadExcel"
                            elevation="2"
                        >
                            <v-icon left>mdi-file-excel</v-icon>
                            Exportar XLS
                        </v-btn>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <!-- Indicadores por tipo de visita - Ocupan todo el ancho -->
        <v-card class="mb-4" elevation="1" style="border-radius: 12px; overflow: hidden; background: #f8f9fa;">
            <v-card-text class="pa-0">
                <v-row v-if="visitTypeStats.length > 0" no-gutters class="stats-row">
                    <v-col 
                        v-for="stat in visitTypeStats" 
                        :key="stat.id_visit_type"
                        :cols="getStatsCols()"
                        class="stats-col"
                    >
                        <div 
                            class="stat-item"
                            :style="'background: linear-gradient(135deg, ' + stat.color + '15 0%, ' + stat.color + '08 100%); border-left: 4px solid ' + stat.color"
                        >
                            <div class="stat-label" :style="{ color: stat.color }">
                                {{ stat.description }}
                            </div>
                            <div class="stat-value" :style="{ color: stat.color }">
                                {{ stat.count }}
                            </div>
                            <div class="stat-details">
                                <div class="stat-detail-row">
                                    <span class="stat-detail-label">Entrada:</span>
                                    <span class="stat-detail-value green--text">${{ formatNumber(stat.entry_amount_paid) }}</span>
                                </div>
                                <div class="stat-detail-row">
                                    <span class="stat-detail-label">Extra Ent:</span>
                                    <span class="stat-detail-value orange--text">${{ formatNumber(stat.extra_entry) }}</span>
                                </div>
                                <div class="stat-detail-row">
                                    <span class="stat-detail-label">Consumos:</span>
                                    <span class="stat-detail-value blue--text">${{ formatNumber(stat.visit_amount_consumed) }}</span>
                                </div>
                                <div class="stat-detail-row">
                                    <span class="stat-detail-label">Salida:</span>
                                    <span class="stat-detail-value purple--text">${{ formatNumber(stat.exit_amount_payed) }}</span>
                                </div>
                                <div class="stat-detail-row">
                                    <span class="stat-detail-label">Extra Sal:</span>
                                    <span class="stat-detail-value orange--text">${{ formatNumber(stat.extra_exit) }}</span>
                                </div>
                                <div class="stat-detail-row total-row">
                                    <span class="stat-detail-label font-weight-bold">Total:</span>
                                    <span class="stat-detail-value font-weight-bold" :style="{ color: stat.color }">${{ formatNumber(stat.total) }}</span>
                                </div>
                            </div>
                        </div>
                    </v-col>
                    <!-- Total general -->
                    <v-col 
                        v-if="visitTypeStats.length > 0"
                        :cols="getStatsCols()"
                        class="stats-col"
                    >
                        <div 
                            class="stat-item total-stat"
                            style="background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); border-left: 4px solid #FF6F00;"
                        >
                            <div class="stat-label white--text">
                                TOTAL
                            </div>
                            <div class="stat-value white--text">
                                {{ totalCount }}
                            </div>
                            <div class="stat-details">
                                <div class="stat-detail-row">
                                    <span class="stat-detail-label white--text">Entrada:</span>
                                    <span class="stat-detail-value white--text">${{ formatNumber(totalEntryAmount) }}</span>
                                </div>
                                <div class="stat-detail-row">
                                    <span class="stat-detail-label white--text">Extra Ent:</span>
                                    <span class="stat-detail-value white--text">${{ formatNumber(totalExtraEntry) }}</span>
                                </div>
                                <div class="stat-detail-row">
                                    <span class="stat-detail-label white--text">Consumos:</span>
                                    <span class="stat-detail-value white--text">${{ formatNumber(totalConsumos) }}</span>
                                </div>
                                <div class="stat-detail-row">
                                    <span class="stat-detail-label white--text">Salida:</span>
                                    <span class="stat-detail-value white--text">${{ formatNumber(totalExitAmount) }}</span>
                                </div>
                                <div class="stat-detail-row">
                                    <span class="stat-detail-label white--text">Extra Sal:</span>
                                    <span class="stat-detail-value white--text">${{ formatNumber(totalExtraExit) }}</span>
                                </div>
                                <div class="stat-detail-row total-row">
                                    <span class="stat-detail-label white--text font-weight-bold">Total:</span>
                                    <span class="stat-detail-value white--text font-weight-bold">${{ formatNumber(totalAmount) }}</span>
                                </div>
                            </div>
                        </div>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <!-- Filtros y búsqueda en Collapsible -->
        <v-expansion-panels v-model="filterPanel" class="mb-4" flat>
            <v-expansion-panel>
                <v-expansion-panel-header class="px-4 py-2" style="min-height: 48px;">
                    <template v-slot:default="{ open }">
                        <div class="d-flex align-center">
                            <v-icon :color="open ? 'orange' : 'grey'" class="mr-2">mdi-filter-variant</v-icon>
                            <span class="font-weight-medium">Filtros y Búsqueda</span>
                            <v-spacer></v-spacer>
                            <v-chip small :color="hasActiveFilters ? 'orange' : 'grey'" text-color="white" class="ml-2">
                                {{ hasActiveFilters ? 'Filtros activos' : 'Sin filtros' }}
                            </v-chip>
                        </div>
                    </template>
                </v-expansion-panel-header>
                <v-expansion-panel-content>
                    <v-card flat class="pa-4" style="background-color: #fafafa;">
                        <v-row align="center" class="filter-row">
                            <v-col cols="12" sm="12" md="4" lg="3" class="py-1">
                                <v-text-field
                                    v-model="searchText"
                                    label="Buscar por DNI, nombre o alias"
                                    filled
                                    rounded
                                    dense
                                    clearable
                                    prepend-inner-icon="mdi-magnify"
                                    @keyup.enter="getVisits"
                                    @click:clear="getVisits"
                                ></v-text-field>
                            </v-col>
                            <v-col cols="12" sm="6" md="2" lg="2" class="py-1">
                                <v-select
                                    v-model="filters.id_state"
                                    :items="states"
                                    item-text="description"
                                    item-value="id_state"
                                    label="Estado"
                                    filled
                                    rounded
                                    dense
                                    clearable
                                    prepend-inner-icon="mdi-account-check"
                                    @change="getVisits"
                                ></v-select>
                            </v-col>
                            <v-col cols="12" sm="6" md="2" lg="2" class="py-1">
                                <v-select
                                    v-model="filters.id_visit_type"
                                    :items="visitTypes"
                                    item-text="description"
                                    item-value="id_visit_type"
                                    label="Tipo de Visita"
                                    filled
                                    rounded
                                    dense
                                    clearable
                                    prepend-inner-icon="mdi-account-group"
                                    @change="getVisits"
                                ></v-select>
                            </v-col>
                            <v-col cols="12" sm="12" md="4" lg="5" class="py-1 d-flex align-center justify-end flex-wrap">
                                <v-btn
                                    color="orange"
                                    dark
                                    rounded
                                    @click="getVisits"
                                    :loading="load"
                                    class="mr-2 mb-1"
                                    elevation="2"
                                    :small="$vuetify.breakpoint.smAndDown"
                                    :x-small="$vuetify.breakpoint.xs"
                                >
                                    <v-icon :left="!$vuetify.breakpoint.xs">mdi-reload</v-icon>
                                    <span v-if="!$vuetify.breakpoint.xs">Actualizar</span>
                                </v-btn>
                            </v-col>
                        </v-row>
                    </v-card>
                </v-expansion-panel-content>
            </v-expansion-panel>
        </v-expansion-panels>

       <historicalVisitsLarge
        v-if="$vuetify.breakpoint.mdAndUp"
        :items="items"
        :load="load"
        :totalItems="totalItems"
        :options="options"
        @changePaginado="options = $event">
       </historicalVisitsLarge>

       <historicalVisitsSmall
        v-if="!$vuetify.breakpoint.mdAndUp" 
        :items="items"
        :load="load"
        @changePaginado="options = $event">
       </historicalVisitsSmall>

       <!-- Modal de Histograma -->
       <HistogramModal
        v-model="showHistogramModal"
        @close="showHistogramModal = false"
       />
    </div>
</template>

<script>

    import historicalVisitsSmall from './historicalVisitsSmall.vue';
    import historicalVisitsLarge from './historicalVisitsLarge.vue';
    import HistogramModal from './HistogramModal.vue';
    import exportFromJSON from 'export-from-json';
    import { downloadFileRN } from '../../helpers/reactNative';

    export default {
    components: {historicalVisitsSmall, historicalVisitsLarge, HistogramModal},

    data: () => ({
      load: false,   
      loadExcel: false,
      items : [],
      searchText: '',
      filters: {
        id_state: null,
        id_visit_type: null,
      },
      states: [],
      visitTypes: [],
      filterPanel: [], // Collapsible cerrado por defecto (array vacío)
      selectedDate: null,
      menu: false,
      showHistogramModal: false,
      datesWithVisits: [], // Fechas que tienen visitantes
      options: {
            sortBy:['visit_date'],
            sortDesc:[true],
            page: 1,
            itemsPerPage: 100,
        },
        totalItems: 0,
     
    }),

    computed: {
        formattedDate() {
            if (!this.selectedDate) return '';
            return this.$moment(this.selectedDate).format('DD/MM/YYYY');
        },
        dateEvents() {
            // Crear un objeto donde las fechas con visitantes tienen valor true
            const events = {};
            this.datesWithVisits.forEach(date => {
                events[date] = true;
            });
            return events;
        },
        paginationText() {
            let cant = this.totalItems/ this.options.itemsPerPage
            return 'Pag. ' + this.options.page + " de " + cant 
        },
        visitTypeStats() {
            if (!this.items || this.items.length === 0) return [];
            
            const statsMap = {};
            
            this.items.forEach(item => {
                const visitType = item.visit_type;
                if (!visitType) return;
                
                const id = visitType.id_visit_type;
                const description = visitType.description || 'Sin tipo';
                
                if (!statsMap[id]) {
                    statsMap[id] = {
                        id_visit_type: id,
                        description: description,
                        count: 0,
                        entry_amount_paid: 0,
                        extra_entry: 0,
                        visit_amount_consumed: 0,
                        exit_amount_payed: 0,
                        extra_exit: 0,
                        total: 0,
                        color: this.getVisitTypeColor(id)
                    };
                }
                
                statsMap[id].count++;
                statsMap[id].entry_amount_paid += parseFloat(item.entry_amount_paid || 0);
                statsMap[id].extra_entry += parseFloat(item.extra_entry || 0);
                statsMap[id].visit_amount_consumed += parseFloat(item.visit_amount_consumed || 0);
                statsMap[id].exit_amount_payed += parseFloat(item.exit_amount_payed || 0);
                statsMap[id].extra_exit += parseFloat(item.extra_exit || 0);
                statsMap[id].total += parseFloat(item.total_payed || 0);
            });
            
            return Object.values(statsMap).map(stat => ({
                ...stat,
                entry_amount_paid: parseFloat(stat.entry_amount_paid.toFixed(2)),
                extra_entry: parseFloat(stat.extra_entry.toFixed(2)),
                visit_amount_consumed: parseFloat(stat.visit_amount_consumed.toFixed(2)),
                exit_amount_payed: parseFloat(stat.exit_amount_payed.toFixed(2)),
                extra_exit: parseFloat(stat.extra_exit.toFixed(2)),
                total: parseFloat(stat.total.toFixed(2))
            }));
        },
        totalCount() {
            return this.items ? this.items.length : 0;
        },
        totalAmount() {
            if (!this.items || this.items.length === 0) return 0;
            const total = this.items.reduce((sum, item) => {
                return sum + (parseFloat(item.total_payed) || 0);
            }, 0);
            return parseFloat(total.toFixed(2));
        },
        totalEntryAmount() {
            if (!this.items || this.items.length === 0) return 0;
            const total = this.items.reduce((sum, item) => {
                return sum + (parseFloat(item.entry_amount_paid || 0));
            }, 0);
            return parseFloat(total.toFixed(2));
        },
        totalExtraEntry() {
            if (!this.items || this.items.length === 0) return 0;
            const total = this.items.reduce((sum, item) => {
                return sum + (parseFloat(item.extra_entry || 0));
            }, 0);
            return parseFloat(total.toFixed(2));
        },
        totalConsumos() {
            if (!this.items || this.items.length === 0) return 0;
            const total = this.items.reduce((sum, item) => {
                return sum + (parseFloat(item.visit_amount_consumed || 0));
            }, 0);
            return parseFloat(total.toFixed(2));
        },
        totalExitAmount() {
            if (!this.items || this.items.length === 0) return 0;
            const total = this.items.reduce((sum, item) => {
                return sum + (parseFloat(item.exit_amount_payed || 0));
            }, 0);
            return parseFloat(total.toFixed(2));
        },
        totalExtraExit() {
            if (!this.items || this.items.length === 0) return 0;
            const total = this.items.reduce((sum, item) => {
                return sum + (parseFloat(item.extra_exit || 0));
            }, 0);
            return parseFloat(total.toFixed(2));
        },
        hasActiveFilters() {
            return !!(this.searchText || this.filters.id_state || this.filters.id_visit_type);
        }
    },
    watch: {
        options: {
            handler () {
                if(this.options.sortBy.length > 0) {
                    this.getVisits()
                }
            },
            deep: true,
        },
    },
    beforeMount() {
      // Establecer fecha por defecto a hoy
      this.selectedDate = this.$moment().format('YYYY-MM-DD');
      this.loadStates();
      this.loadVisitTypes();
      this.loadDatesWithVisits();
      this.getVisits();
    },
    methods: {
      getStatsCols() {
        const totalStats = this.visitTypeStats.length + 1; // +1 para el total
        if (totalStats <= 2) return 6;
        if (totalStats <= 4) return 3;
        if (totalStats <= 6) return 2;
        return 2;
      },
      onDateSelected(date) {
        // Se ejecuta cuando se selecciona una fecha en el picker
        this.selectedDate = date;
      },
      onDateChange() {
        // Se ejecuta cuando se hace clic en "Aceptar"
        if (this.$refs.menu && this.selectedDate) {
          this.$refs.menu.save(this.selectedDate);
        }
        this.menu = false;
        this.$nextTick(() => {
          this.getVisits();
        });
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
      async loadDatesWithVisits() {
        try {
          const response = await this.$http.get(
            `${process.env.VUE_APP_DEGIRA}partners/dates-with-visits`
          );
          if (response && response.data) {
            this.datesWithVisits = response.data.data || [];
          }
        } catch (error) {
          console.error('Error al cargar fechas con visitantes:', error);
          this.datesWithVisits = [];
        }
      },
      openHistogramModal() {
        console.log('=== openHistogramModal() llamado ===');
        console.log('showHistogramModal antes:', this.showHistogramModal);
        this.showHistogramModal = true;
        console.log('showHistogramModal después:', this.showHistogramModal);
      },
      getVisits() {
        if (!this.selectedDate) {
          this.$toast.error('Por favor seleccione una fecha');
          return;
        }

        let vm = this
        this.load = true

        const params = {
          page: this.options.page,
          pageSize: this.options.itemsPerPage,
          sortBy: this.options.sortBy[0] || 'visit_date',
          sortDesc: this.options.sortDesc[0] !== false,
          date: this.selectedDate, // Fecha seleccionada
        };

        if (this.searchText) {
          params.search = this.searchText;
        }

        if (this.filters.id_state) {
          params.id_state = this.filters.id_state;
        }

        if (this.filters.id_visit_type) {
          params.id_visit_type = this.filters.id_visit_type;
        }

        this.$http.get(process.env.VUE_APP_DEGIRA+"partners/historical", { params })
          .then((response)=>{
            if(response && response.data){
              // El responseHandler devuelve { data: rows, totalCount: count }
              vm.items = response.data.data || []
              vm.totalItems = response.data.totalCount || 0
              console.log('Datos recibidos:', { items: vm.items.length, total: vm.totalItems, params });
            } 
            vm.load = false
          })
          .catch((error) => {
            console.error('Error al cargar visitas:', error);
            console.error('Error response:', error.response);
            vm.load = false
          })
      },
      formatNumber(num) {
        if (!num && num !== 0) return '0';
        return num.toLocaleString('es-AR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        });
      },
      getVisitTypeColor(id) {
        const colors = {
          1: '#4CAF50', // verde
          2: '#2196F3', // azul
          3: '#9C27B0', // morado
          4: '#FF9800', // naranja
          5: '#F44336', // rojo
        };
        return colors[id] || '#757575'; // gris por defecto
      },
      archiveXLS() {
        this.loadExcel = true;
        const data = this.items.map(item => {
          let row = {
            Tipo_de_Membresia: item.partner?.visit_type?.description || '',
            Alias: item.partner?.alias || '',
            Estado: item.partner?.state?.description || '',
            Datos_de_Ingreso: item.visit_date || '',
            Dia_de_Visita: this.formatDay(item.id_day),
            Hora_de_Entrada: this.parseHour(item.hour_entry),
            Monto_Abonado: item.total_payed || 0,
            Tipo_de_Visita: item.visit_type?.description || '',
            Nombre_Socio: item.partner?.partner_name || '',
            DNI_Socio: item.partner?.partner_dni || '',
            Brazalete_1: item.id_bracelet_1 || '',
            Nombre_Afiliado: item.partner?.affiliate_name || '',
            DNI_Afiliado: item.partner?.affiliate_dni || '',
            Brazalete_2: item.id_bracelet_2 || '',
          };
          return row;
        });

        const timeAndHour = this.$moment().format('DDMMYYYYHHmm');
        const fileName = `Visitas_Historicas_${this.selectedDate}_${timeAndHour}`;
        let exportType = exportFromJSON.types.xls;
        downloadFileRN({ data, fileName, exportType });
        exportFromJSON({ data, fileName, exportType });
        this.loadExcel = false;
      },
      formatDay(id_day) {
        if (id_day == 1) return 'Domingo';
        if (id_day == 2) return 'Lunes';
        if (id_day == 3) return 'Martes';
        if (id_day == 4) return 'Miércoles';
        if (id_day == 5) return 'Jueves';
        if (id_day == 6) return 'Viernes';
        if (id_day == 7) return 'Sábado';
        return '';
      },
      parseHour(date) {
        if (date != null) {
          date.replace(/(T)/, ' ');
          date.substr(0, 19);
        }
        return (date != null) ? this.$moment(date, 'YYYY-MM-DD HH:mm:ss').format('HH:mm') : '';
      },
    },
  }
</script>

<style scoped>
/* Estilos para los indicadores - No son botones */
.stats-row {
  display: flex;
  width: 100%;
}

.stats-col {
  display: flex;
  padding: 0 !important;
}

.stat-item {
  width: 100%;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  text-align: center;
  min-height: 240px;
  transition: opacity 0.2s;
  border-right: 1px solid rgba(0, 0, 0, 0.05);
}

.stat-item:last-child {
  border-right: none;
}

.stat-item:hover {
  opacity: 0.9;
}

.total-stat {
  box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.1);
}

.stat-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 8px;
  opacity: 0.9;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 6px;
  font-family: 'Roboto', sans-serif;
}

.stat-amount {
  font-size: 0.85rem;
  font-weight: 500;
  opacity: 0.85;
  margin-top: 4px;
}

.stat-details {
  width: 100%;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.stat-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
  font-size: 0.7rem;
}

.stat-detail-row.total-row {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  font-size: 0.75rem;
}

.stat-detail-label {
  font-weight: 500;
  opacity: 0.8;
}

.stat-detail-value {
  font-weight: 600;
  text-align: right;
}

/* Responsive para indicadores */
@media (max-width: 600px) {
  .stat-item {
    padding: 12px 8px;
    min-height: 220px;
  }
  
  .stat-value {
    font-size: 1.4rem;
  }
  
  .stat-label {
    font-size: 0.6rem;
  }
  
  .stat-details {
    margin-top: 6px;
    padding-top: 6px;
  }
  
  .stat-detail-row {
    font-size: 0.65rem;
    padding: 1px 0;
  }
  
  .stat-detail-row.total-row {
    font-size: 0.7rem;
  }
}

/* Mejorar el estilo del expansion panel */
.v-expansion-panel {
  border-radius: 10px !important;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08) !important;
  overflow: hidden;
}

.v-expansion-panel-header {
  background-color: white !important;
  transition: background-color 0.2s;
}

.v-expansion-panel-header:hover {
  background-color: #fafafa !important;
}

.v-expansion-panel-content {
  background-color: #fafafa !important;
}

/* Responsive mejorado para botones */
@media (max-width: 960px) {
  .v-expansion-panel-content .v-row .v-col {
    margin-bottom: 8px;
  }
  
  .v-expansion-panel-content .v-btn {
    width: 100%;
    margin-right: 0 !important;
    margin-bottom: 8px;
  }
}

/* Estilos para el selector de fecha mejorado */
.date-selector-wrapper {
  position: relative;
}

.date-input-field {
  cursor: pointer;
}

.date-input-field:hover {
  background-color: #fafafa;
}

.date-input-field ::v-deep .v-input__control {
  cursor: pointer;
}

.date-input-field ::v-deep .v-input__slot {
  cursor: pointer;
  transition: all 0.2s ease;
}

.date-input-field ::v-deep .v-input__slot:hover {
  background-color: #fff3e0 !important;
  box-shadow: 0 2px 4px rgba(255, 152, 0, 0.2) !important;
}

.calendar-icon {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.calendar-icon:hover {
  transform: scale(1.1);
}

.calendar-button {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.calendar-button:hover {
  transform: scale(1.1);
}

.date-input-field ::v-deep input {
  cursor: pointer;
}

.date-input-field ::v-deep label {
  cursor: pointer;
}
</style>

