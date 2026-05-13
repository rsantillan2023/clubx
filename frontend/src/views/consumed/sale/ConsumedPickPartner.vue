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
                        <div class="text-h6 font-weight-bold">Ver consumos</div>
                        <div class="text-caption grey--text text--darken-1">
                            Elegí un socio que esté dentro; se abre la pantalla de consumos con esa tarjeta.
                        </div>
                    </div>
                    <div class="header-club-count orange--text font-weight-bold flex-shrink-0 text-end">
                        <template v-if="consumptionFilterMode === 'all'">{{ totalItems }} en club</template>
                        <template v-else>
                            {{ filteredItems.length }}
                            <span class="header-filter-count-caption d-block font-weight-regular">filtrados</span>
                        </template>
                    </div>
                </div>
            </v-col>
        </v-row>

        <v-alert
            v-if="!load && items.length && calculatingTotals"
            dense
            text
            type="info"
            colored-border
            border="left"
            class="mb-3 py-2"
        >
            <span class="text-caption">
                Calculando total consumido por tarjeta… {{ totalsProgress.done }} / {{ totalsProgress.total }}
            </span>
        </v-alert>

        <v-card outlined class="pa-2 mb-3 filter-toolbar-card">
            <v-text-field
                v-model="searchText"
                label="Buscar (DNI, nombre, alias)"
                outlined
                dense
                hide-details
                clearable
                prepend-inner-icon="mdi-magnify"
                class="filter-toolbar-search-fullwidth mb-2"
                @keyup.enter="flushSearchRefresh"
            />
            <div class="text-caption grey--text font-weight-medium mb-2 text-center">Mostrar por consumo</div>
            <v-btn-toggle
                v-model="consumptionFilterMode"
                mandatory
                class="filter-consumption-toggle mb-3"
                color="orange"
            >
                <v-btn value="all" depressed class="filter-consumption-toggle-btn">Todos</v-btn>
                <v-btn value="with" depressed class="filter-consumption-toggle-btn" title="Socios con consumo registrado ($ &gt; 0)">
                    Con consumos
                </v-btn>
                <v-btn value="without" depressed class="filter-consumption-toggle-btn" title="Socios sin consumo ($ 0)">
                    Sin consumos
                </v-btn>
            </v-btn-toggle>
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
                        :items="filteredItems"
                        :items-per-page="-1"
                        hide-default-footer
                        class="elevation-0"
                        :no-data-text="
                            consumptionFilterMode !== 'all' && items.length && !filteredItems.length
                                ? 'Nadie coincide con el filtro de consumo'
                                : 'Ningún socio en el club con estos criterios'
                        "
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
                        <template v-slot:item.totalConsumedBracelet1="{ item }">
                            <template v-if="shouldShowConsumptionRow(item.totalConsumedBracelet1)">
                                <span v-if="item.totalConsumedBracelet1 === undefined" class="grey--text">…</span>
                                <span v-else-if="item.totalConsumedBracelet1 === null" class="grey--text">—</span>
                                <span v-else class="orange--text pick-total-money-desktop">${{ formatMoneyDisplay(item.totalConsumedBracelet1) }}</span>
                            </template>
                        </template>
                        <template v-slot:item.actions="{ item }">
                            <div class="d-flex flex-column align-end">
                                <div>
                                    <v-btn
                                        x-small
                                        dark
                                        color="orange"
                                        class="mr-1"
                                        :disabled="item.totalConsumedBracelet1 === undefined"
                                        @click="handlePrimaryBraceletAction(item)"
                                    >
                                        {{ primaryBraceletButtonLabel(item) }}
                                    </v-btn>
                                    <v-btn
                                        v-if="item.id_bracelet_2 && item.partner && item.partner.affiliate_name"
                                        x-small
                                        outlined
                                        color="orange"
                                        :disabled="!opensConsumedForTotal(item.totalConsumedBracelet2)"
                                        @click="goConsumed(item.id_bracelet_2)"
                                    >
                                        Ver afiliado
                                    </v-btn>
                                </div>
                                <div
                                    v-if="item.id_bracelet_2 && item.partner && item.partner.affiliate_name && shouldShowConsumptionRow(item.totalConsumedBracelet2)"
                                    class="mt-1 text-end pick-affiliate-money-row"
                                >
                                    <span v-if="item.totalConsumedBracelet2 === undefined" class="grey--text text-caption">…</span>
                                    <span v-else-if="item.totalConsumedBracelet2 === null" class="grey--text text-caption">—</span>
                                    <span v-else class="orange--text pick-affiliate-money-desktop">${{ formatMoneyDisplay(item.totalConsumedBracelet2) }}</span>
                                </div>
                            </div>
                        </template>
                    </v-data-table>
                </v-card>
            </div>

            <div v-else>
                <v-row class="pick-cards-mobile">
                    <v-col
                        v-for="(item, n) in filteredItems"
                        :key="'pick-cons-' + (item.id_visit || n)"
                        cols="4"
                        class="pick-cards-mobile-col"
                    >
                        <v-card
                            outlined
                            class="pick-card-mobile pa-2 d-flex flex-column fill-height"
                            :class="{
                                'pick-card-clickable': pickCardPrimaryTotalsReady(item),
                                'pick-card-static': !pickCardPrimaryTotalsReady(item),
                            }"
                            :style="'border-left: 3px solid ' + ($vuetify.theme.defaults.light.orange || '#FF9800')"
                            :role="pickCardPrimaryTotalsReady(item) ? 'button' : undefined"
                            :tabindex="pickCardPrimaryTotalsReady(item) ? 0 : -1"
                            :aria-label="pickCardPrimaryAriaLabel(item)"
                            @click="onPickCardPrimary(item)"
                            @keydown.enter.prevent="onPickCardPrimary(item)"
                            @keydown.space.prevent="onPickCardPrimary(item)"
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
                                <div class="pick-card-visit-money-row mt-1">
                                    <div class="pick-card-visit-cell light-blue--text text--darken-2 pick-card-truncate font-weight-bold">
                                        {{ (item.visit_type && item.visit_type.description) || '\u00A0' }}
                                    </div>
                                    <div
                                        v-if="shouldShowConsumptionRow(item.totalConsumedBracelet1)"
                                        class="pick-card-money-cell"
                                    >
                                        <span v-if="item.totalConsumedBracelet1 === undefined" class="grey--text text-caption">…</span>
                                        <span v-else-if="item.totalConsumedBracelet1 === null" class="grey--text text-caption">—</span>
                                        <span v-else class="orange--text pick-card-money-main">${{ formatMoneyDisplay(item.totalConsumedBracelet1) }}</span>
                                    </div>
                                </div>
                                <div
                                    v-if="item.id_bracelet_2 && item.partner && item.partner.affiliate_name && shouldShowConsumptionRow(item.totalConsumedBracelet2)"
                                    class="text-center mt-1 pick-card-truncate"
                                >
                                    <span v-if="item.totalConsumedBracelet2 === undefined" class="grey--text text-caption">…</span>
                                    <span v-else-if="item.totalConsumedBracelet2 === null" class="grey--text text-caption">—</span>
                                    <span v-else class="orange--text pick-card-money-affiliate">${{ formatMoneyDisplay(item.totalConsumedBracelet2) }}</span>
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
                                    :disabled="!opensConsumedForTotal(item.totalConsumedBracelet2)"
                                    @click.stop="goConsumed(item.id_bracelet_2)"
                                >
                                    Ver afiliado
                                </v-btn>
                            </div>
                        </v-card>
                    </v-col>
                </v-row>
                <v-alert v-if="items.length === 0" type="info" outlined dense class="mt-2">
                    No hay socios que coincidan. Probá otro filtro o actualizá la lista.
                </v-alert>
                <v-alert
                    v-else-if="consumptionFilterMode !== 'all' && filteredItems.length === 0"
                    type="info"
                    outlined
                    dense
                    class="mt-2"
                >
                    Nadie coincide con el filtro de consumo. Probá «Todos» u otro criterio.
                </v-alert>
            </div>
        </template>
    </div>
</template>

<script>
export default {
    name: 'ConsumedPickPartner',
    data() {
        return {
            load: false,
            items: [],
            totalItems: 0,
            calculatingTotals: false,
            totalsProgress: { done: 0, total: 0 },
            totalsGeneration: 0,
            searchText: '',
            searchDebounceMs: 380,
            searchDebounceTimer: null,
            filters: {
                id_visit_type: null,
            },
            visitTypes: [],
            consumptionFilterMode: 'all',
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
                { text: '$', value: 'totalConsumedBracelet1', align: 'end', sortable: false },
                { text: '', value: 'actions', sortable: false, width: '260' },
            ],
        };
    },
    computed: {
        filteredItems() {
            return this.items.filter((item) => this.passesConsumptionFilter(item));
        },
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
        passesConsumptionFilter(item) {
            const mode = this.consumptionFilterMode;
            if (mode === 'all') return true;
            const v = item.totalConsumedBracelet1;
            if (v === undefined) return false;
            if (v === null) return mode === 'all';
            const n = Number(v);
            if (mode === 'with') return n > 0;
            if (mode === 'without') return n <= 0;
            return true;
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
            this.totalsGeneration += 1;
            this.calculatingTotals = false;
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
                        const rows = Array.isArray(response.data.data) ? response.data.data : [];
                        this.items = rows.map((row) => ({
                            ...row,
                            totalConsumedBracelet1: undefined,
                            totalConsumedBracelet2: undefined,
                        }));
                        this.totalItems = response.data.totalCount || this.items.length;
                    }
                    this.load = false;
                    this.$nextTick(() => this.hydrateConsumptionTotals());
                })
                .catch((error) => {
                    console.error(error);
                    this.load = false;
                });
        },
        goConsumed(idBracelet) {
            if (idBracelet == null || idBracelet === '') return;
            this.$router.push({
                path: '/consumed',
                query: { id_bracelet: String(idBracelet) },
            });
        },
        shouldShowConsumptionRow(val) {
            if (val === undefined || val === null) return true;
            return Number(val) > 0;
        },
        /** Para consumos por tarjeta (p. ej. afiliado): habilita /consumed si total no cargado, error de API (null) o &gt; 0 */
        opensConsumedForTotal(totalVal) {
            if (totalVal === undefined || totalVal === null) return true;
            return Number(totalVal) > 0;
        },
        pickCardPrimaryTotalsReady(item) {
            return item.totalConsumedBracelet1 !== undefined;
        },
        pickCardPrimaryOpensExit(item) {
            const v = item.totalConsumedBracelet1;
            return v !== undefined && v !== null && Number(v) <= 0;
        },
        pickCardPrimaryAriaLabel(item) {
            if (!this.pickCardPrimaryTotalsReady(item)) {
                return 'Calculando consumos — ' + this.pickCardPrimaryLabel(item);
            }
            if (this.pickCardPrimaryOpensExit(item)) {
                return 'Registrar salida: ' + this.pickCardPrimaryLabel(item);
            }
            return 'Ver consumos: ' + this.pickCardPrimaryLabel(item);
        },
        primaryBraceletButtonLabel(item) {
            const v = item.totalConsumedBracelet1;
            if (v === undefined) return '…';
            if (v === null || Number(v) > 0) return 'Ver consumos';
            return 'Salida del club';
        },
        handlePrimaryBraceletAction(item) {
            this.onPickCardPrimary(item);
        },
        buildPartnerPayloadForExit(item) {
            const nested = item.partner ? { ...item.partner } : {};
            const totalConsumed =
                item.totalConsumedBracelet1 != null ? Number(item.totalConsumedBracelet1) : 0;
            return {
                ...nested,
                total: totalConsumed,
                id_bracelet_1: item.id_bracelet_1,
                id_bracelet_2: item.id_bracelet_2,
                id_visit: item.id_visit,
                visit_date: item.visit_date,
                hour_entry: item.hour_entry,
                id_day: item.id_day,
                last_visit: item.last_visit,
                entry_amount_paid: item.entry_amount_paid,
                extra_entry: item.extra_entry,
                extra_entry_obs: item.extra_entry_obs,
                visit_amount_consumed:
                    item.visit_amount_consumed != null
                        ? item.visit_amount_consumed
                        : nested.visit_amount_consumed,
                exit_amount_payed: item.exit_amount_payed,
                extra_exit: item.extra_exit,
                extra_exit_obs: item.extra_exit_obs,
                entry_visit_obs: item.entry_visit_obs,
                other_visit_obs: item.other_visit_obs,
                had_to_paid: item.had_to_paid,
                pendiente_entrada: item.pendiente_entrada,
                es_pago_al_salir: item.es_pago_al_salir,
                visit_type: item.visit_type || nested.visit_type,
            };
        },
        goExitRegisterFromPick(item) {
            const payload = this.buildPartnerPayloadForExit(item);
            this.$store.commit('setPartner', payload);
            this.$router.push('/exitRegister');
        },
        onPickCardPrimary(item) {
            const v = item.totalConsumedBracelet1;
            if (v === undefined) return;
            if (v === null || Number(v) > 0) {
                this.goConsumed(item.id_bracelet_1);
                return;
            }
            this.goExitRegisterFromPick(item);
        },
        formatMoneyDisplay(val) {
            if (val === undefined || val === null || val === '') return '';
            const n = Number(val);
            if (Number.isNaN(n)) return '';
            return n.toLocaleString('es-AR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
        },
        fetchConsumptionTotal(idBracelet) {
            return this.$http
                .get(
                    `${process.env.VUE_APP_DEGIRA}consumptions/get/consume?id_bracelet=${encodeURIComponent(String(idBracelet))}`
                )
                .then((res) => {
                    const products =
                        res.data && res.data.data && res.data.data.products ? res.data.data.products : [];
                    if (!Array.isArray(products) || products.length === 0) return 0;
                    return products.reduce(
                        (sum, p) => sum + parseFloat(p.price || 0) * parseInt(p.quantity || 0, 10),
                        0
                    );
                })
                .catch(() => null);
        },
        hydrateConsumptionTotals() {
            if (!this.items.length) return;
            const gen = this.totalsGeneration;
            const idSet = new Set();
            this.items.forEach((item) => {
                if (item.id_bracelet_1 != null && item.id_bracelet_1 !== '') {
                    idSet.add(String(item.id_bracelet_1));
                }
                if (item.id_bracelet_2 && item.partner && item.partner.affiliate_name) {
                    idSet.add(String(item.id_bracelet_2));
                }
            });
            const ids = Array.from(idSet);
            if (!ids.length) return;

            this.calculatingTotals = true;
            this.totalsProgress = { done: 0, total: ids.length };

            const cache = {};
            let completed = 0;
            Promise.all(
                ids.map((id) =>
                    this.fetchConsumptionTotal(id)
                        .then((total) => {
                            cache[id] = total;
                        })
                        .finally(() => {
                            if (gen !== this.totalsGeneration) return;
                            completed += 1;
                            this.totalsProgress = { done: completed, total: ids.length };
                        })
                )
            ).then(() => {
                if (gen !== this.totalsGeneration) return;
                this.items.forEach((item) => {
                    const k1 = item.id_bracelet_1 != null ? String(item.id_bracelet_1) : '';
                    const k2 = item.id_bracelet_2 != null ? String(item.id_bracelet_2) : '';
                    const v1 =
                        k1 && Object.prototype.hasOwnProperty.call(cache, k1) ? cache[k1] : 0;
                    this.$set(item, 'totalConsumedBracelet1', v1 === null ? null : v1);
                    if (item.id_bracelet_2 && item.partner && item.partner.affiliate_name) {
                        const v2 =
                            k2 && Object.prototype.hasOwnProperty.call(cache, k2) ? cache[k2] : 0;
                        this.$set(item, 'totalConsumedBracelet2', v2 === null ? null : v2);
                    } else {
                        this.$set(item, 'totalConsumedBracelet2', undefined);
                    }
                });
                this.calculatingTotals = false;
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

.filter-consumption-toggle {
    width: 100%;
    display: flex !important;
    flex-wrap: nowrap;
}

.filter-consumption-toggle ::v-deep .v-btn {
    flex: 1 1 0;
    min-width: 0 !important;
    min-height: 52px !important;
    height: auto !important;
    padding: 10px 8px !important;
}

.filter-consumption-toggle-btn {
    text-transform: none !important;
    letter-spacing: 0 !important;
    font-size: 1.05rem !important;
    font-weight: 700 !important;
    line-height: 1.25 !important;
    white-space: normal !important;
}

.filter-consumption-toggle ::v-deep .filter-consumption-toggle-btn .v-btn__content {
    white-space: normal !important;
    text-align: center;
    font-weight: 700 !important;
}

.header-filter-count-caption {
    font-size: 0.7rem;
    line-height: 1.15;
    opacity: 0.92;
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

.pick-card-visit-money-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    width: 100%;
    min-width: 0;
}

.pick-card-visit-cell {
    flex: 1 1 auto;
    min-width: 0;
    font-size: 0.74rem;
    font-weight: 700;
    line-height: 1.25;
    text-align: left;
    color: #039be5 !important;
}

.pick-card-money-cell {
    flex: 0 0 auto;
    text-align: right;
    white-space: nowrap;
    max-width: 52%;
}

.pick-card-actions {
    flex-shrink: 0;
    width: 100%;
}

.pick-card-static {
    cursor: default;
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

.pick-total-money-desktop {
    font-size: 1.125rem;
    font-weight: 700;
    line-height: 1.25;
}

.pick-affiliate-money-desktop {
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.25;
}

.pick-affiliate-money-row {
    font-size: 0.75rem;
}

.pick-card-money-main {
    font-size: clamp(0.76rem, 2.85vw, 0.98rem);
    font-weight: 700;
    line-height: 1.25;
}

.pick-card-money-affiliate {
    font-size: clamp(0.68rem, 2.4vw, 0.82rem);
    font-weight: 700;
    line-height: 1.25;
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
