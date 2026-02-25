<template>
<v-row class="justify-center" no-gutters>
    <div class="detail-consumed-container">
        <v-card elevation="2" outlined class="pa-2 mb-2 consumos-card">
            <div class="consumos-title-container">
                <span class="orange--text font-weight-bold text-caption consumos-title">Consumos</span>
            </div>
            <div class="py-3 consumos-list">
                <v-row no-gutters v-for="consumo, n in consumos" :key="'cons'+n" class="text-body-2 align-center mb-1">
                    <v-col cols="8" class="pr-1">
                        <span class="text--secondary cantidad-number">{{consumo.cantidad}}</span>
                        <span class="consumo-description">{{consumo.description}}</span>
                    </v-col>
                    <v-col cols="4" class="text-end font-weight-bold price-text">${{formatNumber(parseFloat(consumo.price) * parseInt(consumo.cantidad))}}</v-col>
                </v-row>
            </div>

            <v-divider class="my-2"></v-divider>

            <v-row no-gutters class="font-weight-bold align-center">
                <v-col cols="6">Total</v-col>
                <v-col cols="6" class="text-end orange--text total-price">${{formatNumber(total)}}</v-col>
            </v-row>
        </v-card>

        <v-autocomplete
            label="Nro de Tarjeta"
            :items="items"
            dense
            outlined
            :menu-props="{maxHeight:200, offsetY: true}"
            v-model="id_bracelet"
            item-text="option"
            item-value="id_bracelet"
            :rules="[(v) => !!v || 'Indique el socio']"
            class="mb-2"
            hide-details="auto"
        ></v-autocomplete>

        <v-textarea
            label="Observaciones"
            rows="3"
            outlined
            dense
            v-model="observations"
            class="mb-2"
            hide-details
        />

        <v-btn 
            :dark="(id_bracelet != null)" color="orange" 
            block 
            :disabled="(id_bracelet == null)" 
            :loading="loading" 
            @click="send"
            class="mb-2">
             <v-icon left small>mdi-receipt-text-plus</v-icon> Confirmar Venta
        </v-btn>

        <v-btn 
            outlined 
            color="orange" 
            block 
            @click="dialogConfirm = true" 
            :disabled="loading"
            small>
                <v-icon left small>mdi-cancel</v-icon> Cancelar
        </v-btn>

        <div class="mt-4"></div>

        <v-btn 
            outlined 
            color="orange" 
            block 
            @click="goToConsumed" 
            :disabled="loading"
            small
            class="mb-2">
                <v-icon left small>mdi-receipt-text</v-icon> Ver Consumos de Socios
        </v-btn>

        <v-btn 
            outlined 
            color="orange" 
            block 
            @click="goToConsumedByBracelet" 
            :disabled="loading || !id_bracelet"
            small
            class="mb-2">
                <v-icon left small>mdi-receipt-text-outline</v-icon> Ver Consumos de Este Socio
        </v-btn>

        <v-btn 
            outlined 
            color="orange" 
            block 
            @click="goToActiveVisits" 
            :disabled="loading"
            small>
                <v-icon left small>mdi-account-group</v-icon> Ver Socios en el Club
        </v-btn>
        
        <v-dialog 
          v-model="dialogConfirm" max-width="500px">
            <v-card>
              <v-card-title>
                <v-spacer></v-spacer>
                  <v-btn 
                    x-small 
                    icon 
                    @click="dialogConfirm=false">
                        <v-icon >mdi-close</v-icon>
                  </v-btn>
              </v-card-title>

                <div class="text-center py-5">
                    <span style="font-size: 1rem">¿Está seguro que desea cancelar la orden?</span>
                </div>

              <v-card-actions>
                <v-spacer></v-spacer>
                    <v-btn 
                        color="orange" 
                        text 
                        small 
                        dark 
                        @click="dialogConfirm = false">Volver
                    </v-btn>
                  <v-btn 
                        small 
                        dark 
                        color="orange" 
                        elevation="0" 
                        @click="cancel">SI, Cancelar
                    </v-btn>
              </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</v-row>
</template>

<script>
    import eventBus from '../../../event-bus'
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
            formatNumber(num) {
                if (!num && num !== 0) return '0';
                return num.toLocaleString('es-AR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            },
            getVisits() {
            let vm = this
            this.load = true

            // El endpoint ahora devuelve { data: rows, totalCount: count } directamente
            this.$http.get(process.env.VUE_APP_DEGIRA+"partners/inside?sortBy=id_bracelet_1&sortDesc=false")
            .then((response)=>{
              if(response && response.data && response.data.data){
                vm.items = []
                // response.data.data es un array de visitas directamente
                response.data.data.map((item) => {
                    if (item.id_bracelet_1 && item.partner && item.partner.partner_name) {
                        let obj = {
                            id_bracelet : item.id_bracelet_1,
                            option : item.partner.partner_name + " (" + item.id_bracelet_1+")"
                        }
                        vm.items.push(obj)
                    }
                    
                    if (item.id_bracelet_2 && item.partner && item.partner.affiliate_name){
                        let obj2 = {
                            id_bracelet : item.id_bracelet_2,
                            option : item.partner.affiliate_name + " (" + item.id_bracelet_2+")"
                        }
                        vm.items.push(obj2)
                    }

                    return item
                })
                console.log('Brazaletes cargados:', vm.items.length);
              } else {
                console.warn('No se recibieron datos del endpoint');
              }
              vm.load = false
            })
            .catch((error) => {
              console.error('Error al cargar brazaletes:', error);
              console.error('Error response:', error.response);
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
            goToConsumed(){
                this.$router.push('/consumed');
            },
            goToConsumedByBracelet(){
                if(this.id_bracelet){
                    this.$router.push(`/consumed?id_bracelet=${this.id_bracelet}`);
                }
            },
            goToActiveVisits(){
                this.$router.push('/activeVisits');
            },
            send(){
                // Validar que id_bracelet no sea null o undefined
                if (!this.id_bracelet) {
                    eventBus.$emit('toast', { show: true, text: "Debe seleccionar un número de tarjeta", color: "red" })
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
                                        closeDialog: true,
                                        goTo: { title: 'Ver consumos',
                                                route: '/consumed?id_bracelet='+ response.data.data.id_bracelet,
                                        },
                                        isHtml: true,
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

<style scoped>
.detail-consumed-container {
    width: 100%;
    max-width: 100%;
}

.consumos-card {
    width: 100%;
    max-width: 100%;
    position: relative;
}

.consumos-title-container {
    position: relative;
    margin-bottom: 8px;
    padding-top: 4px;
}

.consumos-title {
    position: absolute;
    top: -8px;
    left: 8px;
    background: #fff;
    padding: 0 8px;
    z-index: 1;
}

.consumos-list {
    max-height: 200px;
    overflow-y: auto;
    overflow-x: hidden;
}

.consumos-list::-webkit-scrollbar {
    width: 4px;
}

.consumos-list::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
}

.consumos-list::-webkit-scrollbar-thumb {
    background: #FF9800;
    border-radius: 10px;
}

.cantidad-number {
    margin-right: 6px;
    font-weight: bold;
}

.consumo-description {
    font-size: 0.85rem;
    word-break: break-word;
}

.price-text {
    font-size: 0.8rem !important;
}

.total-price {
    font-size: 1rem !important;
}

/* Asegurar que los campos se vean completos */
.detail-consumed-container ::v-deep .v-input {
    font-size: 0.875rem;
}

.detail-consumed-container ::v-deep .v-text-field {
    margin-bottom: 8px;
}

.detail-consumed-container ::v-deep .v-textarea {
    margin-bottom: 8px;
}

.detail-consumed-container ::v-deep .v-autocomplete__menu {
    max-height: 200px !important;
}

/* Responsive para pantallas pequeñas */
@media (max-width: 959px) {
    .detail-consumed-container {
        width: 100%;
        padding: 0 8px;
    }
    
    .consumos-list {
        max-height: 150px;
    }
}
</style>