<template>
  <v-card v-if="showStatus" elevation="2" class="mb-4">
    <v-card-title class="py-2">
      <v-icon :color="isOnline ? 'green' : 'red'" class="mr-2">
        {{ isOnline ? 'mdi-wifi' : 'mdi-wifi-off' }}
      </v-icon>
      <span class="text-body-1">
        Estado: {{ isOnline ? 'Online' : 'Offline' }}
      </span>
      <v-spacer></v-spacer>
      <v-btn
        v-if="pendingTickets > 0"
        small
        color="orange"
        dark
        @click="syncTickets"
        :loading="syncing"
      >
        <v-icon left small>mdi-sync</v-icon>
        Sincronizar ({{ pendingTickets }})
      </v-btn>
    </v-card-title>

    <v-card-text v-if="!isOnline || pendingTickets > 0" class="py-2">
      <v-row dense>
        <v-col cols="12" v-if="pendingTickets > 0">
          <v-alert type="info" dense outlined>
            <strong>{{ pendingTickets }}</strong> ticket(s) pendiente(s) de sincronizar
          </v-alert>
        </v-col>
        <v-col cols="12" v-if="!isOnline">
          <v-alert type="warning" dense outlined>
            Modo offline activo. Los tickets se guardarán localmente y se sincronizarán cuando vuelva la conexión.
          </v-alert>
        </v-col>
      </v-row>

      <v-divider class="my-2" v-if="syncMetadata.length > 0"></v-divider>

      <v-row dense v-if="syncMetadata.length > 0">
        <v-col cols="4" v-for="(meta, index) in syncMetadata" :key="index">
          <div class="text-caption text--secondary">{{ getResourceName(meta.resource_name) }}</div>
          <div class="text-body-2">
            {{ formatDate(meta.last_sync_date) || 'Nunca' }}
          </div>
        </v-col>
      </v-row>
    </v-card-text>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
      <template v-slot:action="{ attrs }">
        <v-btn text v-bind="attrs" @click="snackbar.show = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script>
import syncService from '../services/sync-service';
import { checkRemoteStatus } from '../middlewares/offline-interceptor';

export default {
  name: 'SyncStatus',
  data() {
    return {
      isOnline: true,
      pendingTickets: 0,
      syncMetadata: [],
      syncing: false,
      snackbar: {
        show: false,
        message: '',
        color: 'success',
      },
      checkInterval: null,
    };
  },
  computed: {
    showStatus() {
      return !this.isOnline || this.pendingTickets > 0 || this.syncMetadata.length > 0;
    },
  },
  mounted() {
    this.loadStatus();
    // Verificar estado cada 30 segundos
    this.checkInterval = setInterval(() => {
      this.checkOnlineStatus();
      this.loadStatus();
    }, 30000);
  },
  beforeDestroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  },
  methods: {
    async checkOnlineStatus() {
      this.isOnline = await checkRemoteStatus();
    },
    async loadStatus() {
      try {
        const result = await syncService.getSyncStatus();
        if (result.success && result.data) {
          this.pendingTickets = result.data.pending_tickets || 0;
          this.syncMetadata = result.data.sync_metadata || [];
        }
      } catch (error) {
        console.error('Error al cargar estado:', error);
      }
    },
    async syncTickets() {
      this.syncing = true;
      try {
        const result = await syncService.syncPendingTickets();
        if (result.success) {
          this.snackbar = {
            show: true,
            message: result.message || 'Tickets sincronizados exitosamente',
            color: 'success',
          };
          // Recargar estado
          await this.loadStatus();
        } else {
          this.snackbar = {
            show: true,
            message: result.message || 'Error al sincronizar tickets',
            color: 'error',
          };
        }
      } catch (error) {
        this.snackbar = {
          show: true,
          message: 'Error al sincronizar tickets',
          color: 'error',
        };
      } finally {
        this.syncing = false;
      }
    },
    formatDate(date) {
      if (!date) return null;
      const d = new Date(date);
      const now = new Date();
      const diffMs = now - d;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Hace menos de 1 min';
      if (diffMins < 60) return `Hace ${diffMins} min`;
      if (diffHours < 24) return `Hace ${diffHours} h`;
      if (diffDays < 7) return `Hace ${diffDays} días`;
      return d.toLocaleDateString('es-AR');
    },
    getResourceName(name) {
      const names = {
        partners: 'Partners',
        products_services: 'Products',
        visits: 'Visits',
      };
      return names[name] || name;
    },
  },
};
</script>

<style scoped>
.v-card {
  border-left: 4px solid orange;
}
</style>

