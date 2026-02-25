<template>
<div class="py-5 pa-2">
    <v-fab-transition>
          <v-btn
            color="orange"
            fab
            x-large
            v-show="(!$vuetify.breakpoint.mdAndUp && consumos.length > 0)"
            absolute
            fixed
            class="mb-15"
            dark
            bottom
            left
            @click="modalDetail = true"
          >
            <div>
                <v-icon top size="22">mdi-receipt-text-outline</v-icon>
                <div class="text-body-2">${{total}}</div>
            </div>
          </v-btn>
    </v-fab-transition>

    <v-row v-if="!load">
        <v-col :cols="($vuetify.breakpoint.mdAndUp && consumos.length > 0) ? 9 : 12" >
            <v-card no-gutters elevation="0" style="position: fixed; z-index: 100;" :width="($vuetify.breakpoint.mdAndUp) ? (consumos.length > 0) ? '68%' : '92%' : '100%'" class="py-2 px-3 mt-n5 rounded-0">
                <v-text-field
                    v-model="search"
                    append-icon="mdi-magnify"
                    label="Buscar Producto"
                    outlined
                    dense
                    class="mr-2"
                    clearable
                    hide-details
                ></v-text-field>
            </v-card>

            <v-data-iterator
                class="mt-10 px-5"
                :items="productos"
                hide-default-footer
                disable-pagination
                :search="search"
                no-results-text="No se encontraron productos"
                v-if="search"
            >
                <template v-slot:default="props">
                    <v-row>
                        <v-col cols="12" :md="(consumos.length > 0) ? 6 : 4" v-for="item, n in props.items" :key="'op-'+n" >
                            <ProductCard :item="item" class="mb-2"
                                         @add="add(item)"
                                         @remove="remove(item)"
                                         @delete="deleteItem(item)"
                            ></ProductCard>
                        </v-col>
                    </v-row>
                </template>
            </v-data-iterator>

            <div v-else class="mt-10">
                <v-row class="justify-center orange--text font-weight-bold my-2">
                    Productos destacados
                </v-row>

                <v-data-iterator
                    :items="productos_destacados"
                    hide-default-footer
                    disable-pagination
                    no-results-text=""
                    class="px-5"
                >
                    <template v-slot:default="props">
                        <v-row>
                            <v-col cols="12" :md="(consumos.length > 0) ? 6 : 4" v-for="item, n in props.items" :key="'p-'+n">
                                <ProductCard :item="item" class="mb-2"
                                    @add="add(item)"
                                    @remove="remove(item)"
                                    @delete="deleteItem(item)"
                                ></ProductCard>
                            </v-col>
                        </v-row>
                    </template>
                </v-data-iterator>

                <v-expansion-panels flat tile>
                <v-expansion-panel class="pa-0">
                    <v-expansion-panel-header class="font-weight-bold" :style="'border: solid 1px ' + $vuetify.theme.defaults.light.orange">
                          Otros Productos
                          <template v-slot:actions>
                            <v-avatar color="orange" class="font-weight-bold white--text" size="25" v-if="cant_otros_productos">
                              {{cant_otros_productos}}
                            </v-avatar>
                            <v-icon color="black">$expand</v-icon>
                          </template>
                    </v-expansion-panel-header>
                    <v-expansion-panel-content class="mt-2">
                        <v-data-iterator
                            :items="otros_productos"
                            hide-default-footer
                            disable-pagination
                            no-results-text=""
                        >
                            <template v-slot:default="props">
                                <v-row>
                                    <v-col cols="12" :md="(consumos.length > 0) ? 6 : 4" v-for="item, n in props.items" :key="'op-'+n" >
                                        <ProductCard :item="item" class="mb-2"
                                                     @add="add(item)"
                                                     @remove="remove(item)"
                                                     @delete="deleteItem(item)"
                                        ></ProductCard>
                                    </v-col>
                                </v-row>
                            </template>
                        </v-data-iterator>
                    </v-expansion-panel-content>
                  </v-expansion-panel>
                </v-expansion-panels>
            </div>
        </v-col>

        <v-col v-if="($vuetify.breakpoint.mdAndUp && consumos.length > 0)" cols="3" class="mt-10">
            <div style="position: fixed;">
                <DetailConsumed :total="total" :consumos="consumos" @cancelOrder="cancel()"/>
            </div>
        </v-col>
    </v-row>

    <v-container style="height: 30rem;" v-else>
      <v-row class="fill-height" no-gutters align-content="center" justify="center" >
        <v-col class="text-subtitle-1 text-center text--secondary" cols="12" >
          Buscando Productos...
        </v-col>
        <v-col cols="6">
          <v-progress-linear
            color="orange"
            indeterminate
            rounded
            height="6"
          ></v-progress-linear>
        </v-col>
      </v-row>
    </v-container>

    <v-dialog v-model="modalDetail">
        <v-card v-if="consumos.length">
            <v-toolbar color="orange" class="rounded-b-0" dark elevation="0">
                <v-icon class="mx-1">mdi-receipt-text-outline</v-icon>
                <span class="font-weight-bold">Detalle de Consumos</span>
                <v-spacer></v-spacer>
                <v-btn icon x-small @click="modalDetail = false" class="mr-1">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-toolbar>
            <div class="pa-5" style="max-height: 35rem; overflow-y: scroll;">
                <DetailConsumed :total="total" :consumos="consumos" @cancelOrder="cancel()"/>
            </div>

            <v-card-actions class="d-flex justify-center">
                <v-btn small dark @click="modalDetail = false" color="orange">
                    <v-icon>mdi-cart-arrow-down</v-icon>Seguir Agregando Productos
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
    
    
</div>
</template>

<script>
    import ProductCard from './ProductCard'
    import DetailConsumed from './DetailConsumed'
    export default{
        components:{
            ProductCard,
            DetailConsumed
        },
        data(){
            return{
                modalDetail: false,
                load: false,
                id_bracelet: null,
                search: null,
                productos: []
            }
        },
        computed:{
            productos_destacados(){
                return this.productos.filter((item) => item.featured)
            },
            otros_productos(){
                return this.productos.filter((item) => !item.featured)
            },
            cant_otros_productos(){
                let cant = 0
                this.otros_productos.map((item) => {
                    if(item.cantidad > 0) cant++
                })
                return cant
            },
            consumos(){
                return this.productos.filter((item) => item.cantidad > 0)
            },
            total(){
                let total = 0;
                this.consumos.map((item) => {
                    total += parseFloat(item.price)*parseInt(item.cantidad)
                })
                return total
            }
        },
        beforeMount(){
            this.getProducts()
        },
        methods:{
            add(item){
                let index = this.productos.indexOf(item)
                this.productos[index].cantidad++
            },
            remove(item){
                let index = this.productos.indexOf(item)
                this.productos[index].cantidad--
            },
            deleteItem(item){
                let index = this.productos.indexOf(item)
                this.productos[index].cantidad = 0
            },
            cancel(){
                this.modalDetail = false
                this.productos = this.productos.map((item) => {
                    item.cantidad = 0
                    return item
                })
            },
            getProducts(){
                let vm = this
                this.load = true
                this.$http.get(`${process.env.VUE_APP_DEGIRA}consumptions/get/featured`)
                .then((response) => {
                    if(response){
                        vm.productos = response.data.data.filter((item) => {
                            item.cantidad = 0
                            if(item.id_product_service > 10000) return item
                        })

                    }
                    vm.load = false
                })
                .catch((error) => console.log(error))
            }
        }
    }    
</script>


<style>
  /* This is for documentation purposes and will not be needed in your application */
  #lateral .v-btn--example {
    bottom: 0;
    position: absolute;
    margin: 0 0 16px 16px;
  }
</style>