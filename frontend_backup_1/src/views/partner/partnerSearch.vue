<template>
    <div class="py-8">
        <v-row class="mb-3 px-5" no-gutters>

            <v-col cols="12" class="d-flex justify-center"> 
                <v-icon color="orange" class="text-h1">{{icon.icon}}</v-icon>
            </v-col>

            <v-col cols="12" class="d-flex justify-center">
                <p class="orange--text font-weight-bold">{{icon.text}}</p>
            </v-col>

            <v-col>
                <v-row class="px-md-10 px-4">
                    <v-col  :md="partner && partner.length ? 6: 12" cols="12" class="pt-md-0 pt-0" >
                        <label class="text--secondary text-caption">ALIAS, DNI, Nombre o Nro único de membresía</label>
                        <v-text-field
                            prepend-inner-icon="mdi-selection-search"
                            outlined
                            autofocus
                            dense
                            :loading="load"
                            clearable
                            @keydown.enter="searchPartners"
                            v-model="search"
                        />
                    </v-col>
                    <v-col v-if="partner && partner.length> 0" :md="partner && partner.length ? 6: 12" cols="12" class="pt-md-0 pt-0" >
                        <label class="text--secondary text-caption">Filtro Avanzado</label>
                        <v-text-field
                            prepend-inner-icon="mdi-filter-variant"
                            outlined
                            dense
                            :loading="loadFilter"
                            clearable
                            @keydown.enter="filterPartners"
                            v-model="filter"
                        />
                    </v-col>
                </v-row>
  
                <v-row class="px-md-10 px-4" no-gutters>
                    <v-col cols="12"  class="d-flex justify-center">
                        <v-btn 
                        color="orange" 
                        dark 
                        @click="searchPartners" 
                        :loading="load">
                            <v-icon left>mdi-magnify</v-icon> Buscar
                        </v-btn>
                    </v-col>
                    <v-col cols="12" v-if="partner" class="d-flex justify-center mt-3">
                        <v-btn 
                        color="orange" 
                        dark 
                        text
                        @click="goTo('/access', dato)"
                        :loading="load">
                            <v-icon left>mdi-arrow-left-thin</v-icon> Ir a Validación por DNI
                        </v-btn>
                    </v-col>
                </v-row>
             </v-col>

<!----------------- BUSQUEDA NEGATIVA-------------------- -->

            <v-col cols="12" class="text-h6 text-center font-weight-bold" v-if="partnerComputed != null"> 
  
               
<!------------- DE BUSQUEDA POSITIVA ------------------------>

            <div v-if="partnerComputed.length> 0" class="px-md-10 px-4">
                <v-card v-for="dato,n in partnerComputed" :key="'partner'+n" class="pa-2 my-4 pt-2" :style="'border: solid 2px ' + $vuetify.theme.defaults.light.orange" outlined >
                    
                <v-row>
                    <v-col cols="4" md="2" class="d-flex align-center justify-center">
                        <div>
                            <v-icon 
                                class="ma-0 pa-0 text-h2 text-md-h1" 
                                :color="iconState(dato.state.id_state).color">mdi-account
                            </v-icon>

                            <p :class="`${iconState(dato.state.id_state).color}--text font-weight-bold`" 
                            :style="`font-size: ${($vuetify.breakpoint.mdAndUp) ? '1' : '.8'}rem;`">
                                {{dato.state.description}}
                            </p>
                        </div>
                    </v-col>

                    <v-col cols="8" md="10">
                        <div class="pa-1 pl-3 text-body-2 text-md-body-1 text-start black--text">   
                            <v-row no-gutters>

                                <v-col cols="12" md="6">
                                    <p class="mb-0"><b>ALIAS: </b> {{ dato.alias }}</p>
                                    <p class="mb-0"><b>Nombre Socio: </b> {{ dato.partner_name }}</p>
                                    <p class="mb-0" v-if="$vuetify.breakpoint.mdAndUp"><b>Fecha Nacimiento Socio: </b> {{ formateDate(dato.partner_birthdate) }}</p>
                                    <p class="mb-0"><b>DNI Socio: </b> {{ dato.partner_dni}}</p>
                                    <p class="mb-0" v-if="$vuetify.breakpoint.mdAndUp"><b>Teléfono Socio: </b> {{ dato.partner_phone }}</p>
                                    <p class="mb-0" v-if="$vuetify.breakpoint.mdAndUp"><b>Ultima Visita: </b> {{formateDate(dato.last_visit) }}</p>
                                    <p class="mb-0" v-if="$vuetify.breakpoint.mdAndUp"><b>Tipo de Visita: </b> {{dato.visit_type.description}}</p>
                                </v-col>

                                <v-col cols="12" md="6" v-if="dato.id_visit_type_usualy == 2 || dato.observations">
                                    <p class="mb-0" v-if="dato.id_visit_type_usualy == 2"><b>Nombre Afiliado: </b> {{ dato.affiliate_name }}</p>
                                    <p class="mb-0" v-if="dato.id_visit_type_usualy == 2 && $vuetify.breakpoint.mdAndUp"><b>Fecha Nacimiento Afiliado: </b> {{ formateDate(dato.affiliate_birthdate) }}</p>
                                    <p class="mb-0" v-if="dato.id_visit_type_usualy == 2"><b>DNI Afiliado: </b> {{ dato.affiliate_dni}}</p>
                                    <p class="mb-0" v-if="dato.id_visit_type_usualy == 2 && $vuetify.breakpoint.mdAndUp"><b>Teléfono Afiliado: </b> {{ dato.affiliate_phone }}</p>
                                    <p class="mb-0" v-if="$vuetify.breakpoint.mdAndUp && dato.observations"><b>Observaciones: </b> {{ dato.observations }}</p>
                                </v-col>

                                <v-col cols="12" v-if="dato.partner_in_establishment">
                                    <span class="font-weight-bold orange--text">El socio ya está en el establecimiento</span>
                                </v-col>
                            </v-row>
                        </div>
                    </v-col>
                </v-row>

 <!----------------------- ACCIONES ---------------------->

                <v-card-actions v-if="$vuetify.breakpoint.mdAndUp" class="d-flex justify-end pt-0">
                    <v-tooltip bottom>
                        <template v-slot:activator="{ on, attrs }">
                            <v-icon size="25" class="mx-1" color="orange" 
                                    @click="goTo('/editPartner', dato)" 
                                    v-bind="attrs" v-on="on">mdi-card-account-details-outline
                            </v-icon>
                        </template>
                        <span>Actualizar DNI de {{(dato.id_visit_type_usualy == 2) ? 'Socios' : 'Socio'}}</span>
                    </v-tooltip>

                    <v-tooltip bottom v-if="!dato.partner_in_establishment && normal.includes(dato.state.id_state)">
                        <template v-slot:activator="{ on, attrs }">
                            <v-icon size="25" class="mx-1" color="orange" 
                                    @click="goTo('/entryRegister', dato)" 
                                    v-bind="attrs" v-on="on">mdi-cash
                            </v-icon>
                        </template>
                        <span>Pagar Entrada</span>
                    </v-tooltip>
                    
                    <v-tooltip bottom v-if="!dato.partner_in_establishment && normal.includes(dato.state.id_state)">
                        <template v-slot:activator="{ on, attrs }">
                            <v-icon size="25" class="mx-1" color="orange" 
                                    @click="goTo('/entryRegisterLite', dato)" 
                                    v-bind="attrs" v-on="on">mdi-cash-fast
                            </v-icon>
                        </template>
                        <span>Pagar Entrada Rápida</span>
                    </v-tooltip>

                    <v-tooltip bottom v-if="dato.state.id_state == 5">
                        <template v-slot:activator="{ on, attrs }">
                            <v-icon size="25" class="mx-1" color="orange" 
                                    @click="goTo('/membershipReactivation', dato)" 
                                    v-bind="attrs" v-on="on">mdi-account-reactivate
                            </v-icon>
                        </template>
                        <span>Reactivar Membresía</span>
                    </v-tooltip>
                </v-card-actions>

                <div class="d-flex justify-end" v-else>
                    <v-menu transition="slide-y-transition" bottom>

                        <template v-slot:activator="{ on, attrs }">
                            <v-btn color="orange" class="font-weight-bold" x-small style="font-size: 0.8rem" text v-bind="attrs" v-on="on">
                                Acciones <v-icon small>mdi-chevron-down</v-icon>
                            </v-btn>
                        </template>

                            <v-list dense>
                                <v-list-item  @click="viewDato=dato;showVerMas= true">
                                    <v-list-item-icon>
                                        <v-icon>mdi-eye</v-icon>
                                    </v-list-item-icon>
                                <v-list-item-title>Ver Más</v-list-item-title>
                                </v-list-item>

                            <v-list-item @click="goTo('/editPartner', dato)"  >
                                <v-list-item-icon>
                                    <v-icon>mdi-card-account-details-outline</v-icon>
                                </v-list-item-icon>
                                <v-list-item-title>Actualizar DNI de {{(dato.id_visit_type_usualy == 2) ? 'Socios' : 'Socio'}}</v-list-item-title>
                            </v-list-item>

                            <v-list-item @click="goTo('/entryRegister', dato)" v-if="!dato.partner_in_establishment && normal.includes(dato.state.id_state)">
                                <v-list-item-icon>
                                    <v-icon>mdi-cash</v-icon>
                                </v-list-item-icon>
                                <v-list-item-title>Pagar Entrada</v-list-item-title>
                            </v-list-item>

                        </v-list>
                    </v-menu>
                </div>
            </v-card>   
            <v-dialog v-model="showVerMas">
                <v-card class="px-3 pb-2" v-if="showVerMas">
                    <v-card-title>
                        <v-spacer></v-spacer>
                        <v-btn x-small icon @click="showVerMas=false">
                            <v-icon >mdi-close</v-icon>
                        </v-btn>
                    </v-card-title>
            
                    <v-row class="justify-center pb-5">
                        <v-icon color="orange" size=60 >
                            {{ (partner.id_visit_type ==2 ) ? "mdi-account-multiple-check" : "mdi-account-check"}}
                        </v-icon>
                    </v-row>
                    
                    <p class="mb-4 text-center"><b>ALIAS: </b>{{viewDato.alias}}</p>
                    <v-card class="pa-2 mb-3" outlined elevation="0">
                        <span class="orange--text font-weight-bold text-caption mt-n4 py-0 px-2" style="position: absolute; background: #fff;">Socio
                        </span>
            
                        <div class="pa-2 text-body-2">   
                            <p class="mb-0"><b>Nombre: </b>{{viewDato.partner_name}}</p>
                            <p class="mb-0"><b>DNI: </b>{{viewDato.partner_dni}}</p>
                            <p class="mb-0"><b>Fecha de Nacimiento: </b>{{viewDato.partner_birthdate}}</p>
                            <p class="mb-0"><b>Teléfono: </b>{{viewDato.partner_phone}}</p>
                            <p class="mb-0"><b>Ultima Visita: </b>{{formateDate(viewDato.last_visit)}}</p>
                            <p class="mb-0"><b>Tipo de Visita: </b>{{viewDato.visit_type.description}}</p>
                            <p class="mb-0"><b>Observaciones: </b>{{viewDato.observations}}</p>
                        </div>
                      </v-card>
            
                    <v-card v-if="partner.id_visit_type ==2" class="pa-2 mb-3" outlined elevation="0">
                    <span class="orange--text font-weight-bold text-caption mt-n4 py-0 px-2" style="position: absolute; background: #fff;">Afiliado
                    </span>
            
                        <div class="pa-2 text-body-2">   
                            <p class="mb-0"><b>Nombre: </b>{{viewDato.affiliate_name}}</p>
                            <p class="mb-0"><b>DNI: </b>{{viewDato.affiliate_dni}}</p>
                             <p class="mb-0"><b>Fecha de Nacimiento: </b>{{viewDato.affiliate_birthdate}}</p>
                            <p class="mb-0"><b>Teléfono: </b>{{viewDato.affiliate_phone}}</p>
                        </div>
                    </v-card>
                </v-card>
            </v-dialog>
        </div>
    </v-col>            
</v-row>
</div>

</template>

<script>
    
    import eventBus from '../../event-bus'
        export default{

            components: {
                
            },
            

            data(){
                return {
                   partner:null,
                    search: null,
                    filter: null,
                    dato: null,
                    load: false,
                    loadFilter: false,
                    normal: [1,2,3,8,4],
                    showVerMas: false,
                    viewDato: null

                }
            },
            
            beforeMount() {
                
                console.log('vuetify', this.$vuetify)
            },
            methods:{
                goTo(path, partner){
                    console.log(partner)
                    this.$store.commit('setPartner', partner)
                    this.$router.push(path)
                },
                searchPartners(){
                    let vm = this
                    this.load = true
                    this.$http.get(process.env.VUE_APP_PARTNERS+"/search?page=1&pageSize=100&search="+this.search)
                    .then((response)=>{
                        if(response){
                            vm.partner = response.data.data
                            if(response.data.data.length == 0){
                                eventBus.$emit('toast', { show: true, text: 'No se encontraron socios registrados para esta busqueda', color: "red" })
                            }
                        }
                        vm.load = false
                    })
                },
                formateDate(date){
                    if(date != null){ 
                        date.replace(/(T)/, ' ');
                        date.substr(0, 19);
                    }
                    return (date != null) ? this.$moment(date, 'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY') : '';
                }, 
                iconState(state){
                      let icon = {icon: 'mdi-qrcode-scan', color: 'orange'}
                      if(state != null){
                            switch (state) {
                              case 1: case 2: case 3: case 8:
                                  icon = { color: 'green', icon: 'mdi-check-circle' }
                                  break;
                              case 4:
                                  icon = { color: 'info', icon: 'mdi-check-circle' }
                                  break;
                              case 5: case 6: case 7:
                                  icon = { color: 'red', icon: 'mdi-close-circle' }
                                  break;
                            }
                      }
                      return icon
                },
            },
            computed:{
                icon(){
                  let icon = {icon: 'mdi-account-search-outline', color: 'orange'}
                    if(this.partner){
                          if(this.partner.length == 0) icon = {icon: 'mdi-account-remove',  text: "No se encontró ningún socio con el dato ingresado" }
                          if(this.partner.length == 1) icon = {icon: 'mdi-account-check',text: "Socio Encontrado"}
                          if(this.partner.length > 1) icon = {icon: 'mdi-account-group',  text: "Socios Encontrados"}
                    }
                  return icon
                },
                partnerComputed(){
                    let partner = this.partner
                    if(this.partner && this.partner.length && this.filter){
                        partner = this.partner.filter((item) => {
                            let search = item.observations + " " + item.partner_dni + " " + item.partner_name + " " + this.formateDate(item.partner_birthdate) + " " + item.alias + " " + item.partner_phone
                            if(search.toUpperCase().includes(this.filter.toUpperCase())) return item
                        })
                    }
                    return partner
                }
            }
    }
    </script>