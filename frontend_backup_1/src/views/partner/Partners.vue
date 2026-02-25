<template>
  <div class="partners-view">
    <!-- Header -->
    <div class="header-section">
      <div class="title-with-stats">
        <div class="title-content">
          <h1 class="page-title">
            <v-icon color="primary" class="mr-3">mdi-account-group</v-icon>
            Gestión de Socios
          </h1>
          <p class="page-subtitle">Administración y consulta de socios del club</p>
        </div>
        <div class="stats-badge">
          <div class="stats-content">
            <v-icon class="stats-icon">mdi-account-multiple</v-icon>
            <div class="stats-text">
              <div class="stats-number">{{ totalPartners }}</div>
              <div class="stats-label">Total Socios</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="header-actions">
        <v-btn
          color="primary"
          @click="refreshData"
          class="refresh-btn"
          :loading="load"
        >
          <v-icon left>mdi-refresh</v-icon>
          Actualizar
        </v-btn>
        <v-btn
          color="success"
          @click="exportToExcel"
          class="export-btn"
          :loading="loadExcel"
        >
          <v-icon left>mdi-file-excel</v-icon>
          Exportar Excel
        </v-btn>
      </div>
    </div>

    <!-- Panel de Filtros -->
    <div class="filters-panel">
      <div class="filters-header" @click="toggleFilters">
        <div class="filters-title">
          <v-icon color="primary" class="mr-2">mdi-tune</v-icon>
          <span>Filtros de Búsqueda</span>
          <v-chip
            v-if="hasActiveFilters"
            color="primary"
            text-color="white"
            x-small
            class="ml-2"
          >
            {{ activeFiltersCount }}
          </v-chip>
        </div>
        <v-icon class="expand-icon" :class="{ 'rotate-180': filtersExpanded }">
          mdi-chevron-up
        </v-icon>
      </div>

      <v-expand-transition>
        <div v-show="filtersExpanded" class="filters-content">
          <div class="filter-grid">
            <!-- Búsqueda Principal -->
            <div class="filter-item search-item">
              <label class="filter-label">
                <v-icon size="16" color="primary">mdi-magnify</v-icon>
                Buscar Socio
              </label>
              <v-text-field
                v-model="search"
                placeholder="DNI, alias, email..."
                outlined
                dense
                clearable
                @input="debounceSearch"
                class="search-field"
                hide-details
              >
                <template v-slot:prepend-inner>
                  <v-icon color="grey lighten-1">mdi-magnify</v-icon>
                </template>
              </v-text-field>
            </div>

            <!-- Estado del Socio -->
            <div class="filter-item">
              <label class="filter-label">
                <v-icon size="16" color="primary">mdi-account-check</v-icon>
                Estado
              </label>
              <v-select
                v-model="selectedStatus"
                :items="statusOptions"
                placeholder="Seleccionar estado..."
                outlined
                dense
                clearable
                @change="handleFilterChange"
                hide-details
              >
                <template v-slot:prepend-inner>
                  <v-icon color="grey lighten-1">mdi-account-check</v-icon>
                </template>
              </v-select>
            </div>

            <!-- Rango de Fechas de Alta -->
            <div class="filter-item">
              <label class="filter-label">
                <v-icon size="16" color="primary">mdi-calendar-range</v-icon>
                Fecha de Alta
              </label>
              <v-menu
                ref="dateMenu"
                v-model="dateMenu"
                :close-on-content-click="false"
                transition="scale-transition"
                offset-y
                min-width="auto"
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field
                    v-model="dateRangeText"
                    placeholder="Seleccionar fechas..."
                    readonly
                    outlined
                    dense
                    v-bind="attrs"
                    v-on="on"
                    @click="handleDateChange"
                    hide-details
                  >
                    <template v-slot:prepend-inner>
                      <v-icon color="grey lighten-1">mdi-calendar-range</v-icon>
                    </template>
                  </v-text-field>
                </template>
                <v-date-picker
                  v-model="dates"
                  range
                  @change="handleDateChange"
                ></v-date-picker>
              </v-menu>
            </div>
          </div>

          <!-- Acciones de Filtros -->
          <div class="filter-actions">
            <v-btn
              color="grey"
              outlined
              @click="clearAllFilters"
              class="clear-btn"
              :disabled="!hasActiveFilters"
            >
              <v-icon left>mdi-filter-remove</v-icon>
              Limpiar Filtros
            </v-btn>
            <v-btn
              color="primary"
              @click="toggleFilters"
              class="apply-btn"
            >
              <v-icon left>mdi-check</v-icon>
              Aplicar
            </v-btn>
          </div>
        </div>
      </v-expand-transition>
    </div>

    <!-- Tabla de Socios -->
    <div class="table-container">
      <v-data-table
        :headers="headers"
        :items="apiData"
        :loading="load"
        :options.sync="options"
        :server-items-length="totalItems"
        class="partners-table"
        :items-per-page="25"
        :footer-props="{
          'items-per-page-options': [10, 25, 50, 100]
        }"
      >
        <!-- Template personalizado para cada fila -->
        <template v-slot:item="{ item }">
          <tr class="clickable-row" @click="showDetails(item)">
            <!-- ID -->
            <td class="text-center">
              <v-chip
                color="primary"
                text-color="white"
                small
                class="id-chip"
              >
                {{ item.id_partner }}
              </v-chip>
            </td>

            <!-- DNI -->
            <td class="text-center">
              <div class="dni-cell">
                <v-icon size="16" color="grey" class="mr-1">mdi-card-account-details</v-icon>
                {{ item.dni }}
              </div>
            </td>

            <!-- Alias / Email -->
            <td>
              <div class="alias-cell">
                <div class="alias-name">{{ item.alias }}</div>
                <div class="alias-email" v-if="item.email">{{ item.email }}</div>
              </div>
            </td>

            <!-- Estado -->
            <td class="text-center">
              <v-chip
                :color="getStatusColor(item.id_state)"
                text-color="white"
                small
                class="status-chip"
              >
                <v-icon left size="14">{{ getStatusIcon(item.id_state) }}</v-icon>
                {{ getStatusText(item.id_state) }}
              </v-chip>
            </td>

            <!-- Fecha de Alta -->
            <td class="text-center">
              <div class="date-cell">
                <v-icon size="16" color="grey" class="mr-1">mdi-calendar-plus</v-icon>
                {{ formatDate(item.created_at, 'DD/MM/YYYY') }}
              </div>
            </td>

            <!-- Cantidad de Visitas -->
            <td class="text-center">
              <div class="visits-cell">
                <v-chip
                  :color="getVisitsColor(item.visits_count)"
                  text-color="white"
                  small
                  class="visits-chip"
                >
                  <v-icon left size="14">mdi-door-open</v-icon>
                  {{ item.visits_count || 0 }}
                </v-chip>
              </div>
            </td>

            <!-- Teléfono -->
            <td class="text-center">
              <div class="phone-cell" v-if="item.phone">
                <v-icon size="16" color="grey" class="mr-1">mdi-phone</v-icon>
                {{ item.phone }}
              </div>
              <span v-else class="text-grey">-</span>
            </td>
          </tr>
        </template>

        <!-- Template para cuando no hay datos -->
        <template v-slot:no-data>
          <div class="no-data">
            <v-icon size="64" color="grey lighten-2">mdi-account-off</v-icon>
            <h3>No se encontraron socios</h3>
            <p>Ajusta los filtros o verifica la conexión</p>
          </div>
        </template>

        <!-- Template para loading -->
        <template v-slot:loading>
          <div class="loading-data">
            <v-progress-circular
              indeterminate
              color="primary"
              size="32"
            ></v-progress-circular>
            <p>Cargando socios...</p>
          </div>
        </template>
      </v-data-table>
    </div>

    <!-- Modal de Detalles -->
    <v-dialog v-model="detailsModal" max-width="800px" persistent>
      <v-card>
        <v-card-title class="modal-header">
          <v-icon color="primary" class="mr-2">mdi-account-details</v-icon>
          Detalles del Socio
          <v-spacer></v-spacer>
          <v-btn icon @click="detailsModal = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text v-if="selectedItem" class="modal-content">
          <div class="partner-details">
            <!-- Información Básica -->
            <div class="detail-section">
              <h3 class="section-title">
                <v-icon color="primary" class="mr-2">mdi-information</v-icon>
                Información Básica
              </h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <label>ID:</label>
                  <span>{{ selectedItem.id_partner }}</span>
                </div>
                <div class="detail-item">
                  <label>DNI:</label>
                  <span>{{ selectedItem.dni }}</span>
                </div>
                <div class="detail-item">
                  <label>Alias:</label>
                  <span>{{ selectedItem.alias }}</span>
                </div>
                <div class="detail-item">
                  <label>Email:</label>
                  <span>{{ selectedItem.email || 'No especificado' }}</span>
                </div>
                <div class="detail-item">
                  <label>Teléfono:</label>
                  <span>{{ selectedItem.phone || 'No especificado' }}</span>
                </div>
                <div class="detail-item">
                  <label>Estado:</label>
                  <v-chip
                    :color="getStatusColor(selectedItem.id_state)"
                    text-color="white"
                    small
                  >
                    <v-icon left size="14">{{ getStatusIcon(selectedItem.id_state) }}</v-icon>
                    {{ getStatusText(selectedItem.id_state) }}
                  </v-chip>
                </div>
              </div>
            </div>

            <!-- Estadísticas -->
            <div class="detail-section">
              <h3 class="section-title">
                <v-icon color="primary" class="mr-2">mdi-chart-line</v-icon>
                Estadísticas
              </h3>
              <div class="stats-grid">
                <div class="stat-card">
                  <v-icon color="success" size="32">mdi-door-open</v-icon>
                  <div class="stat-content">
                    <div class="stat-number">{{ selectedItem.visits_count || 0 }}</div>
                    <div class="stat-label">Visitas Totales</div>
                  </div>
                </div>
                <div class="stat-card">
                  <v-icon color="info" size="32">mdi-calendar-plus</v-icon>
                  <div class="stat-content">
                    <div class="stat-number">{{ formatDate(selectedItem.created_at, 'DD/MM/YYYY') }}</div>
                    <div class="stat-label">Fecha de Alta</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>

        <v-card-actions class="modal-actions">
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="detailsModal = false">
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import exportFromJSON from 'export-from-json';
import { getApiUrl } from '../../config/local';

export default {
  name: 'Partners',
  
  data() {
    return {
      // Datos de la tabla
      apiData: [],
      totalItems: 0,
      totalPartners: 0,
      load: false,
      loadExcel: false,
      
      // Filtros
      search: '',
      selectedStatus: null,
      dates: [],
      dateMenu: false,
      filtersExpanded: false,
      
      // Opciones de estado
      statusOptions: [
        { text: 'Activo', value: '1' },
        { text: 'Inactivo', value: '2' },
        { text: 'Suspendido', value: '3' },
        { text: 'Expulsado', value: '4' },
        { text: 'Pendiente', value: '5' },
        { text: 'Bloqueado', value: '6' },
        { text: 'Otro Estado', value: '7' }
      ],
      
      // Configuración de la tabla
      options: {
        page: 1,
        itemsPerPage: 25,
        sortBy: ['created_at'],
        sortDesc: [true]
      },
      
      // Headers de la tabla
      headers: [
        { text: 'ID', value: 'id_partner', width: '80px', sortable: true },
        { text: 'DNI', value: 'dni', width: '120px', sortable: true },
        { text: 'Alias / Email', value: 'alias', sortable: true },
        { text: 'Estado', value: 'id_state', width: '120px', sortable: true },
        { text: 'Fecha Alta', value: 'created_at', width: '120px', sortable: true },
        { text: 'Visitas', value: 'visits_count', width: '100px', sortable: true },
        { text: 'Teléfono', value: 'phone', width: '140px', sortable: true }
      ],
      
      // Modales
      detailsModal: false,
      selectedItem: null,
      
      // Debounce
      searchTimeout: null
    };
  },
  
  computed: {
    dateRangeText() {
      return (this.dates[0] && this.dates[1]) ? this.dates.join(' ~ ') : '';
    },
    
    hasActiveFilters() {
      return this.search || 
             this.selectedStatus || 
             this.dateRangeText;
    },
    
    activeFiltersCount() {
      let count = 0;
      if (this.search) count++;
      if (this.selectedStatus) count++;
      if (this.dateRangeText) count++;
      return count;
    },
    
    totalPages() {
      return Math.ceil(this.totalItems / this.options.itemsPerPage);
    }
  },
  
  mounted() {
    this.searchItems();
  },
  
  methods: {
    // Configuración de API
    getApiUrl(endpoint) {
      return getApiUrl(endpoint);
    },
    
    // Navegación
    toggleFilters() {
      this.filtersExpanded = !this.filtersExpanded;
    },
    
    // API calls
    searchItems() {
      this.load = true;
      
      const params = new URLSearchParams({
        page: this.options.page,
        pageSize: this.options.itemsPerPage,
        sortBy: this.options.sortBy.join(','),
        sortDesc: this.options.sortDesc.join(','),
        searcher: this.search || '',
      });
      
      if (this.selectedStatus) {
        params.append('status', this.selectedStatus);
      }
      
      if (this.dateRangeText) {
        params.append('fechas', this.formatDateRange());
      }
      
      this.$http.get(`${this.getApiUrl('PARTNERS')}?${params}`)
        .then((response) => {
          if (response && response.data) {
            this.apiData = response.data.data || [];
            this.totalItems = response.data.totalCount || 0;
            this.totalPartners = response.data.totalCount || 0;
          }
        })
        .catch((error) => {
          console.error('Error al cargar socios:', error);
          if (this.$toast) {
            this.$toast.error('Error al cargar los socios');
          }
        })
        .finally(() => {
          this.load = false;
        });
    },
    
    // Filtros
    debounceSearch() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.options.page = 1;
        this.searchItems();
      }, 500);
    },
    
    handleFilterChange() {
      this.options.page = 1;
      this.searchItems();
    },
    
    handleDateChange() {
      this.options.page = 1;
      this.searchItems();
    },
    
    clearAllFilters() {
      this.search = '';
      this.selectedStatus = null;
      this.dates = [];
      this.options.page = 1;
      this.searchItems();
    },
    
    // Utilidades
    formatDate(date, format) {
      if (!date) return '';
      return this.$moment(date).format(format);
    },
    
    formatDateRange() {
      if (this.dates.length === 2) {
        return `${this.dates[0]}~${this.dates[1]}`;
      }
      return '';
    },
    
    getStatusColor(idState) {
      const colors = {
        1: 'success',    // Activo
        2: 'grey',       // Inactivo
        3: 'warning',    // Suspendido
        4: 'error',      // Expulsado
        5: 'info',       // Pendiente
        6: 'orange',     // Bloqueado
        7: 'purple'      // Otro estado
      };
      return colors[idState] || 'grey';
    },
    
    getStatusIcon(idState) {
      const icons = {
        1: 'mdi-check-circle',    // Activo
        2: 'mdi-account-off',     // Inactivo
        3: 'mdi-pause-circle',    // Suspendido
        4: 'mdi-account-remove',  // Expulsado
        5: 'mdi-clock-outline',   // Pendiente
        6: 'mdi-lock',           // Bloqueado
        7: 'mdi-help-circle'     // Otro estado
      };
      return icons[idState] || 'mdi-help-circle';
    },
    
    getStatusText(idState) {
      const texts = {
        1: 'Activo',
        2: 'Inactivo',
        3: 'Suspendido',
        4: 'Expulsado',
        5: 'Pendiente',
        6: 'Bloqueado',
        7: 'Otro Estado'
      };
      return texts[idState] || 'Desconocido';
    },
    
    getVisitsColor(count) {
      if (count >= 50) return 'success';
      if (count >= 20) return 'info';
      if (count >= 10) return 'warning';
      return 'grey';
    },
    
    // Acciones
    refreshData() {
      this.options.page = 1;
      this.searchItems();
    },
    
    showDetails(item) {
      this.selectedItem = item;
      this.detailsModal = true;
    },
    
    // Exportación
    exportToExcel() {
      this.loadExcel = true;
      
      // Construir parámetros con los filtros aplicados
      const params = new URLSearchParams({
        page: 1,
        pageSize: -1, // Obtener TODOS los registros
        sortBy: this.options.sortBy.join(','),
        sortDesc: this.options.sortDesc.join(','),
        searcher: this.search || '',
      });
      
      if (this.selectedStatus) {
        params.append('status', this.selectedStatus);
      }
      
      if (this.dateRangeText) {
        params.append('fechas', this.formatDateRange());
      }
      
      this.$http.get(`${this.getApiUrl('PARTNERS')}?${params}`)
        .then((response) => {
          if (response && response.data && response.data.data) {
            const data = response.data.data.map(item => ({
              'ID Socio': item.id_partner,
              'DNI': item.dni,
              'Alias': item.alias,
              'Email': item.email || 'N/A',
              'Teléfono': item.phone || 'N/A',
              'Estado': this.getStatusText(item.id_state),
              'Fecha de Alta': this.formatDate(item.created_at, 'DD/MM/YYYY'),
              'Cantidad de Visitas': item.visits_count || 0
            }));
            
            // Generar nombre de archivo con fecha y hora
            const now = this.$moment();
            const fileName = `Socios_${now.format('YYYY-MM-DD_HH-mm-ss')}`;
            const exportType = exportFromJSON.types.xls;
            
            // Agregar información del reporte
            const reportInfo = {
              'Reporte de Socios': '',
              'Fecha de Generación': now.format('DD/MM/YYYY HH:mm:ss'),
              'Total de Registros': data.length,
              'Filtros Aplicados': this.getAppliedFiltersText(),
              '': '',
              'DATOS DE SOCIOS': ''
            };
            
            // Combinar información del reporte con los datos
            const finalData = [reportInfo, ...data];
            
            // Exportar archivo
            exportFromJSON({ 
              data: finalData, 
              fileName, 
              exportType 
            });
            
            if (this.$toast) {
              this.$toast.success(`Excel exportado: ${fileName}.xls (${data.length} registros)`);
            } else {
              console.log(`Excel exportado: ${fileName}.xls (${data.length} registros)`);
            }
          }
        })
        .catch((error) => {
          console.error('Error al exportar:', error);
          if (this.$toast) {
            this.$toast.error('Error al exportar el archivo');
          }
        })
        .finally(() => {
          this.loadExcel = false;
        });
    },
    
    getAppliedFiltersText() {
      const filters = [];
      if (this.search) filters.push(`Búsqueda: "${this.search}"`);
      if (this.selectedStatus) {
        const statusText = this.statusOptions.find(s => s.value === this.selectedStatus)?.text;
        filters.push(`Estado: ${statusText}`);
      }
      if (this.dateRangeText) filters.push(`Fecha: ${this.dateRangeText}`);
      
      return filters.length > 0 ? filters.join(' | ') : 'Sin filtros';
    }
  }
};
</script>

<style scoped>
.partners-view {
  padding: 24px;
  background: #f8fafc;
  min-height: 100vh;
}

/* Header */
.header-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.title-with-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title-content h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.page-subtitle {
  color: #64748b;
  margin: 4px 0 0 0;
  font-size: 16px;
}

.stats-badge {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 12px;
  padding: 16px 20px;
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.stats-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stats-icon {
  font-size: 24px;
}

.stats-number {
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
}

.stats-label {
  font-size: 12px;
  opacity: 0.9;
  margin-top: 2px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.refresh-btn, .export-btn {
  border-radius: 8px;
  text-transform: none;
  font-weight: 500;
}

.refresh-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.export-btn {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: white;
  border: none;
  box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);
}

/* Filtros */
.filters-panel {
  background: white;
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.filters-header:hover {
  background: #f8fafc;
}

.filters-title {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #374151;
  font-size: 16px;
}

.expand-icon {
  transition: transform 0.3s ease;
}

.rotate-180 {
  transform: rotate(180deg);
}

.filters-content {
  padding: 24px;
  border-top: 1px solid #e5e7eb;
}

.filter-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  align-items: start;
}

@media (min-width: 768px) {
  .filter-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 1200px) {
  .filter-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
  margin-bottom: 6px;
}

.search-item {
  grid-column: 1 / -1;
}

.filter-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.clear-btn, .apply-btn {
  border-radius: 8px;
  text-transform: none;
  font-weight: 500;
}

.apply-btn {
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

/* Tabla */
.table-container {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.partners-table {
  border-radius: 16px;
}

.clickable-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.clickable-row:hover {
  background: #f8fafc;
}

.id-chip {
  font-weight: 600;
}

.dni-cell, .date-cell, .phone-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.alias-cell {
  padding: 4px 0;
}

.alias-name {
  font-weight: 600;
  color: #1e293b;
}

.alias-email {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.status-chip, .visits-chip {
  font-weight: 500;
}

.visits-cell {
  display: flex;
  justify-content: center;
}

/* No data y loading */
.no-data, .loading-data {
  text-align: center;
  padding: 48px 24px;
  color: #64748b;
}

.no-data h3 {
  margin: 16px 0 8px 0;
  color: #374151;
}

.loading-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

/* Modal */
.modal-header {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  font-weight: 600;
}

.modal-content {
  padding: 24px;
}

.partner-details {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-section {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item label {
  font-weight: 600;
  color: #64748b;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-item span {
  color: #1e293b;
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.modal-actions {
  padding: 16px 24px;
  background: #f8fafc;
}

/* Responsive */
@media (max-width: 768px) {
  .partners-view {
    padding: 16px;
  }
  
  .title-with-stats {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: stretch;
  }
  
  .header-actions .v-btn {
    flex: 1;
  }
  
  .filter-grid {
    grid-template-columns: 1fr;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
