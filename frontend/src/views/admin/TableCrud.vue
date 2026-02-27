<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h2 class="orange--text mb-4">CRUD de Tablas del Sistema</h2>
      </v-col>
    </v-row>

    <!-- Botonera de selección de tabla -->
    <v-row>
      <v-col cols="12">
        <v-card outlined class="pa-2 mb-4">
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="text-caption font-weight-bold orange--text">
              Seleccionar Tabla
            </div>
            <v-btn
              icon
              x-small
              @click="tablesExpanded = !tablesExpanded"
            >
              <v-icon small>{{ tablesExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
            </v-btn>
          </div>
          <div v-if="tables.length === 0" class="text-center py-2">
            <v-progress-circular indeterminate color="orange" size="20"></v-progress-circular>
            <div class="mt-1 text-caption">Cargando...</div>
          </div>
          <v-expand-transition>
            <div v-show="tablesExpanded" v-if="tables.length > 0" class="table-buttons">
              <v-btn
                v-for="table in tables"
                :key="table.name"
                :color="selectedTable === table.name ? 'orange' : 'grey'"
                :dark="selectedTable === table.name"
                outlined
                x-small
                class="ma-1 table-btn"
                @click="selectTable(table.name)"
              >
                <v-icon x-small left>{{ getTableIcon(table.name) }}</v-icon>
                <span class="table-btn-text">{{ table.displayName || table.name }}</span>
              </v-btn>
            </div>
          </v-expand-transition>
        </v-card>
      </v-col>
    </v-row>

    <!-- Buscador, Botón Refresh y Botón Nuevo Registro -->
    <v-row v-if="selectedTable" class="mb-2">
      <v-col cols="12" md="6">
        <v-text-field
          v-model="searchText"
          label="Buscar"
          outlined
          dense
          prepend-inner-icon="mdi-magnify"
          clearable
          @input="debounceSearch"
          @click:clear="clearSearch"
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="3" class="d-flex align-center">
        <v-btn
          color="orange"
          @click="refreshData"
          block
          :loading="loading"
        >
          <v-icon left>mdi-refresh</v-icon>
          Actualizar
        </v-btn>
      </v-col>
      <v-col cols="12" md="3" class="d-flex align-center">
        <v-btn
          color="primary"
          @click="openCreateDialog"
          block
        >
          <v-icon left>mdi-plus</v-icon>
          Nuevo Registro
        </v-btn>
      </v-col>
    </v-row>

    <!-- Tabla de datos -->
    <v-row v-if="selectedTable">
      <v-col cols="12">
        <v-card outlined>
          <v-data-table
            :headers="headers"
            :items="records"
            :loading="loading"
            :server-items-length="totalCount"
            :options.sync="options"
            :footer-props="{
              'items-per-page-text': 'Registros por Página',
              'items-per-page-all-text': 'Todos',
            }"
            calculate-widths
            fixed-header
            dense
            no-data-text="No hay registros"
            class="compact-table"
          >
            <!-- Template dinámico para todas las columnas excepto actions -->
            <template v-for="header in headers" v-slot:[`item.${header.value}`]="{ item }">
              <span v-if="header.value !== 'actions'" :key="header.value" :title="String(item[header.value] || '')">
                {{ truncateText(item[header.value], 35) }}
              </span>
            </template>
            
            <template v-slot:item.actions="{ item }">
              <v-icon
                small
                color="orange"
                class="mr-2"
                @click="openEditDialog(item)"
              >
                mdi-pencil
              </v-icon>
              <v-icon
                small
                color="blue"
                class="mr-2"
                @click="openCopyDialog(item)"
              >
                mdi-content-copy
              </v-icon>
              <v-icon
                small
                color="red"
                @click="openDeleteDialog(item)"
              >
                mdi-delete
              </v-icon>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog para crear/editar -->
    <v-dialog v-model="editDialog" max-width="800px" persistent>
      <v-card>
        <v-card-title>
          <span class="headline">{{ editingRecord ? 'Editar Registro' : 'Nuevo Registro' }}</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row v-for="column in tableStructure" :key="column.name">
              <v-col cols="12">
                <v-text-field
                  v-if="!column.primaryKey && !column.autoIncrement"
                  v-model="formData[column.name]"
                  :label="column.name"
                  :type="getInputType(column.type)"
                  outlined
                  dense
                  :disabled="column.primaryKey"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="closeEditDialog">Cancelar</v-btn>
          <v-btn color="primary" @click="saveRecord" :loading="saving">
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog para confirmar eliminación -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title class="headline">¿Está seguro de eliminar este registro?</v-card-title>
        <v-card-text>
          Esta acción no se puede deshacer.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="red" text @click="confirmDelete" :loading="deleting">
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar para mensajes -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.text }}
      <template v-slot:action="{ attrs }">
        <v-btn text v-bind="attrs" @click="snackbar.show = false">
          Cerrar
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script>
export default {
  name: 'TableCrud',
  data() {
    return {
      tables: [],
      selectedTable: null,
      tableStructure: [],
      records: [],
      headers: [],
      loading: false,
      totalCount: 0,
      options: {
        page: 1,
        itemsPerPage: 10,
        sortBy: [],
        sortDesc: [],
      },
      searchText: '',
      searchTimeout: null,
      editDialog: false,
      deleteDialog: false,
      editingRecord: null,
      formData: {},
      saving: false,
      deleting: false,
      snackbar: {
        show: false,
        text: '',
        color: 'success',
      },
      primaryKey: null,
      tablesExpanded: true,
    };
  },
  mounted() {
    this.loadTables();
  },
  watch: {
    options: {
      handler() {
        if (this.selectedTable) {
          this.loadRecords();
        }
      },
      deep: true,
    },
  },
  methods: {
    // Helper para construir URLs de CRUD (el backend monta las rutas en /api/v1/degira/crud/...)
    buildCrudUrl(endpoint) {
      const baseUrl = process.env.VUE_APP_DEGIRA || '';
      if (baseUrl) {
        let url = baseUrl.trim();
        if (!url.endsWith('/')) {
          url += '/';
        }
        return url + 'crud/' + endpoint;
      } else {
        return `/v1/crud/${endpoint}`;
      }
    },
    async loadTables() {
      try {
        const apiPath = this.buildCrudUrl('tables');
        console.log('Llamando a:', apiPath); // Debug
        const response = await this.$http.get(apiPath);
        this.tables = response.data.data || [];
      } catch (error) {
        console.error('Error al cargar las tablas:', error);
        console.error('URL intentada:', error.config?.url); // Debug
        this.showSnackbar('Error al cargar las tablas', 'error');
      }
    },
    async loadTableData() {
      if (!this.selectedTable) return;

      this.loading = true;
      try {
        // Cargar estructura de la tabla
        const structurePath = this.buildCrudUrl(`tables/${this.selectedTable}/structure`);
        const structureResponse = await this.$http.get(structurePath);
        this.tableStructure = structureResponse.data.data || [];
        
        // Encontrar la clave primaria
        const pkColumn = this.tableStructure.find(col => col.primaryKey);
        this.primaryKey = pkColumn ? pkColumn.name : null;

        // Crear headers para la tabla
        this.headers = [
          { text: 'Acciones', value: 'actions', sortable: false, width: '160px' },
          ...this.tableStructure.map(col => ({
            text: col.name,
            value: col.name,
            sortable: true,
          }))
        ];

        // Cargar registros
        await this.loadRecords();
      } catch (error) {
        console.error('Error al cargar los datos de la tabla:', error);
        this.showSnackbar('Error al cargar los datos de la tabla', 'error');
      } finally {
        this.loading = false;
      }
    },
    async loadRecords() {
      if (!this.selectedTable) return;

      this.loading = true;
      try {
        const params = {
          page: this.options.page,
          pageSize: this.options.itemsPerPage,
        };
        
        if (this.searchText) {
          params.search = this.searchText;
        }

        // Agregar parámetros de ordenamiento
        if (this.options.sortBy && this.options.sortBy.length > 0) {
          params.sortBy = this.options.sortBy[0];
        }
        
        if (this.options.sortDesc && this.options.sortDesc.length > 0) {
          params.sortDesc = this.options.sortDesc[0] ? 'true' : 'false';
        }

        const recordsPath = this.buildCrudUrl(`tables/${this.selectedTable}/records`);
        console.log('[TableCrud] Cargando registros para tabla:', this.selectedTable);
        console.log('[TableCrud] URL:', recordsPath);
        console.log('[TableCrud] Parámetros:', params);
        
        const response = await this.$http.get(recordsPath, { params });

        console.log('[TableCrud] Respuesta recibida:', {
          dataLength: response.data.data?.length || 0,
          totalCount: response.data.totalCount || 0,
          fullResponse: response.data
        });

        this.records = response.data.data || [];
        this.totalCount = response.data.totalCount || 0;
        
        console.log('[TableCrud] Registros asignados:', this.records.length);
      } catch (error) {
        console.error('Error al cargar los registros:', error);
        console.error('Detalles del error:', error.response?.data || error.message);
        this.showSnackbar('Error al cargar los registros', 'error');
      } finally {
        this.loading = false;
      }
    },
    debounceSearch() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.options.page = 1;
        this.loadRecords();
      }, 500);
    },
    clearSearch() {
      this.searchText = '';
      this.options.page = 1;
      this.loadRecords();
    },
    async refreshData() {
      if (!this.selectedTable) return;
      await this.loadTableData();
    },
    openCreateDialog() {
      this.editingRecord = null;
      this.formData = {};
      this.editDialog = true;
    },
    openEditDialog(item) {
      this.editingRecord = item;
      this.formData = { ...item };
      this.editDialog = true;
    },
    openCopyDialog(item) {
      // Copiar el registro pero sin la clave primaria para crear uno nuevo
      this.editingRecord = null;
      this.formData = { ...item };
      
      // Eliminar la clave primaria y campos auto-incrementales
      if (this.primaryKey) {
        delete this.formData[this.primaryKey];
      }
      
      // Eliminar otros campos auto-incrementales
      this.tableStructure.forEach(column => {
        if (column.autoIncrement) {
          delete this.formData[column.name];
        }
      });
      
      this.editDialog = true;
    },
    closeEditDialog() {
      this.editDialog = false;
      this.editingRecord = null;
      this.formData = {};
    },
    async saveRecord() {
      this.saving = true;
      try {
        if (this.editingRecord) {
          // Actualizar
          const id = this.formData[this.primaryKey];
          const updatePath = this.buildCrudUrl(`tables/${this.selectedTable}/records/${id}`);
          await this.$http.put(updatePath, this.formData);
          this.showSnackbar('Registro actualizado correctamente', 'success');
        } else {
          // Crear
          const createPath = this.buildCrudUrl(`tables/${this.selectedTable}/records`);
          await this.$http.post(createPath, this.formData);
          this.showSnackbar('Registro creado correctamente', 'success');
        }
        this.closeEditDialog();
        await this.loadRecords();
      } catch (error) {
        console.error('Error al guardar el registro:', error);
        const message = error.response?.data?.message || 'Error al guardar el registro';
        this.showSnackbar(message, 'error');
      } finally {
        this.saving = false;
      }
    },
    openDeleteDialog(item) {
      this.editingRecord = item;
      this.deleteDialog = true;
    },
    async confirmDelete() {
      if (!this.editingRecord || !this.primaryKey) return;

      this.deleting = true;
      try {
        const id = this.editingRecord[this.primaryKey];
        const deletePath = this.buildCrudUrl(`tables/${this.selectedTable}/records/${id}`);
        await this.$http.delete(deletePath);
        this.showSnackbar('Registro eliminado correctamente', 'success');
        this.deleteDialog = false;
        this.editingRecord = null;
        await this.loadRecords();
      } catch (error) {
        console.error('Error al eliminar el registro:', error);
        const message = error.response?.data?.message || 'Error al eliminar el registro';
        this.showSnackbar(message, 'error');
      } finally {
        this.deleting = false;
      }
    },
    selectTable(tableName) {
      console.log('[TableCrud] Tabla seleccionada:', tableName);
      this.selectedTable = tableName;
      this.loadTableData();
    },
    getTableIcon(tableName) {
      const iconMap = {
        'users': 'mdi-account',
        'roles': 'mdi-shield-account',
        'partners': 'mdi-account-group',
        'visits': 'mdi-calendar-clock',
        'tickets': 'mdi-receipt',
        'products_services': 'mdi-package-variant',
        'operations': 'mdi-history',
        'operations_types': 'mdi-format-list-bulleted',
        'states': 'mdi-map-marker',
        'visit_types': 'mdi-calendar-multiple',
        'payment_methods': 'mdi-credit-card',
        'days': 'mdi-calendar-week',
      };
      
      // Buscar coincidencias parciales
      const lowerName = tableName.toLowerCase();
      for (const [key, icon] of Object.entries(iconMap)) {
        if (lowerName.includes(key) || key.includes(lowerName)) {
          return icon;
        }
      }
      
      return 'mdi-table';
    },
    truncateText(text, maxLength = 35) {
      if (!text && text !== 0) return '';
      const str = String(text);
      if (str.length <= maxLength) return str;
      return str.substring(0, maxLength) + '...';
    },
    getInputType(columnType) {
      if (columnType.includes('DATE')) return 'date';
      if (columnType.includes('INT') || columnType.includes('DECIMAL')) return 'number';
      return 'text';
    },
    showSnackbar(text, color = 'success') {
      this.snackbar.text = text;
      this.snackbar.color = color;
      this.snackbar.show = true;
    },
  },
};
</script>

<style scoped>
.table-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.table-btn {
  min-width: auto !important;
  height: 28px !important;
  padding: 0 8px !important;
  text-transform: none !important;
  font-weight: 400 !important;
  font-size: 0.7rem !important;
}

.table-btn-text {
  font-size: 0.7rem;
  white-space: nowrap;
}

@media (max-width: 600px) {
  .table-buttons .v-btn {
    flex: 1 1 calc(50% - 2px);
    min-width: auto;
  }
}

/* Estilos para tabla compacta */
.compact-table >>> .v-data-table {
  font-size: 0.75rem !important;
}

.compact-table >>> .v-data-table th {
  font-size: 0.7rem !important;
  padding: 8px 4px !important;
  font-weight: 600 !important;
}

.compact-table >>> .v-data-table td {
  font-size: 0.75rem !important;
  padding: 8px 4px !important;
}

.compact-table >>> .v-data-table__wrapper {
  font-size: 0.75rem !important;
}

.compact-table >>> .v-data-table__mobile-row {
  font-size: 0.75rem !important;
}

.compact-table >>> .v-data-footer {
  font-size: 0.7rem !important;
}

.compact-table >>> .v-data-footer__select {
  font-size: 0.7rem !important;
}

.compact-table >>> .v-data-footer__pagination {
  font-size: 0.7rem !important;
}
</style>

