import type {
    BaseState,
    Context,
    ContextOptions,
    MeasureTextOptions,
} from '../context';

/** Platform-specific function implementations injected at runtime. */
export interface FactoryOptions {
    requestAnimationFrame(callback: FrameRequestCallback): number;
    cancelAnimationFrame(handle: number): void;
    now(): number;
    devicePixelRatio: number;
    getComputedStyle(element: unknown): {
        font: string;
    };
    createContext(target: string | HTMLElement, options?: ContextOptions): Context;
    createElement(tagName: string): HTMLElement;
    createElementNS(namespace: string, tagName: string): Element;
    getDefaultState(): BaseState;
    measureText(text: string, options?: MeasureTextOptions): TextMetrics;
}

class Factory {

    #state: Partial<FactoryOptions> = {};

    public get requestAnimationFrame() {
        return this.#state.requestAnimationFrame!;
    }

    public get cancelAnimationFrame() {
        return this.#state.cancelAnimationFrame!;
    }

    public get now() {
        return this.#state.now!;
    }

    public get devicePixelRatio() {
        return this.#state.devicePixelRatio!;
    }

    public get getComputedStyle() {
        return this.#state.getComputedStyle!;
    }

    public get createContext() {
        return this.#state.createContext!;
    }

    public get createElement() {
        return this.#state.createElement!;
    }

    public get createElementNS() {
        return this.#state.createElementNS!;
    }

    public get getDefaultState() {
        return this.#state.getDefaultState!;
    }

    public get measureText() {
        return this.#state.measureText!;
    }

    public set(options: Partial<FactoryOptions>) {
        this.#state = {
            ...this.#state,
            ...options,
        };
    }

    constructor(options?: Partial<FactoryOptions>) {
        if (options) {
            this.set(options);
        }
    }

}

/** Global platform factory instance. Call `factory.set(...)` to provide environment-specific implementations. */
export const factory = new Factory();
