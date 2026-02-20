export * from './chart';
export * from './series-join';

// Alias used by factory helpers for readability & possible future augmentation.
// Currently simply maps to the options type itself.
export type ChartOptions<TOptions> = TOptions;