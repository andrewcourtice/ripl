import {
    createFlex,
    createRect,
} from '@ripl/web';

const margin = 40;
const palette = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

const children = palette.map((fill, index) => createRect({
    x: 0,
    y: 0,
    width: 64,
    height: 48 + index * 14,
    cornerRadius: 8,
    fill,
}));

const flex = createFlex({
    x: margin,
    y: margin,
    width: scene.context.width - margin * 2,
    height: scene.context.height - margin * 2,
    gap: 16,
    justify: 'space-between',
    align: 'center',
    children,
});

scene.add(flex);
