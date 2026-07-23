/**
 * One-off generator for the extension action/toolbar icons.
 *
 * Renders the Ripl logo SVG (assets/logo/Ripl 512.svg) at each required size in
 * both the "active" (blue) and "gray" (inactive) variants using Playwright's
 * bundled Chromium, and writes transparent PNGs into public/icons.
 *
 * Run from the workspace root: node scripts/generate-icons.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

import {
    fileURLToPath,
} from 'node:url';

import {
    chromium,
} from 'playwright-core';

const CHROMIUM_EXECUTABLE = '/opt/pw-browsers/chromium';

const SIZES = [16, 32, 48, 128];

const VARIANTS = {
    active: '#459BF1',
    gray: '#9AA0A6',
};

const LOGO_PATH = 'M256 394C315.105 394 367.326 423.472 398.772 468.52C385.992 477.122 372.394 484.603 358.119 490.819C334.75 459.947 297.705 440 256 440C214.295 440 177.249 459.947 153.88 490.819C139.605 484.603 126.007 477.122 113.227 468.52C144.673 423.471 196.894 394 256 394ZM256 328C334.837 328 404.795 366.013 448.547 424.71C437.451 437.363 425.127 448.913 411.763 459.174C377.409 410.095 320.454 378 256 378C191.546 378 134.59 410.095 100.236 459.174C86.8718 448.913 74.5479 437.363 63.4521 424.71C107.204 366.013 177.163 328 256 328ZM256 224C352.35 224 439.449 263.612 501.898 327.438C492.902 358.458 478.195 387.049 458.991 412C412.187 351.188 338.671 312 256 312C173.329 312 99.8118 351.188 53.0078 412C33.8041 387.049 19.0967 358.458 10.1006 327.438C72.5505 263.612 159.65 224 256 224ZM256 88C340.519 88 419.87 110.122 488.582 148.891C503.614 181.477 512 217.759 512 256C512 274.305 510.077 292.16 506.426 309.377C441.631 246.623 353.326 208 256 208C158.673 208 70.3681 246.623 5.57324 309.377C1.92161 292.16 0 274.305 0 256C0 217.759 8.38551 181.477 23.417 148.891C92.1289 110.122 171.481 88 256 88ZM256 0C348.94 0 430.311 49.5272 475.163 123.628C409.216 90.5935 334.78 72 256 72C177.22 72 102.783 90.5933 36.8359 123.628C81.688 49.5269 163.06 0 256 0Z';

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outputDir = path.join(rootDir, 'public', 'icons');

function getIconMarkup(fill, size) {
    return `<!DOCTYPE html>
<html>
<head><style>html, body { margin: 0; padding: 0; background: transparent; }</style></head>
<body>
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
<path d="${LOGO_PATH}" fill="${fill}"/>
</svg>
</body>
</html>`;
}

async function generateIcons() {
    fs.mkdirSync(outputDir, {
        recursive: true,
    });

    const browser = await chromium.launch({
        executablePath: CHROMIUM_EXECUTABLE,
    });

    const page = await browser.newPage();

    for (const [variant, fill] of Object.entries(VARIANTS)) {
        for (const size of SIZES) {
            await page.setViewportSize({
                width: size,
                height: size,
            });

            await page.setContent(getIconMarkup(fill, size));

            const buffer = await page.screenshot({
                omitBackground: true,
            });

            fs.writeFileSync(path.join(outputDir, `icon-${variant}-${size}.png`), buffer);
        }
    }

    await browser.close();
}

generateIcons().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
