export * from './chart';
export * from './options';
export * from './layout';
export * from './animation';
export * from './interaction';
export * from './labels';
export * from './data';
export * from './cartesian';

// Alias used by factory helpers for readability & possible future augmentation.
// Currently simply maps to the options type itself.
export type ChartOptions<TOptions> = TOptions;