<template>
    <div class="py-3 px-2">
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
        <v-expansion-panels v-model="filterPanel" class="mb-4" flat multiple>
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
                        </v-row>
                        <v-row align="center" class="mt-2">
                            <v-col cols="12" class="py-1 d-flex align-center justify-end" style="flex-wrap: nowrap;">
                                <v-btn
                                    color="orange"
                                    dark
                                    rounded
                                    @click="getVisits"
                                    :loading="load"
                                    class="mr-2"
                                    elevation="2"
                                    :small="$vuetify.breakpoint.smAndDown"
                                    :x-small="$vuetify.breakpoint.xs"
                                >
                                    <v-icon :left="!$vuetify.breakpoint.xs">mdi-reload</v-icon>
                                    <span v-if="!$vuetify.breakpoint.xs">Actualizar</span>
                                </v-btn>
                                <v-btn
                                    v-if="$vuetify.breakpoint.mdAndUp"
                                    color="red"
                                    dark
                                    rounded
                                    @click="showMassiveExitDialog"
                                    :disabled="!selectedVisits || selectedVisits.length === 0"
                                    :loading="loadingMassiveExit"
                                    class="mr-2"
                                    elevation="2"
                                    :small="$vuetify.breakpoint.smAndDown"
                                    :x-small="$vuetify.breakpoint.xs"
                                >
                                    <v-icon :left="!$vuetify.breakpoint.xs">mdi-exit-run</v-icon>
                                    <span v-if="!$vuetify.breakpoint.xs">Egreso Masivo</span>
                                    <span v-if="selectedVisits && selectedVisits.length > 0" class="ml-1">({{ selectedVisits.length }})</span>
                                </v-btn>
                                <v-btn
                                    color="blue"
                                    dark
                                    rounded
                                    @click="$router.push('/partnerSearch')"
                                    class="mr-2"
                                    elevation="2"
                                    :small="$vuetify.breakpoint.smAndDown"
                                    :x-small="$vuetify.breakpoint.xs"
                                >
                                    <v-icon :left="!$vuetify.breakpoint.xs">mdi-account-plus</v-icon>
                                    <span v-if="!$vuetify.breakpoint.xs">Registrar</span>
                                </v-btn>
                                <v-btn
                                    color="green"
                                    dark
                                    rounded
                                    @click="archiveXLS"
                                    :loading="loadExcel"
                                    class="mr-2"
                                    elevation="2"
                                    :small="$vuetify.breakpoint.smAndDown"
                                    :x-small="$vuetify.breakpoint.xs"
                                >
                                    <v-icon :left="!$vuetify.breakpoint.xs">mdi-file-excel</v-icon>
                                    <span v-if="!$vuetify.breakpoint.xs">Exportar XLS</span>
                                    <span v-else>XLS</span>
                                </v-btn>
                                <v-btn
                                    color="purple"
                                    dark
                                    rounded
                                    @click="$router.push('/productsSale')"
                                    elevation="2"
                                    :small="$vuetify.breakpoint.smAndDown"
                                    :x-small="$vuetify.breakpoint.xs"
                                >
                                    <v-icon :left="!$vuetify.breakpoint.xs">mdi-cart</v-icon>
                                    <span v-if="!$vuetify.breakpoint.xs">Vender Productos</span>
                                    <span v-else>Vender</span>
                                </v-btn>
                            </v-col>
                        </v-row>
                    </v-card>
                </v-expansion-panel-content>
            </v-expansion-panel>
        </v-expansion-panels>

       <activeVisitsLarge
        v-if="$vuetify.breakpoint.mdAndUp"
        :items="items"
        :load="load"
        :totalItems="totalItems"
        :options="options"
        @changePaginado="options = $event"
        @update:selected="selectedVisits = $event">
       </activeVisitsLarge>

       <activeVisitsSmall
        v-if="!$vuetify.breakpoint.mdAndUp" 
        :items="items"
        :load="load"
        @changePaginado="options = $event">
       </activeVisitsSmall>

        <!-- Diálogo de Confirmación para Egreso Masivo -->
        <v-dialog v-model="massiveExitDialog" max-width="500" persistent>
            <v-card>
                <v-card-title class="red white--text">
                    <v-icon left color="white">mdi-alert-circle</v-icon>
                    Confirmar Egreso Masivo
                </v-card-title>
                <v-card-text class="pt-4">
                    <p class="text-body-1 mb-3">
                        ¿Está seguro que desea registrar la salida de <strong>{{ selectedVisits.length }}</strong> visitante(s)?
                    </p>
                    <v-divider class="my-3"></v-divider>
                    <div class="text-body-2">
                        <div class="mb-2">
                            <strong>Monto por visita:</strong> 
                            <span class="orange--text font-weight-bold">$1</span>
                        </div>
                        <div class="mb-2">
                            <strong>Observaciones:</strong> "baja masiva"
                        </div>
                        <v-alert type="warning" dense outlined class="mt-3">
                            Esta acción registrará la salida de todos los visitantes seleccionados con un monto de $1 y la observación "baja masiva".
                        </v-alert>
                    </div>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn 
                        text 
                        color="grey" 
                        @click="massiveExitDialog = false"
                        :disabled="loadingMassiveExit">
                        Cancelar
                    </v-btn>
                    <v-btn 
                        color="red" 
                        dark 
                        @click="processMassiveExit"
                        :loading="loadingMassiveExit">
                        <v-icon left>mdi-check</v-icon>
                        Confirmar
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>

    import activeVisitsSmall from './activeVisitsSmall.vue';
    import activeVisitsLarge from './activeVisitsLarge.vue';
    import exportFromJSON from 'export-from-json';
    import { downloadFileRN } from '../../helpers/reactNative';
    import eventBus from '../../event-bus';

    export default {
    components: {activeVisitsSmall,activeVisitsLarge},

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
      filterPanel: [0], // Collapsible abierto por defecto
      options: {
            sortBy:['visit_date'],
            sortDesc:[true],
            page: 1,
            itemsPerPage: 100,
        },
        totalItems: 0,
        selectedVisits: [],
        loadingMassiveExit: false,
        massiveExitDialog: false,
     
    }),

    computed: {
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
      this.loadStates();
      this.loadVisitTypes();
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
      getVisits() {
        let vm = this
        this.load = true

        const params = {
          page: this.options.page,
          pageSize: this.options.itemsPerPage,
          sortBy: this.options.sortBy[0] || 'visit_date',
          sortDesc: this.options.sortDesc[0] !== false,
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

        this.$http.get(process.env.VUE_APP_DEGIRA+"partners/inside", { params })
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
            Monto_Consumido: item.visit_amount_consumed || 0,
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
        const fileName = `Visitas_${timeAndHour}`;
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
      showMassiveExitDialog() {
        if (!this.selectedVisits || this.selectedVisits.length === 0) {
          eventBus.$emit('toast', { 
            show: true, 
            text: 'Debe seleccionar al menos un visitante', 
            color: 'red' 
          });
          return;
        }
        this.massiveExitDialog = true;
      },
      async processMassiveExit() {
        if (!this.selectedVisits || this.selectedVisits.length === 0) {
          this.massiveExitDialog = false;
          return;
        }

        this.loadingMassiveExit = true;
        this.massiveExitDialog = false;

        const vm = this;
        const results = {
          success: [],
          errors: []
        };

        // Procesar cada visita seleccionada
        const promises = this.selectedVisits.map(async (visit) => {
          try {
            const data = {
              "id_state": "2",
              "exit_visit_obs": "baja masiva",
              "exit_amount_payed": 1,
              "other_paid": 0,
              "had_to_paid": 1,
              "other_paid_obs": "",
              "id_payment_method": 1, // Efectivo
            };

            const response = await vm.$http.put(
              `${process.env.VUE_APP_DEGIRA}visits/exit/${visit.id_visit}`, 
              data
            );

            if (response && response.data) {
              results.success.push({
                alias: visit.partner?.alias || 'N/A',
                id_visit: visit.id_visit
              });
            }
          } catch (error) {
            console.error(`Error al procesar visita ${visit.id_visit}:`, error);
            results.errors.push({
              alias: visit.partner?.alias || 'N/A',
              id_visit: visit.id_visit,
              error: error.response?.data?.message || 'Error desconocido'
            });
          }
        });

        // Esperar a que todas las promesas se completen
        await Promise.all(promises);

        this.loadingMassiveExit = false;

        // Mostrar resultado
        const successCount = results.success.length;
        const errorCount = results.errors.length;
        
        if (errorCount === 0) {
          eventBus.$emit('toast', {
            show: true,
            text: `Se registró exitosamente la salida de ${successCount} visitante(s)`,
            color: 'green'
          });
        } else if (successCount > 0) {
          eventBus.$emit('toast', {
            show: true,
            text: `Se registraron ${successCount} salidas exitosas. ${errorCount} fallaron.`,
            color: 'orange'
          });
        } else {
          eventBus.$emit('toast', {
            show: true,
            text: `Error al registrar las salidas. Ninguna se procesó correctamente.`,
            color: 'red'
          });
        }

        // Limpiar selección y refrescar lista
        this.selectedVisits = [];
        this.getVisits();
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

/* Asegurar que los botones estén en la misma línea en pantallas grandes */
@media (min-width: 961px) {
  .v-expansion-panel-content .v-col.d-flex {
    flex-wrap: nowrap !important;
  }
  
  .v-expansion-panel-content .v-col.d-flex .v-btn {
    white-space: nowrap;
    flex-shrink: 0;
  }
}

/* Mejorar espaciado de los indicadores */
.stats-container {
  padding: 8px;
}
</style>

