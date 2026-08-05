import {
    createPolyline,
} from '@ripl/web';

const COUNT = 320;
const CELL = 40;
const NEIGHBOR_RADIUS = 40;
const SEPARATION_RADIUS = 15;
const SEPARATION = 2500;
const ALIGNMENT = 3;
const COHESION = 2;
const PREDATOR_RADIUS = 150;
const PREDATOR_FORCE = 1400;
const MIN_SPEED = 70;
const MAX_SPEED = 165;
const GRID_STRIDE = 4096;
const COLORS = ['#38bdf8', '#818cf8', '#c084fc', '#22d3ee', '#60a5fa'];
const BODY = [
    [9, 0],
    [-6, 4.5],
    [-6, -4.5],
];

const px = new Float32Array(COUNT);
const py = new Float32Array(COUNT);
const vx = new Float32Array(COUNT);
const vy = new Float32Array(COUNT);
const buckets = new Map();

let predatorX = -1e6;
let predatorY = -1e6;

for (let i = 0; i < COUNT; i++) {
    const heading = Math.random() * Math.PI * 2;

    px[i] = Math.random() * context.width;
    py[i] = Math.random() * context.height;
    vx[i] = Math.cos(heading) * MAX_SPEED;
    vy[i] = Math.sin(heading) * MAX_SPEED;
}

const boids = Array.from({ length: COUNT }, (_, index) => createPolyline({
    points: BODY,
    translateX: px[index],
    translateY: py[index],
    rotation: Math.atan2(vy[index], vx[index]),
    fill: COLORS[index % COLORS.length],
}));

function bucketAt(x, y) {
    const key = Math.floor(y / CELL) * GRID_STRIDE + Math.floor(x / CELL);

    let bucket = buckets.get(key);

    if (!bucket) {
        bucket = [];
        buckets.set(key, bucket);
    }

    return bucket;
}

// Bucketing by grid cell is what keeps this O(n·k): each boid only ever reads the nine cells around it.
function rebuildHash() {
    buckets.forEach(bucket => {
        bucket.length = 0;
    });

    for (let i = 0; i < COUNT; i++) {
        bucketAt(px[i], py[i]).push(i);
    }
}

function steer(index, dt) {
    const cellX = Math.floor(px[index] / CELL);
    const cellY = Math.floor(py[index] / CELL);

    let alignX = 0;
    let alignY = 0;
    let flockX = 0;
    let flockY = 0;
    let sepX = 0;
    let sepY = 0;
    let flock = 0;

    for (let n = 0; n < 9; n++) {
        const bucket = buckets.get((cellY + Math.floor(n / 3) - 1) * GRID_STRIDE + cellX + (n % 3) - 1);

        if (!bucket) {
            continue;
        }

        for (let j = 0; j < bucket.length; j++) {
            const other = bucket[j];
            const dx = px[other] - px[index];
            const dy = py[other] - py[index];
            const dist2 = dx * dx + dy * dy;

            if (other === index || dist2 > NEIGHBOR_RADIUS ** 2) {
                continue;
            }

            flock++;
            alignX += vx[other];
            alignY += vy[other];
            flockX += px[other];
            flockY += py[other];

            if (dist2 < SEPARATION_RADIUS ** 2 && dist2 > 0) {
                sepX -= (dx * SEPARATION) / dist2;
                sepY -= (dy * SEPARATION) / dist2;
            }
        }
    }

    let ax = sepX;
    let ay = sepY;

    if (flock > 0) {
        ax += (alignX / flock - vx[index]) * ALIGNMENT + (flockX / flock - px[index]) * COHESION;
        ay += (alignY / flock - vy[index]) * ALIGNMENT + (flockY / flock - py[index]) * COHESION;
    }

    const fleeX = px[index] - predatorX;
    const fleeY = py[index] - predatorY;
    const fleeDist = Math.hypot(fleeX, fleeY);

    if (fleeDist > 0 && fleeDist < PREDATOR_RADIUS) {
        const panic = (PREDATOR_FORCE * (1 - fleeDist / PREDATOR_RADIUS)) / fleeDist;

        ax += fleeX * panic;
        ay += fleeY * panic;
    }

    vx[index] += ax * dt;
    vy[index] += ay * dt;

    const pace = Math.hypot(vx[index], vy[index]);
    const capped = Math.min(Math.max(pace, MIN_SPEED), MAX_SPEED);

    if (pace > 0) {
        vx[index] *= capped / pace;
        vy[index] *= capped / pace;
    }
}

function wrap(value, limit) {
    return ((value % limit) + limit) % limit;
}

function move(index, dt) {
    const boid = boids[index];

    px[index] = wrap(px[index] + vx[index] * dt, context.width);
    py[index] = wrap(py[index] + vy[index] * dt, context.height);
    boid.translateX = px[index];
    boid.translateY = py[index];
    boid.rotation = Math.atan2(vy[index], vx[index]);
}

scene.add(boids);

renderer.on('tick', event => {
    const dt = Math.min(event.data.deltaTime, 50) / 1000;

    rebuildHash();

    for (let i = 0; i < COUNT; i++) {
        steer(i, dt);
    }

    for (let i = 0; i < COUNT; i++) {
        move(i, dt);
    }
});

context.on('mousemove', event => {
    predatorX = event.data.x;
    predatorY = event.data.y;
});

context.on('mouseleave', () => {
    predatorX = -1e6;
    predatorY = -1e6;
});
