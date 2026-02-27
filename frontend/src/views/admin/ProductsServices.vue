<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4 orange--text">Gestión de Productos y Servicios</h1>
      </v-col>
    </v-row>

    <!-- Barra de herramientas -->
    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-text-field
          v-model="searchText"
          label="Buscar (Descripción)"
          outlined
          dense
          clearable
          append-icon="mdi-magnify"
          @keyup.enter="loadProductsServices"
          @click:clear="loadProductsServices"
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="2">
        <v-select
          v-model="filters.available"
          :items="availableOptions"
          item-text="text"
          item-value="value"
          label="Disponibilidad"
          outlined
          dense
          clearable
          @change="loadProductsServices"
        ></v-select>
      </v-col>
      <v-col cols="12" md="2">
        <v-select
          v-model="filters.featured"
          :items="featuredOptions"
          item-text="text"
          item-value="value"
          label="Destacado"
          outlined
          dense
          clearable
          @change="loadProductsServices"
        ></v-select>
      </v-col>
      <v-col cols="12" md="2" class="d-flex align-center">
        <v-btn
          color="orange"
          dark
          block
          @click="loadProductsServices"
          :loading="loading"
        >
          <v-icon left>mdi-reload</v-icon>
          Actualizar
        </v-btn>
      </v-col>
      <v-col cols="12" md="2" class="d-flex align-center">
        <v-btn
          color="primary"
          dark
          block
          @click="openCreateDialog"
        >
          <v-icon left>mdi-plus</v-icon>
          Nuevo
        </v-btn>
      </v-col>
    </v-row>

    <!-- Botones de acciones masivas -->
    <v-row v-if="selectedItems.length > 0" class="mb-2">
      <v-col cols="12">
        <v-card color="orange" dark class="pa-3">
          <div class="d-flex align-center">
            <v-icon left>mdi-checkbox-multiple-marked</v-icon>
            <span class="mr-4">{{ selectedItems.length }} item(s) seleccionado(s)</span>
            <v-btn
              small
              color="white"
              text
              @click="openBulkPriceDialog"
              class="mr-2"
            >
              <v-icon left small>mdi-currency-usd</v-icon>
              Cambiar Precios
            </v-btn>
            <v-btn
              small
              color="white"
              text
              @click="openBulkUpdateDialog"
              class="mr-2"
            >
              <v-icon left small>mdi-pencil</v-icon>
              Editar Masivo
            </v-btn>
            <v-btn
              small
              color="white"
              text
              @click="openSpreadsheetDialog"
              class="mr-2"
            >
              <v-icon left small>mdi-table-edit</v-icon>
              Modificar como planilla
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
            :items="productsServices"
            :loading="loading"
            :server-items-length="totalCount"
            :options.sync="options"
            :footer-props="{
              'items-per-page-text': 'Registros por Página',
              'items-per-page-all-text': 'Todos',
              'items-per-page-options': [10, 25, 50, 100, -1],
            }"
            item-key="id_product_service"
            show-select
            dense
            fixed-header
            no-data-text="No hay productos/servicios registrados"
            class="elevation-1"
          >
            <template v-slot:item.id_product_service="{ item }">
              <strong>{{ item.id_product_service }}</strong>
            </template>

            <template v-slot:item.url_image="{ item }">
              <div v-if="item.url_image" style="width: 50px; height: 50px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #f5f5f5;">
                <img 
                  :src="getImageUrl(item.url_image)" 
                  :alt="item.description" 
                  @error="(e) => handleImageError(e, item)"
                  @load="(e) => console.log('Image loaded successfully:', e.target.src)"
                  style="width: 100%; height: 100%; object-fit: contain;"
                />
              </div>
              <v-avatar size="50" color="grey" v-else>
                <v-icon color="white">mdi-image-off</v-icon>
              </v-avatar>
            </template>

            <template v-slot:item.description="{ item }">
              <strong>{{ item.description }}</strong>
              <div v-if="item.long_description" class="text-caption text--secondary">
                {{ item.long_description }}
              </div>
            </template>

            <template v-slot:item.price="{ item }">
              <span class="font-weight-bold orange--text">
                ${{ formatPrice(item.price) }}
              </span>
            </template>

            <template v-slot:item.available="{ item }">
              <div class="text-right">
                <v-chip
                  small
                  :color="item.available > 0 ? 'green' : 'red'"
                  dark
                >
                  {{ item.available }}
                </v-chip>
              </div>
            </template>

            <template v-slot:item.featured="{ item }">
              <v-icon v-if="item.featured" color="orange">mdi-star</v-icon>
              <v-icon v-else color="grey">mdi-star-outline</v-icon>
            </template>

            <template v-slot:item.actions="{ item }">
              <v-btn
                icon
                small
                color="primary"
                @click="openEditDialog(item)"
                class="mr-1"
              >
                <v-icon small>mdi-pencil</v-icon>
              </v-btn>
              <v-btn
                icon
                small
                color="error"
                @click="openDeleteDialog(item)"
              >
                <v-icon small>mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog para crear/editar -->
    <v-dialog v-model="editDialog" max-width="1000px" persistent>
      <v-card>
        <v-card-title class="pb-2">
          <span class="headline">
            {{ editingItem ? 'Editar Producto/Servicio' : 'Nuevo Producto/Servicio' }}
          </span>
          <v-spacer></v-spacer>
          <v-btn icon @click="closeEditDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pt-2 pb-2">
          <v-container class="pa-2">
            <v-row no-gutters>
              <!-- Columna izquierda: Formulario -->
              <v-col cols="12" md="7" class="pr-md-3">
                <v-row dense>
                  <v-col cols="12" md="8">
                    <v-text-field
                      v-model="formData.description"
                      label="Descripción *"
                      outlined
                      dense
                      required
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model.number="formData.price"
                      label="Precio *"
                      type="number"
                      step="0.01"
                      min="0"
                      outlined
                      dense
                      prefix="$"
                      required
                    ></v-text-field>
                  </v-col>
                </v-row>

                <v-row dense>
                  <v-col cols="12">
                    <v-textarea
                      v-model="formData.long_description"
                      label="Descripción Larga"
                      outlined
                      rows="2"
                      dense
                    ></v-textarea>
                  </v-col>
                </v-row>

                <v-row dense>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model.number="formData.available"
                      label="Disponible"
                      type="number"
                      min="0"
                      outlined
                      dense
                      hint="Si pone 0, este producto no se verá y queda como inactivo"
                      persistent-hint
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6" class="d-flex align-center">
                    <v-switch
                      v-model="formData.featured"
                      label="Destacado"
                      color="orange"
                      dense
                    ></v-switch>
                  </v-col>
                </v-row>

                <v-row dense>
                  <v-col cols="12">
                    <v-file-input
                      v-model="selectedImage"
                      label="Seleccionar Imagen"
                      accept="image/*"
                      prepend-icon="mdi-camera"
                      outlined
                      dense
                      show-size
                      @change="handleImageSelect"
                      :loading="uploadingImage"
                      :clearable="true"
                    ></v-file-input>
                  </v-col>
                </v-row>
              </v-col>

              <!-- Columna derecha: Preview de imagen -->
              <v-col cols="12" md="5" class="pl-md-3">
                <v-card outlined class="pa-2" style="height: 100%;">
                  <div class="text-caption text--secondary mb-2">Vista Previa</div>
                  <div v-if="formData.url_image || imagePreview" class="text-center" style="min-height: 200px; display: flex; flex-direction: column; justify-content: center;">
                    <v-img
                      :src="imagePreview || getImageUrl(formData.url_image)"
                      max-height="250"
                      contain
                      @error="handleImageError"
                      class="mb-2"
                    ></v-img>
                    <div v-if="imageError" class="text-caption text--secondary mb-2">
                      Error al cargar la imagen.
                    </div>
                    <v-btn
                      v-if="formData.url_image"
                      x-small
                      color="error"
                      text
                      @click="removeImage"
                    >
                      <v-icon left x-small>mdi-delete</v-icon>
                      Eliminar Imagen
                    </v-btn>
                  </div>
                  <div v-else class="text-center" style="min-height: 200px; display: flex; align-items: center; justify-content: center;">
                    <div>
                      <v-icon color="grey" size="64">mdi-image-off</v-icon>
                      <div class="text-caption text--secondary mt-2">Sin imagen</div>
                    </div>
                  </div>
                  <v-text-field
                    v-if="formData.url_image"
                    v-model="formData.url_image"
                    label="URL"
                    outlined
                    dense
                    readonly
                    prepend-inner-icon="mdi-link"
                    class="mt-2"
                    hide-details
                  ></v-text-field>
                </v-card>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions class="pt-0">
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="closeEditDialog">Cancelar</v-btn>
          <v-btn color="primary" @click="saveItem" :loading="saving">
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog para confirmar eliminación -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title class="headline">¿Está seguro de eliminar este producto/servicio?</v-card-title>
        <v-card-text>
          <div v-if="itemToDelete">
            <strong>{{ itemToDelete.description }}</strong>
            <p class="mt-2">Esta acción no se puede deshacer.</p>
          </div>
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
              Se actualizarán {{ selectedItems.length }} producto(s)/servicio(s)
            </v-alert>

            <v-radio-group v-model="priceUpdateType" row>
              <v-radio
                label="Porcentaje (%)"
                value="percentage"
              ></v-radio>
              <v-radio
                label="Valor Absoluto"
                value="absolute"
              ></v-radio>
              <v-radio
                label="Valor Relativo (+/-)"
                value="relative"
              ></v-radio>
            </v-radio-group>

            <v-text-field
              v-model.number="priceUpdateValue"
              :label="getPriceUpdateLabel()"
              type="number"
              step="0.01"
              outlined
              dense
              :prefix="priceUpdateType === 'percentage' ? '' : '$'"
              :suffix="priceUpdateType === 'percentage' ? '%' : ''"
              required
            ></v-text-field>

            <v-alert
              v-if="priceUpdateType === 'percentage' && priceUpdateValue"
              type="info"
              class="mt-2"
            >
              Ejemplo: Si un producto cuesta $100 y aplica +10%, el nuevo precio será $110
            </v-alert>
            <v-alert
              v-if="priceUpdateType === 'relative' && priceUpdateValue"
              type="info"
              class="mt-2"
            >
              Ejemplo: Si un producto cuesta $100 y aplica +$20, el nuevo precio será $120
            </v-alert>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="closeBulkPriceDialog">Cancelar</v-btn>
          <v-btn color="primary" @click="confirmBulkPriceUpdate" :loading="bulkUpdating">
            Aplicar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog para actualización masiva de otros campos -->
    <v-dialog v-model="bulkUpdateDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title>
          <span class="headline">Actualización Masiva</span>
          <v-spacer></v-spacer>
          <v-btn icon @click="closeBulkUpdateDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-alert type="info" class="mb-4">
              Se actualizarán {{ selectedItems.length }} producto(s)/servicio(s)
            </v-alert>

            <v-text-field
              v-model="bulkFormData.description"
              label="Descripción"
              outlined
              dense
              hint="Deje vacío para no modificar"
              persistent-hint
            ></v-text-field>

            <v-textarea
              v-model="bulkFormData.long_description"
              label="Descripción Larga"
              outlined
              rows="3"
              hint="Deje vacío para no modificar"
              persistent-hint
            ></v-textarea>

            <v-text-field
              v-model.number="bulkFormData.available"
              label="Disponible"
              type="number"
              min="0"
              outlined
              dense
              hint="Deje vacío para no modificar"
              persistent-hint
            ></v-text-field>

            <v-text-field
              v-model="bulkFormData.url_image"
              label="URL de Imagen"
              outlined
              dense
              hint="Deje vacío para no modificar"
              persistent-hint
            ></v-text-field>

            <v-switch
              v-model="bulkFormData.featured"
              label="Destacado"
              color="orange"
              hint="Solo se aplicará si marca esta opción"
              persistent-hint
            ></v-switch>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="closeBulkUpdateDialog">Cancelar</v-btn>
          <v-btn color="primary" @click="confirmBulkUpdate" :loading="bulkUpdating">
            Aplicar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal planilla: edición tipo hoja de cálculo -->
    <v-dialog v-model="spreadsheetDialog" max-width="95%" persistent scrollable>
      <v-card>
        <v-card-title class="orange darken-2 white--text">
          <v-icon left color="white">mdi-table-edit</v-icon>
          Modificar como planilla ({{ spreadsheetRows.length }} producto(s))
          <v-spacer></v-spacer>
          <v-btn icon dark @click="closeSpreadsheetDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-2">
          <div ref="spreadsheetWrapper" class="spreadsheet-wrapper">
            <v-simple-table dense fixed-header class="spreadsheet-table">
              <thead>
                <tr>
                  <th class="text-left" style="width: 60px;">ID</th>
                  <th class="text-left" style="min-width: 140px;">Descripción</th>
                  <th class="text-left" style="min-width: 100px;">Descripción larga</th>
                  <th class="text-left" style="width: 100px;">Precio</th>
                  <th class="text-left" style="width: 90px;">Unid. de Stock</th>
                  <th class="text-left" style="width: 100px;">Producto Destacado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, rowIndex) in spreadsheetRows" :key="row.id_product_service">
                  <td class="pa-1">
                    <span class="font-weight-bold">{{ row.id_product_service }}</span>
                  </td>
                  <td class="pa-1" :data-spreadsheet-row="rowIndex" data-spreadsheet-col="description">
                    <v-text-field
                      :value="row.description"
                      @input="row.description = $event"
                      dense
                      hide-details
                      single-line
                      outlined
                      class="mt-0 pt-0 spreadsheet-cell"
                      @focus="selectAllOnFocus($event)"
                      @keydown.down.prevent="focusSpreadsheetCell(rowIndex + 1, 'description')"
                      @keydown.up.prevent="focusSpreadsheetCell(rowIndex - 1, 'description')"
                      @keydown.right.prevent="focusSpreadsheetCell(rowIndex, 'long_description')"
                      @keydown.left.prevent="focusSpreadsheetCell(rowIndex, 'description')"
                    ></v-text-field>
                  </td>
                  <td class="pa-1" :data-spreadsheet-row="rowIndex" data-spreadsheet-col="long_description">
                    <v-text-field
                      :value="row.long_description"
                      @input="row.long_description = $event"
                      dense
                      hide-details
                      single-line
                      outlined
                      class="mt-0 pt-0 spreadsheet-cell"
                      @focus="selectAllOnFocus($event)"
                      @keydown.down.prevent="focusSpreadsheetCell(rowIndex + 1, 'long_description')"
                      @keydown.up.prevent="focusSpreadsheetCell(rowIndex - 1, 'long_description')"
                      @keydown.right.prevent="focusSpreadsheetCell(rowIndex, 'price')"
                      @keydown.left.prevent="focusSpreadsheetCell(rowIndex, 'description')"
                    ></v-text-field>
                  </td>
                  <td class="pa-1" :data-spreadsheet-row="rowIndex" data-spreadsheet-col="price">
                    <v-text-field
                      :value="row.price"
                      @input="row.price = $event === '' ? '' : (parseFloat($event) || 0)"
                      type="text"
                      inputmode="decimal"
                      dense
                      hide-details
                      single-line
                      outlined
                      prefix="$"
                      class="mt-0 pt-0 spreadsheet-cell"
                      @focus="selectAllOnFocus($event)"
                      @keydown.down.prevent="focusSpreadsheetCell(rowIndex + 1, 'price')"
                      @keydown.up.prevent="focusSpreadsheetCell(rowIndex - 1, 'price')"
                      @keydown.right.prevent="focusSpreadsheetCell(rowIndex, 'available')"
                      @keydown.left.prevent="focusSpreadsheetCell(rowIndex, 'long_description')"
                    ></v-text-field>
                  </td>
                  <td class="pa-1" :data-spreadsheet-row="rowIndex" data-spreadsheet-col="available">
                    <v-text-field
                      :value="row.available"
                      @input="row.available = $event === '' ? '' : (parseInt($event, 10) || 0)"
                      type="text"
                      inputmode="numeric"
                      dense
                      hide-details
                      single-line
                      outlined
                      class="mt-0 pt-0 spreadsheet-cell"
                      @focus="selectAllOnFocus($event)"
                      @keydown.down.prevent="focusSpreadsheetCell(rowIndex + 1, 'available')"
                      @keydown.up.prevent="focusSpreadsheetCell(rowIndex - 1, 'available')"
                      @keydown.right.prevent="focusSpreadsheetCell(rowIndex, 'featured')"
                      @keydown.left.prevent="focusSpreadsheetCell(rowIndex, 'price')"
                    ></v-text-field>
                  </td>
                  <td class="pa-1" :data-spreadsheet-row="rowIndex" data-spreadsheet-col="featured">
                    <v-checkbox
                      v-model="row.featured"
                      hide-details
                      dense
                      class="mt-0 pt-0 spreadsheet-cell"
                      color="orange"
                      @keydown.down.prevent="focusSpreadsheetCell(rowIndex + 1, 'featured')"
                      @keydown.up.prevent="focusSpreadsheetCell(rowIndex - 1, 'featured')"
                      @keydown.right.prevent="focusSpreadsheetCell(rowIndex, 'featured')"
                      @keydown.left.prevent="focusSpreadsheetCell(rowIndex, 'available')"
                    ></v-checkbox>
                  </td>
                </tr>
              </tbody>
            </v-simple-table>
          </div>
        </v-card-text>
        <v-card-actions class="pt-0">
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="closeSpreadsheetDialog">Cancelar</v-btn>
          <v-btn color="primary" @click="saveSpreadsheet" :loading="spreadsheetSaving">
            <v-icon left>mdi-content-save</v-icon>
            Grabar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import eventBus from '../../event-bus';

export default {
  name: 'ProductsServices',
  data() {
    return {
      productsServices: [],
      loading: false,
      totalCount: 0,
      searchText: '',
      filters: {
        available: null,
        featured: null,
      },
      availableOptions: [
        { text: 'Disponibles', value: 1 },
        { text: 'Sin Stock', value: 0 },
      ],
      featuredOptions: [
        { text: 'Sí', value: true },
        { text: 'No', value: false },
      ],
      options: {
        page: 1,
        itemsPerPage: 100,
        sortBy: ['id_product_service'],
        sortDesc: [true],
      },
      headers: [
        { text: 'ID', value: 'id_product_service', sortable: true, width: '80px' },
        { text: 'Imagen', value: 'url_image', sortable: false, width: '80px' },
        { text: 'Descripción', value: 'description', sortable: true },
        { text: 'Precio', value: 'price', sortable: true, width: '120px' },
        { text: 'Unid. de Stock', value: 'available', sortable: true, width: '120px', align: 'right' },
        { text: 'Producto Destacado', value: 'featured', sortable: true, width: '100px' },
        { text: 'Acciones', value: 'actions', sortable: false, width: '120px' },
      ],
      selectedItems: [],
      editDialog: false,
      deleteDialog: false,
      bulkPriceDialog: false,
      bulkUpdateDialog: false,
      spreadsheetDialog: false,
      spreadsheetRows: [],
      spreadsheetSaving: false,
      editingItem: null,
      itemToDelete: null,
      formData: {
        description: '',
        available: 0,
        long_description: '',
        price: 0,
        url_image: '',
        featured: false,
      },
      bulkFormData: {
        description: '',
        long_description: '',
        available: null,
        url_image: '',
        featured: null,
      },
      priceUpdateType: 'percentage',
      priceUpdateValue: null,
      saving: false,
      deleting: false,
      bulkUpdating: false,
      imageError: false,
      selectedImage: null,
      imagePreview: null,
      uploadingImage: false,
    };
  },
  mounted() {
    this.loadProductsServices();
  },
  watch: {
    options: {
      handler() {
        this.loadProductsServices();
      },
      deep: true,
    },
  },
  methods: {
    // Helper para extraer IDs de roles de userData
    extractRoleIds(userData) {
      if (!userData || !userData.roles || !Array.isArray(userData.roles)) {
        return [];
      }
      return userData.roles.map(role => {
        // Si es un objeto con id_role, extraer el número
        if (typeof role === 'object' && role !== null && role.id_role !== undefined) {
          return Number(role.id_role);
        }
        // Si ya es un número, usarlo directamente
        return Number(role);
      }).filter(id => !isNaN(id) && id > 0);
    },
    async loadProductsServices() {
      this.loading = true;
      try {
        const params = {
          page: this.options.page,
          pageSize: this.options.itemsPerPage === -1 ? undefined : this.options.itemsPerPage,
          sortBy: this.options.sortBy[0] || 'id_product_service',
          sortDesc: this.options.sortDesc[0] !== false,
          search: this.searchText || '',
        };
        
        // Si se seleccionó "Todos" (-1), no enviar page para obtener todos los registros
        if (this.options.itemsPerPage === -1) {
          delete params.page;
        }

        if (this.filters.available !== null) {
          params.available = this.filters.available;
        }

        if (this.filters.featured !== null) {
          params.featured = this.filters.featured;
        }

        const response = await this.$http.get(
          `${process.env.VUE_APP_DEGIRA}products_services/`,
          { params }
        );

        console.log('Respuesta de loadProductsServices:', response);
        
        if (response && response.data) {
          // El backend puede devolver los datos directamente en response.data o en response.data.data
          const data = response.data.data || response.data;
          const total = response.data.totalCount || (Array.isArray(data) ? data.length : 0);
          
          this.productsServices = Array.isArray(data) ? data : [];
          this.totalCount = total;
          
          console.log('Productos/servicios cargados:', this.productsServices.length);
        } else {
          console.warn('Respuesta inválida o vacía:', response);
          this.productsServices = [];
          this.totalCount = 0;
        }
      } catch (error) {
        console.error('Error al cargar productos/servicios:', error);
        eventBus.$emit('toast', {
          show: true,
          text: 'Error al cargar productos/servicios',
          color: 'error',
        });
      } finally {
        this.loading = false;
      }
    },
    openCreateDialog() {
      this.editingItem = null;
      this.formData = {
        description: '',
        available: 0,
        long_description: '',
        price: 0,
        url_image: '',
        featured: false,
      };
      this.imageError = false;
      this.editDialog = true;
    },
    openEditDialog(item) {
      this.editingItem = item;
      this.formData = {
        description: item.description || '',
        available: item.available || 0,
        long_description: item.long_description || '',
        price: parseFloat(item.price) || 0,
        url_image: item.url_image || '',
        featured: item.featured || false,
      };
      this.selectedImage = null;
      // Si hay una imagen existente, no mostrar preview local (se mostrará desde la URL)
      this.imagePreview = null;
      this.imageError = false;
      console.log('Abriendo diálogo de edición:', {
        id: item.id_product_service,
        url_image: this.formData.url_image,
      });
      this.editDialog = true;
    },
    closeEditDialog() {
      this.editDialog = false;
      this.editingItem = null;
      this.formData = {
        description: '',
        available: 0,
        long_description: '',
        price: 0,
        url_image: '',
        featured: false,
      };
      this.selectedImage = null;
      this.imagePreview = null;
      this.imageError = false;
    },
    async handleImageSelect(file) {
      console.log('handleImageSelect llamado con:', file);
      
      // v-file-input puede pasar el archivo directamente o como parte de un evento
      // Si es un evento, extraer el archivo
      if (file && file.target) {
        file = file.target.files ? file.target.files[0] : null;
      }
      
      // Si selectedImage tiene valor, usar ese (v-model ya lo tiene)
      if (!file && this.selectedImage) {
        file = this.selectedImage;
      }
      
      if (!file) {
        console.log('No hay archivo seleccionado');
        this.imagePreview = null;
        this.formData.url_image = '';
        return;
      }

      console.log('Archivo seleccionado:', {
        name: file.name,
        size: file.size,
        type: file.type,
      });

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        eventBus.$emit('toast', {
          show: true,
          text: 'La imagen no puede ser mayor a 5MB',
          color: 'error',
        });
        this.selectedImage = null;
        this.imagePreview = null;
        return;
      }

      // Validar tipo de archivo
      if (!file.type || !file.type.startsWith('image/')) {
        eventBus.$emit('toast', {
          show: true,
          text: 'Solo se permiten archivos de imagen',
          color: 'error',
        });
        this.selectedImage = null;
        this.imagePreview = null;
        return;
      }

      // Crear preview local
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);

      // Subir imagen al servidor
      this.uploadingImage = true;
      try {
        const formData = new FormData();
        formData.append('image', file);

        const uploadUrl = `${process.env.VUE_APP_DEGIRA}products_services/upload`;
        console.log('Subiendo imagen a:', uploadUrl);
        console.log('FormData:', formData);
        console.log('Archivo en FormData:', file);
        
        const response = await this.$http.post(
          uploadUrl,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        
        console.log('Respuesta del upload:', response);

        if (response && response.data && response.data.data && response.data.data.url) {
          // Guardar solo la ruta relativa (se construirá la URL completa al mostrar)
          // Limpiar cualquier /v1/ que pueda venir del backend
          let imageUrl = response.data.data.url;
          if (imageUrl) {
            // Remover /v1/ si está presente
            imageUrl = imageUrl.replace(/^\/v1\//, '/');
            // Si es una URL completa, extraer solo la ruta relativa
            if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
              try {
                const urlObj = new URL(imageUrl);
                imageUrl = urlObj.pathname;
                // Limpiar /v1/ de la ruta también
                imageUrl = imageUrl.replace(/^\/v1\//, '/');
              } catch (e) {
                console.error('Error parsing URL:', e);
              }
            }
            // Solo guardar si la URL es válida
            if (imageUrl && imageUrl.startsWith('/uploads/')) {
              this.formData.url_image = imageUrl;
              console.log('URL de imagen guardada en formData:', this.formData.url_image);
              
              eventBus.$emit('toast', {
                show: true,
                text: 'Imagen subida correctamente',
                color: 'success',
              });
            } else {
              console.error('URL de imagen inválida:', imageUrl);
              eventBus.$emit('toast', {
                show: true,
                text: 'Error: URL de imagen inválida: ' + imageUrl,
                color: 'error',
              });
              this.selectedImage = null;
              this.imagePreview = null;
            }
          }
        } else {
          console.error('Respuesta inválida del servidor:', response);
          eventBus.$emit('toast', {
            show: true,
            text: 'Error: No se recibió la URL de la imagen',
            color: 'error',
          });
        }
      } catch (error) {
        console.error('Error al subir imagen:', error);
        eventBus.$emit('toast', {
          show: true,
          text: error.response?.data?.message || 'Error al subir la imagen',
          color: 'error',
        });
        this.selectedImage = null;
        this.imagePreview = null;
      } finally {
        this.uploadingImage = false;
      }
    },
    getImageUrl(url) {
      if (!url) return null;

      // Origen donde se sirven las imágenes = mismo que el API (VUE_APP_DEGIRA)
      let apiOrigin = 'http://localhost:3000';
      try {
        if (process.env.VUE_APP_DEGIRA) apiOrigin = new URL(process.env.VUE_APP_DEGIRA).origin;
      } catch (_e) {
        // usar fallback apiOrigin
      }

      // Si ya es una URL completa, usar solo el pathname y reconstruir con el origen correcto
      // (así aunque en BD esté guardado otro puerto, se muestra con el actual)
      if (url.startsWith('http://') || url.startsWith('https://')) {
        try {
          const pathname = new URL(url).pathname;
          return pathname ? `${apiOrigin}${pathname}` : url;
        } catch (_e) {
          return url;
        }
      }

      // Ruta relativa: limpiar /v1/ y construir URL completa
      let cleanPath = url.replace(/^\/v1\//, '/');
      if (cleanPath.startsWith('/uploads/')) {
        return `${apiOrigin}${cleanPath}`;
      }

      // Solo nombre de archivo: asumir products-services
      if (cleanPath && !cleanPath.includes('/')) {
        return `${apiOrigin}/uploads/products-services/${cleanPath}`;
      }

      return url;
    },
    removeImage() {
      this.formData.url_image = '';
      this.selectedImage = null;
      this.imagePreview = null;
    },
    handleImageError(event, item = null) {
      if (!event || !event.target) {
        this.imageError = true;
        return;
      }
      const imgElement = event.target;
      const imageUrl = imgElement.src;

      // Prevenir loop infinito: si ya intentamos cargar esta imagen, no intentar de nuevo
      if (imgElement.dataset.retryAttempted === 'true') {
        console.error('Image failed to load after retry:', imageUrl);
        this.imageError = true;
        if (imgElement.style) imgElement.style.display = 'none';
        return;
      }

      console.error('Error al cargar imagen:', imageUrl);

      imgElement.dataset.retryAttempted = 'true';

      if (item && item.url_image) {
        const directUrl = this.getImageUrl(item.url_image);
        console.log('Attempting direct URL:', directUrl);
        setTimeout(() => {
          if (directUrl && directUrl !== imageUrl && imgElement) {
            imgElement.src = directUrl;
          } else {
            this.imageError = true;
            if (imgElement.style) imgElement.style.display = 'none';
          }
        }, 100);
      } else {
        this.imageError = true;
        if (imgElement.style) imgElement.style.display = 'none';
      }
    },
    async saveItem() {
      if (!this.formData.description || !this.formData.description.trim()) {
        eventBus.$emit('toast', {
          show: true,
          text: 'La descripción es requerida',
          color: 'error',
        });
        return;
      }

      if (this.formData.price === null || this.formData.price === undefined || this.formData.price < 0) {
        eventBus.$emit('toast', {
          show: true,
          text: 'El precio es requerido y debe ser mayor o igual a 0',
          color: 'error',
        });
        return;
      }

      this.saving = true;
      try {
        const userData = this.$store.state.userLoged?.data || {};
        
        // Limpiar la URL de imagen antes de guardar (asegurar que sea ruta relativa sin /v1/)
        let cleanImageUrl = this.formData.url_image;
        if (cleanImageUrl) {
          // Remover /v1/ si está presente
          cleanImageUrl = cleanImageUrl.replace(/^\/v1\//, '/');
          // Si es una URL completa, extraer solo la ruta relativa
          if (cleanImageUrl.startsWith('http://') || cleanImageUrl.startsWith('https://')) {
            try {
              const urlObj = new URL(cleanImageUrl);
              cleanImageUrl = urlObj.pathname;
              // Limpiar /v1/ de la ruta también
              cleanImageUrl = cleanImageUrl.replace(/^\/v1\//, '/');
            } catch (e) {
              console.error('Error parsing URL:', e);
            }
          }
        }
        
        // Construir payload solo con los campos necesarios
        const payload = {
          description: this.formData.description.trim(),
          available: this.formData.available !== undefined && this.formData.available !== null ? Number(this.formData.available) : 0,
          price: Number(this.formData.price),
          featured: Boolean(this.formData.featured),
          id_user: userData.id_user,
          roles: this.extractRoleIds(userData),
        };
        
        // Agregar campos opcionales solo si tienen valor
        if (this.formData.long_description && this.formData.long_description.trim()) {
          payload.long_description = this.formData.long_description.trim();
        }
        
        // Agregar URL de imagen solo si tiene valor (o null si se quiere eliminar)
        if (cleanImageUrl !== undefined) {
          payload.url_image = cleanImageUrl || null;
        }

        console.log('Guardando producto/servicio:', {
          isEditing: !!this.editingItem,
          id: this.editingItem?.id_product_service,
          payload,
        });

        if (this.editingItem) {
          console.log('Actualizando producto/servicio ID:', this.editingItem.id_product_service);
          const response = await this.$http.put(
            `${process.env.VUE_APP_DEGIRA}products_services/${this.editingItem.id_product_service}`,
            payload
          );
          console.log('Respuesta del servidor:', response);
        } else {
          console.log('Creando nuevo producto/servicio');
          const response = await this.$http.post(
            `${process.env.VUE_APP_DEGIRA}products_services/`,
            payload
          );
          console.log('Respuesta del servidor:', response);
        }
        
        // Cerrar el diálogo primero
        this.closeEditDialog();
        
        // Recargar la lista de productos/servicios para mostrar los cambios
        console.log('Recargando lista de productos/servicios...');
        try {
          await this.loadProductsServices();
          console.log('Lista recargada exitosamente');
          
          // Forzar actualización de la vista para asegurar que se muestren los cambios
          this.$nextTick(() => {
            this.$forceUpdate();
          });
          
          // Mostrar mensaje de éxito
          eventBus.$emit('toast', {
            show: true,
            text: this.editingItem ? 'Producto/Servicio actualizado correctamente' : 'Producto/Servicio creado correctamente',
            color: 'success',
          });
        } catch (reloadError) {
          console.error('Error al recargar la lista:', reloadError);
          // Aún así mostrar mensaje de éxito del guardado
          eventBus.$emit('toast', {
            show: true,
            text: this.editingItem ? 'Producto/Servicio actualizado correctamente' : 'Producto/Servicio creado correctamente',
            color: 'success',
          });
        }
      } catch (error) {
        console.error('Error al guardar:', error);
        const message = error.response?.data?.message || 'Error al guardar el producto/servicio';
        eventBus.$emit('toast', {
          show: true,
          text: message,
          color: 'error',
        });
      } finally {
        this.saving = false;
      }
    },
    openDeleteDialog(item) {
      this.itemToDelete = item;
      this.deleteDialog = true;
    },
    async confirmDelete() {
      if (!this.itemToDelete) return;

      this.deleting = true;
      try {
        const userData = this.$store.state.userLoged?.data || {};
        await this.$http.delete(
          `${process.env.VUE_APP_DEGIRA}products_services/${this.itemToDelete.id_product_service}`,
          {
            data: {
              id_user: userData.id_user,
              roles: this.extractRoleIds(userData),
            },
          }
        );
        eventBus.$emit('toast', {
          show: true,
          text: 'Producto/Servicio eliminado correctamente',
          color: 'success',
        });
        this.deleteDialog = false;
        this.itemToDelete = null;
        await this.loadProductsServices();
      } catch (error) {
        console.error('Error al eliminar:', error);
        const message = error.response?.data?.message || 'Error al eliminar el producto/servicio';
        eventBus.$emit('toast', {
          show: true,
          text: message,
          color: 'error',
        });
      } finally {
        this.deleting = false;
      }
    },
    openBulkPriceDialog() {
      if (this.selectedItems.length === 0) {
        eventBus.$emit('toast', {
          show: true,
          text: 'Debe seleccionar al menos un producto/servicio',
          color: 'warning',
        });
        return;
      }
      this.priceUpdateType = 'percentage';
      this.priceUpdateValue = null;
      this.bulkPriceDialog = true;
    },
    closeBulkPriceDialog() {
      this.bulkPriceDialog = false;
      this.priceUpdateType = 'percentage';
      this.priceUpdateValue = null;
    },
    getPriceUpdateLabel() {
      switch (this.priceUpdateType) {
        case 'percentage':
          return 'Porcentaje (%)';
        case 'absolute':
          return 'Precio Final';
        case 'relative':
          return 'Cantidad a Sumar/Restar';
        default:
          return 'Valor';
      }
    },
    async confirmBulkPriceUpdate() {
      if (this.priceUpdateValue === null || this.priceUpdateValue === undefined) {
        eventBus.$emit('toast', {
          show: true,
          text: 'Debe ingresar un valor',
          color: 'error',
        });
        return;
      }

      this.bulkUpdating = true;
      try {
        const userData = this.$store.state.userLoged?.data || {};
        const ids = this.selectedItems.map(item => item.id_product_service);
        const payload = {
          ids,
          updateType: this.priceUpdateType,
          value: this.priceUpdateValue,
          id_user: userData.id_user,
          roles: this.extractRoleIds(userData),
        };

        const response = await this.$http.put(
          `${process.env.VUE_APP_DEGIRA}products_services/bulk/prices`,
          payload
        );

        eventBus.$emit('toast', {
          show: true,
          text: response.data?.data?.message || 'Precios actualizados correctamente',
          color: 'success',
        });
        this.closeBulkPriceDialog();
        this.selectedItems = [];
        await this.loadProductsServices();
      } catch (error) {
        console.error('Error al actualizar precios:', error);
        const message = error.response?.data?.message || 'Error al actualizar los precios';
        eventBus.$emit('toast', {
          show: true,
          text: message,
          color: 'error',
        });
      } finally {
        this.bulkUpdating = false;
      }
    },
    openBulkUpdateDialog() {
      if (this.selectedItems.length === 0) {
        eventBus.$emit('toast', {
          show: true,
          text: 'Debe seleccionar al menos un producto/servicio',
          color: 'warning',
        });
        return;
      }
      this.bulkFormData = {
        description: '',
        long_description: '',
        available: null,
        url_image: '',
        featured: null,
      };
      this.bulkUpdateDialog = true;
    },
    openSpreadsheetDialog() {
      if (this.selectedItems.length === 0) {
        eventBus.$emit('toast', {
          show: true,
          text: 'Debe seleccionar al menos un producto/servicio',
          color: 'warning',
        });
        return;
      }
      this.spreadsheetRows = this.selectedItems.map(item => ({
        id_product_service: item.id_product_service,
        description: item.description || '',
        long_description: item.long_description || '',
        price: parseFloat(item.price) || 0,
        available: item.available != null ? item.available : 0,
        featured: Boolean(item.featured),
        url_image: item.url_image || '',
      }));
      this.spreadsheetDialog = true;
    },
    closeSpreadsheetDialog() {
      this.spreadsheetDialog = false;
      this.spreadsheetRows = [];
    },
    selectAllOnFocus(e) {
      if (e.target && e.target.tagName === 'INPUT') {
        this.$nextTick(() => e.target.select());
      }
    },
    focusSpreadsheetCell(rowIndex, colKey) {
      if (!this.$refs.spreadsheetWrapper) return;
      if (rowIndex < 0 || rowIndex >= this.spreadsheetRows.length) return;
      const td = this.$refs.spreadsheetWrapper.querySelector(
        `[data-spreadsheet-row="${rowIndex}"][data-spreadsheet-col="${colKey}"]`
      );
      if (td) {
        const input = td.querySelector('input');
        if (input) {
          input.focus();
          if (colKey !== 'featured') input.select();
        }
      }
    },
    async saveSpreadsheet() {
      for (const row of this.spreadsheetRows) {
        if (!(row.description && String(row.description).trim())) {
          eventBus.$emit('toast', {
            show: true,
            text: `ID ${row.id_product_service}: La descripción es obligatoria`,
            color: 'error',
          });
          return;
        }
        const priceNum = Number(row.price);
        if (priceNum === null || priceNum === undefined || isNaN(priceNum) || priceNum < 0) {
          eventBus.$emit('toast', {
            show: true,
            text: `ID ${row.id_product_service}: El precio debe ser mayor o igual a 0`,
            color: 'error',
          });
          return;
        }
      }

      this.spreadsheetSaving = true;
      try {
        const userData = this.$store.state.userLoged?.data || {};
        const roles = this.extractRoleIds(userData);

        for (const row of this.spreadsheetRows) {
          let cleanImageUrl = row.url_image;
          if (cleanImageUrl) {
            cleanImageUrl = cleanImageUrl.replace(/^\/v1\//, '/');
            if (cleanImageUrl.startsWith('http://') || cleanImageUrl.startsWith('https://')) {
              try {
                const urlObj = new URL(cleanImageUrl);
                cleanImageUrl = urlObj.pathname.replace(/^\/v1\//, '/');
              } catch (e) {
                console.error('Error parsing URL:', e);
              }
            }
          }

          const payload = {
            description: (row.description || '').trim(),
            available: row.available !== undefined && row.available !== null && row.available !== ''
              ? Number(row.available)
              : 0,
            price: Number(row.price),
            featured: Boolean(row.featured),
            id_user: userData.id_user,
            roles,
          };
          if (row.long_description != null && String(row.long_description).trim()) {
            payload.long_description = String(row.long_description).trim();
          }
          // No enviar url_image desde la planilla para no pisar la imagen existente
          if (cleanImageUrl) {
            payload.url_image = cleanImageUrl;
          }

          await this.$http.put(
            `${process.env.VUE_APP_DEGIRA}products_services/${row.id_product_service}`,
            payload
          );
        }

        eventBus.$emit('toast', {
          show: true,
          text: 'Productos actualizados correctamente',
          color: 'success',
        });
        this.closeSpreadsheetDialog();
        this.selectedItems = [];
        await this.loadProductsServices();
      } catch (error) {
        console.error('Error al guardar planilla:', error);
        const message = error.response?.data?.message || 'Error al guardar los productos';
        eventBus.$emit('toast', {
          show: true,
          text: message,
          color: 'error',
        });
      } finally {
        this.spreadsheetSaving = false;
      }
    },
    closeBulkUpdateDialog() {
      this.bulkUpdateDialog = false;
      this.bulkFormData = {
        description: '',
        long_description: '',
        available: null,
        url_image: '',
        featured: null,
      };
    },
    async confirmBulkUpdate() {
      // Validar que al menos un campo tenga valor
      const hasData = this.bulkFormData.description ||
        this.bulkFormData.long_description ||
        this.bulkFormData.available !== null ||
        this.bulkFormData.url_image ||
        this.bulkFormData.featured !== null;

      if (!hasData) {
        eventBus.$emit('toast', {
          show: true,
          text: 'Debe completar al menos un campo',
          color: 'error',
        });
        return;
      }

      this.bulkUpdating = true;
      try {
        const userData = this.$store.state.userLoged?.data || {};
        const ids = this.selectedItems.map(item => item.id_product_service);
        const payload = {
          ids,
          ...this.bulkFormData,
          id_user: userData.id_user,
          roles: this.extractRoleIds(userData),
        };

        // Remover campos null/undefined
        Object.keys(payload).forEach(key => {
          if (payload[key] === null || payload[key] === undefined || payload[key] === '') {
            delete payload[key];
          }
        });

        const response = await this.$http.put(
          `${process.env.VUE_APP_DEGIRA}products_services/bulk/update`,
          payload
        );

        eventBus.$emit('toast', {
          show: true,
          text: response.data?.data?.message || 'Productos/Servicios actualizados correctamente',
          color: 'success',
        });
        this.closeBulkUpdateDialog();
        this.selectedItems = [];
        await this.loadProductsServices();
      } catch (error) {
        console.error('Error al actualizar:', error);
        const message = error.response?.data?.message || 'Error al actualizar los productos/servicios';
        eventBus.$emit('toast', {
          show: true,
          text: message,
          color: 'error',
        });
      } finally {
        this.bulkUpdating = false;
      }
    },
    formatPrice(price) {
      if (!price) return '0.00';
      return parseFloat(price).toFixed(2);
    },
  },
};
</script>

<style scoped>
.compact-table >>> .v-data-table__wrapper {
  max-height: 600px;
}
.spreadsheet-wrapper {
  max-height: 70vh;
  overflow: auto;
}
.spreadsheet-table >>> .v-text-field__slot input {
  font-size: 0.875rem;
}
</style>

