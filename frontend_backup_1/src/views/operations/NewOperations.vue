<template>
  <div class="operations-dashboard">
    <!-- Header Principal -->
    <div class="dashboard-header">
      <div class="header-content">
        <div class="title-section">
          <div class="title-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="title-text">
            <div class="title-with-stats">
              <h1>Registro de Operaciones del Club</h1>
              <div class="stats-badge" v-if="totalItems > 0">
                <div class="stats-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 11H15M9 15H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L19.7071 9.70711C19.8946 9.89464 20 10.149 20 10.4142V19C20 20.1046 19.1046 21 18 21H17ZM17 21V9.5H12.5V5H7V19H17Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div class="stats-content">
                  <div class="stats-number">{{ totalItems }}</div>
                  <div class="stats-label">operaciones</div>
                </div>
              </div>
            </div>
            <p>Monitoreo de todas las actividades realizadas en el sistema</p>
          </div>
        </div>
        <div class="header-actions">
          <v-btn
            color="primary"
            outlined
            @click="refreshData"
            class="refresh-btn mr-3"
          >
            <v-icon left>mdi-refresh</v-icon>
            Actualizar
          </v-btn>
          <v-btn
            color="success"
            dark
            @click="exportToExcel"
            :loading="loadExcel"
            class="export-btn"
          >
            <v-icon left>mdi-file-excel</v-icon>
            Exportar Excel
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Panel de Filtros Collapsible -->
    <div class="filters-panel">
      <div class="filters-header" @click="toggleFilters">
        <div class="filters-title">
          <v-icon color="primary" class="mr-2">mdi-tune</v-icon>
          <span>Filtros Avanzados</span>
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
        <v-icon :class="{ 'rotate-180': filtersExpanded }" class="expand-icon">
          mdi-chevron-up
        </v-icon>
      </div>
      
      <v-expand-transition>
        <div v-show="filtersExpanded" class="filters-content">
          <div class="filter-group">
            <div class="filter-item search-item">
              <label class="filter-label">
                <v-icon size="16" color="primary">mdi-magnify</v-icon>
                Buscar Operación
              </label>
              <v-text-field
                v-model="search"
                placeholder="ID, socio, usuario..."
                outlined
                dense
                clearable
                @input="debounceSearch"
                class="search-field"
              >
                <template v-slot:prepend-inner>
                  <v-icon color="grey">mdi-magnify</v-icon>
                </template>
              </v-text-field>
            </div>

            <div class="filter-item">
              <label class="filter-label">
                <v-icon size="16" color="primary">mdi-shape</v-icon>
                Tipo de Operación
              </label>
              <v-select
                v-model="selectedOperation"
                :items="operations"
                placeholder="Seleccionar tipo..."
                outlined
                dense
                multiple
                chips
                clearable
                item-text="description"
                item-value="id_operation_type"
                @change="handleFilterChange"
              >
                <template v-slot:prepend-inner>
                  <v-icon color="grey">mdi-filter</v-icon>
                </template>
              </v-select>
              <div class="filter-note" v-if="!selectedOperation.length">
                <v-icon color="info" size="12">mdi-information</v-icon>
                <span>Excluyendo "Consulta de Datos de Socio" por defecto</span>
              </div>
            </div>

            <div class="filter-item">
              <label class="filter-label">
                <v-icon size="16" color="primary">mdi-calendar-week</v-icon>
                Día de la Semana
              </label>
              <v-select
                v-model="selectedDay"
                :items="days"
                placeholder="Seleccionar día..."
                outlined
                dense
                clearable
                item-text="name"
                item-value="id_day"
                :loading="loadDayFilter"
                @change="handleFilterChange"
              >
                <template v-slot:prepend-inner>
                  <v-icon color="grey">mdi-calendar-week</v-icon>
                </template>
                <template v-slot:append>
                  <v-progress-circular
                    v-if="loadDayFilter"
                    size="20"
                    width="2"
                    indeterminate
                    color="primary"
                  ></v-progress-circular>
                </template>
              </v-select>
              <div v-if="loadDayFilter" class="filter-loading-text">
                <v-icon size="16" color="primary">mdi-loading</v-icon>
                <span>Procesando filtro por día...</span>
              </div>
            </div>

            <div class="filter-item">
              <label class="filter-label">
                <v-icon size="16" color="primary">mdi-calendar-range</v-icon>
                Rango de Fechas
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
                    outlined
                    dense
                    readonly
                    clearable
                    v-bind="attrs"
                    v-on="on"
                    @click:clear="clearDateRange"
                  >
                    <template v-slot:prepend-inner>
                      <v-icon color="grey">mdi-calendar</v-icon>
                    </template>
                  </v-text-field>
                </template>
                <v-date-picker
                  v-model="dates"
                  range
                  color="primary"
                  locale="es-es"
                  no-title
                  @change="handleDateChange"
                />
              </v-menu>
            </div>

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
        </div>
      </v-expand-transition>
    </div>


    <!-- Tabla de Operaciones -->
    <div class="operations-table">
      <v-data-table
        :headers="headers"
        :items="apiData"
        :loading="load"
        :server-items-length="totalItems"
        :options.sync="options"
        :footer-props="{
          'items-per-page-text': 'Registros por página',
          'items-per-page-all-text': 'Todos',
          'page-text': paginationText,
        }"
        class="operations-data-table"
        :no-data-text="'No se encontraron operaciones'"
        :loading-text="'Cargando operaciones...'"
        :items-per-page="15"
      >

        <!-- Template para fila clickeable -->
        <template v-slot:item="{ item }">
          <tr @click="showDetails(item)" class="clickable-row">
            <td class="text-center">
              <div class="operation-id">
                <div class="id-number">#{{ item.id_operation }}</div>
              </div>
            </td>
            <td class="text-center">
              <div class="datetime-cell">
                <div class="date">{{ formatDate(item.operation_date, 'DD/MM/YYYY') }}</div>
                <div class="time">{{ parseHour(item.operation_date) }}</div>
              </div>
            </td>
            <td class="text-center">
              <div class="day-cell">
                <div class="day-icon" :class="getDayClass(item.day ? item.day.name : 'N/A')">
                  <!-- Domingo -->
                  <svg v-if="getDayName(item.day) === 'Domingo'" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" stroke-width="2"/>
                  </svg>
                  <!-- Lunes -->
                  <svg v-else-if="getDayName(item.day) === 'Lunes'" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <!-- Martes -->
                  <svg v-else-if="getDayName(item.day) === 'Martes'" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                  </svg>
                  <!-- Miércoles -->
                  <svg v-else-if="getDayName(item.day) === 'Miércoles'" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 3H21V21H3V3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M9 9H15V15H9V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M3 9H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <path d="M3 15H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  <!-- Jueves -->
                  <svg v-else-if="getDayName(item.day) === 'Jueves'" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.09 8.26L22 9L15.09 9.74L12 16L8.91 9.74L2 9L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                    <path d="M12 2V8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  <!-- Viernes -->
                  <svg v-else-if="getDayName(item.day) === 'Viernes'" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                    <path d="M12 2V8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <path d="M12 16V22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  <!-- Sábado -->
                  <svg v-else-if="getDayName(item.day) === 'Sábado'" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20Z" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="12" cy="12" r="1" fill="currentColor"/>
                  </svg>
                  <!-- Default -->
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
                    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2"/>
                    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2"/>
                    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2"/>
                  </svg>
                </div>
                <div class="day-name">{{ item.day ? item.day.name : 'N/A' }}</div>
              </div>
            </td>
            <td class="text-center">
              <div class="operation-type">
                <div class="type-icon" :class="item.operation_type ? getOperationTypeClass(item.operation_type.description) : 'default'">
                  <!-- Entrada -->
                  <svg v-if="item.operation_type && getOperationType(item.operation_type.description) === 'Entrada'" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.09 8.26L22 9L15.09 9.74L12 16L8.91 9.74L2 9L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                    <path d="M12 2V8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  <!-- Salida -->
                  <svg v-else-if="item.operation_type && getOperationType(item.operation_type.description) === 'Salida'" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L8.91 8.26L2 9L8.91 9.74L12 16L15.09 9.74L22 9L15.09 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                    <path d="M12 16V22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  <!-- Pago -->
                  <svg v-else-if="item.operation_type && getOperationType(item.operation_type.description) === 'Pago'" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
                    <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" stroke-width="2"/>
                    <circle cx="6" cy="7" r="1" fill="currentColor"/>
                    <circle cx="18" cy="7" r="1" fill="currentColor"/>
                  </svg>
                  <!-- Consulta -->
                  <svg v-else-if="item.operation_type && getOperationType(item.operation_type.description) === 'Consulta'" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
                    <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="11" cy="11" r="2" fill="currentColor"/>
                  </svg>
                  <!-- Devolución -->
                  <svg v-else-if="item.operation_type && getOperationType(item.operation_type.description) === 'Devolución'" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 12L9 6L15 12L21 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M3 18L9 12L15 18L21 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M9 6V12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <path d="M15 12V18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  <!-- Reserva -->
                  <svg v-else-if="item.operation_type && getOperationType(item.operation_type.description) === 'Reserva'" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" stroke-width="2"/>
                    <path d="M16 1V5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <path d="M8 1V5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <path d="M3 9H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <circle cx="12" cy="15" r="2" fill="currentColor"/>
                  </svg>
                  <!-- Venta -->
                  <svg v-else-if="item.operation_type && getOperationType(item.operation_type.description) === 'Venta'" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 4V2C7 1.44772 7.44772 1 8 1H16C16.5523 1 17 1.44772 17 2V4H20C20.5523 4 21 4.44772 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 4.44772 3.44772 4 4 4H7Z" stroke="currentColor" stroke-width="2"/>
                    <path d="M7 4H17" stroke="currentColor" stroke-width="2"/>
                    <path d="M9 9V17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <path d="M15 9V17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  <!-- Validación -->
                  <svg v-else-if="item.operation_type && getOperationType(item.operation_type.description) === 'Validación'" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <path d="M12 18V22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  <!-- Alta Socio -->
                  <svg v-else-if="item.operation_type && getOperationType(item.operation_type.description) === 'Alta Socio'" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="8.5" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M20 8V14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M23 11H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <!-- Membresía -->
                  <svg v-else-if="item.operation_type && getOperationType(item.operation_type.description) === 'Membresía'" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" stroke-width="2"/>
                    <path d="M2 10H22" stroke="currentColor" stroke-width="2"/>
                    <path d="M6 6H10" stroke="currentColor" stroke-width="2"/>
                    <path d="M6 14H10" stroke="currentColor" stroke-width="2"/>
                    <path d="M14 6H18" stroke="currentColor" stroke-width="2"/>
                    <path d="M14 14H18" stroke="currentColor" stroke-width="2"/>
                  </svg>
                  <!-- Registro -->
                  <svg v-else-if="item.operation_type && getOperationType(item.operation_type.description) === 'Registro'" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" stroke-width="2"/>
                    <path d="M14 2V8H20" stroke="currentColor" stroke-width="2"/>
                    <path d="M16 13H8" stroke="currentColor" stroke-width="2"/>
                    <path d="M16 17H8" stroke="currentColor" stroke-width="2"/>
                    <path d="M10 9H8" stroke="currentColor" stroke-width="2"/>
                  </svg>
                  <!-- Ingreso -->
                  <svg v-else-if="item.operation_type && getOperationType(item.operation_type.description) === 'Ingreso'" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H15" stroke="currentColor" stroke-width="2"/>
                    <path d="M10 17L15 12L10 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M15 12H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <!-- Egreso -->
                  <svg v-else-if="item.operation_type && getOperationType(item.operation_type.description) === 'Egreso'" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H9" stroke="currentColor" stroke-width="2"/>
                    <path d="M14 7L9 12L14 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M9 12H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <!-- Default -->
                  <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div class="type-text">{{ item.operation_type ? item.operation_type.description : 'Sin tipo' }}</div>
              </div>
            </td>
            <td class="text-center">
              <div class="user-cell">
                <div class="user-avatar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div class="user-info">
                  <div class="username">{{ item.user.username }}</div>
                  <div class="user-role">{{ item.role.description }}</div>
                </div>
              </div>
            </td>
            <td class="text-center">
              <div class="partner-cell">
                <div class="partner-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M23 21V19C23 17.1362 21.7252 15.5701 20 15.126M16 3.13C17.7252 3.57007 19 5.13616 19 7C19 8.86384 17.7252 10.4299 16 10.87" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div class="partner-info">
                  <div class="partner-alias">{{ item.partner ? item.partner.alias : 'N/A' }}</div>
                  <div class="partner-id" v-if="item.id_visit">Visita #{{ item.id_visit }}</div>
                </div>
              </div>
            </td>
            <td class="text-center">
              <div class="payment-cell" v-if="item.payment_method">
                <div class="payment-icon">
                  <svg v-if="item.payment_method.method.includes('Efectivo')" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 1V23M17 5H9.5C8.11929 5 7 6.11929 7 7.5S8.11929 10 9.5 10H14.5C15.8807 10 17 11.1193 17 12.5S15.8807 15 14.5 15H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <svg v-else-if="item.payment_method.method.includes('Tarjeta')" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
                    <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" stroke-width="2"/>
                  </svg>
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <path d="M8 14S9.5 16 12 16S16 14 16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <line x1="9" y1="9" x2="9.01" y2="9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <line x1="15" y1="9" x2="15.01" y2="9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div class="payment-method">{{ item.payment_method.method }}</div>
              </div>
              <span v-else class="no-payment">-</span>
            </td>
            <td class="text-center">
              <div class="amount-cell" v-if="item.operation_amount > 0">
                <div class="amount-value">${{ item.operation_amount }}</div>
              </div>
              <span v-else class="no-amount">-</span>
            </td>
          </tr>
        </template>
      </v-data-table>
    </div>

    <!-- Modal de Detalles -->
    <v-dialog v-model="detailsModal" max-width="700" persistent>
      <v-card class="details-modal">
        <v-card-title class="modal-header">
          <div class="modal-title">
            <div class="title-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="title-text">
              <h3>Detalles de la Operación</h3>
              <p>Información completa del registro</p>
            </div>
          </div>
          <v-btn icon @click="detailsModal = false" class="close-btn">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="modal-content">
          <div v-if="selectedItem" class="details-content">
            <v-simple-table class="details-table">
              <tbody>
                <tr v-for="(value, key) in parsedDetails" :key="key">
                  <td class="detail-key">{{ formatKey(key) }}</td>
                  <td class="detail-value">{{ value }}</td>
                </tr>
              </tbody>
            </v-simple-table>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Modal de Log -->
    <v-dialog v-model="logModal" max-width="700" persistent>
      <v-card class="log-modal">
        <v-card-title class="modal-header">
          <div class="modal-title">
            <div class="title-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="10,9 9,9 8,9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="title-text">
              <h3>Log de la Operación</h3>
              <p>Registro de actividades del sistema</p>
            </div>
          </div>
          <v-btn icon @click="logModal = false" class="close-btn">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="modal-content">
          <div v-if="selectedItem" class="log-content">
            <v-simple-table class="log-table">
              <tbody>
                <tr v-for="(value, key) in parsedLog" :key="key">
                  <td class="log-key">{{ formatKey(key) }}</td>
                  <td class="log-value">{{ value }}</td>
                </tr>
              </tbody>
            </v-simple-table>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import exportFromJSON from 'export-from-json';

export default {
  name: 'NewOperations',
  
  data() {
    return {
      // Filtros
      search: '',
      selectedOperation: [],
      selectedDay: null,
      dates: ['', ''],
      dateMenu: false,
      filtersExpanded: false,
      
      // Datos
      apiData: [],
      totalItems: 0,
      operations: [],
      days: [
        { id_day: 1, name: 'Domingo' },
        { id_day: 2, name: 'Lunes' },
        { id_day: 3, name: 'Martes' },
        { id_day: 4, name: 'Miércoles' },
        { id_day: 5, name: 'Jueves' },
        { id_day: 6, name: 'Viernes' },
        { id_day: 7, name: 'Sábado' }
      ],
      load: false,
      loadExcel: false,
      loadDayFilter: false,
      
      // Modales
      detailsModal: false,
      logModal: false,
      selectedItem: null,
      
      // Vista
      viewMode: 'table',
      
      // Tabla
      options: {
        sortBy: ['operation_date'],
        sortDesc: [true],
        page: 1,
        itemsPerPage: 10,
      },
      
      headers: [
        { text: 'ID', value: 'id_operation', align: 'center', width: '60px' },
        { text: 'Fecha', value: 'operation_date', align: 'center', width: '100px' },
        { text: 'Día', value: 'day', align: 'center', width: '100px' },
        { text: 'Tipo', value: 'operation_type', align: 'center', width: '150px' },
        { text: 'Usuario', value: 'user', align: 'center', width: '120px' },
        { text: 'Socio', value: 'partner', align: 'center', width: '180px' },
        { text: 'Pago', value: 'payment_method', align: 'center', width: '120px' },
        { text: 'Monto', value: 'operation_amount', align: 'center', width: '100px' },
      ],
      
      // Debounce
      searchTimeout: null,
    };
  },
  
  computed: {
    dateRangeText() {
      return (this.dates[0] && this.dates[1]) ? this.dates.join(' ~ ') : '';
    },
    
    paginationText() {
      const totalPages = Math.ceil(this.totalItems / this.options.itemsPerPage);
      return `Página ${this.options.page} de ${totalPages}`;
    },
    
    hasActiveFilters() {
      return this.search || 
             this.selectedOperation.length > 0 || 
             this.selectedDay || 
             this.dateRangeText;
    },
    
    activeFiltersCount() {
      let count = 0;
      if (this.search) count++;
      if (this.selectedOperation.length > 0) count++;
      if (this.selectedDay) count++;
      if (this.dateRangeText) count++;
      return count;
    },
    
    totalPages() {
      return Math.ceil(this.totalItems / this.options.itemsPerPage);
    },
    
    parsedDetails() {
      if (!this.selectedItem || !this.selectedItem.operation_metadata) return {};
      try {
        return JSON.parse(this.selectedItem.operation_metadata);
      } catch (e) {
        return { 'Error': 'No se pudieron parsear los detalles' };
      }
    },
    
    parsedLog() {
      if (!this.selectedItem || !this.selectedItem.operation_log) return {};
      try {
        return JSON.parse(this.selectedItem.operation_log);
      } catch (e) {
        return { 'Error': 'No se pudo parsear el log' };
      }
    },
  },
  
  watch: {
    options: {
      handler() {
        this.searchItems();
      },
      deep: true,
    },
  },
  
  async mounted() {
    await this.getOperationsTypes();
    this.searchItems();
  },
  
  methods: {
    // Búsqueda con debounce
    debounceSearch() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.options.page = 1;
        this.searchItems();
      }, 500);
    },
    
    // Manejo de filtros
    handleFilterChange() {
      this.options.page = 1;
      this.searchItems();
    },
    
    handleDateChange() {
      this.options.page = 1;
      this.searchItems();
    },
    
    clearDateRange() {
      this.dates = ['', ''];
      this.options.page = 1;
      this.searchItems();
    },
    
    clearAllFilters() {
      this.search = '';
      this.selectedOperation = []; // Esto activará el filtro por defecto
      this.selectedDay = null;
      this.dates = ['', ''];
      this.options.page = 1;
      this.searchItems();
    },
    
    toggleFilters() {
      this.filtersExpanded = !this.filtersExpanded;
    },
    
    // API calls
    searchItems() {
      this.load = true;
      
      // Activar indicador específico para filtro por día
      if (this.selectedDay) {
        this.loadDayFilter = true;
      }
      
      // Si hay filtro por día, obtener todas las operaciones para filtrar correctamente
      const pageSize = this.selectedDay ? -1 : this.options.itemsPerPage;
      
      const params = new URLSearchParams({
        page: this.selectedDay ? 1 : this.options.page,
        pageSize: pageSize,
        sortBy: this.options.sortBy.join(','),
        sortDesc: this.options.sortDesc.join(','),
        searcher: this.search || '',
      });
      
      // Por defecto excluir "Consulta de Datos de Socio"
      if (this.selectedOperation.length) {
        // Si hay filtros específicos, usar esos
        params.append('tipoOperacion', JSON.stringify(this.selectedOperation));
      } else {
        // Si no hay filtros específicos, excluir solo "Consulta de Datos de Socio"
        if (this.operations.length > 0) {
          const consultaOperation = this.operations.find(op => {
            const desc = op.description.toLowerCase();
            return desc.includes('consulta de datos de socio') || 
                   desc.includes('consulta datos socio');
          });
          
          if (consultaOperation) {
            // Enviar todos los IDs excepto el de consulta
            const excludeIds = this.operations
              .filter(op => op.id_operation_type !== consultaOperation.id_operation_type)
              .map(op => op.id_operation_type);
            
            if (excludeIds.length > 0) {
              params.append('tipoOperacion', JSON.stringify(excludeIds));
            }
          }
        }
      }
      
      if (this.selectedDay) {
        params.append('dia', this.selectedDay);
      }
      
      if (this.dateRangeText) {
        params.append('fechas', this.formatDateRange());
      }
      
      this.$http.get(`${process.env.VUE_APP_DEGIRA}operations/get?${params}`)
        .then((response) => {
          if (response && response.data) {
            let filteredData = response.data.data || [];
            
            // Filtro temporal en frontend si el backend no filtra por día
            if (this.selectedDay) {
              filteredData = filteredData.filter(item => {
                const dayId = item.day?.id_day;
                return dayId === this.selectedDay;
              });
              this.totalItems = filteredData.length;
            } else {
              this.totalItems = response.data.totalCount || 0;
            }
            
            this.apiData = filteredData;
          }
        })
        .catch((error) => {
          console.error('Error al cargar operaciones:', error);
          if (this.$toast) {
            this.$toast.error('Error al cargar las operaciones');
          }
        })
        .finally(() => {
          this.load = false;
          this.loadDayFilter = false;
        });
    },
    
    async getOperationsTypes() {
      try {
        const response = await this.$http.get(`${process.env.VUE_APP_DEGIRA}operations_types/getAll`);
        if (response && response.data) {
          this.operations = response.data.data || [];
        }
      } catch (error) {
        console.error('Error al cargar tipos de operación:', error);
      }
    },
    
    // Modales
    showDetails(item) {
      this.selectedItem = item;
      this.detailsModal = true;
    },
    
    showLog(item) {
      this.selectedItem = item;
      this.logModal = true;
    },
    
    // Refresh de datos
    refreshData() {
      this.options.page = 1;
      this.searchItems();
      // Usar notificación alternativa si $toast no está disponible
      if (this.$toast) {
        this.$toast.success('Datos actualizados');
      } else {
        console.log('Datos actualizados');
      }
    },

    // Obtener texto de filtros aplicados
    getAppliedFiltersText() {
      const filters = [];
      
      if (this.search) {
        filters.push(`Búsqueda: "${this.search}"`);
      }
      
      if (this.selectedOperation.length) {
        const operationNames = this.selectedOperation.map(id => {
          const op = this.operations.find(o => o.id_operation_type === id);
          return op ? op.description : '';
        }).filter(name => name);
        filters.push(`Tipos: ${operationNames.join(', ')}`);
      }
      
      if (this.selectedDay) {
        const dayName = this.days.find(d => d.id_day === this.selectedDay)?.name || this.selectedDay;
        filters.push(`Día: ${dayName}`);
      }
      
      if (this.dateRangeText) {
        filters.push(`Fechas: ${this.dateRangeText}`);
      }
      
      return filters.length > 0 ? filters.join(' | ') : 'Sin filtros';
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
      
      // Aplicar filtros de tipo de operación
      if (this.selectedOperation.length) {
        params.append('tipoOperacion', JSON.stringify(this.selectedOperation));
      } else {
        // Si no hay filtro específico, excluir "Consulta de Datos de Socio" por defecto
        const consultaId = this.operations.find(op => 
          op.description && op.description.toLowerCase().includes('consulta de datos de socio')
        );
        if (consultaId) {
          const excludeIds = this.operations
            .filter(op => op.id_operation_type !== consultaId.id_operation_type)
            .map(op => op.id_operation_type);
          params.append('tipoOperacion', JSON.stringify(excludeIds));
        }
      }
      
      // Aplicar filtro de día
      if (this.selectedDay) {
        params.append('dia', this.selectedDay);
      }
      
      // Aplicar filtro de fechas
      if (this.dateRangeText) {
        params.append('fechas', this.formatDateRange());
      }
      
      this.$http.get(`${process.env.VUE_APP_DEGIRA}operations/get?${params}`)
        .then((response) => {
          if (response && response.data && response.data.data) {
            const data = response.data.data.map(item => ({
          'ID Operación': item.id_operation,
          'Fecha': this.formatDate(item.operation_date, 'DD/MM/YYYY'),
          'Hora': this.parseHour(item.operation_date),
          'Día de la Semana': item.day ? item.day.name : 'N/A',
          'Tipo de Operación': item.operation_type ? item.operation_type.description : 'N/A',
          'Usuario': item.user ? item.user.username : 'N/A',
          'Rol del Usuario': item.role ? item.role.description : 'N/A',
          'Socio': item.partner ? item.partner.alias : 'N/A',
          'ID de Visita': item.id_visit || 'N/A',
          'Método de Pago': item.payment_method ? item.payment_method.description : 'N/A',
          'Monto': item.amount ? `$${item.amount}` : 'N/A',
          'Observaciones': item.observations || 'N/A'
        }));
        
        // Generar nombre de archivo con fecha y hora
        const now = this.$moment();
        const fileName = `Operaciones_${now.format('YYYY-MM-DD_HH-mm-ss')}`;
        const exportType = exportFromJSON.types.xls;
        
        // Agregar información del reporte
        const reportInfo = {
          'Reporte de Operaciones': '',
          'Fecha de Generación': now.format('DD/MM/YYYY HH:mm:ss'),
          'Total de Registros': data.length,
          'Filtros Aplicados': this.getAppliedFiltersText(),
          '': '',
          'DATOS DE OPERACIONES': ''
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
    
    // Utilidades
    formatDate(date, format) {
      if (!date) return '';
      return this.$moment(date, 'YYYY-MM-DD HH:mm:ss').format(format);
    },
    
    parseHour(date) {
      if (!date) return '';
      return this.$moment(date, 'YYYY-MM-DD HH:mm:ss').format('HH:mm');
    },
    
    formatDateRange() {
      if (!this.dateRangeText) return '';
      const fechasSeparadas = this.dateRangeText.split(' ~ ');
      const fechasISO = fechasSeparadas.map(fecha => 
        this.$moment(fecha, 'YYYY-MM-DD').toISOString()
      );
      return `['${fechasISO.join("','")}']`;
    },
    
    getOperationType(description) {
      if (!description) return 'Otro';
      
      const desc = description.toLowerCase().trim();
      
      if (desc.includes('entrada')) return 'Entrada';
      if (desc.includes('salida')) return 'Salida';
      if (desc.includes('pago')) return 'Pago';
      if (desc.includes('consulta')) return 'Consulta';
      if (desc.includes('devolución') || desc.includes('devolucion')) return 'Devolución';
      if (desc.includes('reserva')) return 'Reserva';
      if (desc.includes('venta')) return 'Venta';
      if (desc.includes('validación') || desc.includes('validacion')) return 'Validación';
      if (desc.includes('alta de socio') || desc.includes('alta socio')) return 'Alta Socio';
      if (desc.includes('membresía') || desc.includes('membresia')) return 'Membresía';
      if (desc.includes('registro')) return 'Registro';
      if (desc.includes('ingreso')) return 'Ingreso';
      if (desc.includes('egreso')) return 'Egreso';
      
      return 'Otro';
    },

    getOperationTypeClass(type) {
      const operationType = this.getOperationType(type);
      
      const typeClasses = {
        'Entrada': 'entrada',
        'Salida': 'salida',
        'Pago': 'pago',
        'Consulta': 'consulta',
        'Devolución': 'devolucion',
        'Reserva': 'reserva',
        'Venta': 'venta',
        'Validación': 'validacion',
        'Alta Socio': 'alta-socio',
        'Membresía': 'membresia',
        'Registro': 'registro',
        'Ingreso': 'ingreso',
        'Egreso': 'egreso'
      };
      
      return typeClasses[operationType] || 'otro';
    },
    
    getDayName(dayObj) {
      if (!dayObj || !dayObj.name) return 'N/A';
      
      // Normalizar el nombre del día
      const dayName = dayObj.name.trim();
      
      // Mapeo de variaciones posibles
      const dayMap = {
        'Domingo': 'Domingo',
        'domingo': 'Domingo',
        'DOMINGO': 'Domingo',
        'Lunes': 'Lunes',
        'lunes': 'Lunes',
        'LUNES': 'Lunes',
        'Martes': 'Martes',
        'martes': 'Martes',
        'MARTES': 'Martes',
        'Miércoles': 'Miércoles',
        'miercoles': 'Miércoles',
        'Miercoles': 'Miércoles',
        'MIÉRCOLES': 'Miércoles',
        'MIERCOLES': 'Miércoles',
        'Jueves': 'Jueves',
        'jueves': 'Jueves',
        'JUEVES': 'Jueves',
        'Viernes': 'Viernes',
        'viernes': 'Viernes',
        'VIERNES': 'Viernes',
        'Sábado': 'Sábado',
        'sabado': 'Sábado',
        'Sabado': 'Sábado',
        'SÁBADO': 'Sábado',
        'SABADO': 'Sábado'
      };
      
      return dayMap[dayName] || 'N/A';
    },

    getDayClass(dayName) {
      const dayClasses = {
        'Domingo': 'domingo',
        'Lunes': 'lunes',
        'Martes': 'martes',
        'Miércoles': 'miercoles',
        'Jueves': 'jueves',
        'Viernes': 'viernes',
        'Sábado': 'sabado'
      };
      return dayClasses[dayName] || 'default';
    },
    
    formatKey(key) {
      return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    },
  },
};
</script>

<style scoped>
.operations-dashboard {
  background: #f8fafc;
  min-height: 100vh;
  padding: 24px;
}

/* Header Principal */
.dashboard-header {
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 24px;
  color: white;
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-icon {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-with-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
}

.title-text h1 {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  color: white;
}

.stats-badge {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.stats-icon {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stats-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stats-number {
  font-size: 20px;
  font-weight: 700;
  color: white;
  line-height: 1;
}

.stats-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  text-transform: lowercase;
}

.title-text p {
  font-size: 16px;
  margin: 0;
  opacity: 0.9;
  color: white;
}

.refresh-btn {
  background: rgba(59, 130, 246, 0.9) !important;
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 600;
  text-transform: none;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  color: white !important;
}

.export-btn {
  background: rgba(34, 197, 94, 0.9) !important;
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 600;
  text-transform: none;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

/* Panel de Filtros */
.filters-panel {
  background: white;
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.filters-header {
  background: #f8fafc;
  padding: 16px 24px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.filters-header:hover {
  background: #f1f5f9;
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
  color: #6b7280;
}

.expand-icon.rotate-180 {
  transform: rotate(180deg);
}

.filters-content {
  padding: 24px;
}

.filter-group {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  align-items: start;
}

@media (min-width: 768px) {
  .filter-group {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 1200px) {
  .filter-group {
    grid-template-columns: 1fr 1fr 1fr 1fr;
  }
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-item label {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
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

.filter-note {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
  font-style: italic;
}

.filter-loading-text {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 12px;
  color: #3b82f6;
  font-weight: 500;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
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

.clear-btn {
  border-radius: 8px;
  text-transform: none;
  font-weight: 500;
}

.apply-btn {
  border-radius: 8px;
  text-transform: none;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.search-field >>> .v-input__control >>> .v-input__slot {
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.search-field >>> .v-input__control >>> .v-input__slot:hover {
  border-color: #3b82f6;
}

.clear-btn {
  border-radius: 12px;
  padding: 12px 20px;
  font-weight: 600;
  text-transform: none;
}


/* Tabla de Operaciones */
.operations-table {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

.operations-data-table >>> .v-data-table__wrapper {
  border-radius: 16px;
}

.operations-data-table >>> .v-data-table__mobile-table-row {
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.clickable-row {
  cursor: pointer;
  transition: all 0.2s ease;
}

.clickable-row:hover {
  background-color: #f8fafc !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Celdas personalizadas */
.operation-id {
  display: flex;
  align-items: center;
}

.id-number {
  background: #f3f4f6;
  color: #374151;
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
}

.datetime-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.date {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

.time {
  font-size: 12px;
  color: #6b7280;
}

.day-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.day-icon {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.day-icon.domingo {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.day-icon.lunes {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.day-icon.martes {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.day-icon.miercoles {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border: 2px solid #8b5cf6;
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);
}

.day-icon.jueves {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.day-icon.viernes {
  background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
}

.day-icon.sabado {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: 2px solid #f59e0b;
  box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
}

.day-icon.default {
  background: #f3f4f6;
  color: #6b7280;
}

.day-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

.operation-type {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.type-icon.entrada {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: 2px solid #10b981;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
}

.type-icon.salida {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border: 2px solid #ef4444;
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
}

.type-icon.pago {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: 2px solid #3b82f6;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

.type-icon.consulta {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border: 2px solid #8b5cf6;
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);
}

.type-icon.devolucion {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: 2px solid #f59e0b;
  box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
}

.type-icon.reserva {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  border: 2px solid #06b6d4;
  box-shadow: 0 2px 4px rgba(6, 182, 212, 0.3);
}

.type-icon.venta {
  background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%);
  border: 2px solid #84cc16;
  box-shadow: 0 2px 4px rgba(132, 204, 22, 0.3);
}

.type-icon.validacion {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: 2px solid #f59e0b;
  box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
}

.type-icon.alta-socio {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: 2px solid #10b981;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
}

.type-icon.membresia {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border: 2px solid #8b5cf6;
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);
}

.type-icon.registro {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  border: 2px solid #06b6d4;
  box-shadow: 0 2px 4px rgba(6, 182, 212, 0.3);
}

.type-icon.ingreso {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: 2px solid #10b981;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
}

.type-icon.egreso {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border: 2px solid #ef4444;
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
}

.type-icon.otro {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  border: 2px solid #6b7280;
  box-shadow: 0 2px 4px rgba(107, 114, 128, 0.3);
}

.type-text {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.username {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

.user-role {
  font-size: 12px;
  color: #6b7280;
}

.partner-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.partner-icon {
  width: 32px;
  height: 32px;
  background: #fef3c7;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d97706;
}

.partner-alias {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

.partner-id {
  font-size: 12px;
  color: #6b7280;
}

.payment-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.payment-icon {
  width: 24px;
  height: 24px;
  background: #dbeafe;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
}

.payment-method {
  font-weight: 500;
  color: #1f2937;
  font-size: 14px;
}

.amount-cell {
  display: flex;
  align-items: center;
}

.amount-value {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 14px;
}


.no-payment, .no-amount {
  color: #9ca3af;
  font-style: italic;
}

/* Modales */
.details-modal, .log-modal {
  border-radius: 16px;
  overflow: hidden;
}

.modal-header {
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  color: white;
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-title .title-icon {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-title h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: white;
}

.modal-title p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
  color: white;
}

.close-btn {
  color: white !important;
}

.modal-content {
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.details-table, .log-table {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.detail-key, .log-key {
  background: #f8fafc;
  font-weight: 600;
  color: #374151;
  padding: 12px 16px;
  border-right: 1px solid #e2e8f0;
  width: 40%;
}

.detail-value, .log-value {
  padding: 12px 16px;
  color: #1f2937;
  word-break: break-word;
}

/* Responsive */
@media (max-width: 1200px) {
  .filter-group {
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .operations-dashboard {
    padding: 16px;
  }
  
  .dashboard-header {
    padding: 24px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .filter-group {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .title-text h1 {
    font-size: 24px;
  }
  
  .title-with-stats {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .stats-badge {
    align-self: flex-start;
  }
}

@media (max-width: 480px) {
  .operations-dashboard {
    padding: 12px;
  }
  
  .dashboard-header {
    padding: 20px;
  }
  
  .filters-panel {
    padding: 16px;
  }
  
  .modal-content {
    padding: 16px;
  }
}
</style>
