<template>
<div>
    <v-card elevation="0" outlined :style="'border: solid 2px ' + $vuetify.theme.defaults.light.orange" class="px-5 pb-5" :max-height="($vuetify.breakpoint.mdAndUp) ? '25rem' : ''" :min-height="($vuetify.breakpoint.mdAndUp) ? '25rem' : ''">

        <v-container fluid class="d-flex justify-center">
            <v-img max-height="13rem" max-width="13rem"  :src="getImageUrl(item.url_image)"></v-img>
        </v-container>

        <v-row no-gutters>
            <v-col cols="12">
                <span class="font-weight-bold" style="font-size: 1.1rem">{{item.description}}</span>
            </v-col>
            <v-col cols="12">
                <span class="text-caption text--secondary">{{item.long_description}}</span>
            </v-col>
        </v-row>

        <v-card-actions class="d-block" bottom>
            <v-row no-gutters>
                <v-col cols="4" v-if="item.featured">
                    <v-icon color="yellow darken-3">mdi-star</v-icon>
                </v-col>

                <v-col :cols="(item.featured) ? 8 : 12" class="text-end">
                    <span class="font-weight-bold orange--text" style="font-size: 1.5rem">${{item.price}}</span>
                    <span class="ml-1 text--secondary">c/u</span>
                </v-col>
            </v-row>

            <v-divider :thickness="2" :style="'border: solid 1px ' + $vuetify.theme.defaults.light.orange"></v-divider>

            <v-row class="justify-center align-center pb-1 pt-5">
                <v-btn fab :dark="item.cantidad > 0" elevation="0" x-small color="orange" :disabled="item.cantidad == 0" @click="$emit('remove')"><v-icon>mdi-minus-thick</v-icon></v-btn>
                <span class=" mx-5" style="font-size: 1.1rem">{{item.cantidad}}</span>
                <v-btn fab dark elevation="0" x-small color="orange" @click="$emit('add')"><v-icon>mdi-plus-thick</v-icon></v-btn>
            </v-row>

            <v-row class="justify-center pt-2" no-gutters>
                <span class="text-caption text--secondary">Cantidad</span>
            </v-row>

            <v-row class="justify-end pb-2 mt-n10" no-gutters v-if="item.cantidad > 0">
                <v-btn icon elevation="0" small color="orange" @click="$emit('delete')"><v-icon>mdi-delete</v-icon></v-btn>
            </v-row>
        </v-card-actions>
    </v-card>
</div>
</template>

<script>
    export default{
        props:{
            item: {}
        },
        data(){
            return{

            }
        },
        methods: {
            getImageUrl(url) {
                if (!url) return null;
                
                // Si ya es una URL completa (http:// o https://), usarla tal cual
                if (url.startsWith('http://') || url.startsWith('https://')) {
                    return url;
                }
                
                // Si es una ruta relativa que empieza con /uploads/, construir la URL completa
                // Limpiar cualquier /v1/ que pueda estar en la ruta
                let cleanPath = url.replace(/^\/v1\//, '/');
                if (cleanPath.startsWith('/uploads/')) {
                    return `http://localhost:3000${cleanPath}`;
                }
                
                // Si no empieza con /uploads/, retornar la URL original
                return url;
            }
        }
    }
</script>