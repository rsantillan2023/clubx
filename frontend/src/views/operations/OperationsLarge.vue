<template>
    <div class="py-5 px-2">
        <v-row class="align-center">
            <v-col cols="4" class="">
                <v-text-field 
                    v-model="search"
                    label="Buscar" 
                    outlined
                    dense
                    clearable 
                    append-icon="mdi-magnify"
                    type="text">
                </v-text-field>
            </v-col>

            <v-col cols="4" class="">
                <v-select
                v-model="selectedOperation"
                :items="operations"
                chips
                dense
                item-text="description"
                item-value="id_operation_type"
                append-icon="mdi-filter-variant"
                label="Tipo de Operación"
                multiple
                clearable
                @change="Searchitems"
                :menu-props="{offsetY: true}"
                outlined>
                    <template v-slot:selection="data">
                        <v-chip
                            v-bind="data.attrs"
                            :input-value="data.selected"
                            small
                            class="mt-1"
                        >
                            {{ data.item.description }}
                        </v-chip>
                  </template>
                </v-select>
            </v-col>
                  
            <v-col cols="3" class="">
                <v-menu ref="menu" 
                v-model="menu" 
                :close-on-content-click="false" 
                transition="scale-transition" 
                offset-y    
                min-width="auto">

                    <template v-slot:activator="{ on, attrs }">
                        <v-text-field v-model="dateRangeText" outlined dense label="Ingrese un rango de fechas"
                            append-icon="mdi-calendar" readonly v-bind="attrs" v-on="on" clearable @click:clear="dates = ['', '']; Searchitems()"></v-text-field>
                    </template>

                    <v-date-picker v-model="dates" @change="Searchitems" color="red" range locale="es-es" no-title></v-date-picker>

                </v-menu>
            </v-col>

            <v-col cols="1">
                <v-icon 
                    class="mt-n8 ml-5"
                    button 
                    color="red" 
                    :loading="load" 
                    @click="restart" >mdi-reload
                
                </v-icon>
            </v-col>
        </v-row>
     
        
        

        <v-card outlined elevation="0">
            <v-data-table v-model="table" :height="tableHeight" :options.sync="options" :headers="headers" :items="apiData"
                 :footer="tableFooter" :footer-props="{
                        'items-per-page-text': 'Registros por Página',
                        'items-per-page-all-text': 'Todos',
                        'page-text': paginationText,
                    }" :server-items-length="totalItems" calculate-widths fixed-header :loading="load"
                :sort-by="options.sortBy" :sort-desc="options.sortDesc" no-data-text="No hay consumos">


                <template v-slot:item.operation_date="{ item }">
                    {{ formatDate(item.operation_date, 'DD/MM/YYYY') }} | {{ parseHour(item.operation_date) }}
                </template>

                <template v-slot:item.operation_amount="{ item }">
                    <p v-if="item.operation_amount > 0">$ {{ item.operation_amount }}</p>
                    <p v-if="item.operation_amount == ''">{{ item.operation_amount }}</p>
                </template>


                <template v-slot:item.actions="{ item }">
                    <v-tooltip bottom>
                        <template v-slot:activator="{ on, attrs }">
                            <v-icon size="20" class="mx-1" color="orange" @click="showModalDetail(item)" v-bind="attrs"
                                v-on="on">
                                mdi-account-details
                            </v-icon>
                        </template>
                        <span>Ver Detalles</span>
                    </v-tooltip>

                    <v-tooltip bottom>
                        <template v-slot:activator="{ on, attrs }">
                            <v-icon size="20" class="mx-1" color="orange" @click="showModalLog(item)" v-bind="attrs"
                                v-on="on">
                                mdi-account-cash
                            </v-icon>
                        </template>
                        <span>Ver Log</span>
                    </v-tooltip>
                </template>
            </v-data-table>
        </v-card>

        <v-col cols="12" class="d-flex justify-center">
            <v-btn small color="orange" dark @click="archiveXLS" :loading="loadExcel">
                <v-icon left>mdi-file-excel</v-icon>Exportar Archivo .xls
            </v-btn>
        </v-col>

        <v-dialog v-model="modalDetail">
            <v-card>
                <v-toolbar color="orange" class="rounded-b-0" dark elevation="0">
                    <v-icon class="mx-1">mdi-receipt-text-outline</v-icon>
                    <span class="font-weight-bold">Detalles</span>
                    <v-spacer></v-spacer>
                    <v-btn icon x-small @click="modalDetail = false" class="mr-1">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-toolbar>
                <div class="pa-5" style="max-height: 35rem; overflow-y: scroll;">
                    <span v-for="(value, key) in obj" :key="key"> <b> {{ key }}:</b> {{ value }} <br> </span>
                </div>


            </v-card>
        </v-dialog>

        <v-dialog v-model="modalLog">
            <v-card>
                <v-toolbar color="orange" class="rounded-b-0" dark elevation="0">
                    <v-icon class="mx-1">mdi-receipt-text-outline</v-icon>
                    <span class="font-weight-bold">Log</span>
                    <v-spacer></v-spacer>
                    <v-btn icon x-small @click="modalLog = false" class="mr-1">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-toolbar>
                <div class="pa-5" style="max-height: 35rem; overflow-y: scroll;">
                    <!-- <span> {{ this.obj }} </span> -->
                    <span v-for="(value, key) in obj" :key="key"> <b> {{ key }}:</b> {{ value }} <br> </span>
                </div>

            </v-card>
        </v-dialog>

    </div>
</template>

<script>

import exportFromJSON from 'export-from-json';
import { downloadFileRN } from '../../helpers/reactNative';


export default {
    props: {
    },

    data: () => ({

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
        totalItems: 0,
        row: {},
        selectedRow: [],
        activePicker: null,
        date: null,
        menu: false,
        dates: ['', ''],
        operations: [],
        selectedOperation: [],
        tableHeight: '23rem',
        tableFooter: '',
        table: {},
        headers: [
            { text: 'Id', value: 'id_operation', align: 'center' },
            { text: 'Fecha', value: 'operation_date', align: 'center' },
            { text: 'Dia', value: 'day.name', align: 'center' },
            { text: 'Tipo de Operacion', value: 'operation_type.description', align: 'center' },
            { text: 'Usuario', value: 'user.username', align: 'center' },
            { text: 'Rol', value: 'role.description', align: 'center' },
            { text: 'Alias', value: 'partner.alias', align: 'center' },
            { text: 'Tipo Visita', value: 'visit.visit_type.description', align: 'center' },
            { text: 'Id visita', value: 'id_visit', align: 'center' },
            { text: 'Metodo de pago', value: 'payment_method.method', align: 'center' },
            { text: 'Monto', value: 'operation_amount', align: 'center' },
            { text: '', value: 'actions', align: 'center' },
        ],
        options: {
            sortBy: ['operation_date'],
            sortDesc: [true],
            page: 1,
            itemsPerPage: 10,
        },
    }),
    mounted() {
    },

    beforeMount() {
        this.Searchitems()
        this.getOperationsTypes()
    },

    computed: {
        paginationText() {
            let cant = this.totalItems / this.options.itemsPerPage
            let decimales = cant - Math.trunc(cant)
            let pages = Math.trunc(cant)
            if (decimales > 0) pages++
            return 'Pag. ' + this.options.page + " de " + pages
        },

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
            return (this.dates[0] && this.dates[1]) ? this.dates.join(' ~ ') : ''
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

    },


    methods: {
        Searchitems() {
            console.log(this.dateRangeText)
            let tipoOperacion = (this.selectedOperation.length) ? "&tipoOperacion=" + encodeURIComponent(JSON.stringify(this.selectedOperation)) : ''
            let fechas = (this.dateRangeText) ? "&fechas=" + this.fecha() : ""
            let vm = this
            this.load = true
             this.$http.get(process.env.VUE_APP_DEGIRA + "operations/get?page=" + vm.options.page + "&pageSize=" + vm.options.itemsPerPage + "&sortBy=" + vm.options.sortBy + "&sortDesc=" + vm.options.sortDesc + "&searcher=" + this.search + tipoOperacion + fechas) 
                
                .then((response) => {
                    if (response) {
                        vm.apiData = (response.data.data) ? response.data.data : []
                        vm.totalItems = response.data.totalCount
                    }
                    vm.load = false
                })
                .catch((error) => console.log(error))
        },

        getOperationsTypes(){
            let vm = this
            this.loadOperationsTypes = true
            this.$http.get(process.env.VUE_APP_DEGIRA + "operations_types/getAll")
                .then((response) => {
                    if (response) {
                        vm.operations = (response.data.data) ? response.data.data : []
                    }
                    vm.loadOperationsTypes = false
                })
                .catch((error) => console.log(error))
        },

        showModalDetail(detalles) {
            const text = detalles.operation_metadata // detalles.poeration_metadada es JSON
            this.obj = JSON.parse(text) 
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
            return fechasISO
           
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


        archiveXLS() {
            let tipoOperacion = (this.selectedOperation.length) ? "&tipoOperacion=" + encodeURIComponent(JSON.stringify(this.selectedOperation)) : ''
            let fechas = (this.dateRangeText) ? "&fechas=" + this.fecha() : ""
            let vm = this

            this.$http.get(process.env.VUE_APP_DEGIRA + "operations/get?page=" + vm.options.page + "&pageSize=-1&sortBy=" + vm.options.sortBy + "&sortDesc=" + vm.options.sortDesc + "&searcher=" + this.search + tipoOperacion + fechas)

                .then((response) => {
                    if (response) {
                        if (response.data.data) {
                            const data = response.data.data.map(item => {

                                let row = {

                                    Id_de_Operacion: item.id_operation,
                                    Fecha_de_Operacion: this.formatDate(item.operation_date,"DD/MM/YYYY HH:mm "), 
                                    Tipo_de_Operacion: item.operation_type.description,
                                    Usuario: item.user.username,
                                    Rol: item.role.description,
                                    Alias: (item.partner) ? item.partner.alias : '',
                                    Tipo_de_Visita: (item.visit) ? item.visit.visit_type.description : "",
                                    Id_Visita: (item.id_visit) ? item.id_visit : '',
                                    Metodo_de_Pago: (item.payment_method) ? item.payment_method.method : '',
                                    Dia: (item.day) ? item.day.name : '',
                                    Monto_de_Operacion: (item.payment_method) ? item.operation_amount : '',
                                }
                                return row;
                            })

                            const timeAndHour = this.$moment().format('DDMMYYYYHHmm'); //Fecha y Hora formateada del momento
                            const fileName = `Operaciones_${timeAndHour}`; //Nombre con el que se crea el archivo
                            let exportType = exportFromJSON.types.xls; //Esto viene de la libreria q instalaste
                            downloadFileRN({ data, fileName, exportType }); //Esto se ejecuta para que lo descargue en la app
                            exportFromJSON({ data, fileName, exportType }); //Esto es lo q hace q el excel salga
                        }
                    }
                    vm.load = false
                })
                .catch((error) => console.log(error))




        },

        restart() {
            this.search = ""
            this.selectedOperation = []
            this.dates = ['', '']
            this.Searchitems()
        },
        handleRowsPerPage() {
            alert()
            if (this.options.itemsPerPage == 5) {
                this.tableHeight = '40rem'
            } else {
                this.tableHeight = '24rem'
            }
        }
    },
}
</script>