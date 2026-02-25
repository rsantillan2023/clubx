<template>
<v-row class="justify-center" no-gutters>
    <div>
        <v-card elevation="0" width="20rem" outlined class="pa-2 mb-2">
            <span class="orange--text font-weight-bold text-caption mt-n4 py-0 px-2" style="position: absolute; background: #fff;">Consumos</span>
            <div class="py-5">
                <v-row no-gutters v-for="consumo, n in consumos" :key="'cons'+n" class="text-body-2 align-center">
                    <v-col cols="8"><span class="text--secondary">{{consumo.cantidad}}u.</span> {{consumo.description}}</v-col>
                    <v-col cols="4" class="text-end font-weight-bold">${{parseFloat(consumo.price) * parseInt(consumo.cantidad)}}</v-col>
                </v-row>
            </div>

            <v-row no-gutters class="font-weight-bold align-center">
                <v-col cols="6">Total</v-col>
                <v-col cols="6" class="text-end text-h6 orange--text">${{total}}</v-col>
            </v-row>
        </v-card>

        <v-autocomplete
            label="Brazalete"
            :items="items"
            dense
            outlined
            :menu-props="{maxHeight:100}"
            v-model="id_bracelet"
            item-text="option"
            item-value="id_bracelet"
            :rules="[(v) => !!v || 'El campo es requerido']"
        ></v-autocomplete>

        <v-textarea
            label="Observaciones"
            rows="3"
            outlined
            dense
            v-model="observations"
        />

        <v-btn :dark="(id_bracelet != null)" color="orange" block :disabled="(id_bracelet == null)" :loading="loading" @click="send">
            <v-icon left>mdi-receipt-text-plus</v-icon> Confirmar Venta
        </v-btn>

        <v-btn class="mt-2" text color="orange" block @click="dialogConfirm = true" :disabled="loading"><v-icon left>mdi-cancel</v-icon> Cancelar</v-btn>
        

        <v-dialog 
          v-model="dialogConfirm" 
          max-width="500px">
            <v-card>
              <v-card-title>
                <v-spacer></v-spacer>
                  <v-btn x-small icon @click="dialogConfirm=false">
                    <v-icon >mdi-close</v-icon>
                  </v-btn>
              </v-card-title>

                <div class="text-center py-5">
                    <span style="font-size: 1rem">¿Está seguro que desea cancelar la orden?</span>
                </div>
              <v-card-actions>
                <v-spacer></v-spacer>
                  <v-btn color="orange" text small dark @click="dialogConfirm = false">Volver</v-btn>
                  <v-btn small dark color="orange" elevation="0" @click="cancel">SI, Cancelar</v-btn>
              </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</v-row>
</template>

<script>
    import eventBus from '../../event-bus'
    export default{
        props: {
            consumos: {type: Array},
            total: {}
        },
        data(){
            return{
                id_bracelet: null,
                observations: '',
                dialogConfirm: false,
                loading: false,
                items: [],
                roles: [],
               
            }
        },

        beforeMount(){
            this.$store.state.userLoged.data.roles.map( (UserRole) => {
                this.roles.push(UserRole.id_role)
            })
            this.getVisits()
        },

        methods:{
            getVisits() {
            let vm = this
            this.load = true

          //https://dev-imasdsooft.imasdsooft.com.ar/api/v1/degira/partners/inside?sortBy=partner.visit_type.description&sortDesc=false
          //process.env.VUE_APP_DEGIRA+"partners/inside?page="+this.options.page+"&cantPage="+this.options.cantPage+"&sortBy="+this.options.sortBy[0]+"&sortDesc="+this.options.sortDesc[0]
            this.$http.get(process.env.VUE_APP_DEGIRA+"partners/inside?sortBy=id_bracelet_1&sortDesc=false")
            .then((response)=>{
              if(response){
                vm.items = []
                response.data.data.visits.map((item) => {
                    let obj = {
                        id_bracelet : item.id_bracelet_1,
                        option : item.partner.partner_name + " (" + item.id_bracelet_1+")"
                    }
                    vm.items.push(obj)
                    
                    if (item.id_bracelet_2 && item.partner.affiliate_name){
                        obj = {
                            id_bracelet : item.id_bracelet_2,
                            option : item.partner.affiliate_name + " (" + item.id_bracelet_2+")"
                        }
                        vm.items.push(obj)
                    }

                    return item
                })
                } 
                vm.load = false
            })

      },
            textWhatsapp(data){
                let text = '_Hola '+ data.partner_name+'_' + '! Realizaste el siguiente consumo '
                text += '*Brazalete Nº ' + data.id_bracelet +':* '
                data.products.map((item) => {
                    text = text + item.description + ' x' + item.cantidad + ' '
                })
                    
                text = text + '| TU CONSUMO TOTAL ES: ' + '*$' + data.ticket_amount+'*'+' |'
                return text
           
            },

            cancel(){
                this.$emit('cancelOrder');
                this.$refs.braazalete.reset() 
                this.dialogConfirm=false;
            },
            send(){
                // Validar que id_bracelet no sea null o undefined
                if (!this.id_bracelet) {
                    eventBus.$emit('toast', { show: true, text: "Debe seleccionar un brazalete", color: "red" })
                    return
                }
                
                let data =  {cart: this.consumos,
                             total_consumed: this.total,
                             id_bracelet : String(this.id_bracelet),
                             ticket_observations: this.observations
                         }
                let vm = this
                this.loading = true
                this.$http.post(`${process.env.VUE_APP_DEGIRA}consumptions/create`, data)
                .then((response) => {
                    if(response){
                        let dialog = {  show: true, 
                                        title: "Venta Confirmada", 
                                        type: 'success',
                                        cardNumber: response.data.data.id_bracelet,
                                        sendToWhatsapp : vm.roles.includes(1) ? true : false,
                                        whatsappData: {
                                            textWhatsappDialog: this.textWhatsapp(response.data.data), 
                                            phoneNumber: response.data.data.partner_phone
                                        },
                                        goTo: { title: 'Ver consumos',
                                                route: '/devolution?id_bracelet='+ response.data.data.id_bracelet,
                                        },
                                        isHtml: true,
                                        closeDialog: true,
                                        text: [ {label: '', 
                                                 value: response.data.data.products, 
                                                 show: true,
                                                 cardConsumed: true,
                                                },
                                                {label: 'Total', 
                                                 value: '$'+response.data.data.ticket_amount, 
                                                 show: true
                                                },
                                                {label: 'Observaciones', 
                                                 value: response.data.data.ticket_observation, 
                                                 show: (response.data.data.ticket_observation)
                                                },
                                            ]
                                    }
                        eventBus.$emit('ConfirmDialog', dialog)
                        vm.cancel()
                    }
                    vm.loading=false
                })
                .catch((error) => {
                    console.log(error.response)
                    eventBus.$emit('toast', { show: true, text: (error.response.data.message) ? error.response.data.message :  "No se ha podido generar el consumo", color: "red" })
                    vm.loading=false
                })
            }
        }
    }
</script>