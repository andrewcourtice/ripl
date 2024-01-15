export const COLOURS = {
    blue: '#3b82f6',
    emerald: '#10b981',
    red: '#ef4444',
    purple: '#a855f7',
    amber: '#f59e0b',
    pink: '#ec4899',
    slate: '#64748b',
    sky: '#0ea5e9',
    fuscia: '#d946ef',
};

export function* getColorGenerator() {
    const colors = Object.values(COLOURS);
    let index = 0;

    while (true) {
        yield colors[index];
        index = (index + 1) % colors.length;
    }
}