<template>
<div>
    <v-row no-gutters class="justify-end" v-if="closeDialog || goToHome">
        <v-btn 
            v-if="goToHome"
            color="orange" 
            dark 
            icon 
            x-small 
            outlined 
            class="mr-1"
            @click="goHome">
            <v-icon small>mdi-home</v-icon>
        </v-btn>
        <v-btn icon x-small @click="close" v-if="closeDialog"><v-icon>mdi-close</v-icon></v-btn>
    </v-row>
    <v-row no-gutters class="text-center pa-5">
        <v-col cols="12" class="d-flex justify-center">
            <v-icon :color="color" class="text-h1">{{icon}}</v-icon>
        </v-col>

        <v-col cols="12" class="text-body-1 font-weight-bold mb-2">
            <span :class="`${color}--text`">{{title}}</span>
        </v-col>

        <v-col cols="12" class="text-center mb-3" v-if="getAliasValue">
            <span class="text-h6 font-weight-bold orange--text">
                {{getAliasValue}}<span v-if="getTipoVisitaValue"> / {{getTipoVisitaValue}}</span>
            </span>
        </v-col>

        <v-col cols="12" class="mb-4" v-if="getBrazalete1Value">
            <div class="text-center">
                <div class="text-h3 font-weight-bold orange--text">{{getBrazalete1Value}}</div>
            </div>
        </v-col>

        <v-col cols="12">
            <div v-if="isHtml">
                <div class="text-start" v-for="item,n in text" :key="'text'+n">

                    <v-card elevation="0" width="20rem" outlined class="pa-2 mb-2" v-if="item.cardConsumed">
                        <span class="orange--text font-weight-bold text-caption mt-n4 py-0 px-2" style="position: absolute; background: #fff;">Consumo</span>
                        <div class="py-5">
                            <v-row no-gutters v-for="row, n in item.value" :key="'cons'+n" class="text-body-2 align-center">
                                <v-col cols="8"><span class="text--secondary">{{row.cantidad}} </span>{{row.description}}</v-col>
                                <v-col cols="4" class="text-end font-weight-bold">${{formatNumber(parseFloat(row.price) * parseInt(row.cantidad))}}</v-col>
                            </v-row>
                        </div>
                    </v-card>

                    <div v-else>
                        <p class="text-caption text-center mb-0 font-weight-bold orange--text" v-if="item.title && item.show">{{item.title}}:</p>
                        <p :class="item.label === 'Total' ? 'text-h6 font-weight-bold mb-0 orange--text text-center' : (item.label === 'Hora de entrada' || item.label === 'Metodo de Pago' || item.label === 'Monto que abono' ? 'text-caption font-weight-bold mb-0 text-center' : 'text-caption font-weight-bold mb-0')" v-if="item.show && item.label !== 'Número de Tarjeta' && item.label !== 'Brazalete 1' && item.label !== 'Alias' && item.label !== 'Tipo de visita' && item.label !== 'Monto que debió abonar' && item.label !== 'Monto de entrada'">{{item.label}}: 
                            <span :class="item.label === 'Total' ? 'font-weight-bold' : 'font-weight-medium'">{{item.label === 'Total' ? formatCurrency(item.value) : item.value}}</span>
                        </p>
                    </div>
                </div>
            </div>
            <span v-else class="text-body-2">{{text}}</span>
        </v-col>

        <v-col cols="12" class="mt-3 d-flex justify-center">
            <v-row no-gutters class="justify-center" style="width: 100%;">
                <v-col cols="12" class="d-flex justify-center flex-wrap">
                    <v-btn 
                        v-if="closeDialog"
                        color="orange" 
                        dark 
                        small 
                        class="ma-1"
                        @click="continueSelling" 
                        style="font-size: 0.75rem;">
                        Seguir vendiendo
                    </v-btn>
                    <v-btn 
                        v-if="sendToWhatsapp"
                        color="#25d366" 
                        dark 
                        icon 
                        small 
                        outlined 
                        class="ma-1"
                        @click="handleWhatsappClick">
                        <v-icon small>mdi-whatsapp</v-icon>
                    </v-btn>
                    <v-btn
                        v-for="item, n in goToComputed"
                        :key="'goTo'+n"
                        small
                        color="orange"
                        dark
                        class="ma-1"
                        @click="handleGoTo(item)"
                        style="font-size: 0.75rem;">
                        <v-icon v-if="item.icon" left small>{{item.icon}}</v-icon>
                        {{item.title}}
                    </v-btn>
                    <v-btn
                        v-if="getBrazalete1Value"
                        small
                        color="blue"
                        dark
                        class="ma-1"
                        @click="go('/activeVisits')"
                        style="font-size: 0.75rem;">
                        <v-icon left small>mdi-account-group</v-icon>
                        Ver socios en el club
                    </v-btn>
                </v-col>
            </v-row>
        </v-col>
    </v-row>

    <!-- Modal para pedir/validar teléfono de WhatsApp -->
    <v-dialog v-model="showPhoneDialog" max-width="500px" persistent>
        <v-card>
            <v-card-title class="headline orange--text">
                <v-icon left color="orange">mdi-phone</v-icon>
                Ingresar Teléfono
            </v-card-title>
            <v-card-text>
                <p class="mb-3" v-if="!whatsappData || !whatsappData.phoneNumber">
                    El socio no tiene teléfono registrado. Por favor, ingrese el número de teléfono para enviar el mensaje por WhatsApp.
                </p>
                <p class="mb-3" v-else>
                    Por favor, valide o edite el número de teléfono antes de enviar el mensaje por WhatsApp.
                </p>
                <v-text-field
                    v-model="tempPhone"
                    label="Número de Teléfono"
                    outlined
                    dense
                    type="tel"
                    placeholder="Ej: 2211234567"
                    :rules="phoneRules"
                    autofocus
                    @keyup.enter="confirmPhone"
                    hint="Ingrese el número sin código de país (se agregará automáticamente +54)"
                    persistent-hint
                >
                    <template v-slot:prepend-inner>
                        <span class="mt-2 mr-2">+54</span>
                    </template>
                </v-text-field>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="cancelPhone">Cancelar</v-btn>
                <v-btn color="green" dark @click="confirmPhone" :disabled="!isValidPhone">
                    Enviar
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</div>
</template>
<script>
    import eventBus from '../../event-bus'
    export default{
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
            cardNumber: {type: [String, Number], default: null}, //Número de tarjeta para mostrar debajo del título
            
        },
        data() {
            return {
                showPhoneDialog: false,
                tempPhone: ''
            }
        },
        computed:{
            getAliasValue(){
                if(this.text && Array.isArray(this.text)){
                    const alias = this.text.find(item => item.label === 'Alias' && item.show)
                    if(alias && alias.value){
                        // Reemplazar "---" por un espacio, manteniendo el resto
                        const value = String(alias.value)
                        return value.replace(/---/g, ' ')
                    }
                    return null
                }
                return null
            },
            getTipoVisitaValue(){
                if(this.text && Array.isArray(this.text)){
                    const tipoVisita = this.text.find(item => item.label === 'Tipo de visita' && item.show)
                    return tipoVisita ? tipoVisita.value : null
                }
                return null
            },
            getBrazalete1Value(){
                if(this.text && Array.isArray(this.text)){
                    const brazalete1 = this.text.find(item => item.label === 'Brazalete 1' && item.show)
                    if(brazalete1 && brazalete1.value){
                        // Extraer solo la parte después del guión (ej: "Tarj251111-004" -> "004")
                        const value = String(brazalete1.value)
                        const parts = value.split('-')
                        return parts.length > 1 ? parts[parts.length - 1] : value
                    }
                    return null
                }
                return null
            },
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
            },
            phoneRules() {
                return [
                    v => !!v || 'El teléfono es requerido',
                    v => (v && v.length >= 8) || 'El teléfono debe tener al menos 8 dígitos',
                    v => (v && /^[0-9]+$/.test(v)) || 'Solo se permiten números'
                ]
            },
            isValidPhone() {
                return this.tempPhone && this.tempPhone.length >= 8 && /^[0-9]+$/.test(this.tempPhone)
            }
        },
        methods:{
            formatNumber(num) {
                if (!num && num !== 0) return '0';
                return num.toLocaleString('es-AR', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                });
            },
            formatCurrency(value) {
                // Si el valor ya tiene el símbolo $, extraer el número
                let num = value;
                if (typeof value === 'string' && value.startsWith('$')) {
                    num = parseFloat(value.replace('$', '').replace(/\./g, '').replace(',', '.'));
                }
                return '$' + this.formatNumber(num);
            },
            handleWhatsappClick(){
                // Siempre mostrar el modal para validar/editar el teléfono
                if (this.whatsappData && this.whatsappData.phoneNumber) {
                    // Si hay teléfono, extraer solo los números (sin código de país)
                    let phone = String(this.whatsappData.phoneNumber).trim()
                    phone = phone.replace(/\s+/g, '').replace(/-/g, '').replace(/\(/g, '').replace(/\)/g, '')
                    
                    // Si empieza con +54 o 54, quitarlo para mostrar solo el número local
                    if (phone.startsWith('+54')) {
                        phone = phone.slice(3)
                    } else if (phone.startsWith('54')) {
                        phone = phone.slice(2)
                    } else if (phone.startsWith('+')) {
                        phone = phone.slice(1)
                    }
                    
                    this.tempPhone = phone
                } else {
                    this.tempPhone = ''
                }
                this.showPhoneDialog = true
            },
            confirmPhone(){
                if (!this.isValidPhone) return
                
                // Procesar el teléfono ingresado - asegurar formato correcto para WhatsApp
                let phone = this.tempPhone.trim().replace(/\s+/g, '').replace(/-/g, '').replace(/\(/g, '').replace(/\)/g, '')
                
                // Remover cualquier código de país que pueda haber ingresado
                if (phone.startsWith('+54')) {
                    phone = phone.slice(3)
                } else if (phone.startsWith('54')) {
                    phone = phone.slice(2)
                } else if (phone.startsWith('+')) {
                    phone = phone.slice(1)
                }
                
                // Agregar código de país 54 si no lo tiene
                if (phone && !phone.startsWith('54')) {
                    phone = '54' + phone
                }
                
                // Cerrar modal y enviar
                this.showPhoneDialog = false
                this.sendWhatsapp(phone)
                this.tempPhone = ''
            },
            cancelPhone(){
                this.showPhoneDialog = false
                this.tempPhone = ''
            },
            sendWhatsapp(phoneToUse){
                if (!phoneToUse || !this.whatsappData || !this.whatsappData.textWhatsappDialog) {
                    console.warn('WhatsApp: Teléfono o texto vacío', { phone: phoneToUse, text: this.whatsappData?.textWhatsappDialog })
                    return
                }
                
                // Asegurar que el teléfono esté en formato correcto (solo números, con código de país)
                let phone = String(phoneToUse).trim()
                
                // Remover todo lo que no sea número
                phone = phone.replace(/\D/g, '')
                
                // Remover código de país si está duplicado
                if (phone.startsWith('5454')) {
                    phone = phone.slice(2)
                }
                
                // Verificar que tenga código de país 54
                if (!phone.startsWith('54')) {
                    phone = '54' + phone
                }
                
                // Validar que el número tenga al menos 10 dígitos (54 + 8 dígitos mínimo)
                if (phone.length < 10) {
                    alert('El número de teléfono es inválido. Debe tener al menos 8 dígitos.')
                    return
                }
                
                // Codificar el texto del mensaje
                const text = encodeURIComponent(this.whatsappData.textWhatsappDialog || '')
                
                // Usar formato wa.me (formato oficial recomendado por WhatsApp)
                // NOTA: WhatsApp puede no mostrar el texto prellenado si el número no está en los contactos
                // Esto es una limitación de seguridad de WhatsApp, no del código
                const url = `https://wa.me/${phone}?text=${text}`
                
                console.log('Enviando WhatsApp:', { 
                    original: phoneToUse, 
                    processed: phone, 
                    url,
                    textLength: this.whatsappData.textWhatsappDialog?.length || 0,
                    textPreview: this.whatsappData.textWhatsappDialog?.substring(0, 50) + '...'
                })
                
                // Detectar si es móvil para mostrar advertencia
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
                
                if (isMobile && this.whatsappData.textWhatsappDialog) {
                    // En móviles, mostrar advertencia sobre la limitación de WhatsApp
                    // Solo si el mensaje es largo (más probable que sea importante)
                    if (this.whatsappData.textWhatsappDialog.length > 50) {
                        const userConfirmed = confirm(
                            'IMPORTANTE: Si el número no está en tus contactos, WhatsApp puede no mostrar el mensaje prellenado.\n\n' +
                            'Si el mensaje no aparece, deberás copiarlo manualmente.\n\n' +
                            '¿Deseas continuar y abrir WhatsApp?'
                        )
                        if (!userConfirmed) return
                    }
                }
                
                const a = document.createElement("a")
                a.setAttribute("href", url)
                a.setAttribute("target", "_blank")
                a.setAttribute("rel", "noopener noreferrer")
                a.click()
                
                // Si es móvil y el mensaje es importante, también copiar al portapapeles como respaldo
                if (isMobile && this.whatsappData.textWhatsappDialog && this.whatsappData.textWhatsappDialog.length > 50) {
                    // Intentar copiar al portapapeles después de un breve delay
                    setTimeout(() => {
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                            navigator.clipboard.writeText(this.whatsappData.textWhatsappDialog).then(() => {
                                console.log('Mensaje copiado al portapapeles como respaldo')
                            }).catch(err => {
                                console.warn('No se pudo copiar al portapapeles:', err)
                            })
                        }
                    }, 500)
                }
            },
            continueSelling(){
                this.close();
                // Forzar recarga completa de la página para limpiar todo el estado
                window.location.href = '/productsSale';
            },
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
            handleGoTo(item){
                if(item.action && typeof item.action === 'function'){
                    item.action()
                } else if(item.route){
                    this.go(item.route)
                }
            },
            go(route){
                if(route){
                    this.$router.push(route)
                }
                this.close()
            }
        }
    } 
</script>