<template>
    <v-card class="px-4 py-6 ma-0" rounded="lg" min-height="400">
        <v-row class="d-flex justify-center align-center text-center">
            <v-col cols="12" class="d-flex justify-center align-center"> 
                <v-card class="rounded-circle d-flex justify-center align-center" color="grey lighten-2" width="15rem" height="15rem">
                    <v-icon style="font-size: 10rem;" class="grey--text">mdi-close-circle-outline</v-icon>
                </v-card>
            </v-col>

            <v-col cols="12">
                <span class="text-h2 text--secondary font-weight-bold">Página no endontrada</span>
            </v-col>
        </v-row>
    </v-card>
</template>

<script>
export default {
    name: 'Notfound',
};
</script>