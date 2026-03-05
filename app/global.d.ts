declare module '*?raw' {
    const content: string;
    export default content;
}

declare module '*.vue' {
    import type {
        Component,
    } from 'vue';

    const component: Component;

    export default component;
}

interface ImportMetaEnv {
    readonly VITE_ALPHAVANTAGE_API_KEY: string;
    readonly BASE_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}