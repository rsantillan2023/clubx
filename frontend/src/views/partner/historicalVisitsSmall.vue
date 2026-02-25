<template>
    <div class="py-1 px-1">
        <div v-if="!load">
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
       

    </div>
</template>

<script>

export default {

    props: {
        items: {type:Array},
        load: {type: Boolean, default: false}
    },
    components: {},

    data: () => ({
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


