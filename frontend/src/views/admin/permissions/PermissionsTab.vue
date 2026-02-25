<template>
  <div>
    <!-- Barra de búsqueda y filtros -->
    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-text-field
          v-model="searchText"
          label="Buscar pantalla (descripción, ruta)"
          outlined
          dense
          prepend-inner-icon="mdi-magnify"
          clearable
          @input="debounceSearch"
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="selectedRoleFilter"
          :items="roles"
          item-text="description"
          item-value="id_role"
          label="Filtrar por rol"
          outlined
          dense
          clearable
          @change="loadPermissions"
        ></v-select>
      </v-col>
      <v-col cols="12" md="2">
        <v-select
          v-model="menuAvailableFilter"
          :items="menuOptions"
          label="En menú"
          outlined
          dense
          clearable
          @change="loadPermissions"
        ></v-select>
      </v-col>
      <v-col cols="12" md="3" class="d-flex align-center">
        <v-btn
          color="primary"
          @click="openCreateDialog"
          block
        >
          <v-icon left>mdi-view-dashboard-plus</v-icon>
          Nueva Pantalla
        </v-btn>
      </v-col>
    </v-row>

    <!-- Tabla de permisos/pantallas -->
    <v-card outlined>
      <v-data-table
        :headers="headers"
        :items="permissions"
        :loading="loading"
        :server-items-length="totalCount"
        :options.sync="options"
        :footer-props="{
          'items-per-page-text': 'Pantallas por página',
          'items-per-page-all-text': 'Todos',
        }"
        @update:options="loadPermissions"
      >
        <template v-slot:item.role="{ item }">
          <v-chip
            v-if="item.role"
            x-small
            :color="getRoleColor(item.role.id_role)"
            dark
          >
            {{ item.role.description }}
          </v-chip>
          <span v-else class="text-caption grey--text">Sin rol</span>
        </template>

        <template v-slot:item.menu_available="{ item }">
          <v-icon
            :color="item.menu_available == 1 ? 'success' : 'grey'"
            small
          >
            {{ item.menu_available == 1 ? 'mdi-check-circle' : 'mdi-close-circle' }}
          </v-icon>
        </template>

        <template v-slot:item.icon="{ item }">
          <v-icon v-if="item.icon" small>{{ item.icon }}</v-icon>
          <span v-else class="text-caption grey--text">-</span>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn
            icon
            x-small
            color="primary"
            @click="editPermission(item)"
          >
            <v-icon small>mdi-pencil</v-icon>
          </v-btn>
          <v-btn
            icon
            x-small
            color="orange"
            @click="changeRole(item)"
          >
            <v-icon small>mdi-shield-account</v-icon>
          </v-btn>
          <v-btn
            icon
            x-small
            color="error"
            @click="confirmDelete(item)"
          >
            <v-icon small>mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog Crear/Editar Permiso -->
    <v-dialog v-model="permissionDialog" max-width="700px" persistent>
      <v-card>
        <v-card-title class="orange white--text">
          <span class="headline">{{ editingPermission ? 'Editar Pantalla' : 'Nueva Pantalla' }}</span>
          <v-spacer></v-spacer>
          <v-btn icon dark @click="closePermissionDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="pt-4">
          <v-form ref="permissionForm">
            <v-text-field
              v-model="permissionForm.description"
              label="Descripción"
              outlined
              dense
              :rules="[v => !!v || 'La descripción es requerida']"
            ></v-text-field>

            <v-text-field
              v-model="permissionForm.action"
              label="Acción"
              outlined
              dense
              hint="Opcional"
            ></v-text-field>

            <v-select
              v-model="permissionForm.id_role"
              :items="roles"
              item-text="description"
              item-value="id_role"
              label="Rol"
              outlined
              dense
              :rules="[v => !!v || 'El rol es requerido']"
            ></v-select>

            <v-text-field
              v-model="permissionForm.path"
              label="Ruta (Path)"
              outlined
              dense
              hint="Ej: /nueva-pantalla"
            ></v-text-field>

            <v-text-field
              v-model="permissionForm.icon"
              label="Icono (Material Design)"
              outlined
              dense
              hint="Ej: mdi-home"
              prepend-inner-icon="mdi-information"
            ></v-text-field>

            <v-text-field
              v-model="permissionForm.tag"
              label="Tag"
              outlined
              dense
              hint="Opcional"
            ></v-text-field>

            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model.number="permissionForm.order"
                  label="Orden"
                  type="number"
                  outlined
                  dense
                  hint="Para ordenar en el menú"
                ></v-text-field>
              </v-col>
              <v-col cols="6" class="d-flex align-center">
                <v-switch
                  v-model="permissionForm.menu_available"
                  label="Visible en menú"
                  color="orange"
                ></v-switch>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closePermissionDialog">Cancelar</v-btn>
          <v-btn color="orange" dark @click="savePermission">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Cambiar Rol -->
    <v-dialog v-model="roleChangeDialog" max-width="500px" persistent>
      <v-card>
        <v-card-title class="orange white--text">
          <span class="headline">Cambiar Rol de Pantalla</span>
          <v-spacer></v-spacer>
          <v-btn icon dark @click="closeRoleChangeDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="pt-4">
          <v-alert v-if="selectedPermission" type="info" dense class="mb-4">
            <strong>Pantalla:</strong> {{ selectedPermission.description }}
          </v-alert>
          
          <v-select
            v-model="newRoleId"
            :items="roles"
            item-text="description"
            item-value="id_role"
            label="Seleccionar Nuevo Rol"
            outlined
            dense
            :rules="[v => !!v || 'Debe seleccionar un rol']"
            required
          ></v-select>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeRoleChangeDialog">Cancelar</v-btn>
          <v-btn 
            color="orange" 
            dark 
            @click="saveRoleChange"
            :loading="savingRole"
            :disabled="!newRoleId"
          >
            <v-icon left>mdi-content-save</v-icon>
            Guardar Cambio
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Confirmar Eliminación -->
    <ModalConfirm
      :show="deleteDialog"
      title="Eliminar Pantalla"
      :message="`¿Está seguro de eliminar la pantalla ${permissionToDelete?.description}?`"
      @confirm="deletePermission"
      @cancel="deleteDialog = false"
    />
  </div>
</template>

<script>
import ModalConfirm from '../../app/ModalConfirm.vue';

export default {
  name: 'PermissionsTab',
  components: {
    ModalConfirm,
  },
  data() {
    return {
      loading: false,
      searchText: '',
      selectedRoleFilter: null,
      menuAvailableFilter: null,
      permissions: [],
      roles: [],
      totalCount: 0,
      options: {
        page: 1,
        itemsPerPage: 10,
        sortBy: ['order'],
        sortDesc: [false],
      },
      headers: [
        { text: 'ID', value: 'id_operation_type', width: '80px' },
        { text: 'Descripción', value: 'description' },
        { text: 'Ruta', value: 'path' },
        { text: 'Rol', value: 'role', sortable: false },
        { text: 'Icono', value: 'icon', sortable: false, width: '80px' },
        { text: 'Orden', value: 'order', width: '80px' },
        { text: 'En Menú', value: 'menu_available', sortable: false, width: '100px' },
        { text: 'Acciones', value: 'actions', sortable: false, width: '150px' },
      ],
      permissionDialog: false,
      editingPermission: false,
      permissionForm: {
        description: '',
        action: '',
        id_role: null,
        tag: '',
        icon: '',
        path: '',
        menu_available: 1,
        order: null,
      },
      roleChangeDialog: false,
      selectedPermission: null,
      newRoleId: null,
      savingRole: false,
      deleteDialog: false,
      permissionToDelete: null,
      menuOptions: [
        { text: 'Sí', value: 1 },
        { text: 'No', value: 0 },
      ],
      searchTimeout: null,
    };
  },
  mounted() {
    this.loadPermissions();
    this.loadRoles();
    this.$root.$on('refresh-roles', this.loadRoles);
  },
  beforeDestroy() {
    this.$root.$off('refresh-roles', this.loadRoles);
  },
  methods: {
    async loadPermissions() {
      this.loading = true;
      try {
        const params = {
          page: this.options.page,
          pageSize: this.options.itemsPerPage,
          search: this.searchText || undefined,
          roleId: this.selectedRoleFilter || undefined,
          menuAvailable: this.menuAvailableFilter !== null ? this.menuAvailableFilter : undefined,
        };

        const response = await this.$http.get(
          `${process.env.VUE_APP_DEGIRA}operations_types`,
          { params }
        );

        console.log('Response completo:', response); // Debug
        console.log('Response data:', response.data); // Debug

        if (response && response.data) {
          // El responseHandler devuelve { data: [...], totalCount: number }
          this.permissions = response.data.data || [];
          this.totalCount = response.data.totalCount || 0;
          
          console.log('Permisos cargados:', this.permissions.length); // Debug
          console.log('Total count:', this.totalCount); // Debug
        } else {
          this.permissions = [];
          this.totalCount = 0;
        }
      } catch (error) {
        console.error('Error al cargar permisos:', error);
        console.error('Error response:', error.response);
        console.error('Error config:', error.config);
        this.permissions = [];
        this.totalCount = 0;
        this.$store.commit('showSnackbar', {
          text: error.response?.data?.message || 'Error al cargar las pantallas',
          color: 'error',
        });
      } finally {
        this.loading = false;
      }
    },
    async loadRoles() {
      try {
        const response = await this.$http.get(
          `${process.env.VUE_APP_DEGIRA}roles`
        );
        if (response && response.data) {
          this.roles = response.data.data?.rows || response.data.data || [];
        }
      } catch (error) {
        console.error('Error al cargar roles:', error);
      }
    },
    debounceSearch() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.options.page = 1;
        this.loadPermissions();
      }, 500);
    },
    getRoleColor(id_role) {
      // Asignar colores distintos según el ID del rol
      const colors = {
        1: 'blue',      // CAJA
        2: 'green',     // BARMAN
        3: 'red',       // ADMIN (cambié de orange a red para diferenciarlo)
        4: 'purple',    // GUARDAROPA
        5: 'teal',      // CAJA_ESPECIAL
        6: 'cyan',      // BARMAN_SUPERV
      };
      return colors[id_role] || 'grey';
    },
    openCreateDialog() {
      this.editingPermission = false;
      this.permissionForm = {
        description: '',
        action: '',
        id_role: null,
        tag: '',
        icon: '',
        path: '',
        menu_available: 1,
        order: null,
      };
      this.permissionDialog = true;
    },
    editPermission(permission) {
      this.editingPermission = true;
      this.permissionForm = {
        description: permission.description || '',
        action: permission.action || '',
        id_role: permission.id_role || permission.role?.id_role || null,
        tag: permission.tag || '',
        icon: permission.icon || '',
        path: permission.path || '',
        menu_available: permission.menu_available == 1 ? 1 : 0,
        order: permission.order || null,
      };
      this.selectedPermission = permission;
      this.permissionDialog = true;
    },
    closePermissionDialog() {
      this.permissionDialog = false;
      this.$refs.permissionForm?.resetValidation();
    },
    async savePermission() {
      if (!this.$refs.permissionForm.validate()) return;

      try {
        const permissionData = {
          description: this.permissionForm.description,
          id_role: this.permissionForm.id_role,
          action: this.permissionForm.action || undefined,
          tag: this.permissionForm.tag || undefined,
          icon: this.permissionForm.icon || undefined,
          path: this.permissionForm.path || undefined,
          menu_available: this.permissionForm.menu_available,
          order: this.permissionForm.order || undefined,
        };

        if (this.editingPermission) {
          await this.$http.put(
            `${process.env.VUE_APP_DEGIRA}operations_types/${this.selectedPermission.id_operation_type}`,
            permissionData
          );
          this.$store.commit('showSnackbar', {
            text: 'Pantalla actualizada correctamente',
            color: 'success',
          });
        } else {
          await this.$http.post(
            `${process.env.VUE_APP_DEGIRA}operations_types`,
            permissionData
          );
          this.$store.commit('showSnackbar', {
            text: 'Pantalla creada correctamente',
            color: 'success',
          });
        }

        this.closePermissionDialog();
        this.loadPermissions();
        this.$root.$emit('refresh-roles');
      } catch (error) {
        console.error('Error al guardar pantalla:', error);
        this.$store.commit('showSnackbar', {
          text: error.response?.data?.message || 'Error al guardar la pantalla',
          color: 'error',
        });
      }
    },
    changeRole(permission) {
      this.selectedPermission = permission;
      this.newRoleId = permission.id_role || permission.role?.id_role || null;
      this.roleChangeDialog = true;
    },
    closeRoleChangeDialog() {
      this.roleChangeDialog = false;
      this.selectedPermission = null;
      this.newRoleId = null;
      this.savingRole = false;
    },
    async saveRoleChange() {
      if (!this.newRoleId) {
        this.$store.commit('showSnackbar', {
          text: 'Debe seleccionar un rol',
          color: 'warning',
        });
        return;
      }

      if (!this.selectedPermission) {
        this.$store.commit('showSnackbar', {
          text: 'Error: No hay pantalla seleccionada',
          color: 'error',
        });
        return;
      }

      this.savingRole = true;
      try {
        console.log('Cambiando rol:', {
          id_operation_type: this.selectedPermission.id_operation_type,
          newRoleId: this.newRoleId,
        });

        const response = await this.$http.put(
          `${process.env.VUE_APP_DEGIRA}operations_types/${this.selectedPermission.id_operation_type}/assign-role`,
          { id_role: this.newRoleId }
        );

        console.log('Respuesta del servidor:', response.data);

        this.$store.commit('showSnackbar', {
          text: 'Rol actualizado correctamente',
          color: 'success',
        });

        this.closeRoleChangeDialog();
        this.loadPermissions();
        this.$root.$emit('refresh-roles');
      } catch (error) {
        console.error('Error al cambiar rol:', error);
        console.error('Error response:', error.response);
        this.$store.commit('showSnackbar', {
          text: error.response?.data?.message || 'Error al cambiar el rol',
          color: 'error',
        });
      } finally {
        this.savingRole = false;
      }
    },
    confirmDelete(permission) {
      this.permissionToDelete = permission;
      this.deleteDialog = true;
    },
    async deletePermission() {
      try {
        await this.$http.delete(
          `${process.env.VUE_APP_DEGIRA}operations_types/${this.permissionToDelete.id_operation_type}`
        );

        this.$store.commit('showSnackbar', {
          text: 'Pantalla eliminada correctamente',
          color: 'success',
        });

        this.deleteDialog = false;
        this.permissionToDelete = null;
        this.loadPermissions();
      } catch (error) {
        console.error('Error al eliminar pantalla:', error);
        this.$store.commit('showSnackbar', {
          text: error.response?.data?.message || 'Error al eliminar la pantalla',
          color: 'error',
        });
      }
    },
  },
};
</script>

