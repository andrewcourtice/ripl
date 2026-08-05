import type {
    GraphPreset,
} from '../types';

/**
 * Curated equations offered in the preset gallery, chosen for visual interest rather than
 * syntax coverage. Every entry is verified to compile and evaluate; a preset that errors is
 * worse than no preset.
 */
export const PRESETS: GraphPreset[] = [
    {
        label: 'Butterfly curve',
        description: 'Temple Fay\'s parametric butterfly, swept over six full turns.',
        mode: '2d',
        expressions: [
            '(sin(t)*(exp(cos(t)) - 2*cos(4*t) - sin(t/12)^5), cos(t)*(exp(cos(t)) - 2*cos(4*t) - sin(t/12)^5))',
        ],
        viewport: {
            xMin: -3.5,
            xMax: 3.5,
            yMin: -4,
            yMax: 3,
        },
    },
    {
        label: 'Rose curve',
        description: 'A polar rose whose petal count follows k: odd k gives k petals, even k gives 2k.',
        mode: '2d',
        expressions: [
            'r = cos(k*theta)',
        ],
        params: {
            k: 5,
        },
        viewport: {
            xMin: -1.5,
            xMax: 1.5,
            yMin: -1.5,
            yMax: 1.5,
        },
    },
    {
        label: 'Lissajous figure',
        description: 'Two perpendicular oscillations; the frequency ratio a:b sets the knot.',
        mode: '2d',
        expressions: [
            '(sin(a*t), sin(b*t))',
        ],
        params: {
            a: 3,
            b: 4,
        },
        viewport: {
            xMin: -1.4,
            xMax: 1.4,
            yMin: -1.4,
            yMax: 1.4,
        },
    },
    {
        label: 'Implicit heart',
        description: 'A sextic whose zero set is a heart, traced by marching squares.',
        mode: '2d',
        expressions: [
            '(x^2 + y^2 - 1)^3 = x^2*y^3',
        ],
        viewport: {
            xMin: -1.8,
            xMax: 1.8,
            yMin: -1.6,
            yMax: 1.6,
        },
    },
    {
        label: 'Lemniscate of Bernoulli',
        description: 'The locus where the distances to two foci multiply to a constant.',
        mode: '2d',
        expressions: [
            '(x^2 + y^2)^2 = 2*a^2*(x^2 - y^2)',
        ],
        params: {
            a: 1.5,
        },
        viewport: {
            xMin: -3,
            xMax: 3,
            yMin: -2,
            yMax: 2,
        },
    },
    {
        label: 'Spirograph',
        description: 'An epitrochoid: a point fixed to a circle rolling around another circle.',
        mode: '2d',
        expressions: [
            '((rr + rs)*cos(t) - d*cos((rr + rs)/rs*t), (rr + rs)*sin(t) - d*sin((rr + rs)/rs*t))',
        ],
        params: {
            rr: 5,
            rs: 3,
            d: 5,
        },
        viewport: {
            xMin: -14,
            xMax: 14,
            yMin: -14,
            yMax: 14,
        },
    },
    {
        label: 'Damped oscillation',
        description: 'A sine under an exponential envelope, with the envelope drawn alongside.',
        mode: '2d',
        expressions: [
            'y = exp(-x/5)*sin(3*x)',
            'y = exp(-x/5)',
            'y = -exp(-x/5)',
        ],
        viewport: {
            xMin: -1,
            xMax: 16,
            yMin: -1.2,
            yMax: 1.2,
        },
    },
    {
        label: 'Fourier square wave',
        description: 'The first five odd harmonics of a square wave, showing Gibbs ringing at the step.',
        mode: '2d',
        expressions: [
            'y = sin(x) + sin(3*x)/3 + sin(5*x)/5 + sin(7*x)/7 + sin(9*x)/9',
        ],
        viewport: {
            xMin: -7,
            xMax: 7,
            yMin: -1.4,
            yMax: 1.4,
        },
    },
    {
        label: 'Ripple',
        description: 'A radial sinc: concentric waves decaying with distance from the origin.',
        mode: '3d',
        expressions: [
            'z = sin(sqrt(x^2 + y^2))/sqrt(x^2 + y^2)',
        ],
        viewport: {
            xMin: -12,
            xMax: 12,
            yMin: -12,
            yMax: 12,
        },
    },
    {
        label: 'Monkey saddle',
        description: 'A saddle with three descents, one for each leg plus the tail.',
        mode: '3d',
        expressions: [
            'z = x^3 - 3*x*y^2',
        ],
        viewport: {
            xMin: -1.5,
            xMax: 1.5,
            yMin: -1.5,
            yMax: 1.5,
        },
    },
    {
        label: 'Gaussian',
        description: 'A radially symmetric bell, the 2D normal distribution.',
        mode: '3d',
        expressions: [
            'z = exp(-(x^2 + y^2)/4)',
        ],
        viewport: {
            xMin: -5,
            xMax: 5,
            yMin: -5,
            yMax: 5,
        },
    },
    {
        label: 'Hyperbolic paraboloid',
        description: 'The classic saddle: every straight cut through it is a parabola.',
        mode: '3d',
        expressions: [
            'z = (x^2 - y^2)/4',
        ],
        viewport: {
            xMin: -4,
            xMax: 4,
            yMin: -4,
            yMax: 4,
        },
    },
    {
        label: 'Egg carton',
        description: 'A separable product of sines; the sliders set the wavelength on each axis.',
        mode: '3d',
        expressions: [
            'z = sin(a*x)*cos(b*y)',
        ],
        params: {
            a: 1,
            b: 1,
        },
        viewport: {
            xMin: -6,
            xMax: 6,
            yMin: -6,
            yMax: 6,
        },
    },
    {
        label: 'Cross-ripple',
        description: 'Two interfering plane waves, decaying radially.',
        mode: '3d',
        expressions: [
            'z = cos(x)*cos(y)*exp(-(x^2 + y^2)/40)',
        ],
        viewport: {
            xMin: -8,
            xMax: 8,
            yMin: -8,
            yMax: 8,
        },
    },
];
