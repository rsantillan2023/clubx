<template>
    <div class="py-1 px-1">
        <div v-if="!load">
            <v-col cols="12" class="d-flex justify-center">
                <v-btn small color="orange" dark @click="archiveXLS" :loading="loadExcel">
                    <v-icon left>mdi-file-excel</v-icon>Exportar Archivo .xls
                </v-btn>
            </v-col>


            <div v-for="item, n in  items " :key="n" class="px-md-10 px-5">




                <v-card class="pa-2 my-4 pt-2" :style="'border: solid 1px ' + $vuetify.theme.defaults.light.orange"
                    outlined>
                    <v-row class="text-center" no-gutters>
                        <v-col cols="12" class="mb-2">
                            <p class="mb-0"><b>Usuario:</b> {{ item.user.username }}</p>
                        </v-col>

                        <v-col cols="6" class="text-caption">

                            <p class="mb-0 text-center"><b>Id de Operacion:</b> {{ item.id_operation }}</p>
                            <p class="mb-0 text-center"><b>Fecha de Operacion:</b> {{ parseDate(item.operation_date,
                                'DD/MM/YYYY') }}</p>
                            <p class="mb-0 text-center"><b>Tipo de Operacion:</b> {{ item.operation_type.description }}</p>

                            <v-btn class="font-weight-bold text-caption" small text style="font-size: 0.7rem"
                                @click="verItem = item; showVerMas = true" color="orange">Ver Mas
                            </v-btn>

                        </v-col>

                        <v-col cols="6" class="text-caption">

                            <p class="mb-0 text-center" v-if=" item.operation_amount > 0 "><b>Monto Abonado:</b> ${{
                                item.operation_amount }}</p>
                            <p class="mb-0 text-center" v-if=" item.operation_amount == '' "><b>Monto Abonado:</b> ${{
                                item.operation_amount }}</p>

                            <p class="mb-0 text-center" v-if=" (item.payment_method != null) "><b>Metodo de Pago:</b> {{
                                item.payment_method.method }}</p>
                            <p class="mb-0 text-center" v-else-if=" (item.payment_method == null) "><b>Metodo de Pago:</b>
                                Nulo</p>

                            <v-menu transition="slide-y-transition" bottom>
                                <template v-slot:activator=" { on, attrs } ">
                                    <v-btn color="orange" class="font-weight-bold" small style="font-size: 0.7rem" text
                                        v-bind=" attrs " v-on=" on ">Acciones
                                        <v-icon small>mdi-chevron-down</v-icon>
                                    </v-btn>

                                </template>
                                <v-list dense>
                                    <v-list-item @click="verItem = item; verDetalles = true">
                                        <v-list-item-icon>
                                            <v-icon color="orange">mdi-card-account-details</v-icon>
                                        </v-list-item-icon>
                                        <v-list-item-title>Ver detalles</v-list-item-title>
                                    </v-list-item>

                                    <v-list-item @click="verItem = item; verLog = true">
                                        <v-list-item-icon>
                                            <v-icon color="orange">mdi-account-cash</v-icon>
                                        </v-list-item-icon>
                                        <v-list-item-title>Ver log</v-list-item-title>
                                    </v-list-item>
                                </v-list>
                            </v-menu>
                        </v-col>
                    </v-row>
                </v-card>
            </div>

            <v-dialog v-model=" showVerMas ">
                <v-card class="px-3 pb-2" v-if=" verItem ">
                    <v-card-title>
                        <v-spacer></v-spacer>
                        <v-btn x-small icon @click=" showVerMas = false ">
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                    </v-card-title>

                    <v-row class="justify-center pb-5">
                        <v-icon color="orange" size=60>{{ (tipoVisita == 2) ? "mdi-account-multiple-check" :
                            "mdi-account-check"}}</v-icon>
                    </v-row>

                    <v-card class="pa-2 mb-3" outlined elevation="0">
                        <span class="orange--text font-weight-bold text-caption mt-n4 py-0 px-2"
                            style="position: absolute; background: #fff;">Más Datos</span>

                        <div class="pa-2 text-body-2">
                            <p class="mb-0"><b>Rol: </b>{{ verItem.role.description }}</p>
                            <p class="mb-0"><b>Alias: </b>{{ verItem.partner.partner_name }}</p>
                            <p class="mb-0"><b>Id de visita: </b>{{ verItem.id_visit }}</p>
                            <p class="mb-0"><b>Día: </b>{{ verItem.day.name }}</p>
                        </div>
                    </v-card>

                    
                </v-card>
            </v-dialog>

            <v-dialog v-model=" verDetalles ">
                <v-card class="px-3 pb-2" v-if=" verItem ">
                    <v-card-title>
                        <v-spacer></v-spacer>
                        <v-btn x-small icon @click=" verDetalles = false ">
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                    </v-card-title>

                    <v-row class="justify-center pb-5">
                        <v-icon color="orange" size=60>{{ (tipoVisita == 2) ? "mdi-account-multiple-check" :
                            "mdi-account-check"}}</v-icon>
                    </v-row>

                    <v-card class="pa-2 mb-3" outlined elevation="0">
                        <span class="orange--text font-weight-bold text-caption mt-n4 py-0 px-2"
                            style="position: absolute; background: #fff;">Detalles</span>

                        <div class="pa-2 text-body-2">
                            <p class="mb-0">{{ verItem.operation_metadata }}</p>
                        </div>
                    </v-card>

                    
                </v-card>
            </v-dialog>

            <v-dialog v-model=" verLog ">
                <v-card class="px-3 pb-2" v-if=" verItem ">
                    <v-card-title>
                        <v-spacer></v-spacer>
                        <v-btn x-small icon @click=" verLog = false ">
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                    </v-card-title>

                    <v-row class="justify-center pb-5">
                        <v-icon color="orange" size=60>{{ (tipoVisita == 2) ? "mdi-account-multiple-check" :
                            "mdi-account-check"}}</v-icon>
                    </v-row>

                    <v-card class="pa-2 mb-3" outlined elevation="0">
                        <span class="orange--text font-weight-bold text-caption mt-n4 py-0 px-2"
                            style="position: absolute; background: #fff;">Log</span>

                        <div class="pa-2 text-body-2">
                            <p class="mb-0">{{ verItem.operation_log }}</p>
                        </div>
                    </v-card>

                    
                </v-card>
            </v-dialog>
        </div>

        <div v-else>
            <v-container style="height: 30rem;">
                <v-row class="fill-height" no-gutters align-content="center" justify="center">
                    <v-col class="text-subtitle-1 text-center text--secondary" cols="12">Buscando Visitas...</v-col>

                    <v-col cols="6">
                        <v-progress-linear color="orange" indeterminate rounded height="6">
                        </v-progress-linear>
                    </v-col>

                </v-row>
            </v-container>
        </div>



        <!------------------------------------- PAGINACION ------------------------------------------------------->

        <v-row class="text-center">
            <v-col cols="12" class="d-flex justify-center">
                <v-pagination
                    v-model="options.page"
                    :length="totalPages"
                    :total-visible="5"
                ></v-pagination>
            </v-col>
            <!-- <v-col>
                <v-btn-toggle v-model="options.sortDesc[0]" dense>
                    <v-btn :value="false">
                      <v-icon color="orange">
                        mdi-arrow-up
                      </v-icon>
                    </v-btn>
                    <v-btn :value="true">
                      <v-icon color="orange">
                        mdi-arrow-down
                      </v-icon>
                    </v-btn>
                  </v-btn-toggle>
            </v-col> -->
        </v-row>


    </div>
</template>

<script>

import exportFromJSON from 'export-from-json';
import { downloadFileRN } from '../../helpers/reactNative'
import OperationsLarge from './OperationsLarge.vue';
export default {

    props: {
        items: { type: Array },
        load: { type: Boolean, default: false },
        totalItems: {type: Number},
        search: {type: String }
    },

    data: () => ({
        options: {
            sortBy: ['horaEntrada','grgregeg'],
            sortDesc: [true],
            page: 1,
            itemsPerPage: 10,
        },
        loadExcel: false,
        showVerMas: false,
        verDetalles: false,
        verLog: false,
        tipoVisita: 2,
        verItem: null,
        sorts: {},
        paginacion: 1,
        OperationsLarge,
        

    }),

    computed: {
        totalPages(){
            
            if(parseInt(this.totalItems)%parseInt(this.options.itemsPerPage) == 0){ 
                //si la division de items entre cantidad de items por pagina no tiene residuo, se devuelve la division exacta
                //por ejemplo: hay 100 items en total y se divide en 10 items por pagina, el resultado seria 10 paginas exactas
                return parseInt(this.totalItems)/parseInt(this.options.itemsPerPage)
            }else{
                //si la division de items entre cantidad de items por pagina tiene residuo hay que agregarle una pagina extra y borrar el residuo
                //por ejemplo: hay 99 items en total y se divide en 10 items por pagina, el resultado seria 9.9, habria que redondear ese numero a 10 porque serian 9 paginas de 10 items y 1 pagina de 9 items
                let resto = parseInt(this.totalItems)%parseInt(this.options.itemsPerPage)*0.1 //el 0.9 queda aca
                let pages = (parseInt(this.totalItems)/parseInt(this.options.itemsPerPage)) - resto //al 9.9 le resto el 0.9
                return pages + 1 //retorno agregando la pagina extra con los 9 items restantes
            }
        },
    },

    watch: {
        options: {
            handler() {
                if (this.options.sortBy.length > 0) {
                    this.$emit('changePaginado', this.options)
                }
            },
            deep: true,
        },
    },

    methods: {
        Searchitems() {
            this.load = true
            this.$http.get(process.env.VUE_APP_DEGIRA + "operations/get?page=" + this.options.page + "&pageSize=" + this.options.itemsPerPage + "&sortBy=" + this.options.sortBy + "&sortDesc=" + this.options.sortDesc + "&searcher=" + this.search)
                // get?page="this.options.page+"&pageSize="+this.options.itemsPerPage
                .then((response) => {
                    if (response) {
                        this.items = (response.data.data) ? response.data.data : []
                        this.totalItems = response.data.totalCount
                    }
                    this.load = false
                })
                .catch((error) => console.log(error))
        },
        archiveXLS() {
            const data = this.items.map(item => {
                //Haces linea por linea el excel, los nombres de las columnas van a ser las keys (si llevan espacios hazlo con guion bajo como Fecha_Visita)
                let row = {

                    Id_de_Operacion: item.id_operation,
                    Fecha_de_Operacion: this.parseDate(item.operation_date,"DD/MM/YYYY HH:mm "), 
                    Tipo_de_Operacion: item.operation_type.description,
                    Usuario: item.user.username,
                    Rol: item.role.description,
                    Alias: item.partner.alias,
                    Id_Visita: (item.id_visit) ? item.id_visit : '',
                    Metodo_de_Pago: (item.payment_method) ? item.payment_method.method : '',
                    Dia: item.day.name,
                    Monto_de_Operacion: (item.payment_method) ? item.operation_amount : '',
                }

                return row;
            })

            const timeAndHour = this.$moment().format('DDMMYYYYHHmm'); //Fecha y Hora formateada del momento
            const fileName = `Operaciones_${timeAndHour}`; //Nombre con el que se crea el archivo
            let exportType = exportFromJSON.types.xls; //Esto viene de la libreria q instalaste
            downloadFileRN({ data, fileName, exportType }); //Esto se ejecuta para que lo descargue en la app
            exportFromJSON({ data, fileName, exportType }); //Esto es lo q hace q el excel salga

        },

        parseHour(date) {
            if (date != null) {
                date.replace(/(T)/, ' ');
                date.substr(0, 19);
            }
            return (date != null) ? this.$moment(date, 'YYYY-MM-DD HH:mm:ss').format('HH:mm') : '';
        },

        parseDate(date) {
            if (date != null) {
                date.replace(/(T)/, ' ');
                date.substr(0, 19);
            }
            return (date != null) ? this.$moment(date, 'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY') : '';
        },
        formatDay(id_day) {
            if (id_day == 1) return 'Domingo'
            if (id_day == 2) return 'Lunes'
            if (id_day == 3) return 'Martes'
            if (id_day == 4) return 'Miércoles'
            if (id_day == 5) return 'Jueves'
            if (id_day == 6) return 'Viernes'
            if (id_day == 7) return 'Sábado'
        },
    },
}
</script>

