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
            @click="modalDetail = true">
            <div>
                <v-icon top size="22">mdi-receipt-text-outline</v-icon>
                <div class="text-body-2">${{total}}</div>
            </div>
        </v-btn>
    </v-fab-transition>

    <v-row v-if="!load">

        <v-col :cols="($vuetify.breakpoint.mdAndUp) ? 9 : 12" class="px-2">

            <v-card no-gutters elevation="0" style="position: fixed; z-index: 100;" class="py-2 px-2 mt-n5 rounded-0 search-input-card">

                <v-text-field
                    v-model="search"
                    append-icon="mdi-magnify"
                    label="Buscar Producto"
                    outlined
                    dense
                    clearable
                    hide-details>
                </v-text-field>
            </v-card>

            <v-data-iterator
                class="mt-10 px-2"
                :items="productos_disponibles"
                hide-default-footer
                disable-pagination
                :search="search"
                no-results-text="No se encontraron productos"
                v-if="search">

                <template v-slot:default="props">
                    <v-row class="products-grid">
                        <v-col cols="6" :sm="4" :md="auto" v-for="item, n in props.items" :key="'op-'+n" class="product-col">
                            <ProductCard 
                                :item="item" class="mb-2"
                                @add="add(item)"
                                @remove="remove(item)"
                                @delete="deleteItem(item)">
                            </ProductCard>
                        </v-col>
                    </v-row>
                </template>
            </v-data-iterator>

            <div v-else class="mt-10">
                <v-row class="justify-center orange--text font-weight-bold my-2 text-body-2">
                    Productos destacados
                </v-row>

                <v-data-iterator
                    :items="productos_destacados"
                    hide-default-footer
                    disable-pagination
                    no-results-text=""
                    class="px-2">

                    <template v-slot:default="props">
                        <v-row class="products-grid">
                            <v-col cols="6" :sm="4" :md="auto" v-for="item, n in props.items" :key="'p-'+n" class="product-col">
                                <ProductCard 
                                    :item="item" class="mb-2"
                                    @add="add(item)"
                                    @remove="remove(item)"
                                    @delete="deleteItem(item)">
                                </ProductCard>
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
                            no-results-text="">

                            <template v-slot:default="props">
                                <v-row class="products-grid">
                                    <v-col cols="6" :sm="4" :md="auto" v-for="item, n in props.items" :key="'op-'+n" class="product-col">
                                        <ProductCard 
                                            :item="item" class="mb-2"
                                            @add="add(item)"
                                            @remove="remove(item)"
                                            @delete="deleteItem(item)">
                                        </ProductCard>
                                    </v-col>
                                </v-row>
                            </template>
                        </v-data-iterator>

                    </v-expansion-panel-content>
                  </v-expansion-panel>
                </v-expansion-panels>
            </div>
        </v-col>

        <v-col v-if="$vuetify.breakpoint.mdAndUp" cols="3" class="mt-12 px-2">
            <div class="consumos-panel">
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
            productos_disponibles(){
                return this.productos.filter((item) => item.available !== 0)
                    .sort((a, b) => {
                        const descA = (a.description || '').toLowerCase();
                        const descB = (b.description || '').toLowerCase();
                        return descA.localeCompare(descB);
                    })
            },
            productos_destacados(){
                return this.productos.filter((item) => item.featured && item.available !== 0)
                    .sort((a, b) => {
                        const descA = (a.description || '').toLowerCase();
                        const descB = (b.description || '').toLowerCase();
                        return descA.localeCompare(descB);
                    })
            },
            otros_productos(){
                return this.productos.filter((item) => !item.featured && item.available !== 0)
                    .sort((a, b) => {
                        const descA = (a.description || '').toLowerCase();
                        const descB = (b.description || '').toLowerCase();
                        return descA.localeCompare(descB);
                    })
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
                        vm.productos = response.data.data.map((item) => {
                            item.cantidad = 0
                            return item
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

  /* Grid para 4 productos por fila en pantallas medianas y grandes */
  @media (min-width: 960px) {
    .products-grid {
      display: flex;
      flex-wrap: wrap;
    }
    
    .products-grid .product-col {
      flex: 0 0 calc(25% - 8px);
      max-width: calc(25% - 8px);
      margin: 4px;
    }
  }

  /* Panel de consumos responsivo */
  .consumos-panel {
    position: sticky;
    top: 100px;
    max-height: calc(100vh - 120px);
    overflow-y: auto;
    overflow-x: hidden;
    width: 100%;
  }

  .consumos-panel::-webkit-scrollbar {
    width: 6px;
  }

  .consumos-panel::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }

  .consumos-panel::-webkit-scrollbar-thumb {
    background: #FF9800;
    border-radius: 10px;
  }

  .consumos-panel::-webkit-scrollbar-thumb:hover {
    background: #F57C00;
  }

  @media (max-width: 959px) {
    .consumos-panel {
      position: relative;
      top: 0;
      max-height: none;
      width: 100%;
    }
  }

  /* Asegurar que el panel no se corte */
  @media (min-width: 960px) {
    .consumos-panel > div {
      width: 100%;
      min-width: 0;
    }
  }

  /* Input de búsqueda con el mismo ancho que las cards */
  .search-input-card {
    width: calc(100% - 16px) !important;
    left: 8px;
  }

  @media (min-width: 960px) {
    .search-input-card {
      /* El v-col de 9 columnas ocupa 75% del ancho, reducido un 20% */
      width: calc(60% - 16px) !important;
      left: 8px;
    }
  }
</style>