import type {
    StyleProp,
    ViewStyle,
} from 'react-native';

import type {
    SkTypeface,
} from '@shopify/react-native-skia';

import {
    RiplSurface,
} from '../components/ripl-surface';

import {
    useRiplChart,
} from './use-ripl-chart';

import type {
    RiplChartFactory,
    RiplChartInstance,
} from './use-ripl-chart';

/**
 * Props for a chart component produced by {@link createChartComponent}.
 *
 * @typeParam TOptions - The wrapped chart's options type.
 */
export interface RiplChartProps<TOptions> {
    /** The chart options (e.g. `data`, `series`, `key`); changes re-render the chart. */
    options: TOptions;
    /** Style applied to the underlying Skia `<Canvas>` (defaults to `{ flex: 1 }`). */
    style?: StyleProp<ViewStyle>;
    /** Whether touch interaction (tooltips, hover) is enabled. Defaults to `true`. */
    interactive?: boolean;
    /** Typefaces to register (keyed by family name) before the first render, so text measures correctly. */
    fonts?: Record<string, SkTypeface>;
}

/**
 * Turns a Ripl chart factory (e.g. `createBarChart`) into a React Native chart component that renders
 * onto a Skia surface. The generated component takes the chart's `options` (plus `style`,
 * `interactive`, and `fonts`) and keeps the chart in sync with them.
 *
 * @example
 * ```tsx
 * import { createChartComponent } from '@ripl/react-native';
 * import { createHeatmapChart } from '@ripl/charts';
 *
 * const HeatmapChart = createChartComponent(createHeatmapChart);
 * // <HeatmapChart options={{ data, ... }} style={{ flex: 1 }} />
 * ```
 *
 * @param factory - The chart factory to wrap.
 * @returns A React component rendering the chart.
 */
export function createChartComponent<TOptions, TChart extends RiplChartInstance<TOptions>>(
    factory: RiplChartFactory<TOptions, TChart>
) {
    return function RiplChartComponent(props: RiplChartProps<TOptions>) {
        const {
            options,
            style,
            interactive,
            fonts,
        } = props;

        const {
            picture,
            onLayout,
            gesture,
        } = useRiplChart(factory, options, {
            interactive,
            fonts,
        });

        return (
            <RiplSurface picture={picture} onLayout={onLayout} gesture={gesture} style={style} />
        );
    };
}
