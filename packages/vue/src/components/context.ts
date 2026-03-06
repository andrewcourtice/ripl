import {
    defineComponent,
    h,
    onBeforeUnmount,
    onMounted,
    ref,
} from 'vue';

import {
    provideContext,
} from '../composables/use-context';

import {
    createContext,
} from '@ripl/core';

import type {
    Context,
} from '@ripl/core';

type ContextFactory = (target: HTMLElement) => Context | Promise<Context>;

function defineContextComponent(name: string, factory: ContextFactory) {
    return defineComponent({
        name,

        setup(_, { slots }) {
            const container = ref<HTMLElement>();
            const context = ref<Context>();

            provideContext(context);

            onMounted(async () => {
                if (container.value) {
                    context.value = await factory(container.value);
                }
            });

            onBeforeUnmount(() => {
                context.value?.destroy();
                context.value = undefined;
            });

            return () => h('div', {
                ref: container,
                style: {
                    width: '100%',
                    height: '100%',
                },
            }, context.value ? slots.default?.() : undefined);
        },
    });
}

export const RiplContext = defineContextComponent(
    'RiplContext',
    target => createContext(target)
);

export const RiplSvgContext = defineContextComponent(
    'RiplSvgContext',
    async target => {
        try {
            const mod = await import('@ripl/svg');
            return mod.createContext(target);
        } catch {
            throw new Error('@ripl/svg is required to use <ripl-svg-context>. Install it with: npm install @ripl/svg');
        }
    }
);

export const Ripl3dContext = defineContextComponent(
    'Ripl3dContext',
    async target => {
        try {
            const mod = await import('@ripl/3d');
            return mod.createContext(target);
        } catch {
            throw new Error('@ripl/3d is required to use <ripl-3d-context>. Install it with: npm install @ripl/3d');
        }
    }
);
