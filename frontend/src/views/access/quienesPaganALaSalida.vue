<template>
    <div class="py-3 px-2">
        <v-card class="mb-4" elevation="2">
            <v-card-title class="orange white--text pa-4">
                <v-icon left>mdi-cash-clock</v-icon>
                QUIÉNES PAGAN A LA SALIDA
            </v-card-title>
            <v-card-subtitle class="pa-4 pt-0 grey--text">
                Socios que eligieron pagar la entrada a la salida y aún no pagaron.
            </v-card-subtitle>
        </v-card>

        <v-card v-if="loading" class="pa-8 text-center">
            <v-progress-circular indeterminate color="orange" size="48" class="mb-3"></v-progress-circular>
            <div class="text-body-2 grey--text">Cargando...</div>
        </v-card>

        <v-card v-else-if="errorMessage" class="pa-4">
            <v-alert type="error" dense outlined>{{ errorMessage }}</v-alert>
        </v-card>

        <v-card v-else-if="!rows || rows.length === 0" class="pa-8 text-center">
            <v-icon size="64" color="grey lighten-1" class="mb-3">mdi-check-circle-outline</v-icon>
            <div class="text-h6 grey--text">No hay socios con entrada pendiente de pago a la salida.</div>
        </v-card>

        <v-card v-else elevation="2">
            <v-data-table
                :headers="headers"
                :items="rows"
                :items-per-page="15"
                class="elevation-0"
                no-data-text="No hay datos"
            >
                <template v-slot:item.alias="{ item }">
                    <span class="font-weight-medium">{{ formatAlias(item.partner ? item.partner.alias : '') }}</span>
                </template>
                <template v-slot:item.id_bracelet_1="{ item }">
                    <v-chip small color="orange" text-color="white">{{ item.id_bracelet_1 || '—' }}</v-chip>
                </template>
                <template v-slot:item.hour_entry="{ item }">
                    {{ formateHour(item.hour_entry) }}
                </template>
                <template v-slot:item.pendiente_entrada="{ item }">
                    <span class="orange--text font-weight-bold">${{ item.pendiente_entrada || 0 }}</span>
                </template>
                <template v-slot:item.visit_type="{ item }">
                    {{ item.visit_type && item.visit_type.description ? item.visit_type.description : '—' }}
                </template>
                <template v-slot:item.actions="{ item }">
                    <v-btn
                        small
                        color="orange"
                        dark
                        @click="goToExit(item)"
                    >
                        <v-icon left small>mdi-exit-run</v-icon>
                        Ir a salida
                    </v-btn>
                </template>
            </v-data-table>
        </v-card>

        <v-row class="mt-4">
            <v-col cols="12">
                <v-btn outlined color="orange" @click="$router.push('/activeVisits')">
                    <v-icon left>mdi-arrow-left</v-icon>
                    Volver a Visitas Activas
                </v-btn>
            </v-col>
        </v-row>
    </div>
</template>

<script>
export default {
    name: 'QuienesPaganALaSalida',
    data() {
        return {
            loading: true,
            errorMessage: null,
            rows: [],
            count: 0,
            headers: [
                { text: 'Socio', value: 'alias', sortable: false },
                { text: 'Tarjeta', value: 'id_bracelet_1', sortable: false },
                { text: 'Hora entrada', value: 'hour_entry', sortable: false },
                { text: 'Monto pendiente (entrada)', value: 'pendiente_entrada', sortable: false },
                { text: 'Tipo visita', value: 'visit_type', sortable: false },
                { text: 'Acción', value: 'actions', sortable: false, align: 'center' },
            ],
        };
    },
    mounted() {
        this.load();
    },
    methods: {
        load() {
            this.loading = true;
            this.errorMessage = null;
            const base = process.env.VUE_APP_DEGIRA || '';
            this.$http.get(base + 'visits/paying-at-exit')
                .then((res) => {
                    if (res && res.data) {
                        // API devuelve { data: rows, totalCount: count }; rows es el array directo
                        const data = res.data.data;
                        this.rows = Array.isArray(data) ? data : [];
                        this.count = res.data.totalCount != null ? res.data.totalCount : this.rows.length;
                    } else {
                        this.rows = [];
                        this.count = 0;
                    }
                })
                .catch((err) => {
                    this.errorMessage = (err.response && err.response.data && err.response.data.message) || 'Error al cargar los datos.';
                    this.rows = [];
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        formatAlias(alias) {
            if (!alias) return '—';
            return String(alias).replace(/---/g, ' ');
        },
        formateHour(date) {
            if (date == null) return '—';
            const d = typeof date === 'string' ? date : (date && date.toISOString ? date.toISOString() : String(date));
            return this.$moment ? this.$moment(d).format('HH:mm') : d.substr(11, 5);
        },
        goToExit(visit) {
            if (!visit || !visit.id_visit) return;
            const partner = visit.partner ? { ...visit.partner } : {};
            partner.id_visit = visit.id_visit;
            partner.id_bracelet_1 = visit.id_bracelet_1;
            partner.id_bracelet_2 = visit.id_bracelet_2;
            partner.hour_entry = visit.hour_entry;
            partner.visit_date = visit.visit_date;
            partner.id_day = visit.id_day;
            partner.last_visit = visit.last_visit;
            partner.entry_amount_paid = visit.entry_amount_paid;
            partner.visit_amount_consumed = visit.visit_amount_consumed;
            partner.exit_amount_payed = visit.exit_amount_payed;
            partner.extra_entry = visit.extra_entry;
            partner.extra_exit = visit.extra_exit;
            partner.entry_visit_obs = visit.entry_visit_obs;
            partner.other_visit_obs = visit.other_visit_obs;
            partner.total = visit.visit_amount_consumed || 0;
            partner.pendiente_entrada = visit.pendiente_entrada;
            partner.es_pago_al_salir = visit.es_pago_al_salir;
            if (visit.visit_type) partner.visit_type = visit.visit_type;
            if (visit.state) partner.state = visit.state;
            this.$store.commit('setPartner', partner);
            this.$router.push('/exitRegister');
        },
    },
};
</script>
