<template>
    <v-btn  @click="sendWhatsapp"
            small
            block
            dark
            class="mb-3"
            color="#25d366"
    >
        <v-icon left>mdi-whatsapp</v-icon>Enviar Via Whatsapp
    </v-btn>
</template>

<script>
    export default{
        props:{
            phoneNumber: { type: String, default: '' },
            text: { type: String, default: '' },
        },
        computed:{
            phone(){
                let phone = this.phoneNumber
                if(phone.startsWith('+')) phone = phone.slice(1, -1)
                if(!phone.startsWith('54')) phone = '54' + phone
                return phone
            }
        },
        methods:{
            sendWhatsapp(){
                let a = document.createElement("a");
                a.setAttribute("href", `https://wa.me/${this.phone}?text=${encodeURI(this.text)}`);
                a.setAttribute("target", "_blank");
                a.click()
            }
        }
    }
</script>