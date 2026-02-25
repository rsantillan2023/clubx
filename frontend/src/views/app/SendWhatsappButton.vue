<template>
    <div>
        <v-btn  @click="handleClick"
                :small="$vuetify.breakpoint.xs || $vuetify.breakpoint.sm"
                :large="$vuetify.breakpoint.mdAndUp"
                block
                dark
                :elevation="2"
                color="#25d366"
                class="whatsapp-btn"
        >
            <v-icon :left="$vuetify.breakpoint.mdAndUp" :size="$vuetify.breakpoint.xs || $vuetify.breakpoint.sm ? 14 : 20">mdi-whatsapp</v-icon>
            <span class="button-text">Enviar Via Whatsapp</span>
        </v-btn>

        <!-- Modal para pedir teléfono cuando no existe -->
        <v-dialog v-model="showPhoneDialog" max-width="500px" persistent>
            <v-card>
                <v-card-title class="headline orange--text">
                    <v-icon left color="orange">mdi-phone</v-icon>
                    Ingresar Teléfono
                </v-card-title>
                <v-card-text>
                    <p class="mb-3" v-if="!phoneNumber">
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
    export default{
        props:{
            phoneNumber: { type: String, default: '' },
            text: { type: String, default: '' },
        },
        data() {
            return {
                showPhoneDialog: false,
                tempPhone: ''
            }
        },
        computed:{
            phone(){
                if (!this.phoneNumber) {
                    return ''
                }
                let phone = String(this.phoneNumber).trim()
                
                if (!phone || phone === 'undefined' || phone === 'null') {
                    return ''
                }
                
                // Remover espacios y caracteres especiales
                phone = phone.replace(/\s+/g, '').replace(/-/g, '').replace(/\(/g, '').replace(/\)/g, '')
                
                // Si empieza con +, quitarlo
                if(phone.startsWith('+')) {
                    phone = phone.slice(1)
                }
                
                // Si no empieza con 54, agregarlo
                if(phone && !phone.startsWith('54')) {
                    phone = '54' + phone
                }
                
                return phone
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
            handleClick(){
                // Siempre mostrar el modal para validar/editar el teléfono
                if (this.phoneNumber) {
                    // Si hay teléfono, extraer solo los números (sin código de país)
                    let phone = String(this.phoneNumber).trim()
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
                if (!phoneToUse || !this.text) {
                    console.warn('WhatsApp: Teléfono o texto vacío', { phone: phoneToUse, text: this.text })
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
                
                // Construir URL de WhatsApp con el número correctamente formateado
                // Formato: https://wa.me/5491123456789 (sin +, sin espacios, solo números)
                const url = `https://wa.me/${phone}?text=${encodeURIComponent(this.text)}`
                console.log('Enviando WhatsApp:', { 
                    original: phoneToUse, 
                    processed: phone, 
                    url,
                    phoneLength: phone.length
                })
                
                // Usar un nombre de ventana específico para reutilizar la misma ventana si ya existe
                // Esto evita que se abran múltiples pestañas de WhatsApp
                const windowName = 'whatsapp-window'
                
                try {
                    // Intentar abrir/reutilizar la ventana con el nombre específico
                    // Si la ventana ya existe con ese nombre, window.open la reutilizará automáticamente
                    let whatsappWindow = window.open(url, windowName, 'noopener,noreferrer')
                    
                    if (whatsappWindow) {
                        // Si la ventana se abrió o se reutilizó, enfocarla
                        whatsappWindow.focus()
                    }
                    // Si window.open retorna null (bloqueado por el navegador),
                    // no mostrar alert porque el mensaje puede haberse enviado igual
                    // a través de WhatsApp Web si está abierto o a través del protocolo wa.me
                } catch (error) {
                    // Si hay un error (por ejemplo, restricciones de seguridad), intentar abrir normalmente
                    console.warn('Error al abrir WhatsApp:', error)
                    try {
                        const fallbackWindow = window.open(url, '_blank', 'noopener,noreferrer')
                        if (fallbackWindow) {
                            fallbackWindow.focus()
                        }
                        // No mostrar alert si está bloqueado - el mensaje puede haberse enviado igual
                    } catch (e) {
                        console.warn('Error al abrir WhatsApp (fallback):', e)
                    }
                }
            }
        }
    }
</script>

<style scoped>
.whatsapp-btn {
    transition: all 0.3s ease;
    font-weight: 600;
    letter-spacing: 0.3px;
    white-space: normal;
    word-wrap: break-word;
    overflow: hidden;
}

.whatsapp-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2) !important;
}

.button-text {
    font-size: inherit;
    line-height: 1.2;
}
</style>