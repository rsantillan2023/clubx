<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h2 class="orange--text mb-4">
          <v-icon color="orange" class="mr-2">mdi-account-cog</v-icon>
          Gestión de Usuarios, Roles y Permisos
        </h2>
      </v-col>
    </v-row>

    <v-tabs v-model="activeTab" color="orange" class="mb-4">
      <v-tab>
        <v-icon left>mdi-account-group</v-icon>
        Usuarios
      </v-tab>
      <v-tab>
        <v-icon left>mdi-shield-account</v-icon>
        Roles
      </v-tab>
      <v-tab>
        <v-icon left>mdi-view-dashboard</v-icon>
        Pantallas/Permisos
      </v-tab>
    </v-tabs>

    <v-tabs-items v-model="activeTab">
      <!-- TAB USUARIOS -->
      <v-tab-item>
        <UsersTab @refresh-roles="loadRoles" />
      </v-tab-item>

      <!-- TAB ROLES -->
      <v-tab-item>
        <RolesTab @refresh-users="loadUsers" />
      </v-tab-item>

      <!-- TAB PERMISOS -->
      <v-tab-item>
        <PermissionsTab @refresh-roles="loadRoles" />
      </v-tab-item>
    </v-tabs-items>
  </v-container>
</template>

<script>
import UsersTab from './users/UsersTab.vue';
import RolesTab from './roles/RolesTab.vue';
import PermissionsTab from './permissions/PermissionsTab.vue';

export default {
  name: 'UsersManagement',
  components: {
    UsersTab,
    RolesTab,
    PermissionsTab,
  },
  data() {
    return {
      activeTab: 0,
    };
  },
  methods: {
    loadRoles() {
      // Evento para recargar roles en otros componentes
      this.$root.$emit('refresh-roles');
    },
    loadUsers() {
      // Evento para recargar usuarios en otros componentes
      this.$root.$emit('refresh-users');
    },
  },
};
</script>

<style scoped>
.v-tabs {
  border-bottom: 2px solid rgba(0, 0, 0, 0.12);
}
</style>


