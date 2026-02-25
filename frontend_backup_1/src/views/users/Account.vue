<template>
<div class="py-8">
    <v-row no-gutters class="justify-center">
        <v-col cols="12" class="d-flex justify-center">
            <v-avatar :size="200" color="orange">
                <v-icon color="white" :size="110">mdi-account</v-icon>
            </v-avatar>
        </v-col>
        <v-col cols="12" class="text-center my-2">
            <span class="font-weight-thin" style="font-size: 2rem">¡Hola {{user.name}} {{user.surname}}!</span>
        </v-col>

        <v-col cols="12" class="mt-2 px-5">
            <v-card outlined class="pa-4" elevation="0" :style="'border: solid 2px ' + $vuetify.theme.defaults.light.orange">
                <v-row no-gutters class="text-body-2">
                    <v-col cols="12" class="d-flex align-center mb-1">
                        <v-icon color="orange" size="28" class="mr-2">mdi-account</v-icon>
                        <span class="font-weight-bold mr-1">Usuario:</span><span>{{user.username}}</span>
                    </v-col>

                    <v-col cols="12" class="d-flex align-center">
                        <v-icon color="orange" size="28" class="mr-2">mdi-account-details</v-icon>
                        <span class="font-weight-bold mr-1">Roles Asignados:</span>
                        <span v-for="(rol,n) in user.roles" :key="'rol'+n">
                            {{rol.description}}
                            <span v-if="n < user.roles.length-1" class="mr-1">,</span>
                        </span>
                    </v-col>
                </v-row>
            </v-card>
        </v-col>
    </v-row>
</div>
</template>

<script>
    export default{
        data(){
            return{}
        },
        beforeMount(){
            console.log('user', this.user)
        },
        computed:{
            user(){
                return this.$store.state.userLoged.data
            }
        },
        methods:{

        }
    }
</script>