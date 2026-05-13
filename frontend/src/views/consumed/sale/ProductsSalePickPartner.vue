<template>
    <div class="py-3 px-2">
        <v-row class="mb-3 align-center" no-gutters>
            <v-col cols="auto" class="pr-2">
                <v-btn icon aria-label="Volver" @click="$router.push('/home')">
                    <v-icon>mdi-arrow-left</v-icon>
                </v-btn>
            </v-col>
            <v-col class="min-width-0">
                <div class="header-consumos-row d-flex align-center justify-space-between flex-nowrap">
                    <div class="header-consumos-text pr-2 min-width-0">
                        <div class="text-h6 font-weight-bold">Cargar consumos</div>
                        <div class="text-caption grey--text text--darken-1">
                            Elegí un socio que esté dentro; se abre la venta con su tarjeta lista.
                        </div>
                    </div>
                    <div class="header-club-count orange--text font-weight-bold flex-shrink-0">
                        {{ totalItems }} en club
                    </div>
                </div>
            </v-col>
        </v-row>

        <v-card outlined class="pa-2 mb-3 filter-toolbar-card">
            <v-text-field
                v-model="searchText"
                label="Buscar (DNI, nombre, alias)"
                outlined
                dense
                hide-details
                clearable
                prepend-inner-icon="mdi-magnify"
                class="filter-toolbar-search-fullwidth mb-3"
                @keyup.enter="flushSearchRefresh"
            />
            <div class="text-caption grey--text font-weight-medium mb-2 text-center">Tipo de visita</div>
            <div class="filter-visit-type-buttons">
                <v-btn
                    x-small
                    depressed
                    :outlined="filters.id_visit_type != null"
                    color="orange"
                    :dark="filters.id_visit_type == null"
                    class="filter-vt-btn"
                    @click="setVisitTypeFilter(null)"
                >
                    Todos
                </v-btn>
                <v-btn
                    v-for="vt in visitTypes"
                    :key="vt.id_visit_type"
                    x-small
                    depressed
                    :outlined="!isVisitTypeSelected(vt.id_visit_type)"
                    color="orange"
                    :dark="isVisitTypeSelected(vt.id_visit_type)"
                    class="filter-vt-btn"
                    :title="vt.description"
                    @click="setVisitTypeFilter(vt.id_visit_type)"
                >
                    {{ shortVisitTypeLabel(vt) }}
                </v-btn>
            </div>
        </v-card>

        <v-card outlined class="pa-2 mb-3 sort-order-card">
            <div class="sort-order-toggle-wrap sort-order-buttons">
                <v-btn
                    v-for="p in sortPresets"
                    :key="p.key"
                    x-small
                    depressed
                    :outlined="sortPresetKey !== p.key"
                    color="orange"
                    :dark="sortPresetKey === p.key"
                    class="sort-order-btn"
                    :title="p.text"
                    @click="sortPresetKey = p.key"
                >
                    {{ p.shortText }}
                </v-btn>
            </div>
        </v-card>

        <div v-if="load">
            <v-container style="min-height: 16rem;">
                <v-row class="fill-height" align-content="center" justify="center">
                    <v-col cols="12" class="text-center text--secondary">Cargando socios…</v-col>
                    <v-col cols="6">
                        <v-progress-linear color="orange" indeterminate rounded height="6" />
                    </v-col>
                </v-row>
            </v-container>
        </div>

        <template v-else>
            <div v-if="$vuetify.breakpoint.mdAndUp">
                <v-card outlined>
                    <v-data-table
                        :headers="headers"
                        :items="items"
                        :items-per-page="-1"
                        hide-default-footer
                        class="elevation-0"
                        no-data-text="Ningún socio en el club con estos criterios"
                    >
                        <template v-slot:item.partner.alias="{ item }">
                            {{ formatAlias(item.partner && item.partner.alias) }}
                        </template>
                        <template v-slot:item.partner.partner_name="{ item }">
                            {{ (item.partner && item.partner.partner_name) || '—' }}
                        </template>
                        <template v-slot:item.visit_type.description="{ item }">
                            {{ (item.visit_type && item.visit_type.description) || '—' }}
                        </template>
                        <template v-slot:item.hour_entry="{ item }">
                            {{ parseHour(item.hour_entry) }}
                        </template>
                        <template v-slot:item.id_bracelet_1="{ item }">
                            <span class="font-weight-bold">{{ formatBracelet(item.id_bracelet_1) }}</span>
                        </template>
                        <template v-slot:item.actions="{ item }">
                            <v-btn x-small dark color="orange" class="mr-1" @click="goSale(item, item.id_bracelet_1)">
                                Pedido socio
                            </v-btn>
                            <v-btn
                                v-if="item.id_bracelet_2 && item.partner && item.partner.affiliate_name"
                                x-small
                                outlined
                                color="orange"
                                @click="goSale(item, item.id_bracelet_2)"
                            >
                                Pedido afiliado
                            </v-btn>
                        </template>
                    </v-data-table>
                </v-card>
            </div>

            <div v-else>
                <v-row class="pick-cards-mobile">
                    <v-col
                        v-for="(item, n) in items"
                        :key="'pick-' + (item.id_visit || n)"
                        cols="4"
                        class="pick-cards-mobile-col"
                    >
                        <v-card
                            outlined
                            class="pick-card-mobile pick-card-clickable pa-2 d-flex flex-column fill-height"
                            :style="'border-left: 3px solid ' + ($vuetify.theme.defaults.light.orange || '#FF9800')"
                            role="button"
                            tabindex="0"
                            :aria-label="'Cargar pedido: ' + pickCardPrimaryLabel(item)"
                            @click="goSale(item, item.id_bracelet_1)"
                            @keydown.enter.prevent="goSale(item, item.id_bracelet_1)"
                            @keydown.space.prevent="goSale(item, item.id_bracelet_1)"
                        >
                            <div class="pick-card-inner">
                                <div class="pick-card-headrow">
                                    <div class="pick-card-alias font-weight-bold pick-card-truncate">
                                        {{ pickCardPrimaryLabel(item) }}
                                    </div>
                                    <div class="pick-card-bracelet">
                                        {{ formatBracelet(item.id_bracelet_1) }}
                                    </div>
                                </div>
                                <div class="pick-card-meta grey--text mt-1 pick-card-meta-centered">
                                    <div class="pick-card-truncate">{{ parseHour(item.hour_entry) }}</div>
                                </div>
                                <div class="pick-card-extra-row light-blue--text text--darken-2 mt-1 pick-card-truncate font-weight-bold">
                                    {{ (item.visit_type && item.visit_type.description) || '\u00A0' }}
                                </div>
                            </div>
                            <div
                                v-if="item.id_bracelet_2 && item.partner && item.partner.affiliate_name"
                                class="pick-card-actions mt-auto pt-2"
                                @click.stop
                            >
                                <v-btn
                                    outlined
                                    color="orange"
                                    x-small
                                    block
                                    class="px-0"
                                    min-width="0"
                                    @click.stop="goSale(item, item.id_bracelet_2)"
                                >
                                    +Afiliado
                                </v-btn>
                            </div>
                        </v-card>
                    </v-col>
                </v-row>
                <v-alert v-if="items.length === 0" type="info" outlined dense class="mt-2">
                    No hay socios que coincidan. Probá otro filtro o actualizá la lista.
                </v-alert>
            </div>
        </template>
    </div>
</template>

<script>
export default {
    name: 'ProductsSalePickPartner',
    data() {
        return {
            load: false,
            items: [],
            totalItems: 0,
            searchText: '',
            searchDebounceMs: 380,
            searchDebounceTimer: null,
            filters: {
                id_visit_type: null,
            },
            visitTypes: [],
            sortPresetKey: 'hour_desc',
            sortPresets: [
                { key: 'hour_desc', text: 'Entrada: últimos primero', shortText: 'Últimos', sortBy: 'hour_entry', sortDesc: true },
                { key: 'hour_asc', text: 'Entrada: primeros primero', shortText: 'Primeros', sortBy: 'hour_entry', sortDesc: false },
                { key: 'alias_asc', text: 'Alias A → Z', shortText: 'Alias A-Z', sortBy: 'partner.alias', sortDesc: false },
                { key: 'alias_desc', text: 'Alias Z → A', shortText: 'Alias Z-A', sortBy: 'partner.alias', sortDesc: true },
                { key: 'card_asc', text: 'Nº tarjeta menor → mayor', shortText: 'Tarj. ↑', sortBy: 'id_bracelet_1', sortDesc: false },
                { key: 'card_desc', text: 'Nº tarjeta mayor → menor', shortText: 'Tarj. ↓', sortBy: 'id_bracelet_1', sortDesc: true },
            ],
            options: {
                page: 1,
                itemsPerPage: 500,
                sortBy: ['hour_entry'],
                sortDesc: [true],
            },
            headers: [
                { text: 'Alias', value: 'partner.alias', sortable: false },
                { text: 'Socio', value: 'partner.partner_name', sortable: false },
                { text: 'Entrada', value: 'hour_entry', sortable: false },
                { text: 'Tipo visita', value: 'visit_type.description', sortable: false },
                { text: 'Tarjeta', value: 'id_bracelet_1', sortable: false },
                { text: '', value: 'actions', sortable: false, width: '220' },
            ],
        };
    },
    watch: {
        searchText(newVal) {
            const empty = newVal === '' || newVal == null || String(newVal).trim() === '';
            if (empty) {
                this.cancelPendingSearch();
                this.options.page = 1;
                this.getVisits();
                return;
            }
            this.scheduleSearchRefresh();
        },
        'filters.id_visit_type'() {
            this.cancelPendingSearch();
            this.options.page = 1;
            this.refresh();
        },
        sortPresetKey() {
            this.syncSortFromPreset();
            this.options.page = 1;
            this.refresh();
        },
    },
    beforeMount() {
        this.syncSortFromPreset();
        this.loadVisitTypes();
        this.refresh();
    },
    beforeDestroy() {
        this.cancelPendingSearch();
    },
    methods: {
        syncSortFromPreset() {
            const p = this.sortPresets.find((x) => x.key === this.sortPresetKey);
            if (!p) return;
            this.options.sortBy = [p.sortBy];
            this.options.sortDesc = [p.sortDesc];
        },
        refresh() {
            this.cancelPendingSearch();
            this.getVisits();
        },
        cancelPendingSearch() {
            if (this.searchDebounceTimer != null) {
                clearTimeout(this.searchDebounceTimer);
                this.searchDebounceTimer = null;
            }
        },
        scheduleSearchRefresh() {
            this.cancelPendingSearch();
            this.searchDebounceTimer = setTimeout(() => {
                this.searchDebounceTimer = null;
                this.options.page = 1;
                this.getVisits();
            }, this.searchDebounceMs);
        },
        flushSearchRefresh() {
            this.cancelPendingSearch();
            this.options.page = 1;
            this.getVisits();
        },
        async loadVisitTypes() {
            try {
                const response = await this.$http.get(`${process.env.VUE_APP_DEGIRA}visits_types/get`);
                if (response && response.data) this.visitTypes = response.data.data || [];
            } catch (e) {
                console.error(e);
            }
        },
        getVisits() {
            this.load = true;
            const params = {
                page: this.options.page,
                pageSize: this.options.itemsPerPage,
                sortBy: this.options.sortBy[0] || 'hour_entry',
                sortDesc: this.options.sortDesc[0] !== false,
            };
            const q =
                this.searchText != null && this.searchText !== ''
                    ? String(this.searchText).trim()
                    : '';
            if (q) params.search = q;
            if (this.filters.id_visit_type) params.id_visit_type = this.filters.id_visit_type;

            this.$http
                .get(process.env.VUE_APP_DEGIRA + 'partners/inside', { params })
                .then((response) => {
                    if (response && response.data) {
                        this.items = response.data.data || [];
                        this.totalItems = response.data.totalCount || this.items.length;
                    }
                    this.load = false;
                })
                .catch((error) => {
                    console.error(error);
                    this.load = false;
                });
        },
        saleQueryFromVisit(item, idBracelet) {
            const q = {};
            if (!item || idBracelet == null || idBracelet === '') return q;
            q.sale_card_display = this.formatBracelet(idBracelet);
            let name = '';
            if (item.partner) {
                const isAffiliate =
                    item.id_bracelet_2 != null &&
                    String(item.id_bracelet_2) === String(idBracelet);
                if (isAffiliate && item.partner.affiliate_name) {
                    name = item.partner.affiliate_name;
                } else {
                    name = this.pickCardPrimaryLabel(item);
                }
            }
            if (name) q.sale_name = name;
            const aliasRaw = item.partner && item.partner.alias;
            const aliasDisp =
                aliasRaw != null && String(aliasRaw).trim() !== ''
                    ? this.formatAlias(aliasRaw).trim()
                    : '';
            if (aliasDisp) q.sale_alias = aliasDisp;
            const vt = item.visit_type && item.visit_type.description;
            if (vt) q.sale_visit_type = vt;
            let idPartner =
                item.partner &&
                item.partner.id_partner != null &&
                item.partner.id_partner !== ''
                    ? item.partner.id_partner
                    : item.id_partner;
            if (idPartner != null && idPartner !== '') q.sale_id_partner = String(idPartner);
            if (item.id_visit != null && item.id_visit !== '') q.sale_id_visit = String(item.id_visit);
            return q;
        },
        goSale(item, idBracelet) {
            if (idBracelet == null || idBracelet === '') return;
            this.$router.push({
                path: '/productsSale',
                query: {
                    id_bracelet: String(idBracelet),
                    ...this.saleQueryFromVisit(item, idBracelet),
                },
            });
        },
        parseHour(date) {
            if (date == null) return '';
            return this.$moment(date, 'YYYY-MM-DD HH:mm:ss').format('HH:mm');
        },
        formatAlias(alias) {
            if (!alias) return '—';
            return String(alias).replace(/---/g, ' ');
        },
        formatBracelet(bracelet) {
            if (!bracelet) return '—';
            const braceletStr = String(bracelet);
            return braceletStr.length > 3 ? braceletStr.slice(-3) : braceletStr;
        },
        pickCardPrimaryLabel(item) {
            const alias = this.formatAlias(item.partner && item.partner.alias);
            if (alias && alias !== '—') return alias;
            return (item.partner && item.partner.partner_name) || '—';
        },
        setVisitTypeFilter(id) {
            this.filters.id_visit_type = id;
        },
        isVisitTypeSelected(idVisitType) {
            return Number(this.filters.id_visit_type) === Number(idVisitType);
        },
        shortVisitTypeLabel(vt) {
            const d = (vt && vt.description) ? String(vt.description).trim() : '';
            if (!d) return '—';
            if (d.length <= 16) return d;
            return `${d.slice(0, 14)}…`;
        },
    },
};
</script>

<style scoped>
.filter-toolbar-card {
    overflow-x: visible;
    overflow-y: visible;
}

.filter-toolbar-search-fullwidth {
    width: 100%;
}

.filter-visit-type-buttons {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.filter-vt-btn {
    text-transform: none !important;
    letter-spacing: 0 !important;
    font-size: 0.75rem !important;
    height: auto !important;
    min-height: 32px !important;
    padding: 6px 12px !important;
}

.header-club-count {
    font-size: 1.35rem;
    line-height: 1.2;
    letter-spacing: -0.02em;
    text-align: right;
    white-space: nowrap;
}

.pick-cards-mobile {
    align-items: stretch;
    margin-left: -10px;
    margin-right: -10px;
}

.pick-cards-mobile-col {
    padding: 10px !important;
}

.pick-card-mobile {
    min-height: 100%;
}

.pick-card-inner {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: stretch;
    align-self: stretch;
    width: 100%;
    min-height: 0;
}

.pick-card-meta-centered {
    text-align: center;
}

.pick-card-extra-row {
    font-size: 0.74rem;
    font-weight: 700;
    line-height: 1.25;
    text-align: center;
    color: #039be5 !important;
}

.pick-card-actions {
    flex-shrink: 0;
    width: 100%;
}

.pick-card-clickable {
    cursor: pointer;
    transition: box-shadow 0.15s ease, opacity 0.12s ease;
}

.pick-card-clickable:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12) !important;
}

.pick-card-clickable:active {
    opacity: 0.92;
}

.pick-card-headrow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    width: 100%;
}

.pick-card-alias {
    flex: 1 1 auto;
    min-width: 0;
    font-size: 0.82rem;
    line-height: 1.2;
}

.pick-card-bracelet {
    flex: 0 0 auto;
    font-size: 1rem;
    font-weight: 700;
    line-height: 1;
    color: rgba(0, 0, 0, 0.87);
}

.pick-card-meta {
    font-size: 0.6rem;
    line-height: 1.2;
}

.pick-card-truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
}

.pick-card-mobile ::v-deep .v-btn {
    font-size: 0.65rem !important;
    letter-spacing: 0;
}

.sort-order-card {
    overflow: visible;
}

.sort-order-toggle-wrap {
    width: 90%;
    max-width: 100%;
    margin-left: auto;
    margin-right: auto;
}

.sort-order-buttons {
    display: flex;
    flex-wrap: nowrap;
    align-items: stretch;
    gap: 6px;
}

.sort-order-btn {
    flex: 1 1 0;
    min-width: 0 !important;
    height: auto !important;
    min-height: 30px !important;
    padding: 4px 2px !important;
    font-size: 0.62rem !important;
    letter-spacing: 0;
    text-transform: none;
}

.sort-order-btn ::v-deep .v-btn__content {
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
