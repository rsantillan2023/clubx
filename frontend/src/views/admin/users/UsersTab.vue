<template>
  <div>
    <!-- Barra de búsqueda y acciones -->
    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <v-text-field
          v-model="searchText"
          label="Buscar usuario (nombre, apellido, username)"
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
          @change="loadUsers"
        ></v-select>
      </v-col>
      <v-col cols="12" md="3" class="d-flex align-center">
        <v-btn
          color="primary"
          @click="openCreateDialog"
          block
        >
          <v-icon left>mdi-account-plus</v-icon>
          Nuevo Usuario
        </v-btn>
      </v-col>
    </v-row>

    <!-- Tabla de usuarios -->
    <v-card outlined>
      <v-data-table
        :headers="headers"
        :items="users"
        :loading="loading"
        :server-items-length="totalCount"
        :options.sync="options"
        :footer-props="{
          'items-per-page-text': 'Usuarios por página',
          'items-per-page-all-text': 'Todos',
        }"
        @update:options="loadUsers"
      >
        <template v-slot:item.roles="{ item }">
          <v-chip
            v-for="role in item.roles"
            :key="role.id_role"
            x-small
            color="orange"
            dark
            class="mr-1 mb-1"
          >
            {{ role.description }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn
            icon
            x-small
            color="primary"
            @click="editUser(item)"
          >
            <v-icon small>mdi-pencil</v-icon>
          </v-btn>
          <v-btn
            icon
            x-small
            color="orange"
            @click="manageRoles(item)"
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

    <!-- Dialog Crear/Editar Usuario -->
    <v-dialog v-model="userDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title class="orange white--text">
          <span class="headline">{{ editingUser ? 'Editar Usuario' : 'Nuevo Usuario' }}</span>
          <v-spacer></v-spacer>
          <v-btn icon dark @click="closeUserDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="pt-4">
          <v-form ref="userForm">
            <v-text-field
              v-model="userForm.name"
              label="Nombre"
              outlined
              dense
              :rules="[v => !!v || 'El nombre es requerido']"
            ></v-text-field>

            <v-text-field
              v-model="userForm.surname"
              label="Apellido"
              outlined
              dense
              :rules="[v => !!v || 'El apellido es requerido']"
            ></v-text-field>

            <v-text-field
              v-model="userForm.username"
              label="Username"
              outlined
              dense
              :rules="[v => !!v || 'El username es requerido']"
            ></v-text-field>

            <v-text-field
              v-if="!editingUser"
              v-model="userForm.password"
              label="Contraseña"
              type="password"
              outlined
              dense
              :rules="[v => !!v || 'La contraseña es requerida', v => (v && v.length >= 8) || 'Mínimo 8 caracteres']"
            ></v-text-field>

            <v-text-field
              v-if="editingUser"
              v-model="userForm.password"
              label="Nueva Contraseña (dejar vacío para no cambiar)"
              type="password"
              outlined
              dense
              hint="Mínimo 8 caracteres"
            ></v-text-field>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeUserDialog">Cancelar</v-btn>
          <v-btn color="orange" dark @click="saveUser">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Gestión de Roles -->
    <v-dialog v-model="rolesDialog" max-width="500px" persistent>
      <v-card>
        <v-card-title class="orange white--text">
          <span class="headline">Gestionar Roles de {{ selectedUser?.name }} {{ selectedUser?.surname }}</span>
          <v-spacer></v-spacer>
          <v-btn icon dark @click="closeRolesDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="pt-4">
          <div v-if="roles.length === 0" class="text-center py-4">
            <v-progress-circular indeterminate color="orange"></v-progress-circular>
            <div class="mt-2">Cargando roles...</div>
          </div>
          <div v-else>
            <v-checkbox
              v-for="role in roles"
              :key="role.id_role"
              v-model="selectedRoles"
              :value="Number(role.id_role)"
              :label="`${role.description} (ID: ${role.id_role})`"
              color="orange"
              @change="onRoleCheckboxChange(role.id_role, $event)"
            ></v-checkbox>
            <v-alert v-if="selectedRoles.length === 0" type="warning" dense class="mt-2">
              No hay roles seleccionados
            </v-alert>
            <v-alert v-else type="info" dense class="mt-2">
              <strong>Roles seleccionados:</strong> {{ selectedRoles.length }}
              <div class="text-caption mt-1">
                IDs: {{ selectedRoles.join(', ') }}
              </div>
            </v-alert>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeRolesDialog">Cancelar</v-btn>
          <v-btn color="orange" dark @click="saveRoles">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Confirmar Eliminación -->
    <ModalConfirm
      :show="deleteDialog"
      title="Eliminar Usuario"
      :message="`¿Está seguro de eliminar al usuario ${userToDelete?.name} ${userToDelete?.surname}?`"
      @confirm="deleteUser"
      @cancel="deleteDialog = false"
    />
  </div>
</template>

<script>
import ModalConfirm from '../../app/ModalConfirm.vue';

export default {
  name: 'UsersTab',
  components: {
    ModalConfirm,
  },
  data() {
    return {
      loading: false,
      searchText: '',
      selectedRoleFilter: null,
      users: [],
      roles: [],
      totalCount: 0,
      options: {
        page: 1,
        itemsPerPage: 10,
        sortBy: ['id_user'],
        sortDesc: [false],
      },
      headers: [
        { text: 'ID', value: 'id_user', width: '80px' },
        { text: 'Nombre', value: 'name' },
        { text: 'Apellido', value: 'surname' },
        { text: 'Username', value: 'username' },
        { text: 'Roles', value: 'roles', sortable: false },
        { text: 'Acciones', value: 'actions', sortable: false, width: '150px' },
      ],
      userDialog: false,
      editingUser: false,
      userForm: {
        name: '',
        surname: '',
        username: '',
        password: '',
      },
      rolesDialog: false,
      selectedUser: null,
      selectedRoles: [], // Array de números (id_role)
      deleteDialog: false,
      userToDelete: null,
      searchTimeout: null,
    };
  },
  watch: {
    selectedRoles: {
      handler(newVal, oldVal) {
        // Solo validar si el diálogo está abierto para evitar interferencias al cerrar
        if (!this.rolesDialog) {
          return; // No hacer nada si el diálogo está cerrado
        }
        
        console.log('=== WATCHER selectedRoles (diálogo abierto) ===');
        console.log('Valor anterior:', oldVal);
        console.log('Valor nuevo:', newVal);
        
        // Validar que solo contenga roles válidos
        if (Array.isArray(newVal) && this.roles.length > 0) {
          const validRoleIds = this.roles.map(r => Number(r.id_role));
          const invalidRoles = newVal.filter(r => !validRoleIds.includes(Number(r)));
          
          if (invalidRoles.length > 0) {
            console.warn('Roles inválidos detectados en selectedRoles:', invalidRoles);
            // Filtrar roles inválidos
            this.$nextTick(() => {
              const filtered = newVal.filter(r => validRoleIds.includes(Number(r)));
              console.log('Filtrando roles inválidos. Nuevo valor:', filtered);
              this.selectedRoles = filtered;
            });
          } else {
            console.log('Todos los roles son válidos');
          }
        }
      },
      deep: true,
      immediate: false,
    },
  },
  mounted() {
    this.loadUsers();
    this.loadRoles();
    this.$root.$on('refresh-users', this.loadUsers);
  },
  beforeDestroy() {
    this.$root.$off('refresh-users', this.loadUsers);
  },
  methods: {
    async loadUsers() {
      this.loading = true;
      try {
        const params = {
          page: this.options.page,
          pageSize: this.options.itemsPerPage,
          search: this.searchText || undefined,
          roleId: this.selectedRoleFilter || undefined,
        };

        const response = await this.$http.get(
          `${process.env.VUE_APP_DEGIRA}users`,
          { params }
        );

        if (response && response.data) {
          this.users = response.data.data?.rows || response.data.data || [];
          this.totalCount = response.data.totalCount || response.data.count || 0;
          
          // Debug: Verificar roles de usuarios después de cargar
          console.log('=== USUARIOS CARGADOS ===');
          this.users.forEach((user) => {
            if (user.roles && user.roles.length > 0) {
              const rolesInfo = user.roles.map((r) => ({ id: r.id_role, desc: r.description }));
              console.log(`Usuario ${user.username} (ID: ${user.id_user}) tiene roles:`, rolesInfo);
              // Log detallado para el usuario admin específicamente
              if (user.id_user === 104) {
                console.log(`>>> USUARIO ADMIN (104) - Roles detallados:`, JSON.stringify(rolesInfo, null, 2));
              }
            }
          });
        }
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        this.$store.commit('showSnackbar', {
          text: 'Error al cargar los usuarios',
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
          console.log('Roles disponibles:', this.roles.map(r => ({ id: r.id_role, desc: r.description }))); // Debug
        }
      } catch (error) {
        console.error('Error al cargar roles:', error);
      }
    },
    debounceSearch() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.options.page = 1;
        this.loadUsers();
      }, 500);
    },
    openCreateDialog() {
      this.editingUser = false;
      this.userForm = {
        name: '',
        surname: '',
        username: '',
        password: '',
      };
      this.userDialog = true;
    },
    editUser(user) {
      this.editingUser = true;
      this.userForm = {
        name: user.name,
        surname: user.surname,
        username: user.username,
        password: '',
      };
      this.userDialog = true;
    },
    closeUserDialog() {
      this.userDialog = false;
      this.$refs.userForm?.resetValidation();
    },
    async saveUser() {
      if (!this.$refs.userForm.validate()) return;

      try {
        const userData = {
          name: this.userForm.name,
          surname: this.userForm.surname,
          username: this.userForm.username,
        };

        if (this.userForm.password) {
          userData.password = this.userForm.password;
        }

        if (this.editingUser) {
          await this.$http.put(
            `${process.env.VUE_APP_DEGIRA}users/${this.users.find(u => u.username === this.userForm.username)?.id_user}`,
            userData
          );
          this.$store.commit('showSnackbar', {
            text: 'Usuario actualizado correctamente',
            color: 'success',
          });
        } else {
          await this.$http.post(
            `${process.env.VUE_APP_DEGIRA}users`,
            userData
          );
          this.$store.commit('showSnackbar', {
            text: 'Usuario creado correctamente',
            color: 'success',
          });
        }

        this.closeUserDialog();
        this.loadUsers();
      } catch (error) {
        console.error('Error al guardar usuario:', error);
        this.$store.commit('showSnackbar', {
          text: error.response?.data?.message || 'Error al guardar el usuario',
          color: 'error',
        });
      }
    },
    manageRoles(user) {
      this.selectedUser = user;
      
      // Obtener IDs de roles válidos disponibles
      const validRoleIds = this.roles.map(r => Number(r.id_role));
      
      // Extraer IDs de roles del usuario y filtrar solo los válidos
      const userRoleIds = (user.roles || [])
        .map(r => {
          const roleId = Number(r.id_role);
          return roleId;
        })
        .filter(id => {
          const isValid = !isNaN(id) && id > 0 && validRoleIds.includes(id);
          if (!isValid) {
            console.warn(`Rol inválido ${id} será ignorado para el usuario ${user.username}`);
          }
          return isValid;
        });
      
      // Inicializar selectedRoles solo con roles válidos
      this.selectedRoles = [...userRoleIds];
      
      console.log('=== ABRIENDO DIÁLOGO DE ROLES ===');
      console.log('Usuario:', user.username);
      console.log('Roles del usuario (raw):', user.roles);
      console.log('Roles válidos disponibles:', validRoleIds);
      console.log('Roles iniciales del usuario (IDs):', userRoleIds);
      console.log('Roles seleccionados (filtrados):', this.selectedRoles);
      
      this.rolesDialog = true;
    },
    onRoleCheckboxChange(roleId, checked) {
      console.log('=== CHECKBOX CAMBIADO ===');
      console.log('Rol ID:', roleId);
      console.log('Checked:', checked);
      console.log('selectedRoles actual:', JSON.parse(JSON.stringify(this.selectedRoles)));
    },
    closeRolesDialog() {
      this.rolesDialog = false;
      this.selectedUser = null;
      this.selectedRoles = [];
    },
    async saveRoles() {
      if (!this.selectedUser) {
        this.$store.commit('showSnackbar', {
          text: 'Error: No hay usuario seleccionado',
          color: 'error',
        });
        return;
      }

      console.log('=== GUARDANDO ROLES ==='); // Debug
      console.log('Usuario ID:', this.selectedUser.id_user); // Debug
      console.log('Usuario:', this.selectedUser.username); // Debug
      
      // Capturar selectedRoles de forma segura
      let selectedRolesArray = [];
      try {
        // Intentar múltiples formas de obtener el valor
        if (Array.isArray(this.selectedRoles)) {
          selectedRolesArray = [...this.selectedRoles];
        } else if (this.selectedRoles && typeof this.selectedRoles === 'object') {
          selectedRolesArray = Object.values(this.selectedRoles).filter(v => typeof v === 'number');
        }
        
        // Si aún está vacío, intentar con JSON
        if (selectedRolesArray.length === 0) {
          const parsed = JSON.parse(JSON.stringify(this.selectedRoles));
          if (Array.isArray(parsed)) {
            selectedRolesArray = parsed;
          }
        }
      } catch (e) {
        console.error('Error al parsear selectedRoles:', e);
        selectedRolesArray = [];
      }
      
      console.log('selectedRoles (raw):', this.selectedRoles); // Debug
      console.log('selectedRoles (array procesado):', selectedRolesArray); // Debug
      
      // Asegurar que selectedRoles sea un array de números válidos
      const rolesToSave = selectedRolesArray
        .map(r => Number(r))
        .filter(r => !isNaN(r) && r > 0)
        .filter(r => {
          // Validar que el rol existe en la lista de roles disponibles
          const exists = this.roles.some(role => Number(role.id_role) === r);
          if (!exists) {
            console.warn(`Rol ${r} no existe en la lista de roles disponibles`);
          }
          return exists;
        });
      
      console.log('rolesToSave (filtrados y validados):', rolesToSave); // Debug
      console.log('Roles disponibles:', this.roles.map(r => ({ id: r.id_role, desc: r.description }))); // Debug
      
      // Verificación crítica: asegurar que rolesToSave no esté vacío y tenga valores válidos
      if (rolesToSave.length === 0) {
        console.error('ERROR CRÍTICO: rolesToSave está vacío después del filtrado!');
        console.error('selectedRoles original:', this.selectedRoles);
        console.error('selectedRoles array procesado:', selectedRolesArray);
        console.error('Tipo de selectedRoles:', typeof this.selectedRoles);
        console.error('Es array?:', Array.isArray(this.selectedRoles));
      }

      if (rolesToSave.length === 0) {
        this.$store.commit('showSnackbar', {
          text: 'Debe seleccionar al menos un rol válido',
          color: 'warning',
        });
        return;
      }

      try {
        console.log('=== ANTES DE ENVIAR AL SERVIDOR ===');
        console.log('selectedRoles actual:', JSON.parse(JSON.stringify(this.selectedRoles)));
        console.log('selectedRoles (tipo):', typeof this.selectedRoles, Array.isArray(this.selectedRoles));
        console.log('selectedRoles (longitud):', this.selectedRoles?.length);
        console.log('rolesToSave final:', rolesToSave);
        console.log('rolesToSave (tipo):', typeof rolesToSave, Array.isArray(rolesToSave));
        console.log('rolesToSave (longitud):', rolesToSave?.length);
        console.log('Usuario ID:', this.selectedUser.id_user);
        
        // Crear el body explícitamente para asegurar que sea correcto
        const requestId = Date.now();
        const requestBody = { roles: rolesToSave };
        
        console.log('=== ENVIANDO REQUEST ===');
        console.log('Request ID:', requestId);
        console.log('Timestamp:', new Date().toISOString());
        console.log('URL:', `${process.env.VUE_APP_DEGIRA}users/${this.selectedUser.id_user}/roles`);
        console.log('Body (objeto):', requestBody);
        console.log('Body (JSON stringify):', JSON.stringify(requestBody));
        console.log('rolesToSave (array):', rolesToSave);
        console.log('rolesToSave (tipo):', typeof rolesToSave, Array.isArray(rolesToSave));
        console.log('rolesToSave (longitud):', rolesToSave.length);
        console.log('rolesToSave[0]:', rolesToSave[0], 'tipo:', typeof rolesToSave[0]);
        console.log('rolesToSave (verificación completa):', JSON.stringify(rolesToSave));

        const response = await this.$http.post(
          `${process.env.VUE_APP_DEGIRA}users/${this.selectedUser.id_user}/roles`,
          requestBody,
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Request-ID': requestId.toString()
            }
          }
        );
        
        console.log('=== REQUEST COMPLETADO ===');
        console.log('Request ID:', requestId);
        console.log('Response recibida');

        console.log('Respuesta del servidor:', response.data); // Debug
        console.log('Roles asignados en respuesta:', response.data.data); // Debug
        
        // Verificar qué roles se asignaron realmente
        if (response.data.data && Array.isArray(response.data.data)) {
          const rolesDetalle = response.data.data.map((r) => ({
            id: r.id_role,
            desc: r.description
          }));
          console.log('Roles asignados (detalle):', rolesDetalle);
          console.log('Primer rol asignado:', rolesDetalle[0]);
        }

        this.$store.commit('showSnackbar', {
          text: 'Roles actualizados correctamente',
          color: 'success',
        });

        this.closeRolesDialog();
        // Esperar un momento antes de recargar para que el backend procese
        setTimeout(() => {
          console.log('Recargando lista de usuarios...');
          this.loadUsers();
        }, 500);
        this.$root.$emit('refresh-roles');
      } catch (error) {
        console.error('Error al guardar roles:', error);
        console.error('Error response:', error.response);
        console.error('Error config:', error.config);
        this.$store.commit('showSnackbar', {
          text: error.response?.data?.message || 'Error al guardar los roles',
          color: 'error',
        });
      }
    },
    confirmDelete(user) {
      this.userToDelete = user;
      this.deleteDialog = true;
    },
    async deleteUser() {
      try {
        await this.$http.delete(
          `${process.env.VUE_APP_DEGIRA}users/${this.userToDelete.id_user}`
        );

        this.$store.commit('showSnackbar', {
          text: 'Usuario eliminado correctamente',
          color: 'success',
        });

        this.deleteDialog = false;
        this.userToDelete = null;
        this.loadUsers();
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        this.$store.commit('showSnackbar', {
          text: error.response?.data?.message || 'Error al eliminar el usuario',
          color: 'error',
        });
      }
    },
  },
};
</script>

