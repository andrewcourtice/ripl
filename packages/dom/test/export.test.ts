import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    createCanvasExport,
} from '../src/export';

const DATA_URL = 'data:image/png;base64,iVBORw0KGgo=';

describe('createCanvasExport', () => {

    beforeEach(() => {
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
            drawImage: vi.fn(),
            getImageData: vi.fn((_x: number, _y: number, width: number, height: number) => ({
                data: new Uint8ClampedArray(width * height * 4),
                width,
                height,
            })),
        } as unknown as CanvasRenderingContext2D);

        vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(DATA_URL);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('Should export the canvas as a PNG data URL string', () => {
        const canvas = document.createElement('canvas');

        canvas.width = 16;
        canvas.height = 16;

        expect(createCanvasExport(canvas).toString()).toBe(DATA_URL);
    });

    test('Should export the canvas as an object URL', () => {
        const canvas = document.createElement('canvas');

        canvas.width = 16;
        canvas.height = 16;

        const url = createCanvasExport(canvas).toURL();

        expect(url.startsWith('blob:')).toBe(true);
    });

    test('Should export the canvas as ImageData at the backing resolution', async () => {
        const canvas = document.createElement('canvas');

        canvas.width = 16;
        canvas.height = 8;

        const image = await createCanvasExport(canvas).toImage();

        expect(image.width).toBe(16);
        expect(image.height).toBe(8);
    });

});
