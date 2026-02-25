<template>
    <div class="py-8 px-5">
       <!--  <v-row v-if="mode == 0">
          <v-col cols="12" md="6" v-for="n in 2" :key="'btn'+n">
            <v-card elevation="4" outlined @click="changeMode(n)" class="rounded-lg d-flex justify-center align-center text-center" style="height: 130px;">
              <v-card-text class="orange--text">
                <v-icon size="40" class="orange--text pb-4">{{(n == 1) ? 'mdi-barcode-scan' : 'mdi-magnify-scan'}}</v-icon>
                <h4>{{(n == 1) ? 'Usar Scanner' : 'Usar buscador manual'}}</h4>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row> -->
        <div>

        <!-- Botón flotante para cambiar modo (icono grande oculto para ganar espacio) -->
        <v-row class="mb-2 mt-2" no-gutters>
            <v-col cols="12" class="d-flex justify-end px-3">   
                <v-btn
                    color="orange"
                    elevation="4"
                    style="border-radius: 1.5rem;"
                    tile
                    small
                    dark
                    @click="(mode == 1) ? changeMode(2) : changeMode(1)">
                    <v-icon left small>mdi-cached</v-icon>
                    {{(mode == 1) ? 'Cambiar a Buscador Manual' : 'Cambiar a scanner'}}
                </v-btn>
            </v-col>
        </v-row>

           
          <v-form ref="form" onsubmit="return false">
            <!-- buscador scaner -->
              <v-row no-gutters class="px-10 pt-5" v-if="scannToPc && !isApp">
                  <v-col cols="12"> 
                      <v-text-field
                          label="Realice la lectura con el scanner"
                          placeholder="Este input debe estar focalizado al escanear"
                          outlined
                          dense
                          @blur="$refs.scannInput.focus()"
                          autofocus
                          ref="scannInput"
                          v-model="dataScann"
                          @keydown.enter="dataDNI = parseDataDNI(dataScann)"
                      />
                  </v-col>
              </v-row>

            <!-- buscador manual -->
              <v-row no-gutters class="pt-5" v-else>
                  <v-col cols="12" md="12">
                      <v-text-field
                          prepend-inner-icon="mdi-card-account-details-outline"
                          placeholder="DNI o Número único de membresía"
                          outlined
                          dense
                          ref="dniInput"
                          clearable
                          :disabled="load"
                          v-model="dni"
                          @keydown.enter="getIPartners"
                          :rules='[(v) => !!v || "Este campo es requerido"]'
                      />
                  </v-col>
                  <v-col cols="12" v-if="!scannToPc">
                      <v-btn color="orange" class="mt-md-0 mt-4" block dark @click="getIPartners" :loading="load">
                          <v-icon left>mdi-magnify</v-icon> Buscar
                      </v-btn>
                  </v-col>
              </v-row>
  
          </v-form>
  
          <!-- RESULTADO -->
          <!-- si partner esta en null no ha buscado nada, si partner esta en false busco y no encontro ningun socio y si si encontro socio en partner se guardan los datos -->
          <v-row no-gutters class="d-flex justify-center align-center text-center px-3" v-if="partner != null">

            <!-- SOCIO NO ENCONTRADO MANUAL -->
            <v-col cols="12" class="text-h6 px-10 text-center font-weight-bold" v-if="!partner"> 
                
                <v-row class="justify-center mb-2 mt-2">
                    <v-icon :color="`${icon.color} darken-1`" class="text-h1">{{icon.icon}}</v-icon>
                </v-row>

                <p :class="`${icon.color}--text text-body-2`">No se encontró ningún socio con el número de DNI o Número único de membresía ingresado</p>

                <!-- <p class="text-body-2" v-if="dataDNI == null">DNI o Número único de membresía ingresado: {{ dni }}</p> -->

                <v-card class="pa-2 mb-3 text-start" outlined elevation="0" v-if="dataDNI != null">
                    <span class="orange--text font-weight-bold text-caption mt-n4 py-0 px-2" style="position: absolute; background: #fff;">DNI Escaneado</span>
                    <div class="pa-2 text-body-2">   
                        <p class="mb-0"><b>DNI: </b> {{ dataDNI.identification }}</p>
                        <p class="mb-0"><b>Nombre: </b> {{ dataDNI.name }} {{ dataDNI.surname }}</p>
                        <p class="mb-0"><b>Fecha de Nacimiento: </b> {{ dataDNI.date_birth }}</p>
                    </div>
                </v-card>

                <!-- OPCIONES BUSQUEDA NEGATIVA -->
                <v-row>
                    <v-col cols="12" md="6">
                        <v-btn
                            class="mt-2"
                            color="orange" 
                            dark 
                            small
                            @click="$router.push('/registerPartner?dni='+JSON.stringify(dataReturn))">
                            <v-icon left>mdi-account-plus</v-icon>DAR DE ALTA A ESTE SOCIO
                        </v-btn>

                    </v-col> 
                    <v-col  cols="12" md="6">
                        <v-btn
                            class="mt-2"
                            small
                            color="orange" 
                            dark 
                            @click="$router.push('/partnerSearch')">
                            <v-icon left>mdi-account-search</v-icon>CONSULTAR POR OTRO MEDIO 
                        </v-btn>

                    </v-col>
                </v-row>

            </v-col>

            <!-- DNI Escaneado (si existe) -->
            <v-col cols="12" md="6" v-if="partner && dataDNI != null" class="px-10"> 
                <v-card class="pa-2 mb-3 text-start" outlined elevation="0">
                      <span class="orange--text font-weight-bold text-caption mt-n4 py-0 px-2" style="position: absolute; background: #fff;">DNI Escaneado</span>
                      <div class="pa-2 text-body-2">   
                          <p class="mb-0"><b>DNI: </b> {{ dataDNI.identification }}</p>
                          <p class="mb-0"><b>Nombre: </b> {{ dataDNI.name }} {{ dataDNI.surname }}</p>
                          <p class="mb-0"><b>Fecha de Nacimiento: </b> {{ dataDNI.date_birth }}</p>
                      </div>
                </v-card>
            </v-col>

               <!-- SOCIO ENCONTRADO -->
            <v-col cols="12" v-if="partner">
                <v-card class="py-3" color="transparent" elevation="0">
                    
                    <!-- Header: Alias, Estado y Mensaje de establecimiento -->
                    <v-row class="align-center mb-3" no-gutters>
                        <v-col cols="12" sm="auto" class="pr-sm-3 mb-2 mb-sm-0">
                            <v-chip 
                                color="orange" 
                                text-color="white" 
                                class="px-3"
                                style="font-size: 1rem; font-weight: bold;">
                                <v-icon left small>mdi-account-circle</v-icon>
                                {{formatAlias(partner.alias)}}
                            </v-chip>
                        </v-col>
                        <v-col cols="12" sm="auto" class="d-flex align-center pr-sm-3 mb-2 mb-sm-0">
                            <v-icon :color="`${icon.color} darken-1`" class="mr-2">{{icon.icon}}</v-icon>
                            <span :class="`${icon.color}--text font-weight-medium`">
                                {{partner.state.description}} - {{partner.state.actions.description}}
                            </span>
                        </v-col>
                        <v-col cols="12" sm="auto" v-if="partner.partner_in_establishment" class="d-flex align-center">
                            <span class="font-weight-bold text-body-2 orange--text">
                                El socio ya accedió al establecimiento
                            </span>
                        </v-col>
                    </v-row>

                    <!-- Dos columnas: Socio a la izquierda, Visita a la derecha -->
                    <v-row no-gutters>
                        <!-- Columna Izquierda: Información del Socio -->
                        <v-col cols="12" md="6" class="pr-md-2 pr-0 mb-3 mb-md-0">
                            <v-card class="mb-3" outlined elevation="2" style="border-left: 4px solid #ff9800;">
                              <v-card-title class="orange white--text pa-2" style="font-size: 0.9rem;">
                                <v-icon left x-small>mdi-account</v-icon>
                                Información del Socio
                              </v-card-title>
                              <v-card-text class="pa-3">
                                <div class="d-flex align-center mb-2">
                                  <v-icon x-small color="orange" class="mr-2">mdi-account-outline</v-icon>
                                  <span class="text-caption grey--text mr-2">Nombre:</span>
                                  <span class="text-body-2 font-weight-medium">{{ partner.partner_name }}</span>
                                </div>
                                <div class="d-flex align-center mb-2">
                                  <v-icon x-small color="orange" class="mr-2">mdi-card-account-details</v-icon>
                                  <span class="text-caption grey--text mr-2">DNI:</span>
                                  <v-chip x-small color="grey lighten-2">{{ partner.partner_dni }}</v-chip>
                                </div>
                                <div class="d-flex align-center mb-2">
                                  <v-icon x-small color="orange" class="mr-2">mdi-calendar</v-icon>
                                  <span class="text-caption grey--text mr-2">Fecha Nac.:</span>
                                  <span class="text-body-2 font-weight-medium">{{ formatDate(partner.partner_birthdate, 'DD/MM/YYYY') }}</span>
                                </div>
                                <div class="d-flex align-center" v-if="partner.partner_phone">
                                  <v-icon x-small color="orange" class="mr-2">mdi-phone</v-icon>
                                  <span class="text-caption grey--text mr-2">Teléfono:</span>
                                  <span class="text-body-2 font-weight-medium">{{ partner.partner_phone }}</span>
                                </div>
                              </v-card-text>
                            </v-card>
                        </v-col>

                        <!-- Columna Derecha: Datos de Visita -->
                        <v-col cols="12" md="6" class="pl-md-2 pl-0">
                            <v-card class="mb-3" outlined elevation="2" style="border-left: 4px solid #2196F3;">
                              <v-card-title class="blue white--text pa-2" style="font-size: 0.9rem;">
                                <v-icon left x-small>mdi-calendar-clock</v-icon>
                                Datos de Visita
                              </v-card-title>
                              <v-card-text class="pa-3">
                                <div class="d-flex align-center flex-wrap mb-2">
                                  <v-icon x-small color="blue" class="mr-2">mdi-calendar-check</v-icon>
                                  <span class="text-caption grey--text mr-2">Última Visita:</span>
                                  <v-chip 
                                    x-small 
                                    :color="getLastVisitColor(partner.last_visit)" 
                                    text-color="white"
                                    class="mr-1">
                                    {{partner.last_visit ? formatDate(partner.last_visit,'DD/MM/YYYY') : 'N/A'}}
                                  </v-chip>
                                  <span v-if="partner.last_visit" class="text-caption grey--text">
                                    ({{getDaysSinceLastVisit(partner.last_visit)}})
                                  </span>
                                </div>
                                <div class="d-flex align-center mb-2">
                                  <v-icon x-small color="blue" class="mr-2">mdi-account-group</v-icon>
                                  <span class="text-caption grey--text mr-2">Tipo:</span>
                                  <v-chip x-small color="blue lighten-1" text-color="white">
                                    {{partner.visit_type.description}}
                                  </v-chip>
                                </div>
                                <div v-if="partner.expultion_reason" class="mb-2">
                                  <v-alert type="error" dense outlined class="mb-0 pa-2">
                                    <div class="d-flex align-center">
                                      <v-icon x-small left>mdi-alert-circle</v-icon>
                                      <div class="text-caption">
                                        <strong>Expulsión:</strong> {{ partner.expultion_reason }}
                                      </div>
                                    </div>
                                  </v-alert>
                                </div>
                                <div v-if="partner.suspension_reason" class="mb-2">
                                  <v-alert type="warning" dense outlined class="mb-0 pa-2">
                                    <div class="d-flex align-center">
                                      <v-icon x-small left>mdi-alert</v-icon>
                                      <div class="text-caption">
                                        <strong>Suspensión:</strong> {{ partner.suspension_reason }}
                                      </div>
                                    </div>
                                  </v-alert>
                                </div>
                                <div v-if="partner.observations">
                                  <v-alert type="info" dense outlined class="mb-0 pa-2">
                                    <div class="d-flex align-start">
                                      <v-icon x-small left class="mt-0">mdi-information</v-icon>
                                      <div class="text-caption">
                                        {{ partner.observations }}
                                      </div>
                                    </div>
                                  </v-alert>
                                </div>
                              </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                </v-card>
            </v-col>
  
              <!-- Botones de acción -->
              <v-col cols="12" v-if="partner" class="mb-1">
                  <!-- Botones cuando el socio está en el establecimiento -->
                  <v-row no-gutters v-if="partner.partner_in_establishment">
                      <v-col cols="12" :sm="partner.has_consumptions ? 4 : 6" class="pr-sm-1 mb-2 mb-sm-0">
                          <v-btn color="blue" block dark 
                          @click="$router.push('/activeVisits')">
                            <v-icon left small>mdi-account-group</v-icon>
                            Ver en el Club
                          </v-btn>
                      </v-col>
                      <v-col cols="12" sm="4" class="px-sm-1 mb-2 mb-sm-0" v-if="partner.has_consumptions">
                          <v-btn color="green" block dark 
                          @click="goToConsumed">
                            <v-icon left small>mdi-cash-multiple</v-icon>
                            Ver consumos
                          </v-btn>
                      </v-col>
                      <v-col cols="12" :sm="partner.has_consumptions ? 4 : 6" :class="partner.has_consumptions ? 'pl-sm-1' : 'pl-sm-1'">
                          <v-btn color="red" block dark 
                          @click="goToExit"
                          :loading="load">
                            <v-icon left small>mdi-exit-run</v-icon>
                            Egreso
                          </v-btn>
                      </v-col>
                  </v-row>
                  
                  <!-- Botones cuando el socio puede ingresar -->
                  <v-row no-gutters v-if="(partner.state.actions.id_action == 1 || partner.state.actions.id_action == 2 || partner.state.actions.id_action == 5) && !partner.partner_in_establishment">
                      <!-- Botón Pagar Entrada oculto -->
                      <!-- <v-col cols="12" sm="6" class="pr-sm-1 mb-2 mb-sm-0">
                          <v-btn color="orange" block dark 
                          @click="goToEntryRegister">
                            <v-icon left small>mdi-cash</v-icon>
                            Pagar Entrada {{(partner.state.actions.id_action == 5) ? '$0' : ''}}
                          </v-btn>
                      </v-col> -->
                      <v-col cols="12">
                          <v-btn color="orange" block dark 
                          @click="goToEntryRegisterLite">
                            <v-icon left small>mdi-cash-fast</v-icon>
                            Registrar Ingreso
                          </v-btn>
                      </v-col>
                  </v-row>
                  
                  <!-- Botón de reactivación -->
                  <v-row no-gutters v-if="partner.state.actions.id_action == 3">
                      <v-col cols="12">
                          <v-btn color="orange" block dark 
                          @click="$router.push('/membershipReactivation')">
                            <v-icon left small>mdi-account-reactivate</v-icon>
                            Reactivar Membresía
                          </v-btn>
                      </v-col>
                  </v-row>
              </v-col>
  
             
  
          </v-row>
        </div>
    </div>
  </template>
  
  <script>
    import { openCameraRN } from '../../helpers/reactNative';
    import eventBus from "../../event-bus";
    export default{
        data(){
            return{
              mode: 2,
              openCameraRN,
              dni: '',
              load: false,
              scannToPc: false,
              dataScann: '',
              partner: null,
              dataDNI: null
            }
        },
        beforeMount(){
            if(this.$route.query.search){
              this.changeMode(2)
              this.dni = this.$route.query.search
              this.getIPartners()
            }
            /*else{
              if(this.isApp) this.openCameraRN()
            }*/
        },
        created(){
            let vm = this
            eventBus.$on("readDNI", function (result) {
              vm.dataDNI = vm.parseDataDNI(result)
            });
        },
        watch:{
            dataDNI(val){
              if(val){
                this.dni = val.identification;
                this.getIPartners()
              }
            },
            scannToPc(val){
              if(val){
                let vm = this
                setTimeout(() => {
                  vm.$refs.scannInput.focus()
                }, 500);
              }
            }
        },
        computed:{
            isApp(){
              return (window.ReactNativeWebView);
            },
            dataReturn(){
              if(this.dataDNI != null) 
              return {
                name: this.dataDNI.name,
                surname: this.dataDNI.surname,
                identification: this.dni,
                date_birth: this.dataDNI.date_birth,
              }
              else return { identification: this.dni }
            },
            icon(){
                let icon = {icon: 'mdi-qrcode-scan', color: 'orange'}
                if(this.partner != null){
                    if(this.partner){
                        switch (this.partner.state.id_state) {
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
                    }else icon = { color: 'red', icon: 'mdi-close-circle' }
                }
                return icon
            },
        },
        methods:{

            changeMode(mode){
              this.mode = mode
              if(mode == 0) this.clean()
  
              if(mode == 1){
                if(this.isApp) {
                  this.openCameraRN()
                  this.mode = 0
                }
                else this.scannToPc = true
              }
  
              if(mode == 2){
                this.clean(); 
                this.scannToPc = false
              }
            },
            generateNumberDNI(){
              return this.$moment().format('YYYYMMDDHHmmSS');
            },
            formatDate(date, format){
                if(date != null){ 
                      date.replace(/(T)/, ' ');
                      date.substr(0, 19);
                }
                return (date) ? this.$moment(date, 'YYYY-MM-DD HH:mm:ss').format(format) : ''
            },
            getDaysSinceLastVisit(lastVisitDate){
                if(!lastVisitDate) return 'N/A';
                const lastVisit = this.$moment(lastVisitDate);
                const today = this.$moment();
                const daysDiff = today.diff(lastVisit, 'days');
                
                if(daysDiff === 0) return 'Hoy';
                if(daysDiff === 1) return 'Hace 1 día';
                return `Hace ${daysDiff} días`;
            },
            formatAlias(alias){
                if (!alias) return '';
                return String(alias).replace(/---/g, ' ').replace(/----/g, ' - ');
            },
            getLastVisitColor(lastVisitDate){
                if(!lastVisitDate) return 'grey';
                const lastVisit = this.$moment(lastVisitDate);
                const today = this.$moment();
                const daysDiff = today.diff(lastVisit, 'days');
                
                if(daysDiff === 0) return 'green';
                if(daysDiff <= 7) return 'blue';
                if(daysDiff <= 30) return 'orange';
                return 'red';
            },
            clean(){
                this.partner = null
                this.dataDNI = null
                this.dataScann = ''
                this.dni = ''
            },
            getIPartners() {
                if(this.dni){
                    let vm = this;
                    this.load = true
                    let params = (this.dni != null) ? `dni=${this.dni}` : "";
                    this.$http.get(`${process.env.VUE_APP_PARTNERS}?${params}&page=1&pageSize=10`)
                        .then((res) => {
                          if(res){
                            vm.partner = (res.data.data) ? res.data.data : false
                            vm.$store.commit('setPartner', res.data.data)
                            vm.dataScann = ''
                            vm.$refs.scannInput.focus()
                          }
                          vm.load = false
                        }).catch((err) => {
                          console.log(err)
                          vm.load = false
                        });
                }else eventBus.$emit('toast', { show: true, text: "Ingrese DNI", color: "red" })
            },
            goToEntryRegister(){
                this.$store.commit('setPartner', this.partner)
                this.$router.push('/entryRegister')
            },
            goToEntryRegisterLite(){
                this.$store.commit('setPartner', this.partner)
                this.$router.push('/entryRegisterLite')
            },
            goToConsumed(){
                // El objeto partner ya incluye id_bracelet_1 e id_bracelet_2 cuando está en el club
                if(this.partner.partner_in_establishment){
                    const braceletId = this.partner.id_bracelet_1 || this.partner.id_bracelet_2
                    if(braceletId){
                        this.$router.push({
                            path: '/consumed',
                            query: {
                                id_bracelet: braceletId
                            }
                        })
                    } else {
                        eventBus.$emit('toast', { show: true, text: 'No se encontró el número de brazalete del socio', color: "red" })
                    }
                }
            },
            goToExit(){
                let vm = this
                // Si es exitRegister, necesitamos obtener los datos completos de la visita
                if(this.partner.partner_in_establishment && this.partner.id_bracelet_1){
                    this.load = true
                    // Obtener consumos primero
                    this.$http.get(process.env.VUE_APP_DEGIRA+"consumptions/get/consume?id_bracelet="+this.partner.id_bracelet_1)
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
                                search: vm.partner.partner_dni || vm.partner.alias
                            }
                        })
                        .then((visitResponse)=>{
                            if(visitResponse && visitResponse.data && visitResponse.data.data && visitResponse.data.data.length > 0){
                                // Buscar la visita que corresponde al mismo socio (por id_partner)
                                const visitData = visitResponse.data.data.find(v => 
                                    v.partner && v.partner.id_partner === vm.partner.id_partner
                                )
                                
                                if(!visitData){
                                    eventBus.$emit('toast', { show: true, text: 'No se encontró la visita activa para este socio. Verifique que el socio esté en el club.', color: "red" })
                                    vm.load = false
                                    return
                                }
                                
                                // Validar que sea el mismo socio
                                if(visitData.partner.id_partner !== vm.partner.id_partner){
                                    eventBus.$emit('toast', { show: true, text: 'Error: Se encontró una visita de otro socio. Por favor, intente nuevamente.', color: "red" })
                                    vm.load = false
                                    return
                                }
                                
                                // Combinar datos del socio con datos de la visita
                                let obj = {
                                    ...vm.partner,
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
                                search: vm.partner.partner_dni || vm.partner.alias
                            }
                        })
                        .then((visitResponse)=>{
                            if(visitResponse && visitResponse.data && visitResponse.data.data && visitResponse.data.data.length > 0){
                                // Buscar la visita que corresponde al mismo socio (por id_partner)
                                const visitData = visitResponse.data.data.find(v => 
                                    v.partner && v.partner.id_partner === vm.partner.id_partner
                                )
                                
                                if(!visitData){
                                    eventBus.$emit('toast', { show: true, text: 'No se encontró la visita activa para este socio. Verifique que el socio esté en el club.', color: "red" })
                                    vm.load = false
                                    return
                                }
                                
                                // Combinar datos del socio con datos de la visita
                                let obj = {
                                    ...vm.partner,
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
                }
            },
            parseDataDNI(qr_result){
                 // 1 - Left and Rigth Trim
                  let qr_result_clean = qr_result.trim();
                  // 2 - If start with @ remove it
                  if (qr_result_clean.startsWith('@'))
                    qr_result_clean = qr_result_clean.substring(1);
                  // 3 - Split by @
                  let qr_result_split = qr_result_clean.split('@');
                  // 4 - Trim each element
                  qr_result_split = qr_result_split.map(element => element.trim());
                  let data;
                  // 4 - Decide if is Old or New ID
                  if (qr_result_split.length <= 9) {
                    // Is New
                    data = {
                      name: qr_result_split[2],
                      surname: qr_result_split[1],
                      tramit_number: qr_result_split[0],
                      gender: qr_result_split[3],
                      identification: qr_result_split[4],
                      copy_card: qr_result_split[5],
                      date_birth: qr_result_split[6],
                      date_issue: qr_result_split[7],
                      ...(qr_result_split[8] && { start_end_cuil: qr_result_split[8] }),
                    };
                  } else {
                    // Is Old
                    data = {
                      name: qr_result_split[4],
                      surname: qr_result_split[3],
                      tramit_number: qr_result_split[9],
                      gender: qr_result_split[7],
                      identification: qr_result_split[0],
                      copy_card: qr_result_split[1],
                      date_birth: qr_result_split[6],
                      date_issue: qr_result_split[8],
                      nationality: qr_result_split[5],
                      of_ident: qr_result_split[10],
                      date_expirity: qr_result_split[11],
                    };
                  }
                  return data;
                }
            }
            
    }
  </script> 