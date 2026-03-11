<template>
    <div class="ripl-dropdown" ref="dropdownRef">
        <div class="ripl-dropdown__trigger" @click="toggle">
            <slot name="trigger"></slot>
        </div>
        <Teleport to="body">
            <div
                v-if="open"
                class="ripl-dropdown__panel"
                ref="panelRef"
                :style="panelStyle"
            >
                <slot></slot>
            </div>
        </Teleport>
    </div>
</template>

<script lang="ts" setup>
import {
    ref,
    computed,
    onMounted,
    onBeforeUnmount,
    nextTick,
} from 'vue';

export type DropdownAlign = 'left' | 'right';

const props = withDefaults(defineProps<{
    align?: DropdownAlign;
}>(), {
    align: 'left',
});

const open = ref(false);
const dropdownRef = ref<HTMLElement>();
const panelRef = ref<HTMLElement>();
const triggerRect = ref<DOMRect>();

const panelStyle = computed(() => {
    if (!triggerRect.value) return {};

    const rect = triggerRect.value;

    const style: Record<string, string> = {
        position: 'fixed',
        top: `${rect.bottom + 4}px`,
        zIndex: '1000',
    };

    if (props.align === 'right') {
        style.right = `${window.innerWidth - rect.right}px`;
    } else {
        style.left = `${rect.left}px`;
    }

    return style;
});

function toggle() {
    if (open.value) {
        close();
    } else {
        openDropdown();
    }
}

function openDropdown() {
    if (dropdownRef.value) {
        triggerRect.value = dropdownRef.value.getBoundingClientRect();
    }

    open.value = true;

    nextTick(() => {
        document.addEventListener('pointerdown', onClickOutside, true);
    });
}

function close() {
    open.value = false;
    document.removeEventListener('pointerdown', onClickOutside, true);
}

function onClickOutside(event: PointerEvent) {
    const target = event.target as Node;

    if (dropdownRef.value?.contains(target)) return;
    if (panelRef.value?.contains(target)) return;

    close();
}

onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', onClickOutside, true);
});

defineExpose({ close });
</script>

<style scoped>
.ripl-dropdown {
    position: relative;
    display: inline-flex;
}

.ripl-dropdown__trigger {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
}

.ripl-dropdown__panel {
    display: flex;
    flex-direction: column;
    min-width: 10rem;
    padding: 0.375rem;
    border: 1px solid var(--vp-c-divider);
    border-radius: 0.5rem;
    background-color: var(--vp-c-bg-elv);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    animation: ripl-dropdown-enter 150ms ease-out;
}

@keyframes ripl-dropdown-enter {
    from {
        opacity: 0;
        transform: translateY(-4px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
