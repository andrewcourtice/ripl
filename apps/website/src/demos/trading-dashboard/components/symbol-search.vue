<template>
    <div class="symbol-search">
        <div class="symbol-search__current" v-if="store.selectedSymbol">
            <span class="symbol-search__symbol">{{ store.selectedSymbol }}</span>
            <span class="symbol-search__name">{{ store.selectedSymbolName }}</span>
        </div>
        <div class="symbol-search__input-wrap">
            <input
                type="text"
                class="symbol-search__input ripl-select"
                placeholder="Search symbol (e.g. AAPL, MSFT)..."
                v-model="query"
                @input="onInput"
                @focus="showResults = true"
                @blur="onBlur"
            />
            <div class="symbol-search__results" v-if="showResults && store.searchResults.length > 0">
                <button
                    v-for="result in store.searchResults"
                    :key="result.symbol"
                    class="symbol-search__result"
                    @mousedown.prevent="selectResult(result)"
                >
                    <span class="symbol-search__result-symbol">{{ result.symbol }}</span>
                    <span class="symbol-search__result-name">{{ result.name }}</span>
                    <span class="symbol-search__result-region">{{ result.region }}</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import {
    ref,
} from 'vue';

import {
    useDashboardStore,
} from '../store/dashboard';

import type {
    MockSearchResult,
} from '../data/mock';

const store = useDashboardStore();
const query = ref('');
const showResults = ref(false);
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function onInput() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        store.searchSymbols(query.value);
        showResults.value = true;
    }, 300);
}

function selectResult(result: MockSearchResult) {
    query.value = '';
    showResults.value = false;
    store.selectSymbol(result.symbol, result.name);
}

function onBlur() {
    setTimeout(() => {
        showResults.value = false;
    }, 200);
}
</script>
