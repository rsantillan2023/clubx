<template>
    <div class="py-3 px-2">
        <!-- Título y filtros principales -->
        <v-card class="mb-4" elevation="1" style="border-radius: 12px;">
            <v-card-title class="orange darken-2 white--text">
                <v-icon left color="white">mdi-cash-multiple</v-icon>
                Consumos por Visita
            </v-card-title>
            <v-card-text class="pa-4">
                <v-row align="center">
                    <!-- Selector de fecha -->
                    <v-col cols="12" md="4">
                        <v-menu
                            ref="menu"
                            v-model="menu"
                            :close-on-content-click="false"
                            :return-value.sync="selectedDate"
                            transition="scale-transition"
                            offset-y
                            min-width="290px"
                        >
                            <template v-slot:activator="{ on, attrs }">
                                <v-text-field
                                    :value="formattedDate"
                                    label="Fecha de Visita"
                                    placeholder="Seleccionar fecha"
                                    readonly
                                    filled
                                    rounded
                                    dense
                                    v-bind="attrs"
                                    v-on="on"
                                    @click="menu = true"
                                    prepend-inner-icon="mdi-calendar"
                                ></v-text-field>
                            </template>
                            <v-date-picker
                                v-model="selectedDate"
                                no-title
                                scrollable
                                locale="es-AR"
                                color="orange"
                                :events="dateEvents"
                                event-color="green"
                                @input="onDateSelected"
                            >
                                <v-spacer></v-spacer>
                                <v-btn text color="grey" @click="menu = false">Cancelar</v-btn>
                                <v-btn text color="orange" @click="onDateChange">Aceptar</v-btn>
                            </v-date-picker>
                        </v-menu>
                    </v-col>

                    <!-- Búsqueda general -->
                    <v-col cols="12" md="4">
                        <v-text-field
                            v-model="searchText"
                            label="Buscar por socio, DNI o tarjeta"
                            filled
                            rounded
                            dense
                            clearable
                            prepend-inner-icon="mdi-magnify"
                            @keyup.enter="getVisits"
                            @click:clear="getVisits"
                        ></v-text-field>
                    </v-col>

                    <!-- Filtro por número de tarjeta -->
                    <v-col cols="12" md="4">
                        <v-text-field
                            v-model="braceletNumber"
                            label="Número de Tarjeta"
                            filled
                            rounded
                            dense
                            clearable
                            prepend-inner-icon="mdi-card-account-details"
                            @keyup.enter="getVisits"
                            @click:clear="getVisits"
                        ></v-text-field>
                    </v-col>
                </v-row>

                <!-- Botones de acción -->
                <v-row class="mt-2">
                    <v-col cols="12" class="d-flex justify-end">
                        <v-btn
                            color="orange"
                            dark
                            rounded
                            @click="getVisits"
                            :loading="load"
                            class="mr-2"
                            elevation="2"
                        >
                            <v-icon left>mdi-reload</v-icon>
                            Actualizar
                        </v-btn>
                        <v-btn
                            color="green"
                            dark
                            rounded
                            @click="exportToExcel"
                            :loading="loadExcel"
                            elevation="2"
                        >
                            <v-icon left>mdi-file-excel</v-icon>
                            Exportar XLS
                        </v-btn>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <!-- Grilla de datos -->
        <v-card elevation="1" style="border-radius: 12px;">
            <v-data-table
                :headers="headers"
                :items="items"
                :loading="load"
                :options.sync="options"
                :server-items-length="totalItems"
                class="elevation-0"
                :footer-props="{
                    'items-per-page-options': [10, 25, 50, 100],
                    'items-per-page-text': 'Registros por página:',
                    'show-first-last-page': true,
                    'show-current-page': true
                }"
            >
                <!-- Columna: Socio -->
                <template v-slot:item.partner="{ item }">
                    <div v-if="item.partner" class="compact-cell">
                        <div class="text-body-2 font-weight-medium">{{ item.partner.partner_name || 'N/A' }}</div>
                        <div class="text-caption grey--text">{{ item.partner.alias || '' }}</div>
                    </div>
                    <span v-else class="grey--text text-body-2">N/A</span>
                </template>

                <!-- Columna: Tarjeta -->
                <template v-slot:item.id_bracelet_1="{ item }">
                    <v-chip x-small color="blue" text-color="white">
                        {{ item.id_bracelet_1 || 'N/A' }}
                    </v-chip>
                </template>

                <!-- Columna: Fecha/Hora Entrada -->
                <template v-slot:item.hour_entry="{ item }">
                    <div v-if="item.hour_entry" class="compact-cell">
                        <div class="text-body-2">{{ formatDate(item.hour_entry) }}</div>
                        <div class="text-caption grey--text">{{ formatTime(item.hour_entry) }}</div>
                    </div>
                    <span v-else class="grey--text text-body-2">N/A</span>
                </template>

                <!-- Columna: Fecha/Hora Salida -->
                <template v-slot:item.hour_exit="{ item }">
                    <div v-if="item.hour_exit" class="compact-cell">
                        <div class="text-body-2">{{ formatDate(item.hour_exit) }}</div>
                        <div class="text-caption grey--text">{{ formatTime(item.hour_exit) }}</div>
                    </div>
                    <span v-else class="grey--text text-caption">En club</span>
                </template>

                <!-- Columna: Tiempo en el Club -->
                <template v-slot:item.time_in_club="{ item }">
                    <div v-if="item.hour_entry">
                        <v-chip 
                            x-small 
                            :color="getTimeInClubColor(item)" 
                            text-color="white"
                            class="font-weight-bold">
                            {{ calculateTimeInClub(item) }}
                        </v-chip>
                    </div>
                    <span v-else class="grey--text text-caption">N/A</span>
                </template>

                <!-- Columna: Pago Entrada -->
                <template v-slot:item.entry_amount_paid="{ item }">
                    <span class="text-body-2 font-weight-medium green--text">
                        ${{ formatNumber(item.entry_amount_paid || 0) }}
                    </span>
                </template>

                <!-- Columna: Extra Entrada -->
                <template v-slot:item.extra_entry="{ item }">
                    <div v-if="item.extra_entry && item.extra_entry > 0" class="text-center">
                        <v-tooltip bottom>
                            <template v-slot:activator="{ on, attrs }">
                                <span 
                                    class="text-caption font-weight-medium orange--text"
                                    v-bind="attrs"
                                    v-on="on"
                                >
                                    ${{ formatNumber(item.extra_entry) }}
                                </span>
                            </template>
                            <span>{{ item.extra_entry_obs || 'Sin observaciones' }}</span>
                        </v-tooltip>
                    </div>
                    <span v-else class="grey--text text-caption">$0</span>
                </template>

                <!-- Columna: Consumos -->
                <template v-slot:item.visit_amount_consumed="{ item }">
                    <span class="text-body-2 font-weight-medium blue--text">
                        ${{ formatNumber(item.visit_amount_consumed || 0) }}
                    </span>
                </template>

                <!-- Columna: Pago Salida -->
                <template v-slot:item.exit_amount_payed="{ item }">
                    <span class="text-body-2 font-weight-medium purple--text">
                        ${{ formatNumber(item.exit_amount_payed || 0) }}
                    </span>
                </template>

                <!-- Columna: Extra Salida -->
                <template v-slot:item.extra_exit="{ item }">
                    <div v-if="item.extra_exit && item.extra_exit > 0" class="text-center">
                        <v-tooltip bottom>
                            <template v-slot:activator="{ on, attrs }">
                                <span 
                                    class="text-caption font-weight-medium red--text"
                                    v-bind="attrs"
                                    v-on="on"
                                >
                                    ${{ formatNumber(item.extra_exit) }}
                                </span>
                            </template>
                            <span>{{ item.extra_exit_obs || 'Sin observaciones' }}</span>
                        </v-tooltip>
                    </div>
                    <span v-else class="grey--text text-caption">$0</span>
                </template>

                <!-- Columna: Total -->
                <template v-slot:item.total="{ item }">
                    <span class="text-body-1 font-weight-bold orange--text">
                        ${{ formatNumber(calculateTotal(item)) }}
                    </span>
                </template>

                <!-- Columna: Tipo Visita -->
                <template v-slot:item.visit_type="{ item }">
                    <v-chip 
                        x-small 
                        :color="getVisitTypeColor(item.visit_type?.id_visit_type)"
                        text-color="white"
                    >
                        {{ item.visit_type?.description || 'N/A' }}
                    </v-chip>
                </template>

                <!-- Columna: Acciones -->
                <template v-slot:item.actions="{ item }">
                    <v-tooltip bottom>
                        <template v-slot:activator="{ on, attrs }">
                            <v-btn
                                icon
                                small
                                color="orange"
                                v-bind="attrs"
                                v-on="on"
                                @click="goToConsumed(item)"
                            >
                                <v-icon small>mdi-cash-register</v-icon>
                            </v-btn>
                        </template>
                        <span>Ver consumos del socio</span>
                    </v-tooltip>
                </template>

                <!-- Sin datos -->
                <template v-slot:no-data>
                    <div class="text-center py-8">
                        <v-icon size="64" color="grey lighten-1">mdi-database-off</v-icon>
                        <p class="mt-4 grey--text">No hay datos disponibles</p>
                        <p class="text-caption grey--text">Seleccione una fecha para ver las visitas</p>
                    </div>
                </template>
            </v-data-table>
        </v-card>
    </div>
</template>

<script>
import exportFromJSON from 'export-from-json';

export default {
    name: 'VisitsConsumptions',
    data: () => ({
        load: false,
        loadExcel: false,
        items: [],
        searchText: '',
        braceletNumber: '',
        selectedDate: null,
        menu: false,
        datesWithConsumptions: [],
        // Variable para mantener la fecha seleccionada de forma estable
        savedSelectedDate: null,
        options: {
            sortBy: ['hour_entry'],
            sortDesc: [true],
            page: 1,
            itemsPerPage: 50,
        },
        totalItems: 0,
        headers: [
            { text: 'Socio', value: 'partner', sortable: false, width: '140px' },
            { text: 'Tarjeta', value: 'id_bracelet_1', sortable: false, width: '75px' },
            { text: 'Entrada', value: 'hour_entry', sortable: true, width: '100px' },
            { text: 'Salida', value: 'hour_exit', sortable: true, width: '100px' },
            { text: 'Tiempo', value: 'time_in_club', sortable: false, width: '85px', align: 'center' },
            { text: 'P. Entrada', value: 'entry_amount_paid', sortable: true, width: '95px', align: 'right' },
            { text: 'Ext. Ent.', value: 'extra_entry', sortable: true, width: '65px', align: 'right' },
            { text: 'Consumos', value: 'visit_amount_consumed', sortable: true, width: '95px', align: 'right' },
            { text: 'P. Salida', value: 'exit_amount_payed', sortable: true, width: '95px', align: 'right' },
            { text: 'Ext. Sal.', value: 'extra_exit', sortable: true, width: '65px', align: 'right' },
            { text: 'Total', value: 'total', sortable: true, width: '95px', align: 'right' },
            { text: 'Tipo', value: 'visit_type', sortable: false, width: '75px' },
            { text: 'Acciones', value: 'actions', sortable: false, width: '55px', align: 'center' },
        ],
    }),
    computed: {
        formattedDate() {
            if (!this.selectedDate) return '';
            return this.$moment(this.selectedDate).format('DD/MM/YYYY');
        },
        dateEvents() {
            // Crear un objeto donde las fechas con consumos tienen valor true
            const events = {};
            this.datesWithConsumptions.forEach(date => {
                events[date] = true;
            });
            return events;
        },
    },
    methods: {
        onDateSelected(date) {
            // Se ejecuta cuando se selecciona una fecha en el date picker
            // No hacer nada aquí, solo actualizar cuando se confirme
            console.log('onDateSelected - Fecha seleccionada:', date);
        },
        onDateChange() {
            console.log('onDateChange - Fecha confirmada:', this.selectedDate);
            this.menu = false;
            if (this.selectedDate) {
                // Guardar la fecha seleccionada de forma estable
                this.savedSelectedDate = this.selectedDate;
                // Resetear la página a 1 cuando cambia la fecha
                this.options.page = 1;
                this.getVisits();
            }
        },
        async getVisits() {
            // Usar savedSelectedDate si está disponible, sino selectedDate
            const dateToUse = this.savedSelectedDate || this.selectedDate;
            
            if (!dateToUse) {
                this.$toast?.error('Por favor seleccione una fecha');
                return;
            }

            this.load = true;

            // Guardar TODOS los valores actuales para evitar que cambien durante la llamada
            // Usar savedSelectedDate para la fecha para evitar que se resetee
            const currentDate = dateToUse;
            const currentSearchText = this.searchText || '';
            const currentBraceletNumber = this.braceletNumber || '';
            
            // Si selectedDate cambió pero tenemos savedSelectedDate, restaurarlo
            if (this.savedSelectedDate && this.selectedDate !== this.savedSelectedDate) {
                console.warn('selectedDate cambió durante getVisits, restaurando:', this.savedSelectedDate);
                this.selectedDate = this.savedSelectedDate;
            }

            const params = {
                page: this.options.page || 1,
                pageSize: this.options.itemsPerPage || 50,
                sortBy: (this.options.sortBy && this.options.sortBy.length > 0) ? this.options.sortBy[0] : 'hour_entry',
                sortDesc: (this.options.sortDesc && this.options.sortDesc.length > 0) ? this.options.sortDesc[0] !== false : true,
                date: currentDate, // Usar la fecha guardada
            };
            
            // SIEMPRE incluir los filtros, incluso si están vacíos (para mantener el estado)
            if (currentSearchText) {
                params.search = currentSearchText;
            }

            if (currentBraceletNumber) {
                params.bracelet_number = currentBraceletNumber;
            }
            
            console.log('getVisits - Params enviados (con filtros):', params);

            try {
                const response = await this.$http.get(
                    process.env.VUE_APP_DEGIRA + 'partners/visits-consumptions',
                    { params }
                );

                if (response && response.data) {
                    this.items = response.data.data || [];
                    this.totalItems = response.data.totalCount || 0;
                }
            } catch (error) {
                console.error('Error al cargar visitas:', error);
                console.error('Error response:', error.response);
                console.error('Params enviados:', params);
                const errorMessage = error.response?.data?.message || error.message || 'Error al cargar las visitas';
                this.$toast?.error(errorMessage);
                this.items = [];
                this.totalItems = 0;
            } finally {
                this.load = false;
            }
        },
        formatNumber(num) {
            if (!num && num !== 0) return '0';
            return num.toLocaleString('es-AR', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            });
        },
        formatDate(dateString) {
            if (!dateString) return 'N/A';
            return this.$moment(dateString).format('DD/MM/YYYY');
        },
        formatTime(dateString) {
            if (!dateString) return 'N/A';
            // Ajustar hora a UTC-3 (Argentina)
            // Si la fecha viene en UTC, restamos 3 horas
            // Parsear la fecha y restar 3 horas para convertir a hora local de Argentina
            const momentDate = this.$moment.utc(dateString);
            // Restar 3 horas para convertir de UTC a UTC-3 (Argentina)
            const adjustedDate = momentDate.subtract(3, 'hours');
            return adjustedDate.format('HH:mm');
        },
        calculateTimeInClub(item) {
            if (!item.hour_entry) return 'N/A';
            
            const entryTime = this.$moment.utc(item.hour_entry).subtract(3, 'hours');
            const exitTime = item.hour_exit 
                ? this.$moment.utc(item.hour_exit).subtract(3, 'hours')
                : this.$moment(); // Si no hay salida, usar hora actual
            
            const duration = this.$moment.duration(exitTime.diff(entryTime));
            
            const hours = Math.floor(duration.asHours());
            const minutes = duration.minutes();
            
            if (hours > 0) {
                return `${hours}h ${minutes}m`;
            } else {
                return `${minutes}m`;
            }
        },
        getTimeInClubColor(item) {
            if (!item.hour_entry) return 'grey';
            
            const entryTime = this.$moment.utc(item.hour_entry).subtract(3, 'hours');
            const exitTime = item.hour_exit 
                ? this.$moment.utc(item.hour_exit).subtract(3, 'hours')
                : this.$moment();
            
            const duration = this.$moment.duration(exitTime.diff(entryTime));
            const hours = duration.asHours();
            
            // Colores según el tiempo en el club
            if (hours < 1) return 'green';      // Menos de 1 hora
            if (hours < 3) return 'blue';        // Entre 1 y 3 horas
            if (hours < 6) return 'orange';      // Entre 3 y 6 horas
            return 'red';                        // Más de 6 horas
        },
        calculateTotal(item) {
            const entry = Number(item.entry_amount_paid || 0);
            const extraEntry = Number(item.extra_entry || 0);
            const consumos = Number(item.visit_amount_consumed || 0);
            const exit = Number(item.exit_amount_payed || 0);
            const extraExit = Number(item.extra_exit || 0);
            return entry + extraEntry + consumos + exit + extraExit;
        },
        getVisitTypeColor(id) {
            const colors = {
                1: 'blue',      // SOLO
                2: 'purple',    // PAREJA
                3: 'green',     // OTRO
                4: 'pink',      // SOLA
            };
            return colors[id] || 'grey';
        },
        async loadDatesWithConsumptions() {
            try {
                const response = await this.$http.get(
                    process.env.VUE_APP_DEGIRA + 'partners/dates-with-consumptions'
                );
                if (response && response.data) {
                    this.datesWithConsumptions = response.data.data || [];
                }
            } catch (error) {
                console.error('Error al cargar fechas con consumos:', error);
                this.datesWithConsumptions = [];
            }
        },
        goToConsumed(item) {
            // Navegar a la vista de consumos con el id_bracelet del socio
            const braceletId = item.id_bracelet_1 || item.id_bracelet_2;
            if (braceletId) {
                this.$router.push({
                    path: '/consumed',
                    query: {
                        id_bracelet: braceletId
                    }
                });
            } else {
                this.$toast?.error('No se encontró el número de tarjeta del socio');
            }
        },
        changePage(newPage) {
            if (newPage >= 1 && newPage <= Math.ceil(this.totalItems / this.options.itemsPerPage)) {
                this.options.page = newPage;
                // El watch de options se encargará de llamar a getVisits()
            }
        },
        async exportToExcel() {
            if (this.items.length === 0) {
                this.$toast?.error('No hay datos para exportar');
                return;
            }

            this.loadExcel = true;

            try {
                // Preparar datos para exportar
                const dataToExport = this.items.map(item => ({
                    'Socio': item.partner?.partner_name || 'N/A',
                    'Alias': item.partner?.alias || 'N/A',
                    'DNI': item.partner?.partner_dni || 'N/A',
                    'Tarjeta': item.id_bracelet_1 || 'N/A',
                    'Fecha Entrada': item.hour_entry ? this.$moment(item.hour_entry).format('DD/MM/YYYY HH:mm') : 'N/A',
                    'Pago Entrada': item.entry_amount_paid || 0,
                    'Extra Entrada': item.extra_entry || 0,
                    'Obs. Extra Entrada': item.extra_entry_obs || '',
                    'Consumos': item.visit_amount_consumed || 0,
                    'Pago Salida': item.exit_amount_payed || 0,
                    'Extra Salida': item.extra_exit || 0,
                    'Obs. Extra Salida': item.extra_exit_obs || '',
                    'Total': this.calculateTotal(item),
                    'Tipo Visita': item.visit_type?.description || 'N/A',
                }));

                const fileName = `consumos_visitas_${this.selectedDate || 'todas'}_${this.$moment().format('YYYY-MM-DD_HH-mm-ss')}`;
                const exportType = exportFromJSON.types.xls;

                exportFromJSON({ data: dataToExport, fileName, exportType });

                this.$toast?.success('Archivo exportado correctamente');
            } catch (error) {
                console.error('Error al exportar:', error);
                this.$toast?.error('Error al exportar el archivo');
            } finally {
                this.loadExcel = false;
            }
        },
    },
    watch: {
        selectedDate(newDate, oldDate) {
            // Log cuando cambia la fecha para debug
            if (newDate !== oldDate && oldDate !== null) {
                console.log('Watch selectedDate - Fecha cambió:', { old: oldDate, new: newDate });
            }
        },
        searchText(newVal, oldVal) {
            // Log cuando cambia el texto de búsqueda
            if (newVal !== oldVal && oldVal !== undefined) {
                console.log('Watch searchText - Cambió:', { old: oldVal, new: newVal });
            }
        },
        braceletNumber(newVal, oldVal) {
            // Log cuando cambia el número de tarjeta
            if (newVal !== oldVal && oldVal !== undefined) {
                console.log('Watch braceletNumber - Cambió:', { old: oldVal, new: newVal });
            }
        },
        options: {
            handler(newVal, oldVal) {
                // Solo ejecutar si hay cambios en sortBy o sortDesc, no en page o itemsPerPage inicialmente
                if (!oldVal) return; // Evitar ejecución en la inicialización
                
                const sortByChanged = JSON.stringify(newVal.sortBy) !== JSON.stringify(oldVal.sortBy);
                const sortDescChanged = JSON.stringify(newVal.sortDesc) !== JSON.stringify(oldVal.sortDesc);
                const pageChanged = newVal.page !== oldVal.page;
                const itemsPerPageChanged = newVal.itemsPerPage !== oldVal.itemsPerPage;
                
                // Solo ejecutar si cambió el ordenamiento o la paginación Y hay fecha seleccionada
                const dateToUse = this.savedSelectedDate || this.selectedDate;
                if (dateToUse && (sortByChanged || sortDescChanged || pageChanged || itemsPerPageChanged)) {
                    console.log('Watch options - Cambio detectado:', { 
                        sortBy: { old: oldVal.sortBy, new: newVal.sortBy },
                        sortDesc: { old: oldVal.sortDesc, new: newVal.sortDesc },
                        page: { old: oldVal.page, new: newVal.page },
                        itemsPerPage: { old: oldVal.itemsPerPage, new: newVal.itemsPerPage },
                        selectedDate: dateToUse,
                        searchText: this.searchText,
                        braceletNumber: this.braceletNumber
                    });
                    // Cuando cambia solo el ordenamiento, resetear a página 1 pero MANTENER filtros
                    if (sortByChanged || sortDescChanged) {
                        // Guardar los filtros antes de resetear la página
                        const savedSearchText = this.searchText;
                        const savedBraceletNumber = this.braceletNumber;
                        // Usar savedSelectedDate si está disponible, sino selectedDate
                        const savedDate = this.savedSelectedDate || this.selectedDate;
                        
                        // Asegurar que savedSelectedDate esté actualizado
                        if (!this.savedSelectedDate && this.selectedDate) {
                            this.savedSelectedDate = this.selectedDate;
                        }
                        
                        this.options.page = 1;
                        
                        // Asegurarse de que los filtros no se pierdan
                        this.$nextTick(() => {
                            if (this.searchText !== savedSearchText) {
                                console.warn('searchText se perdió, restaurando:', savedSearchText);
                                this.searchText = savedSearchText;
                            }
                            if (this.braceletNumber !== savedBraceletNumber) {
                                console.warn('braceletNumber se perdió, restaurando:', savedBraceletNumber);
                                this.braceletNumber = savedBraceletNumber;
                            }
                            // Restaurar selectedDate usando savedSelectedDate
                            if (this.savedSelectedDate && this.selectedDate !== this.savedSelectedDate) {
                                console.warn('selectedDate se perdió, restaurando desde savedSelectedDate:', this.savedSelectedDate);
                                this.selectedDate = this.savedSelectedDate;
                            } else if (!this.savedSelectedDate && savedDate) {
                                // Si no hay savedSelectedDate pero tenemos savedDate, guardarlo
                                this.savedSelectedDate = savedDate;
                                this.selectedDate = savedDate;
                            }
                        });
                    }
                    // Llamar a getVisits() para cargar los datos con la nueva página/ordenamiento
                    this.getVisits();
                }
            },
            deep: true,
        },
    },
    mounted() {
        // Establecer fecha por defecto (hoy)
        const defaultDate = this.$moment().format('YYYY-MM-DD');
        this.selectedDate = defaultDate;
        this.savedSelectedDate = defaultDate; // Guardar también en savedSelectedDate
        // Cargar fechas con consumos
        this.loadDatesWithConsumptions();
        // Cargar datos iniciales
        this.getVisits();
    },
};
</script>

<style scoped>
.v-data-table >>> .v-data-table__wrapper {
    overflow-x: auto;
}

.v-data-table >>> th {
    font-weight: 600;
    background-color: #f5f5f5;
    font-size: 0.7rem !important;
    padding: 6px 1px !important;
}

.v-data-table >>> td {
    font-size: 0.75rem !important;
    padding: 6px 1px !important;
}

.v-data-table >>> .v-data-table__mobile-row {
    padding: 6px 1px !important;
}

.compact-cell {
    line-height: 1.2;
}

.compact-cell > div {
    margin: 0;
    padding: 0;
}
</style>

