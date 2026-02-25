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

        <!-- ICONO DE TIPO DE BUSQUEDA  -->
        <v-row class="mb-3 mt-md-0 mt-5" no-gutters>
              <v-col cols="12" class="d-flex justify-center pt-md-0 pt-16"> 
                  <v-icon :color="`orange darken-1`" class="text-h1">{{(mode == 1)?"mdi-qrcode-scan" :" mdi-keyboard" }}</v-icon>
              </v-col>

              <!-- boton flotante  -->
            <v-row :style="`right: ${($vuetify.breakpoint.mdAndUp) ? '6.5rem' : '3rem'} !important; position: fixed; top: 6.5rem; z-index: 4;`" class="px-3">   
            <v-btn
                color="orange"
                elevation="6"
                style="width: 20rem; border-radius: 1.5rem;`"
                tile
                medium
                dark
                
                @click="(mode == 1) ? changeMode(2) : changeMode(1)"><v-icon left>mdi-cached</v-icon>
                {{(mode == 1) ? 'Cambiar a Buscador Manual' : 'Cambiar a scanner'}}
            </v-btn>
            </v-row>
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
          <v-row no-gutters class="d-flex justify-center align-center text-center" v-if="partner != null">

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

            <!-- si existe el socio -->
            <v-col cols="12" md="6" class="text-h6 px-10 text-center font-weight-bold" v-if="partner"> 
                <!-- SOCIO NO ENCONTRADO (SCANER) -->
                <v-row class="justify-center mb-2">
                    <v-icon :color="`${icon.color} darken-1`" class="text-h1 pt-5">{{icon.icon}}</v-icon>
                </v-row>
                <span :class="`${icon.color}--text`">{{(partner) ? partner.state.description : 'No Socio'}}</span>

                <p :class="`${icon.color}--text text-body-2`">{{(partner) ? partner.state.actions.description : 'No se encontró ningún socio con el número de DNI o Número único de membresía ingresado'}}</p>

                
                <v-card class="pa-2 mb-3 text-start" outlined elevation="0" v-if="dataDNI != null">
                      <span class="orange--text font-weight-bold text-caption mt-n4 py-0 px-2" style="position: absolute; background: #fff;">DNI Escaneado</span>
                      <div class="pa-2 text-body-2">   
                          <p class="mb-0"><b>DNI: </b> {{ dataDNI.identification }}</p>
                          <p class="mb-0"><b>Nombre: </b> {{ dataDNI.name }} {{ dataDNI.surname }}</p>
                          <p class="mb-0"><b>Fecha de Nacimiento: </b> {{ dataDNI.date_birth }}</p>
                      </div>
                </v-card>
            </v-col>

               <!-- SOCIO ENCONTRADO -->
            <v-col cols="12" md="6" v-if="partner">
                <v-card class="py-3" color="transparent" elevation="0">
                    
                    <v-row class="justify-center pt-3 pb-6"> 
                        Alias 
                        <span class="ml-1 orange--text font-weight-bold text-uppercase">{{partner.alias}}</span>
                    </v-row>

                    <v-card class="pa-2 mb-3 text-start" outlined elevation="0">
                      <span class="orange--text font-weight-bold text-caption mt-n4 py-0 px-2" style="position: absolute; background: #fff;">Socio</span>

                      <div class="pa-2 text-body-2">   
                          <p class="mb-0"><b>Nombre: </b> {{ partner.partner_name }}</p>
                          <p class="mb-0"><b>DNI: </b> {{ partner.partner_dni }}</p>
                          <p class="mb-0"><b>Fecha de Nacimiento: </b> {{ formatDate(partner.partner_birthdate, 'DD/MM/YYYY') }}</p>
                          <p class="mb-0" v-if="partner.partner_phone"><b>Teléfono: </b> {{ partner.partner_phone }}</p>
                      </div>
                    </v-card>

                    <v-card class="pa-2 mb-3 text-start" outlined elevation="0" v-if="partner.visit_type.id_visit_type == 2">
                      <span class="orange--text font-weight-bold text-caption mt-n4 py-0 px-2" style="position: absolute; background: #fff;">Afiliado</span>

                        <div class="pa-2 text-body-2">   
                            <p class="mb-0"><b>Nombre: </b> {{ partner.affiliate_name }}</p>
                            <p class="mb-0"><b>DNI: </b> {{ partner.affiliate_dni }}</p>
                            <p class="mb-0" v-if="partner.affiliate_birthdate"><b>Fecha de Nacimiento: </b> {{ formatDate(partner.affiliate_birthdate, 'DD/MM/YYYY') }}</p>
                            <p class="mb-0" v-if="partner.affiliate_phone"><b>Teléfono: </b> {{ partner.affiliate_phone }}</p>
                        </div>
                    </v-card> 

                    <v-card class="pa-2 mb-3 text-start" outlined elevation="0">
                      <span class="orange--text font-weight-bold text-caption mt-n4 py-0 px-2" style="position: absolute; background: #fff;">Datos de Visita</span>
                        <div class="pa-2 text-body-2">  
                            <p class="mb-0"><b>Ultima Visita: </b>{{formatDate(partner.last_visit,'DD/MM/YYYY')}}</p> 
                            <p class="mb-0"><b>Tipo de visitante: </b> {{partner.visit_type.description}}</p>
                            <p class="mb-0" v-if="partner.expultion_reason"><b>Razón de Expulsión: </b> {{ partner.expultion_reason }}</p>
                            <p class="mb-0" v-if="partner.suspension_reason"><b>Razón de Expulsión: </b> {{ partner.suspension_reason }}</p>
                            <p class="mb-0" v-if="partner.observations"><b>Observaciones: </b> {{ partner.observations }}</p>
                        </div>
                    </v-card>
                </v-card>
            </v-col>
  
              <!-- SOCIO DENTRO -->
              <v-col cols="12" v-if="partner && partner.partner_in_establishment" class="mb-1 text-center">
                <span class="font-weight-bold text-body-2 orange--text">
                  El socio ya accedió al establecimiento
                  <v-btn color="orange" block dark class="mb-2" @click="$router.push(`/consumed?id_bracelet=${partner.id_bracelet_1}`)">
                    <v-icon left>mdi-account-cash</v-icon>Ver consumos hasta ahora
                  </v-btn>
                  <v-btn color="orange" block dark @click="$router.push(`/activeVisits`)">
                    <v-icon left>mdi-clipboard-text-clock</v-icon>Ver visitas activas
                  </v-btn>
                </span>
              </v-col>
              
              <v-col cols="12" v-if="partner" class="mb-1">
                  <v-btn color="orange" block dark 
                  @click="$router.push('/entryRegister')" v-if="(partner.state.actions.id_action == 1 || partner.state.actions.id_action == 2 || partner.state.actions.id_action == 5) && !partner.partner_in_establishment">
                    <v-icon left>mdi-cash</v-icon>
                    Pagar Entrada {{(partner.state.actions.id_action == 5) ? '$0' : ''}}
                  </v-btn>
                  <v-btn color="orange" block dark v-if="partner.state.actions.id_action == 3" @click="$router.push('/membershipReactivation')"><v-icon left>mdi-account-reactivate</v-icon>Reactivar Membresía</v-btn>
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
              mode: 1,
              openCameraRN,
              dni: '',
              load: false,
              scannToPc: true,
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

