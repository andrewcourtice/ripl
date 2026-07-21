import {
    createDevtools,
} from '@ripl/devtools';

import {
    createContext as createSvgContext,
} from '@ripl/svg';

import {
    createCircle,
    createContext,
    createGroup,
    createRect,
    createRenderer,
    createScene,
} from '@ripl/web';

import type {
    Renderer,
    Scene,
} from '@ripl/web';

const SWARM_COUNT = 2000;

const ACCENT_COLORS = [
    '#459bf1',
    '#e8710a',
    '#9334e6',
    '#1e8e3e',
    '#d93025',
];

function setupSpawnButton(scene: Scene, renderer: Renderer): void {
    const button = document.querySelector<HTMLButtonElement>('#spawn');

    button?.addEventListener('click', () => {
        button.disabled = true;

        const swarm = createGroup({
            class: 'swarm',
        });

        const circles = Array.from({
            length: SWARM_COUNT,
        }, () => createCircle({
            class: 'swarm-dot',
            cx: Math.random() * scene.width,
            cy: Math.random() * scene.height,
            radius: 1 + Math.random() * 3,
            fill: ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)],
        }));

        swarm.add(circles);
        scene.add(swarm);

        circles.forEach(circle => renderer.transition(circle, {
            duration: 3000 + Math.random() * 4000,
            loop: 'alternate',
            state: {
                cx: Math.random() * scene.width,
                cy: Math.random() * scene.height,
            },
        }));
    }, {
        once: true,
    });
}

function setupCanvas(): void {
    const context = createContext('#canvas-mount');
    const scene = createScene(context);
    const renderer = createRenderer(scene);

    const rings = createGroup({
        class: 'rings',
    });

    const ringsInner = createGroup({
        class: 'rings-inner',
    });

    const ringsCore = createGroup({
        class: 'rings-core',
    });

    const pulse = createCircle({
        class: 'pulse',
        cx: 170,
        cy: 150,
        radius: 28,
        fill: '#459bf1',
    });

    const block = createRect({
        class: 'block',
        x: 40,
        y: 40,
        width: 70,
        height: 46,
        borderRadius: 6,
        fill: '#e8710a',
    });

    const chip = createRect({
        class: 'chip clickable',
        x: 260,
        y: 60,
        width: 56,
        height: 56,
        borderRadius: 10,
        fill: '#9334e6',
    });

    // Click cycles the chip's fill so listener presence shows in the devtools.
    chip.on('click', () => {
        const fill = ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];

        renderer.transition(chip, {
            duration: 250,
            state: {
                fill,
            },
        });
    });

    ringsCore.add(pulse);
    ringsInner.add([ringsCore, block]);
    rings.add([ringsInner, chip]);
    scene.add(rings);

    // Continuous animation so property polling has something to show.
    renderer.transition(pulse, {
        duration: 2400,
        loop: 'alternate',
        state: {
            cx: 320,
            radius: 60,
        },
    });

    createDevtools(context, scene, renderer);

    setupSpawnButton(scene, renderer);
}

function setupSvg(): void {
    const context = createSvgContext('#svg-mount');
    const scene = createScene(context);

    const badges = createGroup({
        class: 'badges',
    });

    badges.add([
        createRect({
            class: 'badge',
            x: 30,
            y: 30,
            width: 90,
            height: 56,
            borderRadius: 8,
            fill: '#1e8e3e',
        }),
        createCircle({
            class: 'badge',
            cx: 200,
            cy: 100,
            radius: 40,
            fill: '#459bf1',
        }),
        createCircle({
            class: 'badge badge--small',
            cx: 300,
            cy: 190,
            radius: 22,
            fill: '#d93025',
        }),
    ]);

    scene.add(badges);
    scene.render();

    createDevtools(context, scene);
}

setupCanvas();
setupSvg();
