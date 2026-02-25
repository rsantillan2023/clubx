<template>
    <div class="py-5 px-2">
        <v-card outlined elevation="0">
            <v-data-table
                :items-per-page="10"
                :footer-props="{
                    'items-per-page-text':'Registros por Página',
                    'items-per-page-all-text': 'Todos',
                    'page-text': paginationText,
                    }"
                :options.sync="options"
                :server-items-length="totalItems"
                hide-default-footer
                height="24rem"
                :headers="headers"
                :items="items"
                calculate-widths
                fixed-header
                :loading="load"
                no-data-text="Ningun Socio Encontrado">

                    <template v-slot:item.visit_date="{item}" >
                    {{ formatDate(item.visit_date, 'DD/MM/YYYY') }} | {{ parseHour(item.hour_entry) }}
                    </template>

                   <template v-slot:item.id_day="{item}">
                    {{ formatDay(item.id_day) }}
                   </template>

                   <template v-slot:item.total_payed="{item}">
                    $ {{ item.total_payed }}
                   </template>

                    <template v-slot:item.actions="{item}" >
                        <v-tooltip bottom>
                            <template v-slot:activator="{ on, attrs }">
                                <v-icon size="20" class="mx-1" color="orange" 
                                        @click="$router.push(`/access?search=${item.partner.partner_dni}`)" 
                                        v-bind="attrs" v-on="on">
                                    mdi-card-account-details
                                </v-icon>
                            </template>
                            <span>Consultar información de socio</span>
                        </v-tooltip>

                        <v-tooltip bottom>
                            <template v-slot:activator="{ on, attrs }">
                                <v-icon size="20" class="mx-1" color="orange" 
                                        @click="$router.push(`/consumed?id_bracelet=${item.id_bracelet_1}`)" 
                                        v-bind="attrs" v-on="on">
                                    mdi-account-cash
                                </v-icon>
                            </template>
                            <span>Consumo hasta ahora</span>
                        </v-tooltip>

                        <v-tooltip bottom>
                            <template v-slot:activator="{ on, attrs }">
                                <v-btn color="orange" class="mx-3" fab x-small @click="goExit(item)" dark v-bind="attrs" v-on="on">
                                    <v-icon size="20" class="mx-1"  
                                            @click="goExit(item)" 
                                            >
                                        mdi-exit-run
                                    </v-icon>
                                </v-btn>
                            </template>
                            <span>Cerrar Cuenta y Cobrar</span>
                        </v-tooltip>
                    </template>
            </v-data-table>
        </v-card>      
        
        <v-col cols="12" class="d-flex justify-center">
            <v-btn
                small
                color="orange"
                dark
                @click="archiveXLS"
                :loading="loadExcel">
                <v-icon left>mdi-file-excel</v-icon>Exportar Archivo .xls
            </v-btn>
        </v-col>
    </div>

</template>

<script>

    import exportFromJSON from 'export-from-json';
import { downloadFileRN } from '../../helpers/reactNative';
    export default {

    props: {
        items: {type:Array},
        load: {type: Boolean, default: false}

    },
    components: {},

    data: () => ({

        options: {
            sortBy:['horaEntrada'],
            sortDesc:[true],
            page: 1,
            itemsPerPage: 10,
        },
        totalItems: 10,
        loadExcel: false,          
        headers: [

            { text: 'Tipo de Membresia', value: 'partner.visit_type.description', align: 'center'},
            { text: 'ALIAS', value: 'partner.alias' , align: 'center'},
            { text: 'Estado', value: 'partner.state.description', align: 'center' },
            { text: 'Datos de Ingreso', value: 'visit_date', align: 'center',}, //template//
            { text: 'Dia de Visita', value: 'id_day', align: 'center',}, //template//
            { text: 'Monto abonado', value: 'total_payed', align: 'center' }, //template//
            { text: 'Tipo de Visita', value: 'visit_type.description', align: 'center'},
            { text: 'Brazalete 1', value: 'id_bracelet_1' , align: 'center'},
            { text: 'Brazalete 2', value: 'id_bracelet_2' , align: 'center'},
            { text: '', value: 'actions' , align: 'center', width: '200'},

        ],
    
    }),

    computed: {
        paginationText() {
            let cant = this.totalItems / this.options.itemsPerPage
            return 'Pag. ' + this.options.page + " de " + cant 
        }
    },

    watch: {

        options: {
            handler () {
                if(this.options.sortBy.length > 0) {
                    this.$emit('changePaginado', this.options) 
                }
            },
            deep: true,
        },
    
    },

    methods: {
        goExit(data){
            let vm = this
            this.$http.get(process.env.VUE_APP_DEGIRA+"consumptions/get/consume?id_bracelet="+data.id_bracelet_1)
            .then((response)=>{
                if(response){
                    let total = 0;
                    response.data.data.products.map((item) => {
                        total = total + (parseFloat(item.price) * item.quantity)
                    })
                    let obj = data.partner
                    obj.total = total
                    obj.id_bracelet_1 = data.id_bracelet_1
                    obj.id_bracelet_2 = data.id_bracelet_2
                    obj.id_visit = data.id_visit
                    vm.$store.commit('setPartner', obj)
                    vm.$router.push(`/exitRegister`)
                }
            })
        },
        archiveXLS () {
            const data = this.items.map( item => {
            //Haces linea por linea el excel, los nombres de las columnas van a ser las keys (si llevan espacios hazlo con guion bajo como Fecha_Visita)
            let row = {
                        Tipo_de_Membresia: item.partner.visit_type.description,
                        Alias: item.partner.alias,
                        Estado: item.partner.state.description,
                        Datos_de_Ingreso: item.visit_date,
                        Dia_de_Visita: this.formatDay(item.id_day),
                        Hora_de_Entrada: this.parseHour(item.hour_entry),
                        Monto_Abonado: item.total_payed,
                        Tipo_de_Visita: item.visit_type.description,
                        Nombre_Socio: item.partner.partner_name,
                        DNI_Socio: item.partner.partner_dni,
                        Brazalete_1: item.id_bracelet_1,
                        Nombre_Afiliado: item.partner.affiliate_name,
                        DNI_Afiliado: item.partner.affiliate_dni,
                        Brazalete_2: item.id_bracelet_2,
                        }
                    return row;
            })

            const timeAndHour = this.$moment().format('DDMMYYYYHHmm'); //Fecha y Hora formateada del momento
            const fileName = `Visitas_${timeAndHour}`; //Nombre con el que se crea el archivo
            let exportType = exportFromJSON.types.xls; //Esto viene de la libreria q instalaste
            downloadFileRN({ data, fileName, exportType }); //Esto se ejecuta para que lo descargue en la app
            exportFromJSON({ data, fileName, exportType }); //Esto es lo q hace q el excel salga

            },
            formatDate(date, format){
                  if(date != null){ 
                        date.replace(/(T)/, ' ');
                        date.substr(0, 19);
                  }
                  return (date) ? this.$moment(date, 'YYYY-MM-DD HH:mm:ss').format(format) : ''
              },

            parseHour(date){
            if(date != null){ 
                date.replace(/(T)/, ' ');
                date.substr(0, 19);
            }
            return (date != null) ? this.$moment(date, 'YYYY-MM-DD HH:mm:ss').format('HH:mm') : '';
            },

            formatDay(id_day){
                if(id_day == 1) return 'Domingo'
                if(id_day == 2) return 'Lunes'
                if(id_day == 3) return 'Martes'
                if(id_day == 4) return 'Miércoles'
                if(id_day == 5) return 'Jueves'
                if(id_day == 6) return 'Viernes'
                if(id_day == 7) return 'Sábado'
            }, 

        },
    }
</script>

