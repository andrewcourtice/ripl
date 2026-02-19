export const COLOURS = {
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

export function* getColorGenerator(): Generator<string, string> {
    const colors = Object.values(COLOURS);
    let index = 0;

    while (true) {
        yield colors[index];
        index = (index + 1) % colors.length;
    }
}