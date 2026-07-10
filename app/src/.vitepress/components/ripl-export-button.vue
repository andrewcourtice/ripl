<template>
    <RiplDropdown ref="dropdown" align="right">
        <template #trigger>
            <RiplButton icon aria-label="Export" title="Export">
                <Download :size="14" />
            </RiplButton>
        </template>
        <RiplDropdownLabel>Export</RiplDropdownLabel>
        <RiplDropdownItem
            v-for="item in items"
            :key="item.label"
            @click="run(item)"
        >
            {{ item.label }}
        </RiplDropdownItem>
    </RiplDropdown>
</template>

<script lang="ts" setup>
import {
    computed,
    ref,
} from 'vue';

import {
    Download,
} from 'lucide-vue-next';

import RiplButton from './ripl-button.vue';
import RiplDropdown from './ripl-dropdown.vue';
import RiplDropdownItem from './ripl-dropdown-item.vue';
import RiplDropdownLabel from './ripl-dropdown-label.vue';

import type {
    Context,
} from '@ripl/core';

interface ExportItem {
    label: string;
    run: () => string | Promise<string>;
}

const props = defineProps<{
    context: Context;
}>();

const dropdown = ref<InstanceType<typeof RiplDropdown>>();

/** Rasterizes ImageData to a PNG data URL for contexts (e.g. SVG) exposed only as vectors/pixels. */
function imageDataToURL(image: ImageData): string {
    const canvas = document.createElement('canvas');

    canvas.width = image.width;
    canvas.height = image.height;
    canvas.getContext('2d')?.putImageData(image, 0, 0);

    return canvas.toDataURL('image/png');
}

function textToURL(text: string): string {
    return URL.createObjectURL(new Blob([text], {
        type: 'text/plain',
    }));
}

// The export formats surfaced depend on which context is currently rendering the demo.
const items = computed<ExportItem[]>(() => {
    const context = props.context;

    if (context.type === 'svg') {
        return [
            {
                label: 'SVG',
                run: () => context.export().toURL(),
            },
            {
                label: 'PNG image',
                run: async () => imageDataToURL(await context.export().toImage()),
            },
        ];
    }

    if (context.type === 'terminal') {
        return [
            {
                label: 'Text',
                run: () => textToURL(context.export().toString()),
            },
            {
                label: 'PNG image',
                run: () => context.export().toURL(),
            },
        ];
    }

    return [
        {
            label: 'PNG image',
            run: () => context.export().toURL(),
        },
    ];
});

async function run(item: ExportItem): Promise<void> {
    dropdown.value?.close();

    try {
        const url = await item.run();

        window.open(url, '_blank');

        if (url.startsWith('blob:')) {
            setTimeout(() => URL.revokeObjectURL(url), 10000);
        }
    } catch (error) {
        console.error('Export failed', error);
    }
}
</script>
