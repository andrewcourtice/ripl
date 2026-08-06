import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    elementTypeIsBuiltIn,
    getElementDocsUrl,
} from '../src/shared/elements';

const CORE_ELEMENT_TYPES = [
    'arc',
    'circle',
    'ellipse',
    'image',
    'line',
    'path',
    'polygon',
    'polyline',
    'rect',
    'text',
];

describe('Built-in elements', () => {

    test('Should recognise every core element type', () => {
        expect(CORE_ELEMENT_TYPES.every(elementTypeIsBuiltIn)).toBe(true);
    });

    test('Should recognise the container types a tree snapshot reports', () => {
        expect(elementTypeIsBuiltIn('group')).toBe(true);
        expect(elementTypeIsBuiltIn('scene')).toBe(true);
        expect(elementTypeIsBuiltIn('context')).toBe(true);
    });

    test('Should not recognise a consumer-defined element type', () => {
        expect(elementTypeIsBuiltIn('sparkline')).toBe(false);
        expect(getElementDocsUrl('sparkline')).toBeUndefined();
    });

    test('Should link core elements to their documentation page', () => {
        expect(getElementDocsUrl('circle')).toBe('https://www.ripl.run/docs/core/elements/circle.html');
        expect(getElementDocsUrl('group')).toBe('https://www.ripl.run/docs/core/essentials/group.html');
        expect(getElementDocsUrl('cube')).toBe('https://www.ripl.run/docs/3d/shapes/cube.html');
    });

    // The docs site is built without cleanUrls, so an extensionless leaf link 404s.
    test('Should link to .html leaf pages on the www host', () => {
        const urls = CORE_ELEMENT_TYPES.map(type => getElementDocsUrl(type));

        expect(urls.every(url => url?.startsWith('https://www.ripl.run/'))).toBe(true);
        expect(urls.every(url => url?.endsWith('.html'))).toBe(true);
    });

});
