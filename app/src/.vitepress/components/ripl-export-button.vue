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
    filename: string;
    run: () => string | Promise<string>;
}

const props = defineProps<{
    context: Context;
}>();

const dropdown = ref<InstanceType<typeof RiplDropdown>>();

/** Converts a base64 data URL to a Blob object URL — browsers block top-level `data:` navigation. */
function dataURLToObjectURL(dataURL: string): string {
    const [header, data] = dataURL.split(',');
    const mime = /:(.*?);/.exec(header)?.[1] ?? 'image/png';
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return URL.createObjectURL(new Blob([bytes], {
        type: mime,
    }));
}

/** Rasterizes ImageData to a PNG Blob object URL (for contexts, e.g. SVG, exposed as vectors/pixels). */
function imageDataToURL(image: ImageData): string {
    const canvas = document.createElement('canvas');

    canvas.width = image.width;
    canvas.height = image.height;
    canvas.getContext('2d')?.putImageData(image, 0, 0);

    return dataURLToObjectURL(canvas.toDataURL('image/png'));
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
                filename: 'ripl-export.svg',
                run: () => context.export().toURL(),
            },
            {
                label: 'PNG image',
                filename: 'ripl-export.png',
                run: async () => imageDataToURL(await context.export().toImage()),
            },
        ];
    }

    if (context.type === 'terminal') {
        return [
            {
                label: 'Text',
                filename: 'ripl-export.txt',
                run: () => textToURL(context.export().toString()),
            },
            {
                label: 'PNG image',
                filename: 'ripl-export.png',
                run: () => context.export().toURL(),
            },
        ];
    }

    return [
        {
            label: 'PNG image',
            filename: 'ripl-export.png',
            run: () => context.export().toURL(),
        },
    ];
});

function scheduleRevoke(url: string): void {
    if (url.startsWith('blob:')) {
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
}

/** Downloads a URL via a temporary anchor — the fallback when a popup is blocked. */
function download(url: string, filename: string): void {
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
}

/** Opens a URL in a new tab, falling back to a download when the popup is blocked. */
function openInTab(url: string, filename: string): void {
    const tab = window.open(url, '_blank');

    if (!tab) {
        download(url, filename);
    }

    scheduleRevoke(url);
}

function run(item: ExportItem): void {
    const result = item.run();

    // `window.open` must be called synchronously within the click gesture or popup blockers reject
    // it. Sync formats open immediately; async formats (e.g. SVG → PNG) open a blank tab now and
    // navigate it once the URL resolves.
    if (typeof result === 'string') {
        openInTab(result, item.filename);
        dropdown.value?.close();
        return;
    }

    const tab = window.open('', '_blank');

    result
        .then(url => {
            if (tab) {
                tab.location.href = url;
            } else {
                download(url, item.filename);
            }

            scheduleRevoke(url);
        })
        .catch(error => {
            tab?.close();
            console.error('Export failed', error);
        });

    dropdown.value?.close();
}
</script>
