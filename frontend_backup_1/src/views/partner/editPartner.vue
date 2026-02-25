<template>
<div class="py-8">
    <v-form ref="form" class="px-md-15 px-5">
        <v-row no-gutters>
            <v-col cols="12" md="6" class="px-1">
                <v-select 
                    v-model="selectState"
                        :items="states"
                        label="Estado"
                        item-text="description"
                        item-value="id_state"
                        dense
                        outlined
                        >
                </v-select> 
            </v-col>

            <v-col cols="12" md="6" class="px-1">
                <v-select 
                    v-model="selectVisit"
                    :items="visits"
                    label="Tipo de Visitante"
                    
                    dense
                    outlined
                    disabled
                    item-text="description"
                    item-value="id_visit_type">
                </v-select>  
            </v-col>
        </v-row>
           
        <v-row class="justify-center align-center pb-2">
            <v-col cols="12" class="text-center py-0 pb-2">
                <span class="font-weight-thin orange--text" style="font-size: 1.2rem">ALIAS</span>
            </v-col>
        </v-row>
            
        <v-row no-gutters class="justify-center align-center">
            <v-col cols="12" md="6" class="px-1 d-flex justify-center align-center " >
                <v-text-field 
                    label="Ingrese ALIAS"
                    outlined
                    v-model="nickname"
                    
                />
            </v-col>
        </v-row>
           
        <v-row class="justify-center align-center text-center py-0 pb-8 mt-2">
            <v-col cols="12">
                <span class="font-weight-thin orange--text " style="font-size: 1.3rem">Datos Miembro 1</span>
            </v-col>
    
            <v-col cols="6" class="d-flex pl-15 pb-5 justify-center align-center">
                <v-divider :thickness="2" color="orange"></v-divider>
            </v-col>
                
            <v-col cols="6"  class="d-flex pr-15 pb-5 justify-center align-center ">
                <v-divider :thickness="2" color="orange"></v-divider>
            </v-col>
        </v-row>
    
        <v-row no-gutters>
            <v-col cols="10" md="3" class="px-1">
                <v-text-field
                    label="DNI"
                    outlined
                    dense
                    v-model="dniPartner"
                    type="number"
                    :rules='[(v) => !!v || "El campo es requerido"]'
                />
            </v-col>

            <v-col cols="2" md="1">
                <v-btn 
                    text 
                    small 
                    color="orange" 
                    class="mt-2" 
                    @click="dniPartner = generateNumberDNI()">
                        <v-icon left>mdi-smart-card-off</v-icon>
                        <span v-if="$vuetify.breakpoint.mdAndUp">SIN DNI</span>
                </v-btn>
            </v-col>
            
            <v-col cols="12" md="8" class="px-1">
                <v-text-field
                label="Nombre"
                outlined
                dense
                v-model="namePartner"
                type="text"
            />   
            </v-col>
        </v-row>
    
        <v-row no-gutters>
            <v-col cols="12" md="6" class="px-1">

                <DateInput 
                    :fecha="datePartner" 
                    :required="false" 
                    :disabled="false"
                    @changeDate="datePartner = $event" 
                    :validationAge="false">
                </DateInput>
                
            </v-col>
    
            <v-col cols="12" md="6" class="px-1">
                <v-text-field
                label="Telefono"
                outlined
                dense
                type="number"
                v-model="phonePartner"
                :rules='[(v) => (!v || v.toString().length == 10) || "El teléfono debe contener 10 dígitos (Cod. Area + Nro de telefono)"]'
                />
            </v-col>
        </v-row>
        
        <v-row class="justify-center align-center text-center py-0 pb-8 mt-2" v-if="selectVisit === 2">
            <v-col cols="12">
                <span class="font-weight-thin orange--text" style="font-size: 1.3rem;">Datos Miembro 2</span>
            </v-col>
    
            <v-col cols="6"   class="d-flex pl-15 justify-center align-center">
                <v-divider :thickness="2" color="orange"></v-divider>
            </v-col>
                
            <v-col cols="6"   class="d-flex pr-15 justify-center align-center ">
                <v-divider :thickness="2" color="orange"></v-divider>
            </v-col>
        </v-row>
                        
        
        <v-row no-gutters v-if="selectVisit === 2">
            <v-col cols="10" md="3" class="px-1">  
                <v-text-field 
                label="DNI"
                outlined
                dense
                v-model="dniAffiliate"
                type="number"
                :rules='[(v) => (!v || (v && v != dniPartner)) || "El DNI debe ser distinto al del miembro 1"]'
                />
            </v-col>

            <v-col cols="2" md="1">
                <v-btn text small color="orange" class="mt-2" @click="dniAffiliate = generateNumberDNI()">
                    <v-icon left>mdi-smart-card-off</v-icon>
                    <span v-if="$vuetify.breakpoint.mdAndUp">SIN DNI</span>
                </v-btn>
            </v-col>

            <v-col cols="12" md="8" class="px-1"> 
                <v-text-field
                label="Nombre"
                outlined
                dense

                v-model="nameAffiliate"
                
                />
            </v-col>
        </v-row>
        
        <v-row no-gutters v-if="selectVisit === 2">
            <v-col cols="12" md="6" class="px-1">
                <DateInput 
                :fecha="dateAffiliate" 
                :required="false" 
                :disabled="false"
                @changeDate="dateAffiliate = $event" 
                :validationAge="false"
                />
            </v-col>
    
            <v-col cols="12" md="6" class="px-1">
                <v-text-field
                label="Telefono"
                outlined
                dense
                type="number"
                v-model="phoneAffiliate"
                :rules='[(v) => (!v || v.toString().length == 10) || "El teléfono debe contener 10 dígitos (Cod. Area + Nro de telefono)"]'
                />
            </v-col>
        </v-row>
        
        <v-row class="justify-center align-center pb-8 text-center py-0 mt-2">
            <v-col cols="12">
                <span class="font-weight-thin orange--text " style="font-size: 1.3rem;">Otra Información</span>
            </v-col>
    
            <v-col cols="6" class="d-flex pl-15 justify-center align-center">
                <v-divider :thickness="2" color="orange"></v-divider>
            </v-col>
                
            <v-col cols="6" class="d-flex pr-15 justify-center align-center ">
                <v-divider :thickness="2" color="orange"></v-divider>
            </v-col>
        </v-row>
    
        <v-row no-gutters>
            <v-col cols="12" class="px-1">
                <v-textarea
                label="Observaciones"
                rows="3"
                outlined
                dense
                
                v-model="observations"
            />
            </v-col>
        </v-row>

        <v-row no-gutters>
            <v-btn  
                block 
                :loading="loading" 
                color="orange" 
                dark
                class="font-weight-bold" 
                @click="editPartner">
                <v-icon left>mdi-content-save</v-icon> Guardar Datos
            </v-btn>
        </v-row>
    </v-form>
</div>
</template>

<script>
    import DateInput from '../app/DateInput'
    import eventBus from '../../event-bus'
    export default{
        components: {
            DateInput
        },
        data(){
            return {
                selectVisit: null,
                visits: [],
                selectState: 2,
                states: [],
                nickname: "",
                dniPartner: null,
                namePartner: "",
                datePartner: null,
                phonePartner: null,
                dniAffiliate: null,
                nameAffiliate: "",
                dateAffiliate: null,
                phoneAffiliate: null,
                observations: "",
                loading: false,
            }
        },
        beforeMount(){
            this.getEstados()
            this.getTipos() 
            this.setPartnerData()
            console.log(this.$store.state.partner)
        },
        methods:{
            editPartner(){
                /* if(this.$refs.form.validate()){ */
                    this.loading= true
                    let data = {
                        "alias": this.nickname,
                        "partner_dni": this.dniPartner,
                        "partner_name": this.namePartner,
                        "partner_birthdate": (this.datePartner) ? this.$moment(this.datePartner).format("DD/MM/YYYY") : undefined,
                        "partner_phone": this.phonePartner,
                        "affiliate_dni": (this.selectVisit == 2) ? this.dniAffiliate : undefined,
                        "affiliate_name": (this.selectVisit == 2) ? this.nameAffiliate : undefined,
                        "affiliate_birthdate": (this.selectVisit == 2 && this.dateAffiliate) ? this.$moment(this.dateAffiliate).format("DD/MM/YYYY") : undefined,
                        "affiliate_phone": (this.selectVisit == 2) ? this.phoneAffiliate : undefined, 
                        "id_visit_type_usualy": this.selectVisit,
                        "id_state": this.selectState,
                        "observations": this.observations,
                        "suggest_membership_amount": this.payment
                    }
                    let vm = this
                    this.$http.put(`${process.env.VUE_APP_PARTNERS_UPDATE}/${this.$store.state.partner.id_partner}`, data)
                    .then((response)=>{
                        if(response){
                            let data = response.data.data.partnerUpdated
                            let dialog = {  show: true, 
                                            title: "El socio se ha editado correctamente", 
                                            type: 'success',
                                            isHtml: true,
                                            text: [ {label: 'Alias', 
                                                     value: data.alias, 
                                                     show: true
                                                    },
                                                    {label: 'Tipo de visita', 
                                                     value: vm.visits.find((vst) => vm.selectVisit==vst.id_visit_type).description, 
                                                     show: true
                                                    },
                                                    {label: 'Nombre', 
                                                     value: data.partner_name, 
                                                     title: 'Socio', 
                                                     show: true
                                                    },
                                                    {label: 'DNI', 
                                                     value: data.partner_dni, 
                                                     show: true
                                                    },
                                                    {label: 'Fecha de Nacimiento', 
                                                     value: this.formateDate(data.partner_birthdate), 
                                                     show: true
                                                    },
                                                    {label: 'Teléfono', 
                                                     value: data.partner_phone, 
                                                     show: (data.partner_phone)
                                                    },
                                                    {label: 'Nombre', 
                                                     value: data.affiliate_name, 
                                                     title: 'Afiliado', 
                                                     show: (vm.selectVisit== 2)
                                                    },
                                                    {label: 'DNI', 
                                                     value: data.affiliate_dni, 
                                                     show: (vm.selectVisit== 2)
                                                    },
                                                    {label: 'Fecha de Nacimiento', 
                                                     value: this.formateDate(data.affiliate_birthdate), 
                                                     show: (vm.selectVisit== 2)
                                                    },
                                                    {label: 'Teléfono', 
                                                     value: data.affiliate_phone, 
                                                     show: (vm.selectVisit== 2)
                                                    },
                                                    {label: 'Observaciones', 
                                                     value: data.observations, 
                                                     show: (data.observations)
                                                    },
                                                ]
                                        }
                            eventBus.$emit('ConfirmDialog', dialog)
                            vm.loading = false
                        }
                    })
                    .catch((error)=>{
                        console.log(error.response)
                        eventBus.$emit('toast', { show: true, text: (error.response.data.message) ? error.response.data.message :  "No se ha editar el socio", color: "red" })
                        vm.loading = false
                    })
                //}
            },
            formateDate(date){
                if(date != null){ 
                    date.replace(/(T)/, ' ');
                    date.substr(0, 19);
                }
                return (date != null) ? this.$moment(date, 'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY') : '';
            }, 
            setPartnerData(){
                this.nickname = this.$store.state.partner.alias
                this.dniPartner = this.$store.state.partner.partner_dni
                this.namePartner = this.$store.state.partner.partner_name
                this.datePartner = this.formateDate(this.$store.state.partner.partner_birthdate)
                this.phonePartner = (this.$store.state.partner.partner_phone) ? this.$store.state.partner.partner_phone : null
                if(this.$store.state.partner.id_visit_type_usualy == 2){
                    this.dniAffiliate = this.$store.state.partner.affiliate_dni
                    this.nameAffiliate = this.$store.state.partner.affiliate_name
                    this.dateAffiliate = this.formateDate(this.$store.state.partner.affiliate_birthdate)
                    this.phoneAffiliate = (this.$store.state.partner.affiliate_phone) ? this.$store.state.partner.affiliate_phone : null
                }
                this.observations = this.$store.state.partner.observations
                this.selectVisit = this.$store.state.partner.id_visit_type_usualy
                this.selectState = this.$store.state.partner.state.id_state
            },
            getEstados(){
                let vm = this
                this.$http.get(process.env.VUE_APP_DEGIRA+"states/get")
                .then((response)=>{
                    if(response){
                        vm.states = response.data.data
                    }
                })
            },
            getTipos(){
                let vm = this
                this.$http.get(process.env.VUE_APP_DEGIRA+"visits_types/get")
                .then((response)=>{
                    if(response){
                        vm.visits = response.data.data
                    }
                })
            },
            generateNumberDNI(){
               return this.$moment().format('YYYYMMDDHHmmSS');
            },
        }
    }
</script>