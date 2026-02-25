<template>
    <div class="py-1 px-1">
        <div v-if="!load">
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

            <v-col cols="12" class="pb-0">
                <div class="text-body-2 text-center black--text">   
                    <v-icon color="black">mdi-calendar-range</v-icon>
                    <span class="mb-0 ml-2">{{fechas}}</span>
                </div>
            </v-col>
            
            
        <div v-for="item,n in items" :key="'visita'+n" class="px-md-10 px-5">
            <v-card class="pa-2 my-4 pt-2" :style="'border: solid 1px ' + $vuetify.theme.defaults.light.orange" outlined>
                <v-row class="text-center" no-gutters>
                    <v-col cols="12" class="mb-2">
                        <p class="mb-0"><b>ALIAS:</b> {{formatAlias(item.partner.alias)}}</p>
                    </v-col>

                    <v-col cols="6" class="text-caption">

                        <p class="mb-0 text-center"><b>Hora de Entrada:</b> {{parseHour(item.hour_entry)}}</p>
                        <p class="mb-0 text-center"><b>Tipo de Membresia:</b></p>
                        <p class="mb-0 text-center"> {{item.partner.visit_type.description}}</p>

                        <v-btn 
                            class="font-weight-bold text-caption"
                            small
                            text
                            style="font-size: 0.7rem" 
                            @click="verItem= item; showVerMas= true"
                            color="orange">Ver Mas
                        </v-btn>

                    </v-col>

                    <v-col cols="6" class="text-caption">

                        <p class="mb-0 text-center"><b>Monto Abonado:</b> ${{item.total_payed}}</p>
                        <p class="mb-0 text-center"><b>Monto Consumido:</b> ${{item.visit_amount_consumed || 0}}</p>
                        <p class="mb-0 text-center"><b>Tipo de Visita:</b></p>
                        <p class="mb-0 text-center"> {{item.visit_type.description}}</p>

                        <v-btn 
                            color="orange" 
                            dark 
                            x-small 
                            class="ma-1"
                            style="font-size: 0.65rem; min-width: 70px;"
                            @click="$router.push(`/access?search=${item.partner.partner_dni}`)">
                            INFO
                        </v-btn>
                        <v-btn 
                            color="orange" 
                            dark 
                            x-small 
                            class="ma-1"
                            style="font-size: 0.65rem; min-width: 70px;"
                            @click="$router.push(`/consumed?id_bracelet=${item.id_bracelet_1}`)">
                            CONSUMOS
                        </v-btn>
                        <v-btn 
                            color="orange" 
                            dark 
                            x-small 
                            class="ma-1"
                            style="font-size: 0.65rem; min-width: 70px;"
                            @click="goExit(item)">
                            EGRESO
                        </v-btn>
                    </v-col>
                </v-row>
            </v-card>
        </div>
        
        <v-dialog v-model="showVerMas">
            <v-card class="px-3 pb-2" v-if="verItem">
                <v-card-title>
                    <v-spacer></v-spacer>
                    <v-btn x-small icon @click="showVerMas=false">
                        <v-icon >mdi-close</v-icon>
                    </v-btn>
                </v-card-title>

                <v-row class="justify-center pb-5">
                    <v-icon color="orange" size=60 >{{ (tipoVisita == 2) ? "mdi-account-multiple-check" : "mdi-account-check"}}</v-icon>
                </v-row>

                <v-card class="pa-2 mb-3" outlined elevation="0">
                    <span class="orange--text font-weight-bold text-caption mt-n4 py-0 px-2" style="position: absolute; background: #fff;">Datos de Visita</span>

                    <div class="pa-2 text-body-2">   
                        <p v-if="verItem.visit_date" class="mb-0"><b>Fecha de Visita:  </b>{{parseDate(verItem.visit_date)}}</p>
                        <p class="mb-0"><b>Dia de Visita:  </b>{{formatDay(verItem.id_day)}}</p>
                        <p class="mb-0"><b>Monto Abonado:  </b>$ {{verItem.total_payed}}</p>
                        <p class="mb-0"><b>Monto Consumido:  </b>$ {{verItem.visit_amount_consumed || 0}}</p>
                        <p v-if="verItem.state" class="mb-0"><b>Estado:  </b>{{verItem.state.description}}</p>
                        <p class="mb-0"><b>Tipo de Membresia: </b>{{verItem.partner.visit_type.description}}</p>
                        <p class="mb-0"><b>Tipo de Visita: </b>{{verItem.visit_type.description}}</p>
                    </div>
                </v-card>

                <v-card class="pa-2 mb-3" outlined elevation="0">
                        <span class="orange--text font-weight-bold text-caption mt-n4 py-0 px-2" style="position: absolute; background: #fff;">Socio</span>
    
                        <div class="pa-2 text-body-2">   
                            <p class="mb-0"><b>Nombre: </b>{{verItem.partner.partner_name}}</p>
                            <p class="mb-0"><b>Nro de Tarjeta: </b><span class="text-body-1 font-weight-bold">{{formatBracelet(verItem.id_bracelet_1)}}</span></p>
                        </div>
                    </v-card>
                
                <v-card v-if="verItem.visit_type.id_visit_type == 2" class="pa-2 mb-3" outlined elevation="0">
                    <span class="orange--text font-weight-bold text-caption mt-n4 py-0 px-2" style="position: absolute; background: #fff;">Afiliado</span>

                    <div class="pa-2 text-body-2">   
                        <p class="mb-0"><b>Nombre: </b>{{verItem.partner.affiliate_name}}</p>
                    </div>
                </v-card>
            </v-card>
        </v-dialog>
        </div>

        <div v-else>
            <v-container style="height: 30rem;">
                <v-row class="fill-height" no-gutters align-content="center" justify="center" >
                  <v-col class="text-subtitle-1 text-center text--secondary" cols="12" >Buscando Visitas...</v-col>

                  <v-col cols="6">
                    <v-progress-linear
                      color="orange"
                      indeterminate
                      rounded
                      height="6">
                    </v-progress-linear>
                  </v-col>

                </v-row>
              </v-container>
        </div>
       
        <!------------------------------------- PAGINACION ------------------------------------------------------->
            
        <!--<v-row class="text-center">
            <v-col cols="12" class="d-flex justify-center">
                <v-pagination
                    v-model="options.page"
                    :length="totalPages"
                    :total-visible="5"
                ></v-pagination>
            </v-col>
            <v-col cols="8">
                <v-select 
                        v-model="options.sortBy[0]"
                        :items="sorts"
                        label="Ordenar Por"
                        item-text="description"
                        item-value="id"
                        dense
                        outlined
                ></v-select> 
            </v-col>
            <v-col cols="4">
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
            </v-col>
        </v-row>-->

    </div>
</template>

<script>

import exportFromJSON from 'export-from-json';
import { downloadFileRN } from '../../helpers/reactNative'
export default {

    props: {
        items: {type:Array},
        load: {type: Boolean, default: false}
    },
    components: {},

    data: () => ({
    loadExcel: false,  
    showVerMas: false,      
    tipoVisita: 2,  
    verItem: null,
    
    options: {
        sortBy:['horaEntrada'],
        sortDesc:[true],
        page: 1,
        itemsPerPage: 10,
    },
    totalItems: 20,
 
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
    fechas(){
        let arrayFechas = []
        this.items.map( (item) => {
            if (!arrayFechas.includes(this.parseDate(item.visit_date)))
            arrayFechas.push(this.parseDate(item.visit_date))
        })
        return (arrayFechas.length > 1) ? arrayFechas[0]+' - '+arrayFechas[1] : arrayFechas[0]
    },
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
                    // Agregar todos los campos de la visita
                    obj.visit_date = data.visit_date
                    obj.hour_entry = data.hour_entry
                    obj.id_day = data.id_day
                    obj.last_visit = data.last_visit
                    obj.entry_amount_paid = data.entry_amount_paid
                    obj.extra_entry = data.extra_entry
                    obj.extra_entry_obs = data.extra_entry_obs
                    obj.visit_amount_consumed = data.visit_amount_consumed
                    obj.exit_amount_payed = data.exit_amount_payed
                    obj.extra_exit = data.extra_exit
                    obj.extra_exit_obs = data.extra_exit_obs
                    obj.entry_visit_obs = data.entry_visit_obs
                    obj.other_visit_obs = data.other_visit_obs
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
                        Monto_Consumido: item.visit_amount_consumed || 0,
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

    parseHour(date){
            if(date != null){ 
                date.replace(/(T)/, ' ');
                date.substr(0, 19);
            }
            return (date != null) ? this.$moment(date, 'YYYY-MM-DD HH:mm:ss').format('HH:mm') : '';
        }, 

    parseDate(date){
        if(date != null){ 
            date.replace(/(T)/, ' ');
            date.substr(0, 19);
        }
        return (date != null) ? this.$moment(date, 'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY') : '';
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
    formatAlias(alias) {
        if (!alias) return '';
        return String(alias).replace(/---/g, ' ');
    },
    formatBracelet(bracelet) {
        if (!bracelet) return '';
        const braceletStr = String(bracelet);
        return braceletStr.length > 3 ? braceletStr.slice(-3) : braceletStr;
    }, 



},
}
</script>

<style scoped>
/* Estilos para reducir el tamaño de fuente */
.text-caption {
  font-size: 0.65rem !important;
}

.text-body-2 {
  font-size: 0.7rem !important;
}

::v-deep .v-card {
  font-size: 0.7rem;
}

::v-deep .v-btn {
  font-size: 0.65rem !important;
}

::v-deep .v-list-item-title {
  font-size: 0.7rem !important;
}
</style>

