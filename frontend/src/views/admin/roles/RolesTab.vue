<template>
  <div>
    <!-- Barra de búsqueda y acciones -->
    <v-row class="mb-4">
      <v-col cols="12" md="9">
        <v-text-field
          v-model="searchText"
          label="Buscar rol"
          outlined
          dense
          prepend-inner-icon="mdi-magnify"
          clearable
          @input="debounceSearch"
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="3" class="d-flex align-center">
        <v-btn
          color="primary"
          @click="openCreateDialog"
          block
        >
          <v-icon left>mdi-shield-plus</v-icon>
          Nuevo Rol
        </v-btn>
      </v-col>
    </v-row>

    <!-- Tabla de roles -->
    <v-card outlined>
      <v-data-table
        :headers="headers"
        :items="roles"
        :loading="loading"
        :server-items-length="totalCount"
        :options.sync="options"
        :footer-props="{
          'items-per-page-text': 'Roles por página',
          'items-per-page-all-text': 'Todos',
        }"
        @update:options="loadRoles"
      >
        <template v-slot:item.users_count="{ item }">
          <v-chip x-small color="blue" dark>
            {{ item.users_count || 0 }} usuarios
          </v-chip>
        </template>

        <template v-slot:item.operations_count="{ item }">
          <v-chip x-small color="green" dark>
            {{ item.operations_count || 0 }} pantallas
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn
            icon
            x-small
            color="primary"
            @click="editRole(item)"
          >
            <v-icon small>mdi-pencil</v-icon>
          </v-btn>
          <v-btn
            icon
            x-small
            color="orange"
            @click="viewDetails(item)"
          >
            <v-icon small>mdi-eye</v-icon>
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

    <!-- Dialog Crear/Editar Rol -->
    <v-dialog v-model="roleDialog" max-width="500px" persistent>
      <v-card>
        <v-card-title class="orange white--text">
          <span class="headline">{{ editingRole ? 'Editar Rol' : 'Nuevo Rol' }}</span>
          <v-spacer></v-spacer>
          <v-btn icon dark @click="closeRoleDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="pt-4">
          <v-form ref="roleForm">
            <v-text-field
              v-model="roleForm.description"
              label="Descripción del Rol"
              outlined
              dense
              :rules="[v => !!v || 'La descripción es requerida']"
            ></v-text-field>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeRoleDialog">Cancelar</v-btn>
          <v-btn color="orange" dark @click="saveRole">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Detalles del Rol -->
    <v-dialog v-model="detailsDialog" max-width="800px">
      <v-card v-if="selectedRole">
        <v-card-title class="orange white--text">
          <span class="headline">Detalles del Rol: {{ selectedRole.description }}</span>
          <v-spacer></v-spacer>
          <v-btn icon dark @click="detailsDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="pt-4">
          <v-tabs>
            <v-tab>Usuarios</v-tab>
            <v-tab>Pantallas</v-tab>
          </v-tabs>

          <v-tabs-items>
            <v-tab-item>
              <v-list v-if="roleUsers.length > 0" class="mt-4">
                <v-list-item
                  v-for="user in roleUsers"
                  :key="user.id_user"
                >
                  <v-list-item-content>
                    <v-list-item-title>{{ user.name }} {{ user.surname }}</v-list-item-title>
                    <v-list-item-subtitle>{{ user.username }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
              <v-alert v-else type="info" class="mt-4">
                No hay usuarios asignados a este rol
              </v-alert>
            </v-tab-item>

            <v-tab-item>
              <v-list v-if="roleOperations.length > 0" class="mt-4">
                <v-list-item
                  v-for="op in roleOperations"
                  :key="op.id_operation_type"
                >
                  <v-list-item-content>
                    <v-list-item-title>{{ op.description }}</v-list-item-title>
                    <v-list-item-subtitle>{{ op.path }}</v-list-item-subtitle>
                  </v-list-item-content>
                  <v-list-item-icon>
                    <v-icon>{{ op.icon }}</v-icon>
                  </v-list-item-icon>
                </v-list-item>
              </v-list>
              <v-alert v-else type="info" class="mt-4">
                No hay pantallas asignadas a este rol
              </v-alert>
            </v-tab-item>
          </v-tabs-items>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="detailsDialog = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Confirmar Eliminación -->
    <ModalConfirm
      :show="deleteDialog"
      title="Eliminar Rol"
      :message="`¿Está seguro de eliminar el rol ${roleToDelete?.description}?`"
      @confirm="deleteRole"
      @cancel="deleteDialog = false"
    />
  </div>
</template>

<script>
import ModalConfirm from '../../app/ModalConfirm.vue';

export default {
  name: 'RolesTab',
  components: {
    ModalConfirm,
  },
  data() {
    return {
      loading: false,
      searchText: '',
      roles: [],
      totalCount: 0,
      options: {
        page: 1,
        itemsPerPage: 10,
        sortBy: ['id_role'],
        sortDesc: [false],
      },
      headers: [
        { text: 'ID', value: 'id_role', width: '80px' },
        { text: 'Descripción', value: 'description' },
        { text: 'Usuarios', value: 'users_count', sortable: false, width: '120px' },
        { text: 'Pantallas', value: 'operations_count', sortable: false, width: '120px' },
        { text: 'Acciones', value: 'actions', sortable: false, width: '150px' },
      ],
      roleDialog: false,
      editingRole: false,
      roleForm: {
        description: '',
      },
      detailsDialog: false,
      selectedRole: null,
      roleUsers: [],
      roleOperations: [],
      deleteDialog: false,
      roleToDelete: null,
      searchTimeout: null,
    };
  },
  mounted() {
    this.loadRoles();
    this.$root.$on('refresh-roles', this.loadRoles);
  },
  beforeDestroy() {
    this.$root.$off('refresh-roles', this.loadRoles);
  },
  methods: {
    async loadRoles() {
      this.loading = true;
      try {
        const params = {
          page: this.options.page,
          pageSize: this.options.itemsPerPage,
          search: this.searchText || undefined,
        };

        const response = await this.$http.get(
          `${process.env.VUE_APP_DEGIRA}roles`,
          { params }
        );

        if (response && response.data) {
          const rolesData = response.data.data?.rows || response.data.data || [];
          // Enriquecer con conteos
          for (const role of rolesData) {
            try {
              const [usersRes, opsRes] = await Promise.all([
                this.$http.get(`${process.env.VUE_APP_DEGIRA}roles/${role.id_role}/users`),
                this.$http.get(`${process.env.VUE_APP_DEGIRA}roles/${role.id_role}/operations`),
              ]);
              role.users_count = usersRes.data?.data?.users?.length || 0;
              role.operations_count = opsRes.data?.data?.operations?.length || 0;
            } catch (e) {
              role.users_count = 0;
              role.operations_count = 0;
            }
          }
          this.roles = rolesData;
          this.totalCount = response.data.totalCount || response.data.count || 0;
        }
      } catch (error) {
        console.error('Error al cargar roles:', error);
        this.$store.commit('showSnackbar', {
          text: 'Error al cargar los roles',
          color: 'error',
        });
      } finally {
        this.loading = false;
      }
    },
    debounceSearch() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.options.page = 1;
        this.loadRoles();
      }, 500);
    },
    openCreateDialog() {
      this.editingRole = false;
      this.roleForm = {
        description: '',
      };
      this.roleDialog = true;
    },
    editRole(role) {
      this.editingRole = true;
      this.roleForm = {
        description: role.description,
      };
      this.roleDialog = true;
    },
    closeRoleDialog() {
      this.roleDialog = false;
      this.$refs.roleForm?.resetValidation();
    },
    async saveRole() {
      if (!this.$refs.roleForm.validate()) return;

      try {
        if (this.editingRole) {
          await this.$http.put(
            `${process.env.VUE_APP_DEGIRA}roles/${this.selectedRole?.id_role}`,
            this.roleForm
          );
          this.$store.commit('showSnackbar', {
            text: 'Rol actualizado correctamente',
            color: 'success',
          });
        } else {
          await this.$http.post(
            `${process.env.VUE_APP_DEGIRA}roles`,
            this.roleForm
          );
          this.$store.commit('showSnackbar', {
            text: 'Rol creado correctamente',
            color: 'success',
          });
        }

        this.closeRoleDialog();
        this.loadRoles();
        this.$root.$emit('refresh-roles');
      } catch (error) {
        console.error('Error al guardar rol:', error);
        this.$store.commit('showSnackbar', {
          text: error.response?.data?.message || 'Error al guardar el rol',
          color: 'error',
        });
      }
    },
    async viewDetails(role) {
      this.selectedRole = role;
      this.detailsDialog = true;

      try {
        const [usersRes, opsRes] = await Promise.all([
          this.$http.get(`${process.env.VUE_APP_DEGIRA}roles/${role.id_role}/users`),
          this.$http.get(`${process.env.VUE_APP_DEGIRA}roles/${role.id_role}/operations`),
        ]);

        this.roleUsers = usersRes.data?.data?.users || [];
        this.roleOperations = opsRes.data?.data?.operations || [];
      } catch (error) {
        console.error('Error al cargar detalles:', error);
        this.roleUsers = [];
        this.roleOperations = [];
      }
    },
    confirmDelete(role) {
      this.roleToDelete = role;
      this.deleteDialog = true;
    },
    async deleteRole() {
      try {
        await this.$http.delete(
          `${process.env.VUE_APP_DEGIRA}roles/${this.roleToDelete.id_role}`
        );

        this.$store.commit('showSnackbar', {
          text: 'Rol eliminado correctamente',
          color: 'success',
        });

        this.deleteDialog = false;
        this.roleToDelete = null;
        this.loadRoles();
        this.$root.$emit('refresh-roles');
      } catch (error) {
        console.error('Error al eliminar rol:', error);
        this.$store.commit('showSnackbar', {
          text: error.response?.data?.message || 'Error al eliminar el rol',
          color: 'error',
        });
      }
    },
  },
};
</script>


