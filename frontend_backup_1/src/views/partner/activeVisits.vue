<template>
    <div class="py-5 px-2">
        <v-row class="justify-center mb-2">
          <v-icon color="orange" size="100">mdi-clipboard-text-clock</v-icon>
        </v-row>

        <span class="orange--text d-flex justify-center pb-2" style="font-size:1.5rem">Socios en este momento en el club</span>

       <activeVisitsLarge
        v-if="$vuetify.breakpoint.mdAndUp"
        :items="items"
        :load="load"
        @changePaginado="options = $event">
       </activeVisitsLarge>

       <activeVisitsSmall
        v-if="!$vuetify.breakpoint.mdAndUp" 
        :items="items"
        :load="load"
        @changePaginado="options = $event">
       </activeVisitsSmall>
    </div>
</template>

<script>

    import activeVisitsSmall from './activeVisitsSmall.vue';
    import activeVisitsLarge from './activeVisitsLarge.vue';

    export default {
    components: {activeVisitsSmall,activeVisitsLarge},

    data: () => ({
      load: false,   
      loadExcel: false,
      items : [],
      options: {
            sortBy:['horaEntrada'],
            sortDesc:[true],
            page: 1,
            itemsPerPage: 10,
        },
        totalItems: 10,
     
    }),

    computed: {
        paginationText() {
            let cant = this.totalItems/ this.options.itemsPerPage
            return 'Pag. ' + this.options.page + " de " + cant 
        }
    },

    watch: {

        options: {
            handler () {
                if(this.options.sortBy.length > 0) {
                    this.getVisits()
                }
            },
            deep: true,
        },
      
    },
    beforeMount(){
      this.getVisits()
    },

    methods: {

      getVisits() {
        let vm = this
          this.load = true

          //https://dev-imasdsooft.imasdsooft.com.ar/api/v1/degira/partners/inside?sortBy=partner.visit_type.description&sortDesc=false
          //process.env.VUE_APP_DEGIRA+"partners/inside?page="+this.options.page+"&cantPage="+this.options.cantPage+"&sortBy="+this.options.sortBy[0]+"&sortDesc="+this.options.sortDesc[0]
            this.$http.get(process.env.VUE_APP_DEGIRA+"partners/inside?sortBy="+this.options.sortBy[0]+"&sortDesc="+this.options.sortDesc[0])
            .then((response)=>{
              if(response){
                vm.items = response.data.data.visits
                } 
                vm.load = false
            })

      },



    },
  }
</script>

