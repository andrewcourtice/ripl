import {
    createAmbientLight,
    createDirectionalLight,
    createSphere,
    createTexture,
} from '@ripl/3d';

const SIZE = 256;

// Generated rather than fetched, so the example ships no asset and works offline.
function createGridTexture() {
    const canvas = document.createElement('canvas');

    canvas.width = SIZE;
    canvas.height = SIZE;

    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0d3b66';
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.strokeStyle = '#5fa8d3';
    ctx.lineWidth = 2;

    for (let index = 0; index <= 12; index++) {
        const offset = (index / 12) * SIZE;

        ctx.beginPath();
        ctx.moveTo(offset, 0);
        ctx.lineTo(offset, SIZE);
        ctx.moveTo(0, offset);
        ctx.lineTo(SIZE, offset);
        ctx.stroke();
    }

    ctx.fillStyle = '#f4d35e';

    for (let index = 0; index < 24; index++) {
        const px = (index * 97) % SIZE;
        const py = (index * 53) % SIZE;

        ctx.fillRect(px, py, 14, 10);
    }

    return createTexture(canvas);
}

context.lights.clear();
context.lights.add(
    createAmbientLight({
        intensity: 0.35,
    }),
    createDirectionalLight({
        direction: [-0.7, -0.5, -0.5],
        intensity: 0.8,
    })
);

const globe = createSphere({
    radius: 1.4,
    segments: 48,
    rings: 32,
    fill: '#ffffff',
    material: {
        map: createGridTexture(),
    },
});

scene.add(globe);

renderer.on('tick', event => {
    globe.rotationY += event.data.deltaTime * 0.0003;
});
