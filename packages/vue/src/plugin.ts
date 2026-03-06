import {
    Ripl3dContext,
    RiplContext,
    RiplSvgContext,
} from './components/context';

import {
    RiplGroup,
} from './components/group';

import {
    RiplRenderer,
} from './components/renderer';

import {
    RiplScene,
} from './components/scene';

import {
    RiplTransition,
} from './components/transition';

import {
    RiplArc,
    RiplCircle,
    RiplEllipse,
    RiplImage,
    RiplLine,
    RiplPath,
    RiplPolygon,
    RiplPolyline,
    RiplRect,
    RiplText,
} from './components/elements';

import type {
    Plugin,
} from 'vue';

export function createRiplPlugin(): Plugin {
    return {
        install(app) {
            app.component('ripl-context', RiplContext);
            app.component('ripl-svg-context', RiplSvgContext);
            app.component('ripl-3d-context', Ripl3dContext);
            app.component('ripl-scene', RiplScene);
            app.component('ripl-renderer', RiplRenderer);
            app.component('ripl-group', RiplGroup);
            app.component('ripl-transition', RiplTransition);
            app.component('ripl-arc', RiplArc);
            app.component('ripl-circle', RiplCircle);
            app.component('ripl-ellipse', RiplEllipse);
            app.component('ripl-image', RiplImage);
            app.component('ripl-line', RiplLine);
            app.component('ripl-path', RiplPath);
            app.component('ripl-polygon', RiplPolygon);
            app.component('ripl-polyline', RiplPolyline);
            app.component('ripl-rect', RiplRect);
            app.component('ripl-text', RiplText);
        },
    };
}
