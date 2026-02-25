<template>
    <v-dialog
        v-model="dialog"
        max-width="95%"
        width="1600px"
        persistent
        scrollable
    >
        <v-card>
            <v-card-title class="headline orange darken-2 white--text">
                <v-icon left color="white">mdi-chart-bar</v-icon>
                Histograma de Visitantes por Tipo
                <v-spacer></v-spacer>
                <v-btn icon dark @click="close">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>

            <v-card-text class="pa-4">
                <!-- Selector de período -->
                <v-row class="mb-4">
                    <v-col cols="12" md="6">
                        <v-btn-toggle
                            v-model="selectedPeriod"
                            mandatory
                            @change="loadHistogramData"
                            class="period-selector"
                        >
                            <v-btn value="month" small>
                                Último Mes
                            </v-btn>
                            <v-btn value="quarter" small>
                                Último Trimestre
                            </v-btn>
                            <v-btn value="semester" small>
                                Último Semestre
                            </v-btn>
                            <v-btn value="year" small>
                                Último Año
                            </v-btn>
                        </v-btn-toggle>
                    </v-col>
                    <v-col cols="12" md="6" class="d-flex align-center justify-end">
                        <v-chip color="orange" text-color="white" small>
                            {{ periodLabel }}
                        </v-chip>
                    </v-col>
                </v-row>

                <!-- Loading -->
                <div v-if="loading" class="text-center py-8">
                    <v-progress-circular
                        indeterminate
                        color="orange"
                        size="64"
                    ></v-progress-circular>
                    <p class="mt-4">Cargando datos...</p>
                </div>

                <!-- Histograma con Chart.js -->
                <div v-else-if="histogramData.length > 0 && chartData.datasets.length > 0" class="chart-container">
                    <BarChart
                        :key="`chart-${selectedPeriod}-${histogramData.length}`"
                        :chart-data="chartData"
                        :options="chartOptions"
                        :height="600"
                        ref="barChart"
                    />
                </div>
                <!-- Debug: mostrar si hay datos pero no se renderiza -->
                <div v-else-if="histogramData.length > 0 && chartData.datasets.length === 0" class="text-center py-8">
                    <v-icon size="64" color="orange">mdi-alert</v-icon>
                    <p class="mt-4">Hay datos pero no se pueden renderizar</p>
                    <p class="text-caption">Datos: {{ histogramData.length }}, Datasets: {{ chartData.datasets.length }}</p>
                </div>

                <!-- Sin datos -->
                <div v-else class="text-center py-8">
                    <v-icon size="64" color="grey lighten-1">mdi-chart-line-variant</v-icon>
                    <p class="mt-4 grey--text">No hay datos disponibles para el período seleccionado</p>
                </div>
            </v-card-text>

            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                    color="orange"
                    dark
                    @click="close"
                >
                    Cerrar
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import { Bar } from 'vue-chartjs/legacy';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

// Registrar componentes de Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default {
    name: 'HistogramModal',
    components: {
        BarChart: {
            extends: Bar,
            props: ['chartData', 'options'],
            mounted() {
                // Usar vue-chartjs como corresponde
                if (this.chartData && this.chartData.datasets && this.chartData.datasets.length > 0) {
                    this.renderChart(this.chartData, this.options);
                }
            },
            watch: {
                chartData: {
                    deep: true,
                    handler(newVal) {
                        if (newVal && newVal.datasets && newVal.datasets.length > 0) {
                            this.renderChart(newVal, this.options);
                        }
                    }
                },
                options: {
                    deep: true,
                    handler(newOptions) {
                        if (this.chartData && this.chartData.datasets && this.chartData.datasets.length > 0) {
                            this.renderChart(this.chartData, newOptions);
                        }
                    }
                }
            }
        }
    },
    props: {
        value: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            dialog: false,
            selectedPeriod: 'month',
            loading: false,
            histogramData: []
        };
    },
    computed: {
        periodLabel() {
            const labels = {
                month: 'Último Mes',
                quarter: 'Último Trimestre',
                semester: 'Último Semestre',
                year: 'Último Año'
            };
            return labels[this.selectedPeriod] || '';
        },
        chartData() {
            if (!this.histogramData || this.histogramData.length === 0) {
                console.log('chartData: No hay histogramData');
                return {
                    labels: [],
                    datasets: []
                };
            }

            // Obtener todos los tipos de visita únicos
            const visitTypes = this.uniqueVisitTypes;
            if (visitTypes.length === 0) {
                return {
                    labels: [],
                    datasets: []
                };
            }
            
            // Crear datasets para cada tipo de visita
            const datasets = visitTypes.map(type => {
                const data = this.histogramData.map(item => {
                    const typeData = item.types ? item.types.find(t => t.id_visit_type === type.id_visit_type) : null;
                    return typeData ? typeData.count : 0;
                });
                
                return {
                    label: type.description,
                    backgroundColor: type.color,
                    borderColor: type.color,
                    borderWidth: 1,
                    data: data
                };
            });

            // Crear labels con fecha y día de la semana
            const labels = this.histogramData.map(item => {
                const dayName = this.getDayName(item.dateKey);
                const formattedDate = this.formatDateShort(item.dateKey || item.date);
                return `${formattedDate} - ${dayName}`;
            });

            return {
                labels: labels,
                datasets: datasets
            };
        },
        chartOptions() {
            return {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: ${value}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true, // Apilar las barras
                        ticks: {
                            maxRotation: 90,
                            minRotation: 90,
                            font: {
                                size: 10
                            }
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        stacked: true, // Apilar las barras
                        ticks: {
                            beginAtZero: true,
                            stepSize: 1,
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                }
            };
        },
        uniqueVisitTypes() {
            if (!this.histogramData || this.histogramData.length === 0) return [];
            const typesMap = {};
            this.histogramData.forEach(item => {
                item.types.forEach(type => {
                    if (!typesMap[type.id_visit_type]) {
                        typesMap[type.id_visit_type] = {
                            id_visit_type: type.id_visit_type,
                            description: type.description,
                            color: type.color
                        };
                    }
                });
            });
            return Object.values(typesMap).sort((a, b) => a.id_visit_type - b.id_visit_type);
        }
    },
    watch: {
        value(newVal) {
            this.dialog = newVal;
            if (newVal) {
                this.loadHistogramData();
            }
        },
        dialog(newVal) {
            if (!newVal) {
                this.$emit('input', false);
                this.$emit('close');
            }
        }
    },
    methods: {
        close() {
            this.dialog = false;
        },
        async loadHistogramData() {
            this.loading = true;
            try {
                const url = `${process.env.VUE_APP_DEGIRA}partners/histogram`;
                const response = await this.$http.get(url, {
                    params: {
                        period: this.selectedPeriod
                    }
                });

                if (response && response.data && response.data.data) {
                    this.histogramData = this.processHistogramData(response.data.data);
                } else {
                    this.histogramData = [];
                }
            } catch (error) {
                console.error('Error al cargar datos del histograma:', error);
                if (this.$toast) {
                    this.$toast.error('Error al cargar los datos del histograma');
                }
                this.histogramData = [];
            } finally {
                this.loading = false;
            }
        },
        processHistogramData(data) {
            // Procesar los datos para el histograma
            // data debería ser un array de objetos con: { date, dateKey, types: [{ description, count, color }] }
            
            const processed = data.map(item => {
                return {
                    ...item,
                    total: item.types.reduce((sum, t) => sum + t.count, 0)
                };
            });
            
            // Ordenar por fecha ascendente (más antigua primero)
            return processed.sort((a, b) => {
                const dateA = new Date(a.dateKey || a.date);
                const dateB = new Date(b.dateKey || b.date);
                return dateA - dateB;
            });
        },
        getDayName(dateKey) {
            if (!dateKey) return '';
            // Parsear la fecha manualmente para evitar problemas de timezone
            // dateKey viene en formato YYYY-MM-DD
            const parts = dateKey.split('-');
            if (parts.length !== 3) {
                // Fallback al método anterior si el formato no es el esperado
                const date = new Date(dateKey);
                const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                return days[date.getDay()];
            }
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Los meses en JS son 0-indexed
            const day = parseInt(parts[2], 10);
            const date = new Date(year, month, day);
            const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            return days[date.getDay()];
        },
        formatDateShort(dateString) {
            if (!dateString) return '';
            // Parsear la fecha manualmente para evitar problemas de timezone
            // dateString viene en formato YYYY-MM-DD
            const parts = dateString.split('-');
            if (parts.length !== 3) {
                // Fallback al método anterior si el formato no es el esperado
                const date = new Date(dateString);
                const day = date.getDate().toString().padStart(2, '0');
                const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                const month = months[date.getMonth()];
                return `${day}/${month}`;
            }
            const day = parts[2];
            const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const month = months[parseInt(parts[1], 10) - 1]; // Los meses son 1-indexed en el string
            return `${day}/${month}`;
        }
    }
};
</script>

<style scoped>
.period-selector {
    width: 100%;
}

.period-selector .v-btn {
    flex: 1;
}

.chart-container {
    position: relative;
    height: 600px;
    width: 100%;
    padding: 20px 0;
}

/* Responsive */
@media (max-width: 1264px) {
    .chart-container {
        height: 500px;
    }
}

@media (max-width: 960px) {
    .chart-container {
        height: 400px;
    }
}

@media (max-width: 600px) {
    .chart-container {
        height: 350px;
    }
}
</style>
