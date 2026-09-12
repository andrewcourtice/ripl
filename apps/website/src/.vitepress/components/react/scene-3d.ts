import {
    createAmbientLight,
    createDirectionalLight,
    createPointLight,
} from '@ripl/3d';

import {
    RiplCamera,
    RiplContext3D,
    RiplCube,
    RiplGroup3D,
    RiplRenderer,
    RiplScene,
    RiplTransition,
} from '@ripl/react-3d';

import {
    easeOutCubic,
} from '@ripl/web';

import {
    createElement,
    useMemo,
    useState,
} from 'react';

import type {
    ReactElement,
} from 'react';

/** Props accepted by {@link Scene3DDemo}. */
export interface Scene3DDemoProps {
    /** Changing this re-rolls the ring's block heights. */
    seed: number;
    /** Whether the ring turns. */
    spinning: boolean;
    /** Whether the blocks render as wireframe. */
    wireframe: boolean;
}

const RING = 8;
const RADIUS = 2.2;
const PALETTE = ['#3a86ff', '#8338ec', '#ff006e', '#fb5607', '#ffbe0b'];

// Replaces the default ambient-plus-directional rig with a warm key, a cool fill and a rim light,
// which is what makes the faces read as shaded rather than flat-filled.
const LIGHTS = [
    createAmbientLight({
        color: '#8899bb',
        intensity: 0.3,
    }),
    createDirectionalLight({
        direction: [-0.6, -0.8, -0.5],
        color: '#fff2e0',
        intensity: 0.7,
    }),
    createPointLight({
        position: [0, 4, 3],
        color: '#ffd0a0',
        intensity: 12,
        distance: 14,
    }),
];

const FOG = {
    color: '#0b1020',
    near: 8,
    far: 18,
};

const CAMERA_POSITION = [0, 2.4, 6] as const;
const CAMERA_TARGET = [0, 0, 0] as const;

const UPDATE_PHASE = {
    duration: 1000,
    ease: easeOutCubic,
};

const STYLE = {
    width: '100%',
    height: '100%',
};

function heightFor(index: number, offset: number): number {
    return 0.5 + ((index * 7 + offset * 13) % 9) / 6;
}

/** The React 3D demo: a ring of blocks under a hand-built lighting rig. */
export function Scene3DDemo(props: Scene3DDemoProps): ReactElement {
    const [spin, setSpin] = useState(0);

    const material = useMemo(() => ({
        shininess: 40,
        specular: '#ffffff',
        wireframe: props.wireframe,
    }), [props.wireframe]);

    // Memoised so a spin tick, which re-renders this component sixty times a second, leaves the
    // blocks' elements untouched and React can skip them entirely.
    const blocks = useMemo(() => Array.from({ length: RING }, (_, index) => {
        const angle = (index / RING) * Math.PI * 2;
        const size = heightFor(index, props.seed);

        return createElement(RiplCube, {
            key: index,
            size,
            x: Math.cos(angle) * RADIUS,
            y: size / 2 - 1,
            z: Math.sin(angle) * RADIUS,
            fill: PALETTE[index % PALETTE.length],
            material,
        });
    }), [props.seed, material]);

    const onTick = ({ deltaTime }: { deltaTime: number }) => {
        if (props.spinning) {
            setSpin(value => value + deltaTime * 0.0004);
        }
    };

    return createElement(RiplContext3D, {
        style: STYLE,
        lights: LIGHTS,
        fog: FOG,
    }, createElement(RiplScene, null,
        createElement(RiplRenderer, {
            autoStop: false,
            onTick,
        },
        createElement(RiplCamera, {
            position: CAMERA_POSITION,
            target: CAMERA_TARGET,
            fov: 45,
            interactions: true,
        }),
        createElement(RiplTransition, {
            update: UPDATE_PHASE,
        }, createElement(RiplGroup3D, {
            rotationY: spin,
        }, blocks)))));
}
