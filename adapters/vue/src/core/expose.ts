import {
    getCurrentInstance,
} from 'vue';

/**
 * Resolves a template ref on this component to the Ripl object it wraps rather than to Vue's
 * component proxy, so `<ripl-context ref="context">` hands back the `Context`.
 *
 * @param instance - The Ripl object to resolve refs to.
 */
export function useExposedInstance(instance: object): void {
    const component = getCurrentInstance();

    if (component) {
        component.exposed = instance as Record<string, unknown>;
    }
}
