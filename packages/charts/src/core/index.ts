export * from './chart';
export * from './options';
export * from './color';
export * from './scales';
export * from './theme';
export * from './layout';
export * from './animation';
export * from './interaction';
export * from './labels';
export * from './data';
export * from './statistics';
export * from './cartesian';

// Alias used by factory helpers for readability & possible future augmentation.
// Currently simply maps to the options type itself.
/** Alias for a chart's options type, used by factory helpers for readability and future augmentation. */
export type ChartOptions<TOptions> = TOptions;