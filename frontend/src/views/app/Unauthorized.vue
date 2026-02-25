<template>
<div>
    <v-row class="d-flex justify-center align-center text-center">
        <v-col cols="12" class="d-flex justify-center align-center"> 
            <v-icon style="font-size: 8rem;" class="grey--text">mdi-account-cancel-outline</v-icon>
        </v-col>

        <v-col cols="12">
            <span class="text-h6 text--secondary font-weight-bold">Usuario no autorizado</span>
        </v-col>
        <v-col cols="12">
            <v-btn color="orange" dark @click="$router.push('/home')">
                <v-icon left>mdi-home</v-icon>
                Volver al inicio
            </v-btn>
        </v-col>
    </v-row>
</div>
</template>

<script>
export default {
    name: 'Unauthorized',
};
</script>