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
                        <p class="mb-0"><b>ALIAS:</b> {{item.partner.alias}}</p>
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
                        <p class="mb-0 text-center"><b>Tipo de Visita:</b></p>
                        <p class="mb-0 text-center"> {{item.visit_type.description}}</p>

                        <v-menu transition="slide-y-transition" bottom >
                            <template v-slot:activator="{ on, attrs }">
                                <v-btn 
                                    color="orange" 
                                    class="font-weight-bold" 
                                    small 
                                    style="font-size: 0.7rem" 
                                    text 
                                    v-bind="attrs" v-on="on">Acciones 
                                        <v-icon small>mdi-chevron-down</v-icon>
                                </v-btn>

                            </template>
                                <v-list dense>
                                <v-list-item  @click="$router.push(`/access?search=${item.partner.partner_dni}`)">
                                    <v-list-item-icon>
                                        <v-icon color="orange">mdi-card-account-details</v-icon>
                                    </v-list-item-icon>
                                    <v-list-item-title>Consultar informacion del socio</v-list-item-title>
                                </v-list-item>

                                <v-list-item @click="$router.push(`/consumed?id_bracelet=${item.id_bracelet_1}`)">
                                    <v-list-item-icon>
                                        <v-icon color="orange">mdi-account-cash</v-icon>
                                    </v-list-item-icon>
                                    <v-list-item-title>Consumo hasta ahora</v-list-item-title>
                                </v-list-item>

                                <v-list-item  @click="goExit(item)">
                                    <v-list-item-icon>
                                        <v-icon color="orange">mdi-exit-run</v-icon>
                                    </v-list-item-icon>
                                    <v-list-item-title>Cerrar Cuenta y Cobrar</v-list-item-title>
                                </v-list-item>
                            </v-list>
                        </v-menu>
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
                        <p v-if="verItem.state" class="mb-0"><b>Estado:  </b>{{verItem.state.description}}</p>
                        <p class="mb-0"><b>Tipo de Membresia: </b>{{verItem.partner.visit_type.description}}</p>
                        <p class="mb-0"><b>Tipo de Visita: </b>{{verItem.visit_type.description}}</p>
                    </div>
                </v-card>

                <v-card class="pa-2 mb-3" outlined elevation="0">
                        <span class="orange--text font-weight-bold text-caption mt-n4 py-0 px-2" style="position: absolute; background: #fff;">Socio</span>
    
                        <div class="pa-2 text-body-2">   
                            <p class="mb-0"><b>Nombre: </b>{{verItem.partner.partner_name}}</p>
                            <p class="mb-0"><b>Brazalete Socio: </b>{{verItem.id_bracelet_1}}</p>
                        </div>
                    </v-card>
                
                <v-card v-if="verItem.visit_type.id_visit_type == 2" class="pa-2 mb-3" outlined elevation="0">
                    <span class="orange--text font-weight-bold text-caption mt-n4 py-0 px-2" style="position: absolute; background: #fff;">Afiliado</span>

                    <div class="pa-2 text-body-2">   
                        <p class="mb-0"><b>Nombre: </b>{{verItem.partner.affiliate_name}}</p>
                        <p class="mb-0"><b>Brazalete Afiliado: </b>{{verItem.id_bracelet_2}}</p>
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



},
}
</script>

