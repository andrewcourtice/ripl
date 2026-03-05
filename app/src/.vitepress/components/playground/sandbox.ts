export type PlaygroundMode = '2d' | '3d';
export type ContextType = 'canvas' | 'svg';

export interface PlaygroundSettings {
    autoStop: boolean;
    cameraInteractions: boolean;
}

interface SetupCode {
    imports: string;
    body: string;
}

function getSetupCode(mode: PlaygroundMode, contextType: ContextType, settings: PlaygroundSettings): SetupCode {
    if (mode === '3d') {
        return {
            imports: [
                'import { createScene, createRenderer } from \'@ripl/core\';',
                'import { createContext, createCamera, depthSort } from \'@ripl/3d\';',
            ].join('\n'),
            body: [
                'const context = createContext(\'#root\', { buffer: false });',
                'const scene = createScene(context);',
                'const renderer = createRenderer(scene, {',
                `    autoStop: ${settings.autoStop},`,
                '    sortBuffer: depthSort(context),',
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
                'import { createScene, createRenderer } from \'@ripl/core\';',
                'import { createContext } from \'@ripl/svg\';',
            ].join('\n'),
            body: [
                'const context = createContext(\'#root\', { buffer: false });',
                'const scene = createScene(context);',
                'const renderer = createRenderer(scene);',
            ].join('\n'),
        };
    }

    return {
        imports: [
            'import { createScene, createRenderer, createContext } from \'@ripl/core\';',
        ].join('\n'),
        body: [
            'const context = createContext(\'#root\', { buffer: false });',
            'const scene = createScene(context);',
            'const renderer = createRenderer(scene);',
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
    settings: PlaygroundSettings
): string {
    const setup = getSetupCode(mode, contextType, settings);
    const userParts = extractImports(userCode);

    const allImports = [setup.imports, ...userParts.imports].filter(Boolean).join('\n');
    const allBody = [setup.body, userParts.body].filter(Boolean).join('\n');

    const cleanupParts = ['renderer.destroy()'];

    if (mode === '3d') {
        cleanupParts.unshift('camera.dispose()');
    }

    const cleanup = cleanupParts.join('; ');

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
            background: #ffffff;
        }

        #root {
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

        window.addEventListener('pagehide', () => { ${ cleanup } });
    </script>
</body>
</html>`;
}

export function encodeCode(code: string): string {
    try {
        return btoa(encodeURIComponent(code));
    } catch {
        return '';
    }
}

export function decodeCode(encoded: string): string {
    try {
        return decodeURIComponent(atob(encoded));
    } catch {
        return '';
    }
}
