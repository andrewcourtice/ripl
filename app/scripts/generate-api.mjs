import fs from 'node:fs';
import path from 'node:path';
import {
    fileURLToPath,
} from 'node:url';
import ts from 'typescript';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const outputDir = path.resolve(__dirname, '../src/.vitepress/data/api');

const PACKAGES = [
    {
        name: '@ripl/core',
        dir: 'core',
    },
    {
        name: '@ripl/charts',
        dir: 'charts',
    },
    {
        name: '@ripl/svg',
        dir: 'svg',
    },
    {
        name: '@ripl/3d',
        dir: '3d',
    },
    {
        name: '@ripl/utilities',
        dir: 'utilities',
    },
];

if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true });
}

fs.mkdirSync(outputDir, { recursive: true });

const tsConfigPath = path.resolve(rootDir, 'tsconfig.json');
const tsConfigFile = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
const parsedConfig = ts.parseJsonConfigFileContent(tsConfigFile.config, ts.sys, rootDir);

const allEntryFiles = PACKAGES.map(pkg =>
    path.resolve(rootDir, 'packages', pkg.dir, 'src/index.ts')
);

const program = ts.createProgram(allEntryFiles, {
    ...parsedConfig.options,
    noEmit: true,
});

const checker = program.getTypeChecker();

function getJSDoc(symbol) {
    const docs = symbol.getDocumentationComment(checker);
    return docs.length > 0 ? ts.displayPartsToString(docs).trim() : '';
}

function getJSDocTags(symbol) {
    const tags = symbol.getJsDocTags(checker);
    const result = {};
    for (const tag of tags) {
        const text = tag.text ? ts.displayPartsToString(tag.text).trim() : '';
        if (!result[tag.name]) {
            result[tag.name] = [];
        }
        result[tag.name].push(text);
    }
    return result;
}

function getSymbolKind(symbol) {
    const flags = symbol.flags;

    if (flags & ts.SymbolFlags.Class) return 'class';
    if (flags & ts.SymbolFlags.Interface) return 'interface';
    if (flags & ts.SymbolFlags.TypeAlias) return 'type';
    if (flags & ts.SymbolFlags.Enum) return 'enum';
    if (flags & ts.SymbolFlags.Function) return 'function';
    if (flags & ts.SymbolFlags.Variable) return 'variable';
    if (flags & ts.SymbolFlags.ConstEnum) return 'enum';
    return 'unknown';
}

function getTypeString(symbol) {
    try {
        const decl = symbol.declarations?.[0];
        if (!decl) return '';

        if (ts.isTypeAliasDeclaration(decl)) {
            return decl.getText().replace(/^export\s+/, '');
        }

        if (ts.isInterfaceDeclaration(decl)) {
            return decl.getText().replace(/^export\s+/, '');
        }

        if (ts.isClassDeclaration(decl)) {
            const heritage = decl.heritageClauses?.map(h => h.getText()).join(' ') || '';
            const name = decl.name?.getText() || symbol.name;
            const typeParams = decl.typeParameters?.map(tp => tp.getText()).join(', ') || '';
            return `class ${name}${typeParams ? `<${typeParams}>` : ''} ${heritage}`.trim();
        }

        if (ts.isFunctionDeclaration(decl)) {
            return decl.getText().replace(/^export\s+/, '').replace(/\{[\s\S]*\}$/, '').trim();
        }

        if (ts.isVariableDeclaration(decl)) {
            const type = checker.getTypeAtLocation(decl);
            const typeStr = checker.typeToString(type, decl, ts.TypeFormatFlags.NoTruncation);
            return `const ${symbol.name}: ${typeStr}`;
        }

        const type = checker.getTypeOfSymbolAtLocation(symbol, decl);
        return checker.typeToString(type, decl, ts.TypeFormatFlags.NoTruncation);
    } catch {
        return '';
    }
}

function getClassMembers(symbol) {
    const decl = symbol.declarations?.[0];
    if (!decl || !ts.isClassDeclaration(decl)) return [];

    const members = [];
    const type = checker.getDeclaredTypeOfSymbol(symbol);

    for (const prop of type.getProperties()) {
        const propDecl = prop.declarations?.[0];
        if (!propDecl) continue;

        const modifiers = ts.getCombinedModifierFlags(propDecl);
        if (modifiers & ts.ModifierFlags.Private) continue;

        const isStatic = !!(modifiers & ts.ModifierFlags.Static);
        const isReadonly = !!(modifiers & ts.ModifierFlags.Readonly);
        const isProtected = !!(modifiers & ts.ModifierFlags.Protected);

        let memberKind = 'property';
        if (ts.isMethodDeclaration(propDecl) || ts.isMethodSignature(propDecl)) {
            memberKind = 'method';
        } else if (ts.isGetAccessorDeclaration(propDecl)) {
            memberKind = 'getter';
        } else if (ts.isSetAccessorDeclaration(propDecl)) {
            memberKind = 'setter';
        }

        let typeStr = '';
        try {
            const propType = checker.getTypeOfSymbolAtLocation(prop, propDecl);
            typeStr = checker.typeToString(propType, propDecl, ts.TypeFormatFlags.NoTruncation);
        } catch { /* */ }

        let params = [];
        if (memberKind === 'method') {
            try {
                const propType = checker.getTypeOfSymbolAtLocation(prop, propDecl);
                const signatures = propType.getCallSignatures();
                if (signatures.length > 0) {
                    const sig = signatures[0];
                    params = sig.getParameters().map(p => {
                        const pType = checker.getTypeOfSymbolAtLocation(p, p.declarations?.[0] || propDecl);
                        return {
                            name: p.name,
                            type: checker.typeToString(pType, propDecl, ts.TypeFormatFlags.NoTruncation),
                            description: ts.displayPartsToString(p.getDocumentationComment(checker)).trim(),
                            optional: !!(p.flags & ts.SymbolFlags.Optional),
                        };
                    });
                    const returnType = sig.getReturnType();
                    typeStr = checker.typeToString(returnType, propDecl, ts.TypeFormatFlags.NoTruncation);
                }
            } catch { /* */ }
        }

        members.push({
            name: prop.name,
            kind: memberKind,
            description: ts.displayPartsToString(prop.getDocumentationComment(checker)).trim(),
            type: typeStr,
            params: params.length > 0 ? params : undefined,
            static: isStatic || undefined,
            readonly: isReadonly || undefined,
            protected: isProtected || undefined,
        });
    }

    // Get constructor params
    const constructorDecl = decl.members.find(m => ts.isConstructorDeclaration(m));
    if (constructorDecl && ts.isConstructorDeclaration(constructorDecl)) {
        const params = constructorDecl.parameters.map(p => {
            const paramSymbol = checker.getSymbolAtLocation(p.name);
            const paramType = checker.getTypeAtLocation(p);
            return {
                name: p.name.getText(),
                type: checker.typeToString(paramType, p, ts.TypeFormatFlags.NoTruncation),
                description: paramSymbol ? ts.displayPartsToString(paramSymbol.getDocumentationComment(checker)).trim() : '',
                optional: !!p.questionToken || !!p.initializer,
            };
        });

        if (params.length > 0) {
            members.unshift({
                name: 'constructor',
                kind: 'constructor',
                description: '',
                params,
            });
        }
    }

    return members;
}

function getFunctionParams(symbol) {
    const decl = symbol.declarations?.[0];
    if (!decl) return [];

    try {
        const type = checker.getTypeOfSymbolAtLocation(symbol, decl);
        const signatures = type.getCallSignatures();
        if (signatures.length === 0) return [];

        const sig = signatures[0];
        return sig.getParameters().map(p => {
            const pDecl = p.declarations?.[0] || decl;
            const pType = checker.getTypeOfSymbolAtLocation(p, pDecl);
            return {
                name: p.name,
                type: checker.typeToString(pType, pDecl, ts.TypeFormatFlags.NoTruncation),
                description: ts.displayPartsToString(p.getDocumentationComment(checker)).trim(),
                optional: !!(p.flags & ts.SymbolFlags.Optional),
            };
        });
    } catch {
        return [];
    }
}

function getFunctionReturnType(symbol) {
    const decl = symbol.declarations?.[0];
    if (!decl) return '';

    try {
        const type = checker.getTypeOfSymbolAtLocation(symbol, decl);
        const signatures = type.getCallSignatures();
        if (signatures.length === 0) return '';

        const returnType = signatures[0].getReturnType();
        return checker.typeToString(returnType, decl, ts.TypeFormatFlags.NoTruncation);
    } catch {
        return '';
    }
}

function getInterfaceMembers(symbol) {
    const decl = symbol.declarations?.[0];
    if (!decl || !ts.isInterfaceDeclaration(decl)) return [];

    const members = [];
    const type = checker.getDeclaredTypeOfSymbol(symbol);

    for (const prop of type.getProperties()) {
        const propDecl = prop.declarations?.[0];
        if (!propDecl) continue;

        let typeStr = '';
        try {
            const propType = checker.getTypeOfSymbolAtLocation(prop, propDecl);
            typeStr = checker.typeToString(propType, propDecl, ts.TypeFormatFlags.NoTruncation);
        } catch { /* */ }

        const isOptional = !!(prop.flags & ts.SymbolFlags.Optional);

        members.push({
            name: prop.name,
            type: typeStr,
            description: ts.displayPartsToString(prop.getDocumentationComment(checker)).trim(),
            optional: isOptional || undefined,
        });
    }

    return members;
}

function resolveSourceGroup(symbol, pkgDir) {
    const decl = symbol.declarations?.[0];
    if (!decl) return 'other';

    const sourceFile = decl.getSourceFile();
    const filePath = sourceFile.fileName;
    const srcDir = path.resolve(rootDir, 'packages', pkgDir, 'src');
    const relative = path.relative(srcDir, filePath);
    const parts = relative.split(path.sep);

    if (parts.length > 1) {
        return parts[0];
    }

    return path.basename(relative, '.ts');
}

function extractPackageAPI(entryFile, pkgDir) {
    const sourceFile = program.getSourceFile(entryFile);
    if (!sourceFile) {
        console.warn(`Could not find source file: ${entryFile}`);
        return {};
    }

    const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
    if (!moduleSymbol) {
        console.warn(`Could not get module symbol for: ${entryFile}`);
        return {};
    }

    const exports = checker.getExportsOfModule(moduleSymbol);
    const groups = {};

    for (const sym of exports) {
        const resolved = sym.flags & ts.SymbolFlags.Alias
            ? checker.getAliasedSymbol(sym)
            : sym;

        const kind = getSymbolKind(resolved);
        if (kind === 'unknown') continue;

        const group = resolveSourceGroup(resolved, pkgDir);

        if (!groups[group]) {
            groups[group] = [];
        }

        const entry = {
            name: sym.name,
            kind,
            description: getJSDoc(resolved),
            typeSignature: getTypeString(resolved),
            tags: getJSDocTags(resolved),
        };

        if (kind === 'function') {
            entry.params = getFunctionParams(resolved);
            entry.returnType = getFunctionReturnType(resolved);
        }

        if (kind === 'class') {
            entry.members = getClassMembers(resolved);
        }

        if (kind === 'interface') {
            entry.properties = getInterfaceMembers(resolved);
        }

        groups[group].push(entry);
    }

    return groups;
}

for (const pkg of PACKAGES) {
    const entryFile = path.resolve(rootDir, 'packages', pkg.dir, 'src/index.ts');
    console.warn(`Extracting API for ${pkg.name}...`);

    const groups = extractPackageAPI(entryFile, pkg.dir);

    const outputFile = path.resolve(outputDir, `${pkg.dir}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(groups, null, 2) + '\n');
    console.warn(`  → ${Object.keys(groups).length} groups, ${Object.values(groups).flat().length} symbols → ${path.relative(rootDir, outputFile)}`);
}

console.warn('API extraction complete.');
