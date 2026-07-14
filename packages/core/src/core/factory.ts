import type {
    BaseState,
    Context,
    ContextOptions,
    MeasureTextOptions,
} from '../context';

/** Platform-specific function implementations injected at runtime. */
export interface FactoryOptions {
    /** Schedules `callback` to run before the next repaint, returning a handle used to cancel it. */
    requestAnimationFrame(callback: FrameRequestCallback): number;
    /** Cancels a frame request previously scheduled via {@link FactoryOptions.requestAnimationFrame}. */
    cancelAnimationFrame(handle: number): void;
    /** Returns the current high-resolution time, in milliseconds. */
    now(): number;
    /** The ratio of physical pixels to CSS pixels for the current display. */
    devicePixelRatio: number;
    /** Returns the computed style for the given element, exposing at least its resolved `font` shorthand. */
    getComputedStyle(element: unknown): {
        /** The element's resolved CSS `font` shorthand. */
        font: string;
    };
    /** Creates a rendering {@link Context} bound to the given target selector or element. */
    createContext(target: string | HTMLElement, options?: ContextOptions): Context;
    /** Creates a DOM element with the given tag name. */
    createElement(tagName: string): HTMLElement;
    /** Creates a namespaced DOM element (e.g. SVG) with the given namespace URI and tag name. */
    createElementNS(namespace: string, tagName: string): Element;
    /** Returns a fresh copy of the platform's default {@link BaseState}. */
    getDefaultState(): BaseState;
    /** Measures the given text, returning its `TextMetrics`. */
    measureText(text: string, options?: MeasureTextOptions): TextMetrics;
}

class Factory {

    private _state: Partial<FactoryOptions> = {};

    /** The platform `requestAnimationFrame` implementation. */
    public get requestAnimationFrame() {
        return this._state.requestAnimationFrame!;
    }

    /** The platform `cancelAnimationFrame` implementation. */
    public get cancelAnimationFrame() {
        return this._state.cancelAnimationFrame!;
    }

    /** The platform high-resolution clock function, returning the current time in milliseconds. */
    public get now() {
        return this._state.now!;
    }

    /** The platform device pixel ratio. */
    public get devicePixelRatio() {
        return this._state.devicePixelRatio!;
    }

    /** The platform `getComputedStyle` implementation. */
    public get getComputedStyle() {
        return this._state.getComputedStyle!;
    }

    /** The platform {@link Context} factory function. */
    public get createContext() {
        return this._state.createContext!;
    }

    /** The platform element-creation function. */
    public get createElement() {
        return this._state.createElement!;
    }

    /** The platform namespaced-element-creation function. */
    public get createElementNS() {
        return this._state.createElementNS!;
    }

    /** The platform default base-state factory. */
    public get getDefaultState() {
        return this._state.getDefaultState!;
    }

    /** The platform text-measurement function. */
    public get measureText() {
        return this._state.measureText!;
    }

    /** Merges the given platform implementations into the factory's state. */
    public set(options: Partial<FactoryOptions>) {
        this._state = {
            ...this._state,
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
