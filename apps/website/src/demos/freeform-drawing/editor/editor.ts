import {
    DEFAULT_STYLE,
    SCALE_EXTENT,
} from './constants';

import type {
    ToolId,
} from './constants';

import {
    createBoundsLookup,
    updateConnectorGeometry,
} from './connectors';

import {
    History,
} from './history';

import {
    cloneDocument,
    getDocumentBounds,
} from './model';

import type {
    ConnectorShape,
    RiplDocument,
    Shape,
    ShapeStyle,
} from './model';

import {
    reconcile,
    refreshElement,
} from './reconcile';

import {
    renderSelectionOverlay,
} from './selection';

import {
    ConnectorTool,
} from './tools/connector-tool';

import {
    EraserTool,
} from './tools/eraser-tool';

import {
    HandTool,
} from './tools/hand-tool';

import {
    HighlighterTool,
} from './tools/highlighter-tool';

import {
    PenTool,
} from './tools/pen-tool';

import {
    PencilTool,
} from './tools/pencil-tool';

import {
    SelectTool,
} from './tools/select-tool';

import {
    ShapeTool,
} from './tools/shape-tool';

import {
    TextTool,
} from './tools/text-tool';

import type {
    PointerInput,
    Tool,
} from './tools/tool';

import {
    createGroup,
    createRenderer,
    createScene,
    EventBus,
} from '@ripl/web';

import {
    createDevtools,
} from '@ripl/devtools';

import type {
    Box,
    Element,
    EventMap,
    Group,
    Point,
    Renderer,
    Scene,
} from '@ripl/web';

import {
    createNavigator,
} from '@ripl/dom';

import type {
    DOMNavigator,
} from '@ripl/dom';

/** Events emitted by the {@link Editor} so the UI can mirror its state. */
export interface EditorEventMap extends EventMap {
    /** Emitted whenever the document's shapes change. */
    documentchange: null;
    /** Emitted whenever the selection changes. */
    selectionchange: null;
    /** Emitted when the active tool changes, carrying the new tool id. */
    toolchange: ToolId;
    /** Emitted when the current drawing style changes, carrying the new style. */
    stylechange: ShapeStyle;
    /** Emitted when the zoom factor changes, carrying the new factor. */
    zoomchange: number;
    /** Emitted when the undo/redo availability changes. */
    historychange: null;
    /** Emitted when the editor is destroyed. */
    destroyed: null;
}

/**
 * The freeform drawing editor: it owns the Ripl scene, renderer and pan/zoom navigator, holds the
 * document (the single source of truth) and selection, routes pointer/keyboard input to the active
 * tool, and reconciles document changes into rendered elements. UI surfaces subscribe to its events.
 */
export class Editor extends EventBus<EditorEventMap> {

    #host: HTMLElement;
    #scene: Scene;
    #renderer: Renderer;
    #navigator: DOMNavigator;
    #world: Group;
    #overlay: Group;
    #elements = new Map<string, Element>();

    #document: RiplDocument = [];
    #committed: RiplDocument = [];
    #history = new History();
    #selection = new Set<string>();

    #tools = new Map<ToolId, Tool>();
    #activeTool: Tool;
    #style: ShapeStyle = { ...DEFAULT_STYLE };
    #cornerRadius = 0;

    #panning = false;
    #spaceHeld = false;
    #panLast: Point = [0, 0];
    #marquee: Box | null = null;

    constructor(host: HTMLElement) {
        super();

        this.#host = host;
        this.#scene = createScene(host);
        this.#renderer = createRenderer(this.#scene, {
            autoStart: true,
            autoStop: false,
        });

        createDevtools(this.#scene.context, this.#scene, this.#renderer, {
            label: 'Freeform drawing',
        });

        this.#world = createGroup({ id: 'ripl-draw-world' });
        this.#overlay = createGroup({ id: 'ripl-draw-overlay' });
        this.#scene.add([this.#world, this.#overlay]);

        this.#navigator = createNavigator(this.#scene.context, {
            scaleExtent: SCALE_EXTENT,
            interactions: {
                zoom: true,
                pan: false,
                brush: false,
            },
        });

        this.#tools = new Map<ToolId, Tool>([
            ['select', new SelectTool(this)],
            ['hand', new HandTool(this)],
            ['pencil', new PencilTool(this)],
            ['highlighter', new HighlighterTool(this)],
            ['pen', new PenTool(this)],
            ['rect', new ShapeTool(this, 'rect')],
            ['ellipse', new ShapeTool(this, 'ellipse')],
            ['line', new ShapeTool(this, 'line')],
            ['connector', new ConnectorTool(this)],
            ['text', new TextTool(this)],
            ['eraser', new EraserTool(this)],
        ]);

        this.#activeTool = this.#tools.get('select')!;

        this.#navigator.on('change', event => {
            const { k, x, y } = event.data;

            this.#world.translateX = x;
            this.#world.translateY = y;
            this.#world.transformScaleX = k;
            this.#world.transformScaleY = k;
            this.#renderOverlay();
            this.emit('zoomchange', k);
        });

        this.#attachInput();
        this.#applyCursor();
    }

    // ---- Accessors -----------------------------------------------------------------------------

    /** The host element the canvas is mounted into. */
    public get host(): HTMLElement {
        return this.#host;
    }

    /** The active tool's id. */
    public get activeToolId(): ToolId {
        return this.#activeTool.id;
    }

    /** The current drawing style applied to new shapes. */
    public get style(): ShapeStyle {
        return { ...this.#style };
    }

    /** The document's shapes (live reference; treat as read-only when iterating). */
    public get document(): RiplDocument {
        return this.#document;
    }

    /** The set of selected shape ids. */
    public get selection(): Set<string> {
        return this.#selection;
    }

    /** The current zoom factor. */
    public get zoom(): number {
        return this.#navigator.transform.k;
    }

    /** The pan/zoom navigator driving the view transform. */
    public get navigator(): DOMNavigator {
        return this.#navigator;
    }

    /** Whether an undo step is available. */
    public get canUndo(): boolean {
        return this.#history.canUndo;
    }

    /** Whether a redo step is available. */
    public get canRedo(): boolean {
        return this.#history.canRedo;
    }

    /** The current marquee (rubber-band) selection box in world space, or `null`. */
    public get marquee(): Box | null {
        return this.#marquee;
    }

    /** The overlay group used to draw selection handles and previews. */
    public get overlay(): Group {
        return this.#overlay;
    }

    // ---- Coordinate helpers --------------------------------------------------------------------

    /** Converts a client pointer event to a screen (canvas-local CSS pixel) point. */
    public toScreen(event: {
        clientX: number;
        clientY: number;
    }): Point {
        const rect = this.#host.getBoundingClientRect();
        return [event.clientX - rect.left, event.clientY - rect.top];
    }

    /** Converts a screen point to world coordinates. */
    public screenToWorld(screen: Point): Point {
        return this.#navigator.invertPoint(screen);
    }

    /** Converts a world point to its on-screen position. */
    public worldToScreen(world: Point): Point {
        return this.#navigator.applyPoint(world);
    }

    // ---- Tool + style --------------------------------------------------------------------------

    /** Switches the active tool, aborting any in-progress gesture on the previous tool. */
    public setTool(id: ToolId): void {
        if (id === this.#activeTool.id) {
            return;
        }

        const next = this.#tools.get(id);

        if (!next) {
            return;
        }

        this.#activeTool.onDeactivate?.();
        this.#activeTool = next;
        this.#activeTool.onActivate?.();
        this.#applyCursor();
        this.emit('toolchange', id);
    }

    /** The corner radius applied to new rectangles (and to selected rectangles when changed). */
    public get cornerRadius(): number {
        return this.#cornerRadius;
    }

    /** Sets the default rectangle corner radius and applies it to any selected rectangles. */
    public setCornerRadius(value: number): void {
        this.#cornerRadius = value;

        const rects = this.getSelectedShapes().filter(shape => shape.type === 'rect');

        if (rects.length) {
            rects.forEach(shape => {
                (shape as Extract<Shape, { type: 'rect' }>).radius = value;
            });
            this.commit();
        }

        this.emit('stylechange', this.style);
    }

    /** Merges a partial style patch into the current drawing style, applying it to any selection. */
    public setStyle(patch: Partial<ShapeStyle>): void {
        this.#style = {
            ...this.#style,
            ...patch,
        };

        this.emit('stylechange', this.style);

        if (this.#selection.size) {
            this.applyStyleToSelection(patch);
        }
    }

    // ---- Selection -----------------------------------------------------------------------------

    /** Replaces (or extends, when `additive`) the selection with the given shape ids. */
    public select(ids: string[], additive: boolean = false): void {
        if (!additive) {
            this.#selection.clear();
        }

        ids.forEach(id => this.#selection.add(id));
        this.#renderOverlay();
        this.emit('selectionchange', null);
    }

    /** Clears the current selection. */
    public clearSelection(): void {
        if (!this.#selection.size) {
            return;
        }

        this.#selection.clear();
        this.#renderOverlay();
        this.emit('selectionchange', null);
    }

    /** Selects every shape in the document. */
    public selectAll(): void {
        this.select(this.#document.map(shape => shape.id));
    }

    /** Returns the selected shapes in document order. */
    public getSelectedShapes(): Shape[] {
        return this.#document.filter(shape => this.#selection.has(shape.id));
    }

    /**
     * The style the properties panel should display: the primary (topmost) selected shape's style
     * when there is a selection, otherwise the current drawing style used for new shapes.
     */
    public getActiveStyle(): ShapeStyle {
        const selected = this.getSelectedShapes();

        if (!selected.length) {
            return this.style;
        }

        const primary = selected[selected.length - 1];

        return {
            stroke: primary.stroke,
            fill: primary.fill,
            strokeWidth: primary.strokeWidth,
            opacity: primary.opacity,
            dash: primary.dash,
        };
    }

    /** The corner radius the properties panel should display: the topmost selected rectangle's, else the default. */
    public getActiveCornerRadius(): number {
        const rects = this.getSelectedShapes().filter(shape => shape.type === 'rect');
        const primary = rects[rects.length - 1] as Extract<Shape, { type: 'rect' }> | undefined;

        return primary ? primary.radius : this.#cornerRadius;
    }

    /** Deletes the selected shapes (and any connectors bound to them) and commits. */
    public deleteSelection(): void {
        if (!this.#selection.size) {
            return;
        }

        this.deleteShapes([...this.#selection]);
    }

    // ---- Document mutation ---------------------------------------------------------------------

    /** Returns a shape by id, or `undefined`. */
    public getShape(id: string): Shape | undefined {
        return this.#document.find(shape => shape.id === id);
    }

    /** Adds a shape to the document (optionally selecting it) and commits it as an undo step. */
    public addShape(shape: Shape, select: boolean = false): void {
        this.#document.push(shape);

        if (shape.type === 'connector') {
            updateConnectorGeometry(shape, createBoundsLookup(this.#document));
        }

        if (select) {
            this.#selection.clear();
            this.#selection.add(shape.id);
        }

        this.commit();
    }

    /** Removes shapes (and connectors bound to them) by id and commits. */
    public deleteShapes(ids: string[]): void {
        const removing = new Set(ids);

        this.#document = this.#document.filter(shape => {
            if (removing.has(shape.id)) {
                return false;
            }

            if (shape.type === 'connector') {
                return !removing.has(shape.source.shapeId ?? '') && !removing.has(shape.target.shapeId ?? '');
            }

            return true;
        });

        ids.forEach(id => this.#selection.delete(id));
        this.commit();
    }

    /** Pushes a draft shape into the document and renders it, without recording an undo step. */
    public beginDraft(shape: Shape): void {
        this.#document.push(shape);
        this.#sync();
    }

    /** Removes an uncommitted draft shape by id without recording an undo step. */
    public discardDraft(id: string): void {
        this.#document = this.#document.filter(shape => shape.id !== id);
        this.#selection.delete(id);
        this.#sync();
    }

    /** Refreshes the live elements for a set of shapes (and their connectors) without committing. */
    public updateLive(shapes: Shape[]): void {
        const changed = new Set<string>();

        shapes.forEach(shape => {
            refreshElement(this.#elements, shape);
            changed.add(shape.id);
        });

        this.#rerouteConnectors(changed);
        this.#renderOverlay();
    }

    /** Applies a style patch to the current selection and commits. */
    public applyStyleToSelection(patch: Partial<ShapeStyle>): void {
        const selected = this.getSelectedShapes();

        if (!selected.length) {
            return;
        }

        selected.forEach(shape => Object.assign(shape, patch));
        this.commit();
    }

    /** Sets the marquee selection box (or clears it) and refreshes the overlay. */
    public setMarquee(box: Box | null): void {
        this.#marquee = box;
        this.#renderOverlay();
    }

    /**
     * Records the current committed document as an undo point, adopts the live document as the new
     * baseline, reconciles it into elements, and notifies listeners. Called at the end of a gesture.
     */
    public commit(): void {
        this.#history.record(this.#committed);
        this.#committed = cloneDocument(this.#document);
        this.#sync();
        this.emit('historychange', null);
    }

    /** Restores the previous document snapshot. */
    public undo(): void {
        const previous = this.#history.undo(this.#committed);

        if (previous) {
            this.#restore(previous);
        }
    }

    /** Re-applies the next document snapshot. */
    public redo(): void {
        const next = this.#history.redo(this.#committed);

        if (next) {
            this.#restore(next);
        }
    }

    /** Removes every shape and commits the cleared document. */
    public clear(): void {
        if (!this.#document.length) {
            return;
        }

        this.#document = [];
        this.#selection.clear();
        this.commit();
    }

    /** Inserts many shapes at once (used by the performance stress test) and commits. */
    public insertMany(shapes: Shape[]): void {
        this.#document.push(...shapes);
        this.commit();
    }

    // ---- View controls -------------------------------------------------------------------------

    /** Multiplies the zoom by `factor`, keeping the viewport center fixed. */
    public zoomBy(factor: number): void {
        const { width, height } = this.#navigator.viewport;
        this.#navigator.zoomBy(factor, [width / 2, height / 2]);
    }

    /** Resets the view to 100% at the origin. */
    public resetView(): void {
        this.#navigator.reset();
    }

    /** Frames all content within the viewport, or resets when the document is empty. */
    public fitContent(): void {
        const bounds = getDocumentBounds(this.#document);

        if (bounds.width === 0 && bounds.height === 0) {
            this.#navigator.reset();
            return;
        }

        this.#navigator.fitBounds({
            x0: bounds.left,
            y0: bounds.top,
            x1: bounds.right,
            y1: bounds.bottom,
        }, {
            padding: 80,
        });
    }

    /** Whether the space bar is held (temporary pan mode). */
    public get isSpaceHeld(): boolean {
        return this.#spaceHeld;
    }

    /** Returns an openable object URL for a PNG snapshot of the current canvas view. */
    public exportPNG(): string {
        return this.#scene.context.export().toURL();
    }

    /** Pans the view by a screen-space delta (used by the hand tool). */
    public panBy(dx: number, dy: number): void {
        this.#navigator.panBy(dx, dy);
    }

    // ---- Keyboard ------------------------------------------------------------------------------

    /** Handles a key press, returning `true` when the editor consumed it. */
    public handleKeyDown(event: KeyboardEvent): boolean {
        if (this.#isEditingText(event)) {
            return false;
        }

        if (event.code === 'Space') {
            this.#spaceHeld = true;
            this.#applyCursor();
            return true;
        }

        this.#activeTool.onKeyDown?.(event);

        return this.#handleShortcut(event);
    }

    /** Handles a key release. */
    public handleKeyUp(event: KeyboardEvent): void {
        if (event.code === 'Space') {
            this.#spaceHeld = false;
            this.#applyCursor();
        }
    }

    /** Tears down the renderer, navigator, scene and all listeners. */
    public destroy(): void {
        this.#activeTool.onDeactivate?.();
        this.#navigator.destroy();
        this.#renderer.destroy();
        this.#scene.destroy();
        this.emit('destroyed', null);
        super.destroy();
    }

    // ---- Internals -----------------------------------------------------------------------------

    #restore(document: RiplDocument): void {
        this.#document = cloneDocument(document);
        this.#committed = cloneDocument(document);
        this.#selection.clear();
        this.#sync();
        this.emit('selectionchange', null);
        this.emit('historychange', null);
    }

    #sync(): void {
        reconcile(this.#world, this.#elements, this.#document, this.#renderer);
        this.#renderOverlay();
        this.emit('documentchange', null);
    }

    #rerouteConnectors(changed: Set<string>): void {
        const lookup = createBoundsLookup(this.#document);

        this.#document.forEach(shape => {
            if (shape.type !== 'connector') {
                return;
            }

            const connector = shape as ConnectorShape;
            const touches = changed.has(connector.source.shapeId ?? '')
                || changed.has(connector.target.shapeId ?? '');

            if (touches) {
                updateConnectorGeometry(connector, lookup);
                refreshElement(this.#elements, connector);
            }
        });
    }

    #renderOverlay(): void {
        renderSelectionOverlay(this);
    }

    #applyCursor(): void {
        if (this.#panning || this.#spaceHeld) {
            this.#host.style.cursor = this.#panning ? 'grabbing' : 'grab';
            return;
        }

        this.#host.style.cursor = this.#activeTool.cursor;
    }

    #toInput(event: PointerEvent): PointerInput {
        return {
            screen: this.toScreen(event),
            shiftKey: event.shiftKey,
            altKey: event.altKey,
            button: event.button,
        };
    }

    #attachInput(): void {
        const host = this.#host;

        const onPointerDown = (event: PointerEvent) => {
            host.setPointerCapture?.(event.pointerId);

            if (event.button === 1 || this.#spaceHeld) {
                this.#panning = true;
                this.#panLast = this.toScreen(event);
                this.#applyCursor();
                return;
            }

            const input = this.#toInput(event);
            this.#activeTool.onPointerDown?.(this.screenToWorld(input.screen), input);
        };

        const onPointerMove = (event: PointerEvent) => {
            if (this.#panning) {
                const screen = this.toScreen(event);
                this.#navigator.panBy(screen[0] - this.#panLast[0], screen[1] - this.#panLast[1]);
                this.#panLast = screen;
                return;
            }

            const input = this.#toInput(event);
            this.#activeTool.onPointerMove?.(this.screenToWorld(input.screen), input);
        };

        const onPointerUp = (event: PointerEvent) => {
            host.releasePointerCapture?.(event.pointerId);

            if (this.#panning) {
                this.#panning = false;
                this.#applyCursor();
                return;
            }

            const input = this.#toInput(event);
            this.#activeTool.onPointerUp?.(this.screenToWorld(input.screen), input);
        };

        const onDoubleClick = (event: MouseEvent) => {
            const input: PointerInput = {
                screen: this.toScreen(event),
                shiftKey: event.shiftKey,
                altKey: event.altKey,
                button: event.button,
            };
            this.#activeTool.onDoubleClick?.(this.screenToWorld(input.screen), input);
        };

        host.addEventListener('pointerdown', onPointerDown);
        host.addEventListener('pointermove', onPointerMove);
        host.addEventListener('pointerup', onPointerUp);
        host.addEventListener('pointercancel', onPointerUp);
        host.addEventListener('dblclick', onDoubleClick);
        host.addEventListener('contextmenu', this.#preventContextMenu);

        this.retain({
            dispose: () => {
                host.removeEventListener('pointerdown', onPointerDown);
                host.removeEventListener('pointermove', onPointerMove);
                host.removeEventListener('pointerup', onPointerUp);
                host.removeEventListener('pointercancel', onPointerUp);
                host.removeEventListener('dblclick', onDoubleClick);
                host.removeEventListener('contextmenu', this.#preventContextMenu);
            },
        });
    }

    #preventContextMenu = (event: MouseEvent): void => {
        event.preventDefault();
    };

    #isEditingText(event: KeyboardEvent): boolean {
        const target = event.target as HTMLElement | null;

        if (!target) {
            return false;
        }

        return target.tagName === 'INPUT'
            || target.tagName === 'TEXTAREA'
            || target.isContentEditable;
    }

    #handleShortcut(event: KeyboardEvent): boolean {
        const meta = event.metaKey || event.ctrlKey;

        if (meta && event.key.toLowerCase() === 'z') {
            event.preventDefault();

            if (event.shiftKey) {
                this.redo();
            } else {
                this.undo();
            }

            return true;
        }

        if (meta && event.key.toLowerCase() === 'a') {
            event.preventDefault();
            this.selectAll();
            return true;
        }

        if (event.key === 'Delete' || event.key === 'Backspace') {
            this.deleteSelection();
            return true;
        }

        if (event.key === 'Escape') {
            this.setTool('select');
            this.clearSelection();
            return true;
        }

        const toolByKey: Record<string, ToolId> = {
            'v': 'select',
            'h': 'hand',
            'p': 'pencil',
            'n': 'pen',
            'i': 'highlighter',
            'r': 'rect',
            'o': 'ellipse',
            'l': 'line',
            'c': 'connector',
            't': 'text',
            'e': 'eraser',
        };

        const tool = toolByKey[event.key.toLowerCase()];

        if (tool && !meta) {
            this.setTool(tool);
            return true;
        }

        return false;
    }

}
