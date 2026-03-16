export type PlaygroundMode = '2d' | '3d';
export type ContextType = 'canvas' | 'svg' | 'webgpu';

export interface PlaygroundSettings {
    autoStop: boolean;
    cameraInteractions: boolean;
    debugFps: boolean;
    debugElementCount: boolean;
    debugBoundingBoxes: boolean;
}

export interface PlaygroundState {
    code: string;
    mode: PlaygroundMode;
    contextType: ContextType;
    extraImports?: Record<string, string>;
}

interface SetupCode {
    imports: string;
    body: string;
    suffix?: string;
}

function getSetupCode(mode: PlaygroundMode, contextType: ContextType, settings: PlaygroundSettings): SetupCode {
    if (mode === '3d' && contextType === 'webgpu') {
        return {
            imports: [
                'import { createScene, createRenderer } from \'@ripl/web\';',
                'import { createContext } from \'@ripl/webgpu\';',
                'import { createCamera } from \'@ripl/3d\';',
            ].join('\n'),
            body: [
                '(async () => {',
                'const context = await createContext(\'#root\');',
                'const scene = createScene(context);',
                'const renderer = createRenderer(scene, {',
                `    autoStop: ${settings.autoStop},`,
                '    debug: {',
                `        fps: ${settings.debugFps},`,
                `        elementCount: ${settings.debugElementCount},`,
                `        boundingBoxes: ${settings.debugBoundingBoxes},`,
                '    },',
                '});',
                'const camera = createCamera(scene, {',
                '    position: [0, 1.5, 5],',
                '    target: [0, 0, 0],',
                '    fov: 50,',
                `    interactions: ${settings.cameraInteractions},`,
                '});',
                'camera.flush();',
            ].join('\n'),
            suffix: 'window.addEventListener(\'pagehide\', () => { camera.dispose(); renderer.destroy() });\n})();',
        };
    }

    if (mode === '3d') {
        return {
            imports: [
                'import { createScene, createRenderer } from \'@ripl/web\';',
                'import { createContext, createCamera } from \'@ripl/3d\';',
            ].join('\n'),
            body: [
                'const context = createContext(\'#root\');',
                'const scene = createScene(context);',
                'const renderer = createRenderer(scene, {',
                `    autoStop: ${settings.autoStop},`,
                '    debug: {',
                `        fps: ${settings.debugFps},`,
                `        elementCount: ${settings.debugElementCount},`,
                `        boundingBoxes: ${settings.debugBoundingBoxes},`,
                '    },',
                '});',
                'const camera = createCamera(scene, {',
                '    position: [0, 1.5, 5],',
                '    target: [0, 0, 0],',
                '    fov: 50,',
                `    interactions: ${settings.cameraInteractions},`,
                '});',
                'camera.flush();',
            ].join('\n'),
        };
    }

    if (contextType === 'svg') {
        return {
            imports: [
                'import { createScene, createRenderer } from \'@ripl/web\';',
                'import { createContext } from \'@ripl/svg\';',
            ].join('\n'),
            body: [
                'const context = createContext(\'#root\');',
                'const scene = createScene(context);',
                'const renderer = createRenderer(scene, {',
                `    autoStop: ${settings.autoStop},`,
                '    debug: {',
                `        fps: ${settings.debugFps},`,
                `        elementCount: ${settings.debugElementCount},`,
                `        boundingBoxes: ${settings.debugBoundingBoxes},`,
                '    },',
                '});',
            ].join('\n'),
        };
    }

    return {
        imports: [
            'import { createScene, createRenderer, createContext } from \'@ripl/web\';',
        ].join('\n'),
        body: [
            'const context = createContext(\'#root\', { buffer: false });',
            'const scene = createScene(context);',
            'const renderer = createRenderer(scene, {',
            `    autoStop: ${settings.autoStop},`,
            '    debug: {',
            `        fps: ${settings.debugFps},`,
            `        elementCount: ${settings.debugElementCount},`,
            `        boundingBoxes: ${settings.debugBoundingBoxes},`,
            '    },',
            '});',
        ].join('\n'),
    };
}

const IMPORT_REGEX = /^\s*import\s+(?:[\s\S]*?\s+from\s+)?['"][^'"]+['"]\s*;?/gm;

function extractImports(code: string): { imports: string[];
    body: string; } {
    const imports: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = IMPORT_REGEX.exec(code)) !== null) {
        imports.push(match[0].trim());
    }

    const body = code.replace(IMPORT_REGEX, '').trim();

    return {
        imports,
        body,
    };
}

export function buildSrcdoc(
    userCode: string,
    mode: PlaygroundMode,
    contextType: ContextType,
    importMap: Record<string, string>,
    origin: string,
    settings: PlaygroundSettings,
    isDark = false
): string {
    const setup = getSetupCode(mode, contextType, settings);
    const userParts = extractImports(userCode);

    const allImports = [setup.imports, ...userParts.imports].filter(Boolean).join('\n');
    const allBody = [setup.body, userParts.body, setup.suffix].filter(Boolean).join('\n');

    let cleanup = '';

    if (mode === '3d' && contextType !== 'webgpu') {
        cleanup = 'camera.dispose(); renderer.destroy()';
    } else if (contextType !== 'webgpu') {
        cleanup = 'renderer.destroy()';
    }

    const resolvedMap: Record<string, string> = {};

    for (const [pkg, urlPath] of Object.entries(importMap)) {
        resolvedMap[pkg] = urlPath.startsWith('http') ? urlPath : origin + urlPath;
    }

    const importMapJson = JSON.stringify({ imports: resolvedMap }, null, 2);

    return `<!DOCTYPE html>
<html>
<head>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html,
        body {
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: ${isDark ? '#1b1b1f' : '#ffffff'};
        }

        #root {
            position: relative;
            width: 100%;
            height: 100%;
        }

        canvas {
            display: block;
            width: 100%;
            height: 100%;
        }

        svg {
            display: block;
            width: 100%;
            height: 100%;
        }
    </style>
    <script type="importmap">
        ${importMapJson}
    </script>
</head>
<body>
    <div id="root"></div>
    <script>
        window.addEventListener('error', function (ev) {
            window.parent.postMessage({ type: 'playground-error', message: ev.message }, '*');
        });
        window.addEventListener('unhandledrejection', function (ev) {
            window.parent.postMessage({ type: 'playground-error', message: String(ev.reason) }, '*');
        });
    </script>
    <script type="module">
        ${ allImports }

        ${ allBody }

        ${ cleanup ? `window.addEventListener('pagehide', () => { ${ cleanup } });` : '' }
    </script>
</body>
</html>`;
}

export function encodeState(state: PlaygroundState): string {
    try {
        return btoa(encodeURIComponent(JSON.stringify(state)));
    } catch {
        return '';
    }
}

export function decodeState(encoded: string): PlaygroundState | null {
    try {
        const decoded = decodeURIComponent(atob(encoded));

        try {
            const parsed = JSON.parse(decoded);

            if (parsed && typeof parsed.code === 'string') {
                return parsed as PlaygroundState;
            }
        } catch {
            // legacy code-only hash
        }

        if (decoded) {
            return {
                code: decoded,
                mode: '2d',
                contextType: 'canvas',
            };
        }

        return null;
    } catch {
        return null;
    }
}
