import {
    Shape3D,
} from '@ripl/3d';

const SEGMENTS = 40;
const EXTENT = 2.2;
const AMPLITUDE = 0.8;
const FREQUENCY = 4;
const FALLOFF = 1.4;
const WAVE_SPEED = 2.4;
const ORBIT_SPEED = 0.00012;

function getHeight(x, z, time) {
    const radius = Math.sqrt(x * x + z * z);

    return AMPLITUDE * Math.sin(radius * FREQUENCY - time) / (1 + radius * FALLOFF);
}

class WaveGrid extends Shape3D {

    get segments() {
        return this.getStateValue('segments');
    }

    get time() {
        return this.getStateValue('time');
    }

    // `setStateValue` drops the cached geometry, so writing this rebuilds the mesh on the next frame.
    set time(value) {
        this.setStateValue('time', value);
    }

    constructor(options) {
        super('wave-grid', {
            segments: SEGMENTS,
            time: 0,
            ...options,
        });
    }

    computeFaces() {
        const { segments } = this;
        const time = this.time;
        const step = (EXTENT * 2) / segments;
        const faces = [];

        for (let i = 0; i < segments; i++) {
            const x0 = -EXTENT + i * step;
            const x1 = x0 + step;

            for (let j = 0; j < segments; j++) {
                const z0 = -EXTENT + j * step;
                const z1 = z0 + step;

                faces.push({
                    vertices: [
                        [x0, getHeight(x0, z0, time), z0],
                        [x1, getHeight(x1, z0, time), z0],
                        [x1, getHeight(x1, z1, time), z1],
                        [x0, getHeight(x0, z1, time), z1],
                    ],
                });
            }
        }

        return faces;
    }

}

// 40x40 quads is the ceiling the CPU painter's algorithm holds at 60fps.
const grid = new WaveGrid({
    fill: '#6366f1',
    stroke: '#312e81',
    lineWidth: 0.5,
});

scene.add(grid);

let elapsed = 0;

renderer.on('tick', event => {
    elapsed += event.data.deltaTime;

    grid.time = (elapsed / 1000) * WAVE_SPEED;
    camera.orbit(event.data.deltaTime * ORBIT_SPEED, 0);
});
