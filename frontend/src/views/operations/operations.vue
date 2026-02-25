<template>
    <div class="py-5 px-2">

        <!-- <v-row class="justify-center px-md-15 px-3 mb-10" no-gutters>
            <v-col class="pr-4">
                <v-text-field ref="searchOperation" label="Buscar..." outlined dense clearable v-model="search" type="text">
                </v-text-field>
                <div>

                    <v-row class="px-3">

                        <v-select @input="getPrice" v-model="selectedOperation" :items="operations"
                            label="Tipo de Operacion" dense outlined item-text="description" item-value="id_visit_type">
                        </v-select>

                        <v-btn color="blue" dark :loading="load" @click="restart" style="float: right;">
                            Reiniciar
                        </v-btn>
                    </v-row>
                </div>
            </v-col>

            <template>
                <div style="width: 300px;">
                    <v-menu ref="menu" v-model="menu" :close-on-content-click="false" transition="scale-transition" offset-y
                        min-width="auto">
                        <template v-slot:activator="{ on, attrs }">
                            <v-text-field v-model="dateRangeText" label="Ingrese un rango de fechas"
                                prepend-icon="mdi-calendar" readonly v-bind="attrs" v-on="on"></v-text-field>
                        </template>

                        <v-date-picker v-model="dates" color="blue" range locale="es-en"></v-date-picker>

                    </v-menu>
                    <v-col>
                        <v-btn color="orange" dark :loading="load" @click="fecha">
                            <v-icon left>mdi-magnify</v-icon>Buscar
                        </v-btn>
                    </v-col>
                </div>
            </template>


        </v-row> -->


        <!-- <div style="display: grid; grid-template-columns: 80% 20%;">
            <v-col class="pr-4">
                <v-row class="px-3">

                    <v-text-field ref="searchOperation" label="Buscar..." outlined dense clearable v-model="search"
                        type="text">
                    </v-text-field>
                </v-row>

                <v-row>
                    <v-col>

                        <v-select v-model="selectedOperation" :items="operations"
                            label="Tipo de Operación" dense outlined item-text="description" item-value="id_visit_type">
                        </v-select>
                    </v-col>
                    <v-col>


                        <v-btn color="blue" dark :loading="load" @click="restart" style="float: right;">
                            Reiniciar
                        </v-btn>
                    </v-col>
                </v-row>
            </v-col>

            <v-col>
                <v-row class="px-3">


                    <v-menu ref="menu" v-model="menu" :close-on-content-click="false" transition="scale-transition" offset-y
                        min-width="auto">
                        <template v-slot:activator="{ on, attrs }">
                            <v-text-field v-model="dateRangeText" label="Ingrese un rango de fechas"
                                prepend-icon="mdi-calendar" readonly v-bind="attrs" v-on="on"></v-text-field>
                        </template>

                        <v-date-picker v-model="dates" color="blue" range locale="es-es" no-title></v-date-picker>

                    </v-menu>
                </v-row>
                <v-row class="px-3 py-2">

                    <v-btn color="orange" dark :loading="load" @click="fecha">
                        <v-icon left>mdi-magnify</v-icon>Buscar
                    </v-btn>
                </v-row>
            </v-col>
        </div> -->

        <OperationsLarge
        v-if="$vuetify.breakpoint.mdAndUp"
        :items="apiData"
        :load="load"
        @changePaginado="options = $event">
       </OperationsLarge>

       <OperationsSmall
        v-if="!$vuetify.breakpoint.mdAndUp" 
        :items="apiData"
        :load="load"
        :totalItems="totalItems"
        :search="search"
        @changePaginado="options = $event">
       </OperationsSmall>

        

        <!-- <v-col cols="12" class="d-flex justify-center">
            <v-btn small color="orange" dark @click="archiveXLS" :loading="loadExcel">
                <v-icon left>mdi-file-excel</v-icon>Exportar Archivo .xls
            </v-btn>
        </v-col> -->

        
    </div>
</template>

<script>
import OperationsLarge from './OperationsLarge.vue';
import OperationsSmall from './OperationsSmall.vue';

// import exportFromJSON from 'export-from-json';
// import { downloadFileRN } from '../../helpers/reactNative';

export default {
    components: {OperationsSmall,OperationsLarge},

    data: () => ({
        options: {
            sortBy: ['operation_date'],
            sortDesc: [true],
            page: 1,
            itemsPerPage: 10,
        },
        totalItems: 0,
        search: '',
        obj: {},
        objparsed: {},
        modalDetail: false,
        modalLog: false,
        itemDelete: null,
        dialog: false,
        dialogDelete: false,
        load: false,
        loadB1: false,
        loadB2: false,
        loadAnulacion: false,
        brazalete: null,
        motivo: "",
        tipoVisita: 2,
        loadExcel: false,
        selectCantidad: 1,
        roles: [],
        partner: null,
        apiData: [],
        row: {},
        selectedRow: [],
        activePicker: null,
        date: null,
        menu: false,
        dates: ['', ''],
        selectedOperation: '',
        tableHeight: '24rem',
        tableFooter: '',
    }),
    mounted() {
    },

    beforeMount() {
        this.Searchitems()
    },
    computed: {
        total() {
            let total = 0
            this.items.map((item) => {
                total = total + parseInt(item.monto)
            })

            return total
        },
        cantidad() {
            console.log(this.itemDelete)
            let existentes = this.itemDelete.quantity
            let options = []
            for (var i = 1; i <= existentes; i++) {
                options.push(i)
            }
            return options
        },
        itemsClean() {
            return this.items.filter((item) => item.quantity > 0)
        },
        dateRangeText() {
            return this.dates.join(' ~ ')
        },
    },
    watch: {
        options: {
            handler() {
                if (this.options.sortBy.length > 0) {
                    this.Searchitems()
                }
            },
            deep: true,
        },
        search() {
            if (this.search == null) this.search = ''
            if (this.options.page > 1) {
                this.options.page = 1
            }
            else {
                this.Searchitems()
            }
        },
        menu(val) {
            val && setTimeout(() => (this.activePicker = 'YEAR'))
        },

        selectedOperation() {
            if (this.selectedOperation != 'Ninguno') {
                this.search = this.selectedOperation
            } else {
                this.search = ''
            }
            if (this.selectedOperation == 'Salida - Pago - Egreso') {
                this.search = `Salida - Pago  - Egreso`
            }
        },

        tableFooter () {
            alert()
        }
    },
    methods: {
        Searchitems() {
            let vm = this
            this.load = true
            this.$http.get(process.env.VUE_APP_DEGIRA + "operations/get?page=" + vm.options.page + "&pageSize=" + vm.options.itemsPerPage + "&sortBy=" + vm.options.sortBy + "&sortDesc=" + vm.options.sortDesc + "&searcher=" + this.search)
                .then((response) => {
                    if (response) {
                        vm.apiData = (response.data.data) ? response.data.data : []
                        vm.totalItems = response.data.totalCount
                    }
                    vm.load = false
                })
                .catch((error) => console.log(error))
        },
        showModalDetail(detalles) {
            const text = detalles.operation_metadata // detalles.poeration_metadada es JSON
            this.obj = JSON.parse(text) // this.obj es un objeto aca
            this.modalDetail = true
        },
        showModalLog(logs) {
            const text = logs.operation_log
            this.obj = JSON.parse(text)
            this.modalLog = true
        },
        fecha() {
            const fecha = this.dateRangeText
            const fechasSeparadas = fecha.split(" ~ ")
            let fechasISO = fechasSeparadas.map(fecha => this.$moment(fecha, "YYYY-MM-DD").toISOString());

            fechasISO = "['" + fechasISO + "']"
            this.search = fechasISO
        },
        save(date) {
            this.$refs.menu.save(date)
        },
        formatDate(date, format) {
            if (date != null) {
                date.replace(/(T)/, ' ');
                date.substr(0, 19);
            }
            return (date) ? this.$moment(date, 'YYYY-MM-DD HH:mm:ss').format(format) : ''
        },
        parseHour(date) {
            if (date != null) {
                date.replace(/(T)/, ' ');
                date.substr(0, 19);
            }
            return (date != null) ? this.$moment(date, 'YYYY-MM-DD HH:mm:ss').format('HH:mm') : '';
        },
        restart() {
            this.search = ""
            this.selectedOperation = 'Ninguno'
            this.dates = ['','']
        },
    },
}
</script>