import {
    createGrid,
    createRect,
} from '@ripl/web';

const margin = 40;
const palette = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

const children = Array.from({ length: 12 }, (_, index) => createRect({
    x: 0,
    y: 0,
    width: 64,
    height: 48 + (index % 3) * 18,
    cornerRadius: 8,
    fill: palette[index % palette.length],
}));

const grid = createGrid({
    x: margin,
    y: margin,
    width: scene.context.width - margin * 2,
    columns: 4,
    columnGap: 14,
    rowGap: 14,
    alignItems: 'stretch',
    children,
});

scene.add(grid);
