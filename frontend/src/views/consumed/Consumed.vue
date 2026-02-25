<template>
  <div class="py-5 px-2">
    <v-row v-if="items.length == 0" class="justify-center px-md-15 px-3 mb-3" no-gutters>
      <v-col cols="12" class="mb-3">
        <v-autocomplete
          v-model="selectedBracelet"
          :items="braceletsInClub"
          :search-input.sync="searchBracelet"
          item-text="label"
          item-value="id_bracelet_1"
          label="Buscar socio en el club (por tarjeta o alias)"
          outlined
          dense
          clearable
          @change="onBraceletSelected"
          prepend-inner-icon="mdi-account-group"
          :filter="filterBracelets"
        >
          <template v-slot:item="{ item }">
            <div class="d-flex align-center">
              <span class="font-weight-bold mr-2">{{ item.label }}</span>
              <span class="text-caption text--secondary">({{ formatAlias(item.alias) }})</span>
            </div>
          </template>
        </v-autocomplete>
      </v-col>
    </v-row>


<!-- ---------------------------------------------------- MODO APP ---------------------------------------------------------- -->

    <div v-if="items.length == 0 && !$vuetify.breakpoint.mdAndUp">
      <v-card  v-for="visita,n in visitas" :key="'visitas'+n"
        class="pa-2 my-4 pt-2" 
        :style="'border: solid 1px ' + $vuetify.theme.defaults.light.orange" 
        outlined>
        <v-row class="text-center" no-gutters>

          <v-col cols="12" class="mb-2 d-flex justify-center">
            <p class="mb-0"><b>ALIAS:</b> {{formatAlias(visita.partner?.alias || visita.alias)}} </p>
          </v-col>

          <v-col cols="4" class="text-caption">
            <p class="mb-0 text-center"><b>Tarjeta:</b> {{formatBracelet(visita.id_bracelet_1)}}</p>
          </v-col>

          <v-col cols="4" class="mb-2 pl-2 d-flex justify-center">
            <v-icon
            medium
            text
            @click="Searchitems(visita.id_bracelet_1)"
            color="orange">mdi-magnify
            </v-icon>
          </v-col>


          <v-col cols="12" class="text-caption">
            <p class="mb-0 text-center"><b>Tipo de Visita:</b> {{visita.visit_type.description}}</p>
          </v-col>
        </v-row>
      </v-card>
    </div>
<!-- ------------------------------------------------ MODO ESCRITORIO -------------------------------------------------------------- -->
      <v-card v-if="items.length == 0 && $vuetify.breakpoint.mdAndUp" outlined elevation="0">
        <!-- Indicador de cálculo de consumos -->
        <v-alert
          v-if="calculatingConsumos"
          type="info"
          dense
          outlined
          class="ma-2"
        >
          <div class="d-flex align-center">
            <v-progress-circular
              indeterminate
              color="orange"
              size="20"
              width="2"
              class="mr-2"
            ></v-progress-circular>
            <span>
              Calculando consumos... {{ consumosCalculated }} / {{ totalToCalculate }} socios
            </span>
          </div>
        </v-alert>

        <!-- Total consumido -->
        <v-alert
          v-if="!calculatingConsumos && visitas.length > 0"
          type="success"
          dense
          outlined
          class="ma-2"
        >
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <span class="font-weight-bold mr-3">Total Consumido:</span>
              <span class="text-h6 font-weight-bold orange--text">
                ${{ formatNumber(totalConsumido) }}
              </span>
            </div>
            <div class="d-flex align-center">
              <v-btn
                color="orange"
                dark
                small
                @click="recalculateConsumos"
                :loading="calculatingConsumos"
                class="mr-2"
              >
                <v-icon left small>mdi-refresh</v-icon>
                Recalcular
              </v-btn>
              <v-btn
                color="grey"
                dark
                small
                @click="goBack"
                class="mr-2"
              >
                <v-icon left small>mdi-arrow-left</v-icon>
                Volver
              </v-btn>
              <v-btn
                color="green"
                dark
                small
                @click="goToProductsSale"
                class="mr-2"
              >
                <v-icon left small>mdi-currency-usd</v-icon>
                Vender
              </v-btn>
              <v-btn
                color="blue"
                dark
                small
                @click="goToActiveVisits"
                class="mr-2"
              >
                <v-icon left small>mdi-account-group</v-icon>
                Ver socios en el club
              </v-btn>
              <v-btn
                color="green"
                dark
                small
                @click="exportToExcel"
                :loading="loadExcel"
              >
                <v-icon left small>mdi-file-excel</v-icon>
                Exportar Excel
              </v-btn>
            </div>
          </div>
        </v-alert>

        <v-data-table 
          :headers="headers"
          :items="visitasOrdenadas"
          calculate-widths
          hide-default-footer
          :items-per-page="-1" 
          :loading="load"
          no-data-text="No hay consumos">

          <template v-slot:item.partner.alias="{item}">
            <span>{{ formatAlias(item.partner?.alias || item.alias) }}</span>
          </template>

          <template v-slot:item.id_bracelet_1="{item}">
            <span class="text-body-1 font-weight-bold">{{ formatBracelet(item.id_bracelet_1) }}</span>
          </template>

          <template v-slot:item.hasConsumos="{item}">
            <v-chip
              x-small
              :color="item.hasConsumos ? 'orange' : 'grey'"
              :dark="item.hasConsumos"
              :outlined="!item.hasConsumos"
            >
              <v-icon x-small left>{{ item.hasConsumos ? 'mdi-check-circle' : 'mdi-close-circle' }}</v-icon>
              {{ item.hasConsumos ? 'Sí' : 'No' }}
            </v-chip>
          </template>

          <template v-slot:item.totalConsumido="{item}">
            <span v-if="item.hasConsumos" class="text-body-1 font-weight-bold orange--text">
              ${{ formatNumber(item.totalConsumido || 0) }}
            </span>
            <span v-else class="text--secondary">$0</span>
          </template>

          <template v-slot:item.actions="{item}" >
            <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                    <v-icon size="20" class="mx-1" color="orange" @click="Searchitems(item.id_bracelet_1)" v-bind="attrs" v-on="on">mdi-magnify
                    </v-icon>
                </template>
                <span>Consultar consumos del socio</span>
            </v-tooltip>
          </template>
        </v-data-table>
      </v-card>

      <div v-if="items.length > 0">
        <ConsumedLarge 
          v-if="$vuetify.breakpoint.mdAndUp" 
          :items="itemsClean"
          :roles="roles" 
          :brazalete="brazalete" 
          :tipoVisita="tipoVisita"
          :partner="partner"
          :loadExcel="loadExcel"
          @clickVolver="items= []"
          @clickAnular="itemDelete = $event; dialogDelete = true"
          @searchBrazalete="brazalete = $event; Searchitems(brazalete)"
          @exportExcel="exportToExcel">
        </ConsumedLarge>

        <ConsumedSmall 
          v-else :items="itemsClean" 
          :roles="roles" 
          :brazalete="brazalete" 
          :tipoVisita="tipoVisita"
          :partner="partner"
          :loadExcel="loadExcel"
          @clickVolver="items= []"
          @clickAnular="itemDelete = $event; dialogDelete = true"
          @exportExcel="exportToExcel">
        </ConsumedSmall>
      </div>
        
      <v-dialog 
        v-model="dialogDelete" max-width="500px">
          <v-card v-if="itemDelete !== null">
            <v-toolbar color="orange" class="rounded-b-0" dark elevation="0">
              <v-icon class="mx-1">mdi-delete</v-icon>
              <span class="font-weight-bold">Anular Consumo</span>
              <v-spacer></v-spacer>
              <v-btn 
                icon 
                x-small 
                @click="closeDelete" 
                class="mr-1">
                  <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-toolbar>
              
            <v-form class="px-3 py-5 text-center" ref="motivoAnulacion">
              <v-textarea
                class="mt-3"
                label="Motivo de Anulación"
                rows="2"
                outlined
                dense
                :rules='[(v) => !!v || "El campo es requerido"]'
                v-model="motivo"
                />
                <span style="font-size: 15px">¿Está seguro que desea anular este item?</span>
            </v-form>

            <v-card-actions>
              <v-spacer></v-spacer>
                <v-btn 
                  color="orange" 
                  text 
                  small 
                  dark 
                  @click="closeDelete" 
                  :disabled="loadAnulacion">Cancelar
                </v-btn>

                <v-btn 
                  small 
                  dark 
                  color="orange" 
                  elevation="0" 
                  @click="deleteItem" 
                  :loading="loadAnulacion">SI, Anular
                </v-btn>
            </v-card-actions>
          </v-card>
      </v-dialog>
    </div>
</template>

<script>
import eventBus from '../../event-bus'
import ConsumedLarge from './ConsumedLarge.vue'
import ConsumedSmall from './ConsumedSmall.vue'
import exportFromJSON from 'export-from-json'
import { downloadFileRN } from '../../helpers/reactNative'

  export default {
    components: {ConsumedLarge, ConsumedSmall},

    data: () => ({
      itemDelete: null,
      dialog: false,
      dialogDelete: false,
      load: false,
      loadB1: false,
      loadB2: false,
      loadAnulacion: false,
      loadExcel: false,
      calculatingConsumos: false,
      consumosCalculated: 0,
      totalToCalculate: 0,
      brazalete: null,
      selectedBracelet: null,
      searchBracelet: null,
      braceletsInClub: [],
      motivo: "",
      tipoVisita: 2,
      selectCantidad: 1,
      roles: [],
      items: [],
      partner: null,
      visitas: [],
      baseHeaders: [
        { text: 'ALIAS', value: 'partner.alias', align: 'center', sortable: true },
        { text: 'Nro de Tarjeta', value: 'id_bracelet_1', align: 'center', sortable: true },
        { text: 'Tipo de Visita', value: 'visit_type.description', align: 'center', sortable: true },
        { text: 'Tiene Consumos', value: 'hasConsumos', align: 'center', sortable: true },
        { text: 'Monto Consumido', value: 'totalConsumido', align: 'center', sortable: true },
        { text: '', value: 'actions' , align: 'center', width: '130', sortable: false},
      ],
      
      
    }),

    computed: {
      cantidad () {
        console.log(this.itemDelete)
        let existentes= this.itemDelete.quantity
        let options = []
        for(var i = 1; i <= existentes; i++) {
          options.push(i)
        }
        return options

      },
      itemsClean(){
        return this.items.filter((item) => item.quantity > 0)
      },
      totalConsumido() {
        if (!this.visitas || this.visitas.length === 0) return 0;
        return this.visitas.reduce((total, visita) => {
          return total + (parseFloat(visita.totalConsumido || 0));
        }, 0);
      },
      visitasOrdenadas() {
        // Ordenar por totalConsumido descendente si ya se calcularon los consumos
        if (!this.calculatingConsumos && this.visitas.length > 0) {
          return [...this.visitas].sort((a, b) => {
            const totalA = parseFloat(a.totalConsumido || 0);
            const totalB = parseFloat(b.totalConsumido || 0);
            return totalB - totalA; // Mayor a menor
          });
        }
        return this.visitas;
      },
      headers() {
        // Si está calculando, ocultar las columnas de consumos
        if (this.calculatingConsumos) {
          return this.baseHeaders.filter(header => 
            header.value !== 'hasConsumos' && header.value !== 'totalConsumido'
          );
        }
        return this.baseHeaders;
      }
    },

    watch: {
      dialog (val) {
        val || this.close()
      },
      dialogDelete (val) {
        val || this.closeDelete()
        if(!val){
            this.$refs.motivoAnulacion.reset()
        } else {this.selectCantidad = 1}
      },
      options: {
            handler () {
                if(this.options.sortBy.length > 0) {
                    this.getVisits()
                }
            },
            deep: true,
        },
    },

    beforeMount (){
        this.$store.state.userLoged.data.roles.map( (UserRole) => {
            this.roles.push(UserRole.id_role)
        })
        if(this.$route.query.id_bracelet){
          this.brazalete = this.$route.query.id_bracelet
          this.Searchitems(this.brazalete)
        }
        
        this.getVisits()
    },

    methods: {
      Searchitems (brazalete) {
        if(brazalete){
          let vm = this
          this.load = true
            this.$http.get(process.env.VUE_APP_DEGIRA+"consumptions/get/consume?id_bracelet="+brazalete)
            .then((response)=>{
              if(response.data.data.products.length > 0){
                vm.items = response.data.data.products
                vm.partner = response.data.data.partner
                vm.partner.id_visit = response.data.data.id_visit
                vm.partner.visit_type = response.data.data.visit_type
                
                // Debug: verificar datos del partner
                console.log('Consumed: Datos del partner recibidos', {
                  partner: vm.partner,
                  partner_phone: vm.partner?.partner_phone,
                  phone: vm.partner?.phone,
                  allKeys: vm.partner ? Object.keys(vm.partner) : []
                })
                } else {
                  vm.items = [] 
                  vm.partner =  null
                  eventBus.$emit('toast', { show: true, text: "No hay consumos para este Nro de Tarjeta", color: "red" })
                }
                  vm.load = false
            })
            .catch((error) => {
              console.error('Error al obtener consumos:', error)
              vm.load = false
            })
        } else eventBus.$emit('toast', { show: true, text: "Ingrese Nro de Tarjeta", color: "red" })
      },

      editItem (item) {
        this.editedIndex = this.items.indexOf(item)
        this.editedItem = Object.assign({}, item)
        this.dialog = true
      },

      deleteItem () {
        console.log(this.itemDelete)
        let data = {
            "cart": [ {...this.itemDelete,
                        cantidad: this.itemDelete.quantity*-1, 
                        price : parseFloat(this.itemDelete.price) * -1
                      } ],
            "total_consumed": parseFloat(this.itemDelete.price)* this.selectCantidad *-1,
            "id_bracelet" : this.itemDelete.id_bracelet,
            "ticket_observations": this.motivo,
            'id_ticket_detail': this.itemDelete.id_ticket_detail
        }
        this.loadAnulacion = true
        let vm = this
        this.$http.post(process.env.VUE_APP_DEGIRA+"consumptions/create",data)
        .then((response) => { 
            if(response){
              vm.Searchitems(vm.itemDelete.id_bracelet)
              vm.dialogDelete = false
              let dialog = {  show: true, 
                              title: "Consumo eliminado correctamente", 
                              type: 'success',
                              isHtml: true,
                              goToHome: false,
                              closeDialog: true,
                              text: [ {label: 'Tarjeta', 
                                        value: response.data.data.id_bracelet, 
                                        show: true
                                      },
                                      {label: 'Consumo Eliminado', 
                                        value: response.data.data.products[0].description + ' x'+ response.data.data.products[0].cantidad * -1 + ' u.', 
                                        show: true
                                      },
                                      {label: 'Motivo de Anulacion', 
                                        value: response.data.data.ticket_observation,  
                                        show: true
                                      },
                                  ]
                            }
                eventBus.$emit('ConfirmDialog', dialog)
            }
            vm.loadAnulacion = false
        }).catch((error)=>{
            console.log(error.response)
            eventBus.$emit('toast', { show: true, text: (error.response.data.message) ? error.response.data.message :  "No se ha podido eliminar el consumo", color: "red" })
            vm.loadAnulacion=false
        })
        
      },

      close () {
        this.dialog = false
        this.$nextTick(() => {
          this.editedItem = Object.assign({}, this.defaultItem)
          this.editedIndex = -1
        })
      },

      closeDelete () {
        this.dialogDelete = false
        this.$nextTick(() => {
          this.editedItem = Object.assign({}, this.defaultItem)
          this.editedIndex = -1
        })
      },

      save () {
        if (this.editedIndex > -1) {
          Object.assign(this.items[this.editedIndex], this.editedItem)
        } else {
          this.items.push(this.editedItem)
        }
        this.close()
      },

      async getVisits() {
        let vm = this
          this.load = true
          //process.env.VUE_APP_DEGIRA+"partners/inside?page="+this.options.page+"&cantPage="+this.options.cantPage+"&sortBy="+this.options.sortBy[0]+"&sortDesc="+this.options.sortDesc[0]
            this.$http.get(process.env.VUE_APP_DEGIRA+"partners/inside", {
              params: {
                page: 1,
                pageSize: 1000
              }
            })
            .then(async (response)=>{
              if(response){
                // El responseHandler devuelve { data: rows, totalCount: count }
                const visitsData = response.data.data || [];
                vm.visitas = Array.isArray(visitsData) ? visitsData : [];
                
                // Inicializar valores por defecto para mostrar la grilla inmediatamente
                vm.visitas.forEach(visita => {
                  visita.hasConsumos = false;
                  visita.totalConsumido = 0;
                });
                
                // Preparar datos para el combo (sin esperar consumos)
                vm.braceletsInClub = vm.visitas.map(visita => {
                  const braceletStr = String(visita.id_bracelet_1 || '');
                  const last3 = braceletStr.length > 3 ? braceletStr.slice(-3) : braceletStr;
                  const alias = visita.partner?.alias || visita.alias || 'Sin alias';
                  return {
                    id_bracelet_1: visita.id_bracelet_1,
                    label: `Tarjeta: ${last3}`,
                    alias: alias,
                    fullBracelet: visita.id_bracelet_1,
                    hasConsumos: false
                  };
                });
                
                vm.load = false;
                
                // Ahora calcular consumos en segundo plano
                if (vm.visitas.length > 0) {
                  vm.calculatingConsumos = true;
                  vm.totalToCalculate = vm.visitas.length;
                  vm.consumosCalculated = 0;
                  
                  // Calcular consumos para cada visita
                  for (let i = 0; i < vm.visitas.length; i++) {
                    const visita = vm.visitas[i];
                    try {
                      const consumeResponse = await vm.$http.get(
                        process.env.VUE_APP_DEGIRA+"consumptions/get/consume?id_bracelet="+visita.id_bracelet_1
                      );
                      const products = consumeResponse.data.data?.products || [];
                      visita.hasConsumos = products.length > 0;
                      
                      // Calcular total consumido
                      if (visita.hasConsumos) {
                        visita.totalConsumido = products.reduce((total, product) => {
                          return total + (parseFloat(product.price || 0) * parseInt(product.quantity || 0));
                        }, 0);
                      } else {
                        visita.totalConsumido = 0;
                      }
                    } catch (error) {
                      visita.hasConsumos = false;
                      visita.totalConsumido = 0;
                    }
                    
                    vm.consumosCalculated = i + 1;
                    
                    // Forzar actualización de la vista
                    vm.$forceUpdate();
                  }
                  
                  vm.calculatingConsumos = false;
                  
                  // Actualizar el combo con los datos de consumos
                  vm.braceletsInClub = vm.visitas.map(visita => {
                    const braceletStr = String(visita.id_bracelet_1 || '');
                    const last3 = braceletStr.length > 3 ? braceletStr.slice(-3) : braceletStr;
                    const alias = visita.partner?.alias || visita.alias || 'Sin alias';
                    return {
                      id_bracelet_1: visita.id_bracelet_1,
                      label: `Tarjeta: ${last3}`,
                      alias: alias,
                      fullBracelet: visita.id_bracelet_1,
                      hasConsumos: visita.hasConsumos
                    };
                  });
                }
                } 
            })

      },
      onBraceletSelected(braceletId) {
        if (braceletId) {
          this.brazalete = braceletId;
          this.Searchitems(braceletId);
        } else {
          this.brazalete = null;
          this.items = [];
          this.partner = null;
        }
      },
      formatBracelet(bracelet) {
        if (!bracelet) return '';
        const braceletStr = String(bracelet);
        return braceletStr.length > 3 ? braceletStr.slice(-3) : braceletStr;
      },
      formatAlias(alias) {
        if (!alias) return '';
        return String(alias).replace(/---/g, ' ');
      },
      formatNumber(num) {
        if (!num && num !== 0) return '0';
        return num.toLocaleString('es-AR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        });
      },
      filterBracelets(item, queryText) {
        if (!queryText) return true;
        const searchText = queryText.toLowerCase();
        const label = item.label.toLowerCase();
        const alias = this.formatAlias(item.alias).toLowerCase();
        const fullBracelet = String(item.fullBracelet || '').toLowerCase();
        
        return label.includes(searchText) || 
               alias.includes(searchText) || 
               fullBracelet.includes(searchText);
      },
      async recalculateConsumos() {
        if (this.visitas.length === 0) return;
        
        this.calculatingConsumos = true;
        this.totalToCalculate = this.visitas.length;
        this.consumosCalculated = 0;
        
        // Recalcular consumos para cada visita
        for (let i = 0; i < this.visitas.length; i++) {
          const visita = this.visitas[i];
          try {
            const consumeResponse = await this.$http.get(
              process.env.VUE_APP_DEGIRA+"consumptions/get/consume?id_bracelet="+visita.id_bracelet_1
            );
            const products = consumeResponse.data.data?.products || [];
            visita.hasConsumos = products.length > 0;
            
            // Calcular total consumido
            if (visita.hasConsumos) {
              visita.totalConsumido = products.reduce((total, product) => {
                return total + (parseFloat(product.price || 0) * parseInt(product.quantity || 0));
              }, 0);
            } else {
              visita.totalConsumido = 0;
            }
          } catch (error) {
            visita.hasConsumos = false;
            visita.totalConsumido = 0;
          }
          
          this.consumosCalculated = i + 1;
          
          // Forzar actualización de la vista
          this.$forceUpdate();
        }
        
        this.calculatingConsumos = false;
        
        // Actualizar el combo con los datos de consumos
        this.braceletsInClub = this.visitas.map(visita => {
          const braceletStr = String(visita.id_bracelet_1 || '');
          const last3 = braceletStr.length > 3 ? braceletStr.slice(-3) : braceletStr;
          const alias = visita.partner?.alias || visita.alias || 'Sin alias';
          return {
            id_bracelet_1: visita.id_bracelet_1,
            label: `Tarjeta: ${last3}`,
            alias: alias,
            fullBracelet: visita.id_bracelet_1,
            hasConsumos: visita.hasConsumos
          };
        });
      },
      goBack() {
        this.$router.go(-1);
      },
      goToProductsSale() {
        this.$router.push('/productsSale');
      },
      goToActiveVisits() {
        this.$router.push('/activeVisits');
      },
      async exportToExcel() {
        this.loadExcel = true;
        
        try {
          let dataToExport = [];
          let fileName = '';
          
          if (this.items.length > 0) {
            // Exportar detalle de consumos del socio actual
            if (this.itemsClean.length === 0) {
              eventBus.$emit('toast', { 
                show: true, 
                text: "No hay consumos para exportar", 
                color: "red" 
              });
              this.loadExcel = false;
              return;
            }
            
            // Calcular total del socio actual
            const totalSocio = this.itemsClean.reduce((total, item) => {
              if (item.payed != null) {
                return total + (parseFloat(item.price || 0) * parseInt(item.quantity || 0));
              }
              return total;
            }, 0);
            
            // Agregar los consumos con información del socio en cada fila
            this.itemsClean.forEach((item, index) => {
              const estado = item.payed === 0 ? 'No Pagado' : 
                           item.payed === 1 ? 'Pagado' : 'Anulado';
              const hora = item.ticket_date ? 
                this.$moment(item.ticket_date, 'YYYY-MM-DD HH:mm:ss').format('HH:mm') : '';
              
              dataToExport.push({
                'Numero': index + 1,
                'Descripcion': item.description || '',
                'Hora': hora,
                'Tarjeta': item.id_bracelet || '',
                'Precio_Unitario': parseFloat(item.price || 0),
                'Cantidad': parseInt(item.quantity || 0),
                'Monto': parseFloat(item.price || 0) * parseInt(item.quantity || 0),
                'Estado': estado,
                'Alias': this.formatAlias(this.partner?.alias || ''),
                'Nombre': this.partner?.partner_name || '',
                'Tarjeta_Socio': this.partner?.id_bracelet_1 || '',
                'Tipo_Visita': this.partner?.visit_type?.description || '',
              });
            });
            
            // Agregar fila de total al final
            dataToExport.push({
              'Numero': '',
              'Descripcion': 'TOTAL',
              'Hora': '',
              'Tarjeta': '',
              'Precio_Unitario': '',
              'Cantidad': '',
              'Monto': totalSocio,
              'Estado': '',
              'Alias': '',
              'Nombre': '',
              'Tarjeta_Socio': '',
              'Tipo_Visita': '',
            });
            
            const timeAndHour = this.$moment().format('DDMMYYYYHHmm');
            fileName = `Consumos_${this.formatAlias(this.partner?.alias || 'Socio')}_${timeAndHour}`;
          } else {
            // Exportar información de todos los socios en la grilla
            if (this.visitas.length === 0) {
              eventBus.$emit('toast', { 
                show: true, 
                text: "No hay datos para exportar", 
                color: "red" 
              });
              this.loadExcel = false;
              return;
            }
            
            // Esperar a que se calculen los consumos si están calculando
            if (this.calculatingConsumos) {
              eventBus.$emit('toast', { 
                show: true, 
                text: "Espere a que se calculen los consumos", 
                color: "orange" 
              });
              this.loadExcel = false;
              return;
            }
            
            // Preparar datos de los socios
            this.visitasOrdenadas.forEach((visita) => {
              dataToExport.push({
                'Alias': this.formatAlias(visita.partner?.alias || visita.alias || ''),
                'Tarjeta': visita.id_bracelet_1 || '',
                'Tipo_Visita': visita.visit_type?.description || '',
                'Tiene_Consumos': visita.hasConsumos ? 'Sí' : 'No',
                'Monto_Consumido': parseFloat(visita.totalConsumido || 0),
              });
            });
            
            const timeAndHour = this.$moment().format('DDMMYYYYHHmm');
            fileName = `Socios_Consumos_${timeAndHour}`;
          }
          
          const exportType = exportFromJSON.types.xls;
          downloadFileRN({ data: dataToExport, fileName, exportType });
          exportFromJSON({ data: dataToExport, fileName, exportType });
          
          eventBus.$emit('toast', { 
            show: true, 
            text: "Archivo exportado correctamente", 
            color: "green" 
          });
        } catch (error) {
          console.error('Error al exportar:', error);
          eventBus.$emit('toast', { 
            show: true, 
            text: "Error al exportar el archivo", 
            color: "red" 
          });
        } finally {
          this.loadExcel = false;
        }
      },
    },
  }
</script>