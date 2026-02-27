<template>
  <v-container>
    <!-- Filtros -->
    <v-row class="mb-4">
      <v-col cols="12" md="3">
        <v-select
          v-model="filters.id_day"
          :items="days"
          item-text="description"
          item-value="id_day"
          label="Día"
          outlined
          dense
          clearable
          @change="onFilterChange"
        ></v-select>
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="filters.id_visit_type"
          :items="visitTypes"
          item-text="description"
          item-value="id_visit_type"
          label="Tipo de Visita"
          outlined
          dense
          clearable
          @change="onFilterChange"
        ></v-select>
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="filters.id_receivable_concept"
          :items="receivableConcepts"
          item-text="description"
          item-value="id_receivable_concept"
          label="Concepto de Cobro"
          outlined
          dense
          clearable
          @change="onFilterChange"
        ></v-select>
      </v-col>
      <v-col cols="12" md="3" class="d-flex align-center">
        <v-btn
          color="orange"
          dark
          block
          @click="loadPrices"
          :loading="loading"
        >
          <v-icon left>mdi-reload</v-icon>
          Actualizar
        </v-btn>
      </v-col>
    </v-row>

    <!-- Botones de acciones masivas -->
    <v-row v-if="selectedItems.length > 0" class="mb-2">
      <v-col cols="12">
        <v-card color="orange" dark class="pa-3">
          <div class="d-flex align-center">
            <v-icon left>mdi-checkbox-multiple-marked</v-icon>
            <span class="mr-4">{{ selectedItems.length }} precio(s) seleccionado(s)</span>
            <v-btn
              small
              color="white"
              text
              @click="openBulkPriceDialog"
              class="mr-2"
            >
              <v-icon left small>mdi-currency-usd</v-icon>
              Actualizar Precios
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn
              small
              color="white"
              text
              @click="selectedItems = []"
            >
              <v-icon left small>mdi-close</v-icon>
              Deseleccionar
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Grilla de datos -->
    <v-row>
      <v-col cols="12">
        <v-card outlined>
          <v-data-table
            v-model="selectedItems"
            :headers="headers"
            :items="prices"
            :loading="loading"
            :server-items-length="totalCount"
            :options.sync="options"
            :footer-props="{
              'items-per-page-text': 'Registros por Página',
              'items-per-page-all-text': 'Todos',
            }"
            item-key="id_price"
            show-select
            dense
            fixed-header
            no-data-text="No hay precios registrados"
            class="elevation-1"
          >
            <template v-slot:item.id_day="{ item }">
              <span>{{ getDayName(item.id_day) }}</span>
            </template>

            <template v-slot:item.id_visit_type="{ item }">
              <span>{{ getVisitTypeName(item.id_visit_type) }}</span>
            </template>

            <template v-slot:item.id_receivable_concept="{ item }">
              <span>{{ getReceivableConceptName(item.id_receivable_concept) }}</span>
            </template>

            <template v-slot:item.total_amount="{ item }">
              <strong class="orange--text">${{ formatNumber(item.total_amount) }}</strong>
            </template>

            <template v-slot:item.actions="{ item }">
              <v-btn
                icon
                small
                color="orange"
                @click="openEditPriceDialog(item)"
              >
                <v-icon small>mdi-pencil</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog para actualización masiva de precios -->
    <v-dialog v-model="bulkPriceDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title>
          <span class="headline">Actualización Masiva de Precios</span>
          <v-spacer></v-spacer>
          <v-btn icon @click="closeBulkPriceDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-alert type="info" class="mb-4">
              Se actualizarán <strong>{{ selectedItems.length }}</strong> precio(s)
            </v-alert>

            <v-radio-group v-model="priceUpdateType" row class="mb-4">
              <v-radio
                label="Valor Absoluto"
                value="absolute"
                color="orange"
              ></v-radio>
              <v-radio
                label="Valor Relativo"
                value="relative"
                color="orange"
              ></v-radio>
              <v-radio
                label="Porcentaje"
                value="percentage"
                color="orange"
              ></v-radio>
            </v-radio-group>

            <v-text-field
              v-model.number="priceUpdateValue"
              :label="getPriceUpdateLabel()"
              type="number"
              :step="priceUpdateType === 'percentage' ? 1 : 0.01"
              outlined
              dense
              :prefix="priceUpdateType === 'percentage' ? '' : '$'"
              :suffix="priceUpdateType === 'percentage' ? '%' : ''"
              :hint="getPriceUpdateHint()"
              persistent-hint
              class="mb-4"
            ></v-text-field>

            <!-- Vista previa de cambios -->
            <v-card v-if="priceUpdateValue && selectedItems.length > 0" outlined class="pa-3">
              <div class="text-caption font-weight-bold mb-2">Vista Previa de Cambios:</div>
              <v-simple-table dense>
                <template v-slot:default>
                  <thead>
                    <tr>
                      <th class="text-left">ID</th>
                      <th class="text-left">Precio Actual</th>
                      <th class="text-left">Nuevo Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in selectedItems.slice(0, 5)" :key="item.id_price">
                      <td>{{ item.id_price }}</td>
                      <td>${{ formatNumber(item.total_amount) }}</td>
                      <td>
                        <strong class="orange--text">
                          ${{ formatNumber(calculateNewPrice(item.total_amount)) }}
                        </strong>
                      </td>
                    </tr>
                    <tr v-if="selectedItems.length > 5">
                      <td colspan="3" class="text-center text-caption">
                        ... y {{ selectedItems.length - 5 }} más
                      </td>
                    </tr>
                  </tbody>
                </template>
              </v-simple-table>
            </v-card>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="closeBulkPriceDialog">Cancelar</v-btn>
          <v-btn
            color="orange"
            dark
            @click="confirmBulkUpdate"
            :loading="updating"
            :disabled="!priceUpdateValue || selectedItems.length === 0"
          >
            Actualizar Precios
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog para editar precio individual -->
    <v-dialog v-model="editPriceDialog" max-width="500px" persistent>
      <v-card>
        <v-card-title>
          <span class="headline">Editar Precio</span>
          <v-spacer></v-spacer>
          <v-btn icon @click="closeEditPriceDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text v-if="editingPrice">
          <v-container>
            <v-alert type="info" class="mb-4">
              <div><strong>Día:</strong> {{ getDayName(editingPrice.id_day) }}</div>
              <div><strong>Tipo de Visita:</strong> {{ getVisitTypeName(editingPrice.id_visit_type) }}</div>
              <div><strong>Concepto de Cobro:</strong> {{ getReceivableConceptName(editingPrice.id_receivable_concept) }}</div>
            </v-alert>

            <v-text-field
              v-model.number="editPriceValue"
              label="Nuevo Precio"
              type="number"
              step="0.01"
              min="0"
              outlined
              dense
              prefix="$"
              :hint="`Precio actual: $${formatNumber(editingPrice.total_amount)}`"
              persistent-hint
            ></v-text-field>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="closeEditPriceDialog">Cancelar</v-btn>
          <v-btn
            color="orange"
            dark
            @click="confirmEditPrice"
            :loading="savingPrice"
            :disabled="!editPriceValue || editPriceValue < 0"
          >
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar para mensajes -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="5000">
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
  name: 'PricesManagement',
  data() {
    return {
      prices: [],
      selectedItems: [],
      loading: false,
      totalCount: 0,
      filterJustChanged: false,
      options: {
        page: 1,
        itemsPerPage: 10,
        sortBy: [],
        sortDesc: [],
      },
      filters: {
        id_day: null,
        id_visit_type: null,
        id_receivable_concept: null,
      },
      days: [],
      visitTypes: [],
      receivableConcepts: [],
      bulkPriceDialog: false,
      priceUpdateType: 'absolute',
      priceUpdateValue: null,
      updating: false,
      editPriceDialog: false,
      editingPrice: null,
      editPriceValue: null,
      savingPrice: false,
      snackbar: {
        show: false,
        text: '',
        color: 'success',
      },
      headers: [
        { text: 'Día', value: 'id_day', sortable: true },
        { text: 'Tipo de Visita', value: 'id_visit_type', sortable: true },
        { text: 'Concepto de Cobro', value: 'id_receivable_concept', sortable: true },
        { text: 'Monto Total', value: 'total_amount', sortable: true },
        { text: 'Acciones', value: 'actions', sortable: false, width: '120px' },
      ],
    };
  },
  mounted() {
    this.loadDays();
    this.loadVisitTypes();
    this.loadReceivableConcepts();
    this.loadPrices();
  },
  watch: {
    options: {
      handler() {
        if (this.filterJustChanged) {
          this.filterJustChanged = false;
          return;
        }
        this.loadPrices();
      },
      deep: true,
    },
  },
  methods: {
    async loadDays() {
      try {
        const response = await this.$http.get(`${process.env.VUE_APP_DEGIRA}days/get`);
        if (response && response.data) {
          // El responseHandler puede devolver los datos directamente o en response.data.data
          let daysData = response.data.data || response.data || [];
          // Mapear los días con sus descripciones correctas (igual que activeVisits)
          const dayNames = {
            1: 'Domingo',
            2: 'Lunes',
            3: 'Martes',
            4: 'Miércoles',
            5: 'Jueves',
            6: 'Viernes',
            7: 'Sábado',
            8: 'Cualquier Día',
          };
          this.days = daysData.map(day => ({
            id_day: Number(day.id_day),
            description: dayNames[day.id_day] || day.description || day.name || `Día ${day.id_day}`,
          }));
          console.log('Días cargados:', this.days);
        }
      } catch (error) {
        console.error('Error al cargar días:', error);
        this.showSnackbar('Error al cargar los días', 'error');
      }
    },
    async loadVisitTypes() {
      try {
        const response = await this.$http.get(`${process.env.VUE_APP_DEGIRA}visits_types/get`);
        if (response && response.data) {
          this.visitTypes = response.data.data || response.data || [];
          this.visitTypes = this.visitTypes.map(vt => ({
            id_visit_type: Number(vt.id_visit_type),
            description: vt.description || `Tipo ${vt.id_visit_type}`,
          }));
        }
      } catch (error) {
        console.error('Error al cargar tipos de visita:', error);
      }
    },
    async loadReceivableConcepts() {
      try {
        const response = await this.$http.get(`${process.env.VUE_APP_DEGIRA}receivable_concepts/get`);
        if (response && response.data) {
          this.receivableConcepts = response.data.data || response.data || [];
          this.receivableConcepts = this.receivableConcepts.map(rc => ({
            id_receivable_concept: Number(rc.id_receivable_concept),
            description: rc.description || `Concepto ${rc.id_receivable_concept}`,
          }));
        }
      } catch (error) {
        console.error('Error al cargar conceptos de cobro:', error);
      }
    },
    onFilterChange() {
      this.filterJustChanged = true;
      this.options.page = 1;
      this.loadPrices();
    },
    async loadPrices() {
      this.loading = true;
      try {
        const params = {
          page: this.options.page,
          pageSize: this.options.itemsPerPage,
          sortBy: this.options.sortBy.length > 0 ? this.options.sortBy[0] : undefined,
          sortDesc: this.options.sortDesc.length > 0 ? this.options.sortDesc[0] : undefined,
        };

        if (this.filters.id_day != null && this.filters.id_day !== '') {
          const n = Number(this.filters.id_day);
          if (!isNaN(n)) params.id_day = n;
        }
        if (this.filters.id_visit_type != null && this.filters.id_visit_type !== '') {
          const n = Number(this.filters.id_visit_type);
          if (!isNaN(n)) params.id_visit_type = n;
        }
        if (this.filters.id_receivable_concept != null && this.filters.id_receivable_concept !== '') {
          const n = Number(this.filters.id_receivable_concept);
          if (!isNaN(n)) params.id_receivable_concept = n;
        }

        const queryString = Object.keys(params)
          .filter(key => params[key] !== undefined && params[key] !== null)
          .map(key => `${key}=${encodeURIComponent(params[key])}`)
          .join('&');

        const response = await this.$http.get(`${process.env.VUE_APP_DEGIRA}price/list?${queryString}`);
        
        if (response && response.data) {
          // El responseHandler puede devolver { data: { rows: [], count: 0 } } o { data: [] }
          if (response.data.data && Array.isArray(response.data.data)) {
            // Si es un array directo
            this.prices = response.data.data;
            this.totalCount = response.data.totalCount || response.data.data.length || 0;
          } else if (response.data.data && response.data.data.rows) {
            // Si tiene estructura de Sequelize findAndCountAll
            this.prices = response.data.data.rows || [];
            this.totalCount = response.data.data.count || 0;
          } else {
            // Fallback
            this.prices = response.data.data || [];
            this.totalCount = response.data.totalCount || 0;
          }
          // Asegurar que los IDs sean números
          this.prices = this.prices.map(price => ({
            ...price,
            id_price: Number(price.id_price),
            id_day: price.id_day !== null && price.id_day !== undefined ? Number(price.id_day) : null,
            id_visit_type: price.id_visit_type !== null && price.id_visit_type !== undefined ? Number(price.id_visit_type) : null,
            id_receivable_concept: price.id_receivable_concept !== null && price.id_receivable_concept !== undefined ? Number(price.id_receivable_concept) : null,
            total_amount: price.total_amount ? Number(price.total_amount) : 0,
          }));
          console.log('Precios cargados:', this.prices.length, 'Total:', this.totalCount);
          console.log('Primer precio:', this.prices[0]);
          console.log('Días disponibles:', this.days);
        }
      } catch (error) {
        console.error('Error al cargar precios:', error);
        this.showSnackbar('Error al cargar los precios', 'error');
      } finally {
        this.loading = false;
      }
    },
    openBulkPriceDialog() {
      if (this.selectedItems.length === 0) {
        this.showSnackbar('Debe seleccionar al menos un precio', 'warning');
        return;
      }
      this.priceUpdateValue = null;
      this.priceUpdateType = 'absolute';
      this.bulkPriceDialog = true;
    },
    closeBulkPriceDialog() {
      this.bulkPriceDialog = false;
      this.priceUpdateValue = null;
      this.priceUpdateType = 'absolute';
    },
    getPriceUpdateLabel() {
      switch (this.priceUpdateType) {
        case 'absolute':
          return 'Nuevo Precio';
        case 'relative':
          return 'Cantidad a Sumar/Restar';
        case 'percentage':
          return 'Porcentaje de Cambio';
        default:
          return 'Valor';
      }
    },
    getPriceUpdateHint() {
      switch (this.priceUpdateType) {
        case 'absolute':
          return 'Establecerá este valor para todos los precios seleccionados';
        case 'relative':
          return 'Sumará o restará esta cantidad a cada precio (puede ser negativo)';
        case 'percentage':
          return 'Aumentará o disminuirá cada precio en este porcentaje (ej: 10 = +10%, -5 = -5%)';
        default:
          return '';
      }
    },
    calculateNewPrice(currentPrice) {
      if (!this.priceUpdateValue) return currentPrice;

      let newPrice = currentPrice;
      switch (this.priceUpdateType) {
        case 'absolute':
          newPrice = this.priceUpdateValue;
          break;
        case 'relative':
          newPrice = currentPrice + this.priceUpdateValue;
          break;
        case 'percentage':
          newPrice = currentPrice * (1 + this.priceUpdateValue / 100);
          break;
      }

      if (newPrice < 0) newPrice = 0;
      return parseFloat(newPrice.toFixed(2));
    },
    async confirmBulkUpdate() {
      if (!this.priceUpdateValue || this.selectedItems.length === 0) {
        this.showSnackbar('Debe ingresar un valor válido', 'warning');
        return;
      }

      this.updating = true;
      try {
        const ids = this.selectedItems.map(item => item.id_price);
        const userData = this.$store.state.userLoged.data;

        const payload = {
          ids,
          updateType: this.priceUpdateType,
          value: Number(this.priceUpdateValue),
          id_user: userData.id_user,
          roles: userData.roles || [],
        };

        const response = await this.$http.put(
          `${process.env.VUE_APP_DEGIRA}price/bulk-update`,
          payload
        );

        if (response && response.data) {
          this.showSnackbar(
            response.data.message || `${ids.length} precio(s) actualizado(s) correctamente`,
            'success'
          );
          this.closeBulkPriceDialog();
          this.selectedItems = [];
          this.loadPrices();
        }
      } catch (error) {
        console.error('Error al actualizar precios:', error);
        const errorMessage = error.response?.data?.message || 'Error al actualizar los precios';
        this.showSnackbar(errorMessage, 'error');
      } finally {
        this.updating = false;
      }
    },
    formatNumber(num) {
      if (!num && num !== 0) return '0.00';
      return parseFloat(num).toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },
    showSnackbar(text, color = 'success') {
      this.snackbar = {
        show: true,
        text,
        color,
      };
    },
    getDayName(id_day) {
      if (!id_day && id_day !== 0) return '-';
      // Usar el mismo formato que activeVisits
      if (id_day == 1) return 'Domingo';
      if (id_day == 2) return 'Lunes';
      if (id_day == 3) return 'Martes';
      if (id_day == 4) return 'Miércoles';
      if (id_day == 5) return 'Jueves';
      if (id_day == 6) return 'Viernes';
      if (id_day == 7) return 'Sábado';
      if (id_day == 8) return 'Cualquier Día';
      // Fallback: buscar en el array de días cargados
      if (this.days && this.days.length > 0) {
        const day = this.days.find(d => d.id_day === id_day || d.id_day === Number(id_day));
        if (day && day.description) return day.description;
      }
      return `ID: ${id_day}`;
    },
    getVisitTypeName(id_visit_type) {
      if (!id_visit_type) return '-';
      const visitType = this.visitTypes.find(v => v.id_visit_type === id_visit_type);
      return visitType ? visitType.description : id_visit_type;
    },
    getReceivableConceptName(id_receivable_concept) {
      if (!id_receivable_concept) return '-';
      const concept = this.receivableConcepts.find(c => c.id_receivable_concept === id_receivable_concept);
      return concept ? concept.description : id_receivable_concept;
    },
    openEditPriceDialog(item) {
      this.editingPrice = { ...item };
      this.editPriceValue = parseFloat(item.total_amount) || 0;
      this.editPriceDialog = true;
    },
    closeEditPriceDialog() {
      this.editPriceDialog = false;
      this.editingPrice = null;
      this.editPriceValue = null;
    },
    async confirmEditPrice() {
      if (!this.editingPrice || !this.editPriceValue || this.editPriceValue < 0) {
        this.showSnackbar('Debe ingresar un precio válido', 'warning');
        return;
      }

      this.savingPrice = true;
      try {
        const userData = this.$store.state.userLoged.data;
        const payload = {
          id_price: this.editingPrice.id_price,
          total_amount: Number(this.editPriceValue),
          id_user: userData.id_user,
          roles: userData.roles || [],
        };

        const response = await this.$http.put(
          `${process.env.VUE_APP_DEGIRA}price/update`,
          payload
        );

        if (response && response.data) {
          this.showSnackbar(
            response.data.message || 'Precio actualizado correctamente',
            'success'
          );
          this.closeEditPriceDialog();
          this.loadPrices();
        }
      } catch (error) {
        console.error('Error al actualizar precio:', error);
        const data = error.response && error.response.data;
        let errorMessage = (data && data.message) || 'Error al actualizar el precio';
        if (errorMessage.includes('rolled back') || errorMessage.includes('rollback')) {
          errorMessage = 'Error al actualizar el precio. Reinicie el backend (npm run build y luego npm run start en la carpeta backend) y vuelva a intentar.';
        }
        if (data) console.log('[PricesManagement] Respuesta de error del backend:', data);
        this.showSnackbar(errorMessage, 'error');
      } finally {
        this.savingPrice = false;
      }
    },
  },
};
</script>

<style scoped>
.v-data-table >>> .v-data-table__wrapper {
  max-height: 600px;
}
</style>

