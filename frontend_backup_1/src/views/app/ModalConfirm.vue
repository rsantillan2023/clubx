<template>
<div>
    <v-row no-gutters class="justify-end" v-if="closeDialog">
        <v-btn icon x-small @click="close"><v-icon>mdi-close</v-icon></v-btn>
    </v-row>
    <v-row no-gutters class="text-center pa-5">
        <v-col cols="12" class="d-flex justify-center">
            <v-icon :color="color" class="text-h1">{{icon}}</v-icon>
        </v-col>

        <v-col cols="12" class="text-body-1 font-weight-bold mb-5">
            <span :class="`${color}--text`">{{title}}</span>
        </v-col>

        <v-col cols="12">
            <div v-if="isHtml">
                <p class="text-caption font-weight-bold orange--text">Detalle:</p>
                <div class="text-start" v-for="item,n in text" :key="'text'+n">

                    <v-card elevation="0" width="20rem" outlined class="pa-2 mb-2" v-if="item.cardConsumed">
                        <span class="orange--text font-weight-bold text-caption mt-n4 py-0 px-2" style="position: absolute; background: #fff;">Consumo</span>
                        <div class="py-5">
                            <v-row no-gutters v-for="row, n in item.value" :key="'cons'+n" class="text-body-2 align-center">
                                <v-col cols="8"><span class="text--secondary">{{row.cantidad}}u.</span> {{row.description}}</v-col>
                                <v-col cols="4" class="text-end font-weight-bold">${{parseFloat(row.price) * parseInt(row.cantidad)}}</v-col>
                            </v-row>
                        </div>
                    </v-card>

                    <div v-else>
                        <p class="text-caption text-center mb-0 font-weight-bold orange--text" v-if="item.title && item.show">{{item.title}}:</p>
                        <p class="text-caption font-weight-bold mb-0" v-if="item.show">{{item.label}}: 
                            <span class="font-weight-medium">{{item.value}}</span>
                        </p>
                    </div>
                </div>
            </div>
            <span v-else class="text-body-2">{{text}}</span>
        </v-col>

        <v-col cols="12" class="mt-3 d-flex justify-center" v-if="goToHome">
            <v-btn color="orange" text @click="goHome">
                <v-icon left>mdi-home</v-icon> Volver al Inicio
            </v-btn>
        </v-col>

        <v-col cols="12" class="mt-3 d-flex justify-center" v-if="closeDialog">
            <v-btn color="orange" text @click="close">
                <v-icon left>mdi-arrow-left</v-icon> Volver
            </v-btn>
        </v-col>

        <v-col cols="12" class="mt-1 d-flex justify-center" v-if="sendToWhatsapp">
            <SendWhatsappButton 
                :text="whatsappData.textWhatsappDialog" 
                :phoneNumber="whatsappData.phoneNumber">
            </SendWhatsappButton>
        </v-col>

        <v-col cols="12" class="mt-1 d-flex justify-center" v-for="item, n in goToComputed" :key="'goTo'+n">
            <v-btn
              small
              block
              color="orange"
              dark
              @click="go(item.route)">
              <v-icon left>{{(item.icon) ? item.icon : "mdi-arrow-top-right"}}</v-icon>{{item.title}}
            </v-btn>
        </v-col>
    </v-row>
</div>
</template>
<script>
    import eventBus from '../../event-bus'
    import SendWhatsappButton from './SendWhatsappButton'
    export default{
        components:{
            SendWhatsappButton
        },
        props:{
            type: {type: String, default: 'success'}, //Tipo de modal, (de error, de respuesta, de detalles)
            title: {type: String, default: ''}, //titulo del modal
            text: {}, //Texto en el modal
            isHtml: {type: Boolean, default: false}, //si el texto es html (true/false)
            sendToWhatsapp: {type: Boolean, default: false}, //Si debe aparecer el boton enviar por whatsapp
            whatsappData: {}, //Datos que debe llevar el boton de whatsapp, aca debe venir un objeto {textWhatsappDialog: 'Texto a enviar por whatsapp', phoneNumber: '542213332244'}
            goToHome: {type: Boolean, default: true}, //Si debe aparecer el boton ir a home por defecto aparece enviarlo en false cuando no quieras q aparezca
            closeDialog: {type: Boolean, default: false}, //Si quieres que deje cerrar el modal, habilita la X arriba
            goTo: {}, //Boton dinamico para ir a cualquier otra ruta aca debe venir un objeto, por ejemplo {title: 'Volver', icon: "mdi-arrow-left", route: '/access'}
            
        },
        computed:{
            goToComputed(){
                if(this.goTo){
                    if(Array.isArray(this.goTo)) return this.goTo
                    else return [this.goTo]
                }else return []
                
            },
            icon(){
                let icon = 'mdi-check-circle'
                if(this.type == 'success') icon = 'mdi-check-circle'
                if(this.type == 'error') icon = 'mdi-alert-circle'
                return icon
            },
            color(){
                let color = 'green'
                if(this.type == 'success') color = 'green'
                if(this.type == 'error') color = 'red'
                return color
            }
        },
        methods:{
            close(){
                let dialog = {  show: false, 
                                title: "", 
                                text: "", 
                                type: 'success' }
                eventBus.$emit('ConfirmDialog', dialog)
            },
            goHome(){
                this.$router.push('/')
                this.close()
            },
            go(route){
                this.$router.push(route)
                this.close()
            }
        }
    } 
</script>