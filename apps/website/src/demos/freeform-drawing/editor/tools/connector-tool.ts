import {
    createBoundsLookup,
    updateConnectorGeometry,
} from '../connectors';

import type {
    ToolId,
} from '../constants';

import type {
    Editor,
} from '../editor';

import {
    pickTopShape,
} from '../hit-test';

import {
    createShapeId,
} from '../model';

import type {
    ConnectorShape,
    Shape,
} from '../model';

import type {
    Tool,
} from './tool';

import type {
    Point,
} from '@ripl/web';

/** Tool that draws smart connectors; endpoints landing on a shape bind to it and reroute on move. */
export class ConnectorTool implements Tool {

    /** The tool's identifier. */
    public id: ToolId = 'connector';
    /** The cursor shown while the tool is active. */
    public cursor = 'crosshair';

    #editor: Editor;
    #draft: ConnectorShape | null = null;

    constructor(editor: Editor) {
        this.#editor = editor;
    }

    /** Starts a connector, binding its source to a shape under the pointer when there is one. */
    public onPointerDown(world: Point): void {
        const style = this.#editor.style;
        const source = this.#bindableAt(world);

        this.#draft = {
            id: createShapeId(),
            type: 'connector',
            source: {
                shapeId: source?.id,
                point: [world[0], world[1]],
            },
            target: {
                point: [world[0], world[1]],
            },
            stroke: style.stroke,
            fill: null,
            strokeWidth: style.strokeWidth,
            opacity: style.opacity,
            dash: style.dash,
            zIndex: 0,
        };

        this.#reroute();
        this.#editor.beginDraft(this.#draft);
    }

    /** Drags the free target end toward the pointer, rebinding as shapes are hovered. */
    public onPointerMove(world: Point): void {
        if (!this.#draft) {
            return;
        }

        const target = this.#bindableAt(world, this.#draft.source.shapeId);

        this.#draft.target = {
            shapeId: target?.id,
            point: [world[0], world[1]],
        };

        this.#reroute();
        this.#editor.updateLive([this.#draft]);
    }

    /** Commits a valid connector or discards a zero-length one. */
    public onPointerUp(): void {
        if (!this.#draft) {
            return;
        }

        const draft = this.#draft;
        this.#draft = null;

        const [sx, sy] = draft.source.point;
        const [tx, ty] = draft.target.point;
        const degenerate = Math.hypot(tx - sx, ty - sy) < 4
            && !(draft.source.shapeId && draft.target.shapeId);

        if (degenerate) {
            this.#editor.discardDraft(draft.id);
            return;
        }

        this.#editor.commit();
    }

    /** Discards any in-progress connector when the tool is switched away. */
    public onDeactivate(): void {
        if (this.#draft) {
            this.#editor.discardDraft(this.#draft.id);
            this.#draft = null;
        }
    }

    #bindableAt(world: Point, excludeId?: string): Shape | undefined {
        const candidates = this.#editor.document.filter(shape => {
            return shape.type !== 'connector'
                && shape.type !== 'line'
                && shape.id !== excludeId
                && shape.id !== this.#draft?.id;
        });

        return pickTopShape(candidates, world);
    }

    #reroute(): void {
        if (this.#draft) {
            updateConnectorGeometry(this.#draft, createBoundsLookup(this.#editor.document));
        }
    }

}
