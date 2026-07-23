/** Default chart color palette keyed by color name. */
export const COLORS = {
    blue: '#7cacf8',
    emerald: '#6dd5b1',
    violet: '#b197fc',
    amber: '#f7c97e',
    rose: '#f4a0b9',
    teal: '#6ec6d6',
    orange: '#f5b07a',
    indigo: '#9daaf2',
    lime: '#b0d98a',
    fuchsia: '#d9a0e8',
    cyan: '#7dd3e8',
    slate: '#a1afc4',
};

/**
 * Creates an infinite generator that cycles through a chart color palette.
 *
 * @param palette - The colors to cycle through. Defaults to the built-in {@link COLORS} palette;
 * an empty array falls back to it too.
 */
export function* getColorGenerator(palette: string[] = Object.values(COLORS)): Generator<string, string> {
    const colors = palette.length > 0 ? palette : Object.values(COLORS);
    let index = 0;

    while (true) {
        yield colors[index];
        index = (index + 1) % colors.length;
    }
}