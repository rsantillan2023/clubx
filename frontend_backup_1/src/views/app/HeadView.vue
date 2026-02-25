<template>
  <v-app-bar app color="orange" dark hide-toolbar>
    <v-row class="align-center">
      <v-col cols="3" >
        <v-icon style="font-size: 2.5rem;" v-if="$route.name == 'dashboard' || $route.name == 'Unauthorized'">mdi-music-circle</v-icon>
        <v-icon @click="goBack()"  v-else>mdi-arrow-left</v-icon>
      </v-col>
      <v-col cols="6" class="d-flex align-center justify-center">
        <v-icon style="font-size: 2.5rem;" v-if="$route.name != 'dashboard' && $route.name != 'Unauthorized'">mdi-music-circle</v-icon>
        <div class="align-self-center">
          <div v-if="title" class="text-center font-weight-black ml-1" style="font-size: 0.8rem;"> {{ title }}</div>
          <div v-else class="text-center font-weight-black">Club X</div>

          <div style="font-size: 0.8rem; text-align: center;" v-if="$store.state.userLoged">¡Hola {{ $store.state.userLoged.data.name }}!</div>
        </div>
      </v-col>
      <v-col cols="3" class="d-flex justify-end">
        <v-icon @click="$router.push('/account')">mdi-account</v-icon>
      </v-col>
    </v-row>
  </v-app-bar>
</template>

<script>
export default{
    name: "HeadView",
    props:{
        userName: {type: String}
    },
    computed:{
      title(){
        console.log(this.$route)
        return (this.$route.meta.title) ? this.$route.meta.title : null
      }
    },
    methods: {
      goBack() {
        this.$router.go(-1)
      },
    }
}
</script>

