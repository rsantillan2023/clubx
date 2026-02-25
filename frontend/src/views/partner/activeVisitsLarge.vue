<template>
    <div class="py-5 px-2">
        <v-card outlined elevation="0">
            <v-data-table
                :items-per-page="100"
                :footer-props="{
                    'items-per-page-text':'Registros por Página',
                    'items-per-page-all-text': 'Todos',
                    'items-per-page-options': [10, 25, 50, 100, -1],
                    'page-text': paginationText,
                    }"
                :options.sync="localOptions"
                :server-items-length="totalItemsComputed"
                :headers="headers"
                :items="items"
                v-model="selected"
                item-key="id_visit"
                show-select
                calculate-widths
                :loading="load"
                :sort-by="localOptions.sortBy"
                :sort-desc="localOptions.sortDesc"
                no-data-text="Ningun Socio Encontrado">

                    <template v-slot:item.visit_date="{item}" >
                    {{ formatDate(item.visit_date, 'DD/MM/YYYY') }} | {{ parseHour(item.hour_entry) }}
                    </template>

                   <template v-slot:item.id_day="{item}">
                    {{ formatDay(item.id_day) }}
                   </template>

                   <template v-slot:item.total_payed="{item}">
                    $ {{ item.total_payed }}
                   </template>

                   <template v-slot:item.visit_amount_consumed="{item}">
                    $ {{ item.visit_amount_consumed || 0 }}
                   </template>

                   <template v-slot:item.partner.alias="{item}">
                    {{ formatAlias(item.partner.alias) }}
                   </template>

                   <template v-slot:item.id_bracelet_1="{item}">
                    <span class="text-body-1 font-weight-bold">{{ formatBracelet(item.id_bracelet_1) }}</span>
                   </template>

                    <template v-slot:item.actions="{item}" >
                        <div class="actions-buttons">
                            <v-btn 
                                color="orange" 
                                dark 
                                x-small 
                                class="action-btn"
                                @click="$router.push(`/access?search=${item.partner.partner_dni}`)">
                                INFO
                            </v-btn>
                            <v-btn 
                                color="orange" 
                                dark 
                                x-small 
                                class="action-btn"
                                @click="$router.push(`/consumed?id_bracelet=${item.id_bracelet_1}`)">
                                CONSUMOS
                            </v-btn>
                            <v-btn 
                                color="orange" 
                                dark 
                                x-small 
                                class="action-btn"
                                @click="goExit(item)">
                                EGRESO
                            </v-btn>
                        </div>
                    </template>
            </v-data-table>
        </v-card>
    </div>

</template>

<script>

    export default {

    props: {
        items: {type:Array},
        load: {type: Boolean, default: false},
        totalItems: {type: Number, default: 0},
        options: {type: Object, default: () => ({})}
    },
    emits: ['update:selected'],
    components: {},

    data: () => ({
        loadExcel: false,
        selected: [],
        headers: [
            { text: 'Tipo de Membresia', value: 'partner.visit_type.description', align: 'center', sortable: true},
            { text: 'ALIAS', value: 'partner.alias' , align: 'center', sortable: true},
            { text: 'Estado', value: 'partner.state.description', align: 'center', sortable: true },
            { text: 'Datos de Ingreso', value: 'visit_date', align: 'center', sortable: true}, //template//
            { text: 'Dia de Visita', value: 'id_day', align: 'center', sortable: true}, //template//
            { text: 'Monto abonado', value: 'total_payed', align: 'center', sortable: true }, //template//
            { text: 'Monto consumido', value: 'visit_amount_consumed', align: 'center', sortable: true }, //template//
            { text: 'Tipo de Visita', value: 'visit_type.description', align: 'center', sortable: true},
            { text: 'Nro de Tarjeta', value: 'id_bracelet_1' , align: 'center', sortable: true},
            { text: '', value: 'actions' , align: 'center', width: '200', sortable: false},

        ],
    
    }),
    computed: {
        localOptions: {
            get() {
                return this.options || {
                    sortBy: ['visit_date'],
                    sortDesc: [true],
                    page: 1,
                    itemsPerPage: 10,
                };
            },
            set(value) {
                this.$emit('changePaginado', value);
            }
        },
        totalItemsComputed() {
            return this.$props.totalItems || 0;
        },
        paginationText() {
            const itemsPerPage = this.localOptions.itemsPerPage || 10;
            const total = this.totalItemsComputed || 0;
            let cant = Math.ceil(total / itemsPerPage);
            return 'Pag. ' + (this.localOptions.page || 1) + " de " + cant 
        }
    },

    watch: {
        localOptions: {
            handler(newVal) {
                if(newVal && newVal.sortBy && newVal.sortBy.length > 0) {
                    this.$emit('changePaginado', newVal) 
                }
            },
            deep: true,
        },
        selected: {
            handler(newVal) {
                this.$emit('update:selected', newVal);
            },
            deep: true,
        },
    },

    methods: {
        goExit(data){
            let vm = this
            this.$http.get(process.env.VUE_APP_DEGIRA+"consumptions/get/consume?id_bracelet="+data.id_bracelet_1)
            .then((response)=>{
                if(response){
                    let total = 0;
                    response.data.data.products.map((item) => {
                        total = total + (parseFloat(item.price) * item.quantity)
                    })
                    let obj = data.partner
                    obj.total = total
                    obj.id_bracelet_1 = data.id_bracelet_1
                    obj.id_bracelet_2 = data.id_bracelet_2
                    obj.id_visit = data.id_visit
                    // Agregar todos los campos de la visita
                    obj.visit_date = data.visit_date
                    obj.hour_entry = data.hour_entry
                    obj.id_day = data.id_day
                    obj.last_visit = data.last_visit
                    obj.entry_amount_paid = data.entry_amount_paid
                    obj.extra_entry = data.extra_entry
                    obj.extra_entry_obs = data.extra_entry_obs
                    obj.visit_amount_consumed = data.visit_amount_consumed
                    obj.exit_amount_payed = data.exit_amount_payed
                    obj.extra_exit = data.extra_exit
                    obj.extra_exit_obs = data.extra_exit_obs
                    obj.entry_visit_obs = data.entry_visit_obs
                    obj.other_visit_obs = data.other_visit_obs
                    vm.$store.commit('setPartner', obj)
                    vm.$router.push(`/exitRegister`)
                }
            })
        },
            formatDate(date, format){
                  if(date != null){ 
                        date.replace(/(T)/, ' ');
                        date.substr(0, 19);
                  }
                  return (date) ? this.$moment(date, 'YYYY-MM-DD HH:mm:ss').format(format) : ''
              },

            parseHour(date){
            if(date != null){ 
                date.replace(/(T)/, ' ');
                date.substr(0, 19);
            }
            return (date != null) ? this.$moment(date, 'YYYY-MM-DD HH:mm:ss').format('HH:mm') : '';
            },

            formatDay(id_day){
                if(id_day == 1) return 'Domingo'
                if(id_day == 2) return 'Lunes'
                if(id_day == 3) return 'Martes'
                if(id_day == 4) return 'Miércoles'
                if(id_day == 5) return 'Jueves'
                if(id_day == 6) return 'Viernes'
                if(id_day == 7) return 'Sábado'
            },
            formatAlias(alias) {
                if (!alias) return '';
                return String(alias).replace(/---/g, ' ');
            },
            formatBracelet(bracelet) {
                if (!bracelet) return '';
                const braceletStr = String(bracelet);
                return braceletStr.length > 3 ? braceletStr.slice(-3) : braceletStr;
            }, 

        },
    }
</script>

<style scoped>
/* Estilos para reducir el tamaño de fuente */
::v-deep .v-data-table {
  font-size: 0.7rem;
}

::v-deep .v-data-table th {
  font-size: 0.7rem !important;
  padding: 6px 4px !important;
}

::v-deep .v-data-table td {
  font-size: 0.7rem !important;
  padding: 2px 4px !important;
}

::v-deep .actions-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 0 !important;
}

::v-deep .v-data-table td .actions-buttons {
  padding: 0 !important;
}

::v-deep .action-btn {
  font-size: 0.6rem !important;
  padding: 1px 6px !important;
  height: 22px !important;
  min-width: 55px !important;
  margin: 0 !important;
}
</style>

