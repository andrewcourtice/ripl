/**
 * Perceptually-uniform color schemes as sampled control points. Each is a small, evenly-spaced set
 * of stops from the corresponding matplotlib / ColorBrewer colormap; a color scale interpolates
 * between them (see `interpolateColors`). Ten stops reproduce the originals closely while keeping the
 * bundle tiny — consumers who need the full 256-entry tables can pass their own stops.
 *
 * Sequential schemes run low → high. Diverging schemes run low → neutral → high.
 */

/** Sequential — dark purple → blue → teal → green → yellow. The default perceptual scheme. */
export const COLOR_SCHEME_VIRIDIS = [
    '#440154',
    '#482878',
    '#3e4a89',
    '#31688e',
    '#26828e',
    '#1f9e89',
    '#35b779',
    '#6ece58',
    '#b5de2b',
    '#fde725',
];

/** Sequential — dark blue → purple → magenta → orange → yellow. */
export const COLOR_SCHEME_PLASMA = [
    '#0d0887',
    '#46039f',
    '#7201a8',
    '#9c179e',
    '#bd3786',
    '#d8576b',
    '#ed7953',
    '#fb9f3a',
    '#fdca26',
    '#f0f921',
];

/** Sequential — black → purple → red → orange → pale yellow. */
export const COLOR_SCHEME_INFERNO = [
    '#000004',
    '#1b0c41',
    '#4a0c6b',
    '#781c6d',
    '#a52c60',
    '#cf4446',
    '#ed6925',
    '#fb9a06',
    '#f7d03c',
    '#fcffa4',
];

/** Sequential — black → purple → magenta → orange → cream. */
export const COLOR_SCHEME_MAGMA = [
    '#000004',
    '#180f3d',
    '#440f76',
    '#721f81',
    '#9e2f7f',
    '#cd4071',
    '#f1605d',
    '#fd9668',
    '#feca8d',
    '#fcfdbf',
];

/** Sequential — dark blue → slate → tan → yellow. Color-vision-deficiency friendly. */
export const COLOR_SCHEME_CIVIDIS = [
    '#00224e',
    '#123570',
    '#3b496c',
    '#575d6d',
    '#707173',
    '#8a8779',
    '#a79d75',
    '#c7b56d',
    '#e8d055',
    '#fee838',
];

/** Sequential rainbow — purple → blue → cyan → green → yellow → orange → red. High contrast. */
export const COLOR_SCHEME_TURBO = [
    '#30123b',
    '#4145ab',
    '#4675ed',
    '#39a2fc',
    '#1bcfd4',
    '#24eca6',
    '#61fc6c',
    '#a4fc3b',
    '#d1e834',
    '#f9ba38',
    '#e5460b',
    '#7a0403',
];

/** Diverging — red → white → blue (ColorBrewer RdBu). */
export const COLOR_SCHEME_RDBU = [
    '#b2182b',
    '#d6604d',
    '#f4a582',
    '#fddbc7',
    '#f7f7f7',
    '#d1e5f0',
    '#92c5de',
    '#4393c3',
    '#2166ac',
];

/** Diverging — brown → white → teal (ColorBrewer BrBG). */
export const COLOR_SCHEME_BRBG = [
    '#8c510a',
    '#bf812d',
    '#dfc27d',
    '#f6e8c3',
    '#f5f5f5',
    '#c7eae5',
    '#80cdc1',
    '#35978f',
    '#01665e',
];
