<template>
    <div class="py-8">
        <v-row class="mb-3 px-5">
            <v-col cols="12">
                <v-row class="px-md-10 px-4" align="center">
                    <v-col v-if="icon.text" cols="12" md="auto" class="d-flex align-center justify-center justify-md-start pt-md-0 pt-2 pb-0">
                        <p class="orange--text font-weight-bold mb-0">{{icon.text}}</p>
                    </v-col>
                    <v-col :md="icon.text ? (partner ? 4 : 6) : (partner ? 6 : 8)" cols="12" class="pt-md-0 pt-0">
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
                    <v-col cols="12" md="auto" class="d-flex align-center justify-center justify-md-start pt-md-0 pt-2">
                        <v-btn 
                            color="orange" 
                            dark 
                            @click="searchPartners" 
                            :loading="load"
                            class="mr-2">
                            <v-icon left>mdi-magnify</v-icon> Buscar
                        </v-btn>
                        <v-btn 
                            v-if="partner" 
                            color="orange" 
                            dark 
                            @click="goTo('/access', dato)"
                            :loading="load">
                            <v-icon left>mdi-arrow-left-thin</v-icon> Ir a Validación por DNI
                        </v-btn>
                    </v-col>
                </v-row>
                
                <!-- Explicación de la pantalla -->
                <v-row class="px-md-10 px-4 mt-3" v-if="!partner">
                    <v-col cols="12">
                        <v-alert type="info" outlined class="text-body-2">
                            <div class="font-weight-bold mb-2">¿Qué hace esta pantalla?</div>
                            <div>Esta pantalla te permite buscar socios del club ingresando su ALIAS, DNI, Nombre o Número único de membresía. Una vez encontrado el socio, podrás ver su información completa, editarla, registrar su ingreso al club o realizar otras acciones según el estado de su membresía.</div>
                        </v-alert>
                    </v-col>
                </v-row>
             </v-col>

<!----------------- BUSQUEDA NEGATIVA-------------------- -->

            <v-col cols="12" class="text-h6 text-center font-weight-bold" v-if="partnerComputed != null"> 
            </v-col>
               
<!------------- DE BUSQUEDA POSITIVA ------------------------>

            <v-col cols="12" v-if="partnerComputed && partnerComputed.length> 0">
            <v-row class="px-md-10 px-4">
                <v-col cols="12" md="6" v-for="dato,n in partnerComputed" :key="'partner'+n" class="pa-2">
                <v-card class="my-2 pt-2" outlined 
                    :style="'border: solid 2px ' + $vuetify.theme.defaults.light.orange + '; border-left: solid 4px ' + getStateColor(dato.state.id_state) + '; border-top: solid 4px ' + getStateColor(dato.state.id_state) + '; position: relative;'">
                    
                    <!-- Label del estado en la esquina superior izquierda -->
                    <div :style="'position: absolute; top: -1px; left: -1px; background: ' + getStateColor(dato.state.id_state) + '; color: white; padding: 4px 12px; font-size: 0.7rem; font-weight: bold; border-radius: 0 0 4px 0; z-index: 1;'">
                        {{dato.state.description}}
                    </div>

                    <div class="pt-5 pl-4 pr-2">
                        <!-- Alias como label redondeado grande -->
                        <div class="mb-3">
                            <span class="orange--text font-weight-bold" style="font-size: 1.1rem; background: #FFF3E0; padding: 6px 12px; border-radius: 20px; display: inline-block;">
                                {{ dato.alias }}
                            </span>
                        </div>
                        <div class="mb-3" v-if="dato.partner_in_establishment">
                            <span class="font-weight-bold blinking-label" 
                                  style="color: #2196F3; font-size: 0.75rem; background: #E3F2FD; padding: 4px 10px; border-radius: 12px; display: inline-block;">
                                Hoy en el club
                            </span>
                        </div>
                        
                        <div class="text-caption text-md-body-2 text-start black--text" style="font-size: 0.75rem; line-height: 1.6;">   
                            <p class="mb-1"><b>Nombre Socio: </b> {{ dato.partner_name }} - {{ dato.visit_type.description }}</p>
                            <p class="mb-1"><b>Fecha de Nacimiento: </b> {{ formateDate(dato.partner_birthdate) }}</p>
                            <p class="mb-1"><b>DNI: </b> {{ dato.partner_dni}}</p>
                            <p class="mb-1 d-flex align-center">
                                <v-icon small color="orange" class="mr-1">mdi-phone</v-icon>
                                <span>{{ dato.partner_phone }}</span>
                            </p>
                            <p class="mb-1"><b>Ultima Visita: </b> {{formateDate(dato.last_visit) }}</p>
                            <p class="mb-1" v-if="dato.observations"><b>Observaciones: </b> {{ dato.observations }}</p>
                        </div>
                    </div>

 <!----------------------- ACCIONES ---------------------->

                <v-card-actions class="d-flex justify-center pt-2 pb-2 flex-wrap">
                    <v-btn 
                        color="orange" 
                        dark 
                        small 
                        class="ma-1"
                        @click="goTo('/editPartner', dato)">
                        <v-icon left small>mdi-card-account-details-outline</v-icon>
                        Editar
                    </v-btn>

                    <v-btn 
                        v-if="dato.partner_in_establishment"
                        color="blue" 
                        dark 
                        small 
                        class="ma-1"
                        @click="$router.push('/activeVisits')">
                        <v-icon left small>mdi-account-group</v-icon>
                        Ver en el Club
                    </v-btn>

                    <v-btn 
                        v-if="dato.partner_in_establishment && dato.has_consumptions"
                        color="green" 
                        dark 
                        small 
                        class="ma-1"
                        @click="goToConsumed(dato)">
                        <v-icon left small>mdi-cash-multiple</v-icon>
                        Ver consumos
                    </v-btn>

                    <v-btn 
                        v-if="dato.partner_in_establishment"
                        color="red" 
                        dark 
                        small 
                        class="ma-1"
                        @click="goToExit(dato)"
                        :loading="load">
                        <v-icon left small>mdi-exit-run</v-icon>
                        Egreso
                    </v-btn>

                    <!-- Botón Pagar Entrada oculto temporalmente -->
                    <!-- <v-btn 
                        v-if="!dato.partner_in_establishment && normal.includes(dato.state.id_state)"
                        color="orange" 
                        dark 
                        small 
                        class="ma-1"
                        @click="goTo('/entryRegister', dato)">
                        <v-icon left small>mdi-cash</v-icon>
                        Pagar Entrada
                    </v-btn> -->
                    
                    <v-btn 
                        v-if="!dato.partner_in_establishment && normal.includes(dato.state.id_state)"
                        color="orange" 
                        dark 
                        small 
                        class="ma-1"
                        @click="goTo('/entryRegisterLite', dato)">
                        <v-icon left small>mdi-cash-fast</v-icon>
                        Registrar Ingreso
                    </v-btn>

                    <v-btn 
                        v-if="dato.state.id_state == 5"
                        color="orange" 
                        dark 
                        small 
                        class="ma-1"
                        @click="goTo('/membershipReactivation', dato)">
                        <v-icon left small>mdi-account-reactivate</v-icon>
                        Reactivar
                    </v-btn>

                    <!-- Botón Ver Más oculto temporalmente -->
                    <!-- <v-btn 
                        color="grey" 
                        dark 
                        small 
                        class="ma-1"
                        @click="viewDato=dato;showVerMas= true">
                        <v-icon left small>mdi-eye</v-icon>
                        Ver Más
                    </v-btn> -->
                </v-card-actions>
                </v-card>
                </v-col>
            </v-row>
            </v-col>
        </v-row>
        
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
            </v-card>
        </v-dialog>

        <!-- Botón para ver socios en el club -->
        <v-row class="mt-4 mb-4">
            <v-col cols="12" class="d-flex justify-center">
                <v-btn
                    color="orange"
                    dark
                    large
                    @click="$router.push('/activeVisits')"
                >
                    <v-icon left>mdi-account-group</v-icon>
                    Ver quiénes están en el club
                </v-btn>
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
                goToExit(partner){
                    let vm = this
                    // Si es exitRegister, necesitamos obtener los datos completos de la visita
                    if(partner.partner_in_establishment && partner.id_bracelet_1){
                        this.load = true
                        // Obtener consumos primero
                        this.$http.get(process.env.VUE_APP_DEGIRA+"consumptions/get/consume?id_bracelet="+partner.id_bracelet_1)
                        .then((consumeResponse)=>{
                            let total = 0;
                            if(consumeResponse && consumeResponse.data && consumeResponse.data.data && consumeResponse.data.data.products){
                                consumeResponse.data.data.products.map((item) => {
                                    total = total + (parseFloat(item.price) * item.quantity)
                                })
                            }
                            
                            // Obtener datos completos de la visita activa
                            vm.$http.get(process.env.VUE_APP_DEGIRA+"partners/inside", {
                                params: {
                                    page: 1,
                                    pageSize: 100,
                                    search: partner.partner_dni || partner.alias
                                }
                            })
                            .then((visitResponse)=>{
                                if(visitResponse && visitResponse.data && visitResponse.data.data && visitResponse.data.data.length > 0){
                                    // Buscar la visita que corresponde al mismo socio (por id_partner)
                                    const visitData = visitResponse.data.data.find(v => 
                                        v.partner && v.partner.id_partner === partner.id_partner
                                    )
                                    
                                    if(!visitData){
                                        eventBus.$emit('toast', { show: true, text: 'No se encontró la visita activa para este socio. Verifique que el socio esté en el club.', color: "red" })
                                        vm.load = false
                                        return
                                    }
                                    
                                    // Validar que sea el mismo socio
                                    if(visitData.partner.id_partner !== partner.id_partner){
                                        eventBus.$emit('toast', { show: true, text: 'Error: Se encontró una visita de otro socio. Por favor, intente nuevamente.', color: "red" })
                                        vm.load = false
                                        return
                                    }
                                    
                                    // Combinar datos del socio con datos de la visita
                                    let obj = {
                                        ...partner,
                                        ...visitData.partner,
                                        total: total,
                                        id_bracelet_1: visitData.id_bracelet_1,
                                        id_bracelet_2: visitData.id_bracelet_2,
                                        id_visit: visitData.id_visit,
                                        visit_date: visitData.visit_date,
                                        hour_entry: visitData.hour_entry,
                                        id_day: visitData.id_day,
                                        last_visit: visitData.last_visit,
                                        entry_amount_paid: visitData.entry_amount_paid,
                                        extra_entry: visitData.extra_entry,
                                        extra_entry_obs: visitData.extra_entry_obs,
                                        visit_amount_consumed: visitData.visit_amount_consumed,
                                        exit_amount_payed: visitData.exit_amount_payed,
                                        extra_exit: visitData.extra_exit,
                                        extra_exit_obs: visitData.extra_exit_obs,
                                        entry_visit_obs: visitData.entry_visit_obs,
                                        other_visit_obs: visitData.other_visit_obs
                                    }
                                    vm.$store.commit('setPartner', obj)
                                    vm.$router.push('/exitRegister')
                                } else {
                                    eventBus.$emit('toast', { show: true, text: 'No se encontró la visita activa del socio', color: "red" })
                                }
                                vm.load = false
                            })
                            .catch((error)=>{
                                console.error('Error al obtener visita:', error)
                                eventBus.$emit('toast', { show: true, text: 'Error al obtener la información de la visita', color: "red" })
                                vm.load = false
                            })
                        })
                        .catch((error)=>{
                            console.error('Error al obtener consumos:', error)
                            // Continuar aunque falle obtener consumos (puede no tener consumos)
                            let total = 0
                            // Intentar obtener la visita de todas formas
                            vm.$http.get(process.env.VUE_APP_DEGIRA+"partners/inside", {
                                params: {
                                    page: 1,
                                    pageSize: 100,
                                    search: partner.partner_dni || partner.alias
                                }
                            })
                            .then((visitResponse)=>{
                                if(visitResponse && visitResponse.data && visitResponse.data.data && visitResponse.data.data.length > 0){
                                    // Buscar la visita que corresponde al mismo socio (por id_partner)
                                    const visitData = visitResponse.data.data.find(v => 
                                        v.partner && v.partner.id_partner === partner.id_partner
                                    )
                                    
                                    if(!visitData){
                                        eventBus.$emit('toast', { show: true, text: 'No se encontró la visita activa para este socio. Verifique que el socio esté en el club.', color: "red" })
                                        vm.load = false
                                        return
                                    }
                                    
                                    // Validar que sea el mismo socio
                                    if(visitData.partner.id_partner !== partner.id_partner){
                                        eventBus.$emit('toast', { show: true, text: 'Error: Se encontró una visita de otro socio. Por favor, intente nuevamente.', color: "red" })
                                        vm.load = false
                                        return
                                    }
                                    
                                    let obj = {
                                        ...partner,
                                        ...visitData.partner,
                                        total: total,
                                        id_bracelet_1: visitData.id_bracelet_1,
                                        id_bracelet_2: visitData.id_bracelet_2,
                                        id_visit: visitData.id_visit,
                                        visit_date: visitData.visit_date,
                                        hour_entry: visitData.hour_entry,
                                        id_day: visitData.id_day,
                                        last_visit: visitData.last_visit,
                                        entry_amount_paid: visitData.entry_amount_paid,
                                        extra_entry: visitData.extra_entry,
                                        extra_entry_obs: visitData.extra_entry_obs,
                                        visit_amount_consumed: visitData.visit_amount_consumed,
                                        exit_amount_payed: visitData.exit_amount_payed,
                                        extra_exit: visitData.extra_exit,
                                        extra_exit_obs: visitData.extra_exit_obs,
                                        entry_visit_obs: visitData.entry_visit_obs,
                                        other_visit_obs: visitData.other_visit_obs
                                    }
                                    vm.$store.commit('setPartner', obj)
                                    vm.$router.push('/exitRegister')
                                } else {
                                    eventBus.$emit('toast', { show: true, text: 'No se encontró la visita activa del socio', color: "red" })
                                }
                                vm.load = false
                            })
                            .catch((error2)=>{
                                console.error('Error al obtener visita:', error2)
                                eventBus.$emit('toast', { show: true, text: 'Error al obtener la información de la visita', color: "red" })
                                vm.load = false
                            })
                        })
                    } else {
                        eventBus.$emit('toast', { show: true, text: 'El socio no está actualmente en el club', color: "red" })
                    }
                },
                goToConsumed(partner){
                    // El objeto partner ya incluye id_bracelet_1 e id_bracelet_2 cuando está en el club
                    if(partner.partner_in_establishment){
                        const braceletId = partner.id_bracelet_1 || partner.id_bracelet_2
                        if(braceletId){
                            this.$router.push({
                                path: '/consumed',
                                query: {
                                    id_bracelet: braceletId
                                }
                            })
                        } else {
                            eventBus.$emit('toast', { show: true, text: 'No se encontró el número de tarjeta del socio', color: "red" })
                        }
                    } else {
                        eventBus.$emit('toast', { show: true, text: 'El socio no está actualmente en el club', color: "red" })
                    }
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
                getStateColor(state){
                      let color = '#FF9800' // orange por defecto
                      if(state != null){
                            switch (state) {
                              case 1: case 2: case 3: case 8:
                                  color = '#4CAF50' // green
                                  break;
                              case 4:
                                  color = '#2196F3' // info/blue
                                  break;
                              case 5: case 6: case 7:
                                  color = '#F44336' // red
                                  break;
                            }
                      }
                      return color
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
                    // Ordenar: primero los normales (estados 1,2,3,8,4), luego los vencidos (estados 5,6,7)
                    if(partner && partner.length){
                        partner = [...partner].sort((a, b) => {
                            const stateA = a.state ? a.state.id_state : null
                            const stateB = b.state ? b.state.id_state : null
                            
                            // Estados normales: 1, 2, 3, 8, 4
                            const normalStates = [1, 2, 3, 8, 4]
                            // Estados vencidos: 5, 6, 7
                            const expiredStates = [5, 6, 7]
                            
                            const isANormal = normalStates.includes(stateA)
                            const isBNormal = normalStates.includes(stateB)
                            const isAExpired = expiredStates.includes(stateA)
                            const isBExpired = expiredStates.includes(stateB)
                            
                            // Si A es normal y B es vencido, A va primero
                            if(isANormal && isBExpired) return -1
                            // Si A es vencido y B es normal, B va primero
                            if(isAExpired && isBNormal) return 1
                            // Si ambos son del mismo tipo, mantener el orden original
                            return 0
                        })
                    }
                    return partner
                }
            }
    }
    </script>

<style scoped>
@keyframes blink {
    0%, 100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.5;
        transform: scale(0.98);
    }
}

.blinking-label {
    animation: blink 1s ease-in-out infinite;
}
</style>