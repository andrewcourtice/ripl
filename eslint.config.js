import {
    fileURLToPath,
} from 'node:url';

import {
    includeIgnoreFile,
} from '@eslint/compat';

import eslint from '@eslint/js';

import markdown from '@eslint/markdown';

import tseslint from 'typescript-eslint';

import stylistic from '@stylistic/eslint-plugin';

import vue from 'eslint-plugin-vue';

import globals from 'globals';

import vueParser from 'vue-eslint-parser';

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url));

const INDENT = 4;

/**
 * Enforce the canonical import/export grouping: statements of the same *kind*
 * may sit directly adjacent when that kind is groupable — consecutive
 * side-effect imports (`import 'x'`), consecutive default imports, consecutive
 * namespace imports, and consecutive `export * from` re-exports — while any two
 * adjacent import/export statements of *different* kinds (and every braced
 * `import { … }` / `import type { … }` / `export { … }`) must be separated by a
 * blank line.
 *
 * The rule only ever *inserts* a blank line between statements that stay exactly
 * where they are — it never reorders, sorts, merges or removes anything, so it
 * cannot change module load order or introduce circular dependencies.
 */
const GROUPABLE_KINDS = new Set([
    'side-effect',
    'default',
    'namespace',
    'export-star',
]);

/** Classifies a top-level statement into an import/export grouping kind, or `null` when out of scope. */
function importExportKind(node) {
    if (node.type === 'ImportDeclaration') {
        const { specifiers } = node;

        if (!specifiers.length) {
            return 'side-effect';
        }

        if (specifiers.some(specifier => specifier.type === 'ImportSpecifier')) {
            return 'named';
        }

        if (specifiers.some(specifier => specifier.type === 'ImportNamespaceSpecifier')) {
            return 'namespace';
        }

        return 'default';
    }

    if (node.type === 'ExportAllDeclaration') {
        return 'export-star';
    }

    // `export { … }` / `export { … } from '…'` — braced re-exports (never a declaration export).
    if (node.type === 'ExportNamedDeclaration' && !node.declaration && node.specifiers.length) {
        return 'export-named';
    }

    return null;
}

const importExportSpacing = {
    meta: {
        type: 'layout',
        fixable: 'whitespace',
        schema: [],
        messages: {
            missingBlank: 'Imports/exports of different kinds must be separated by a blank line; only consecutive same-kind side-effect, default, namespace, or `export *` statements may be grouped.',
        },
    },
    create(context) {
        const sourceCode = context.sourceCode ?? context.getSourceCode();

        return {
            Program(program) {
                const { body } = program;

                for (let i = 1; i < body.length; i++) {
                    const prev = body[i - 1];
                    const next = body[i];

                    const prevKind = importExportKind(prev);
                    const nextKind = importExportKind(next);

                    if (!prevKind || !nextKind) {
                        continue;
                    }

                    // Same groupable kind may abut; everything else needs a blank line.
                    if (prevKind === nextKind && GROUPABLE_KINDS.has(prevKind)) {
                        continue;
                    }

                    // A blank line exists when a whitespace-only source line sits between the two
                    // statements; a bare comment line does not count as blank.
                    let hasBlankLine = false;

                    for (let line = prev.loc.end.line + 1; line < next.loc.start.line; line++) {
                        if (sourceCode.lines[line - 1].trim() === '') {
                            hasBlankLine = true;
                            break;
                        }
                    }

                    if (!hasBlankLine) {
                        context.report({
                            node: next,
                            messageId: 'missingBlank',
                            fix: fixer => fixer.insertTextAfter(prev, '\n'),
                        });
                    }
                }
            },
        };
    },
};

const riplPlugin = {
    rules: {
        'import-export-spacing': importExportSpacing,
    },
};

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    includeIgnoreFile(gitignorePath),
    {
        name: 'ripl/main',
        plugins: {
            '@stylistic': stylistic,
            'ripl': riplPlugin,
        },
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2021,
                ...globals.worker,
            },
        },
        rules: {
            // Base rules
            'eqeqeq': 'error',
            'no-alert': 'error',
            'no-multi-assign': 'error',
            'no-nested-ternary': 'error',
            'no-return-await': 'off', // Deprecated in ESLint v8.46+, replaced by @typescript-eslint/return-await
            'no-throw-literal': 'error',
            'no-unneeded-ternary': 'error',
            'no-useless-rename': 'error',
            'no-useless-return': 'error',
            'no-var': 'error',
            'prefer-exponentiation-operator': 'error',
            'no-else-return': 'error',
            'no-lonely-if': 'error',
            'max-depth': ['error', 4],
            'max-nested-callbacks': ['error', 4],

            'camelcase': ['warn', { // remove when API changes to camelcase
                'properties': 'never',
                'ignoreDestructuring': true,
            }],

            'id-length': ['error', {
                'min': 2,
                'exceptions': [
                    '_',
                    'i',
                    'j',
                    'k',
                    'x',
                    'y',
                    // Color components (RGB, HSL, HSV)
                    'r',
                    'g',
                    'b',
                    'h',
                    's',
                    'l',
                    'v',
                    // Math/algorithm variables
                    'a',
                    'c',
                    'd',
                    'm',
                    'n',
                    'p',
                    'q',
                    't',
                    'w',
                    'z',
                ],
            }],

            'no-console': ['error', {
                'allow': [
                    'warn',
                    'error',
                ],
            }],

            'prefer-const': ['error', {
                'destructuring': 'all',
            }],

            'sort-imports': ['error', {
                'ignoreCase': true,
                'ignoreDeclarationSort': true,
                'ignoreMemberSort': false,
                'allowSeparatedGroups': true,
                'memberSyntaxSortOrder': [
                    'none',
                    'all',
                    'single',
                    'multiple',
                ],
            }],

            // Stylistic rules (moved from deprecated ESLint/TypeScript-ESLint formatting rules)
            '@stylistic/indent': ['error', INDENT],
            '@stylistic/key-spacing': 'error',
            '@stylistic/keyword-spacing': 'error',
            '@stylistic/no-multi-spaces': 'error',
            '@stylistic/no-trailing-spaces': 'error',
            '@stylistic/no-whitespace-before-property': 'error',
            '@stylistic/object-property-newline': 'error',
            '@stylistic/space-infix-ops': 'error',
            '@stylistic/array-bracket-newline': ['error', 'consistent'],
            '@stylistic/brace-style': ['error', '1tbs'],
            '@stylistic/linebreak-style': ['error', 'unix'],
            '@stylistic/object-curly-spacing': ['error', 'always'],
            '@stylistic/semi': ['error', 'always'],
            '@stylistic/comma-dangle': ['error', {
                'arrays': 'always-multiline',
                'objects': 'always-multiline',
                'imports': 'always-multiline',
                'exports': 'always-multiline',
                'functions': 'never',
            }],
            '@stylistic/object-curly-newline': ['error', {
                'ObjectExpression': {
                    'minProperties': 2,
                    'multiline': true,
                    'consistent': true,
                },
                'ImportDeclaration': 'always',
                'ExportDeclaration': {
                    'minProperties': 2,
                },
            }],
            '@stylistic/quotes': ['error', 'single', {
                'avoidEscape': true,
            }],
            '@stylistic/member-delimiter-style': 'error',
            'ripl/import-export-spacing': 'error',

            // Typescript specific rules
            '@typescript-eslint/explicit-member-accessibility': ['warn', {
                'accessibility': 'explicit',
                'overrides': {
                    'constructors': 'no-public',
                },
            }],
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-inferrable-types': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-empty-function': 'warn',
            // Allow `_`-prefixed arguments (and caught errors) that are intentionally unused — e.g. a
            // base hook whose default ignores a parameter that overrides consume. Unused local
            // variables are still reported (delete them rather than prefixing).
            '@typescript-eslint/no-unused-vars': ['error', {
                'argsIgnorePattern': '^_',
                'caughtErrorsIgnorePattern': '^_',
            }],
            // Enforce `import type` for type-only imports so the codebase stays compatible with
            // `verbatimModuleSyntax` and the future TypeScript 7 compiler.
            '@typescript-eslint/consistent-type-imports': ['error', {
                'prefer': 'type-imports',
                'fixStyle': 'separate-type-imports',
            }],
        },
    },

    // Relax nesting rules for test files (describe > describe > test > callback is standard)
    {
        name: 'ripl/tests',
        files: ['**/test/**/*.ts', '**/*.test.ts', '**/*.bench.ts', 'packages/test-utils/**/*.ts'],
        rules: {
            'max-nested-callbacks': ['error', 6],
            // Test doubles, spies and edge-case casts legitimately use empty
            // callbacks, `any`, and un-annotated members.
            '@typescript-eslint/no-empty-function': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/explicit-member-accessibility': 'off',
        },
    },

    // Build/tooling scripts may log progress to the console.
    {
        name: 'ripl/scripts',
        files: ['apps/website/scripts/**/*.mjs', 'apps/website/scripts/**/*.js'],
        rules: {
            'no-console': 'off',
        },
    },

    // Lint fenced code blocks in markdown files
    {
        name: 'ripl/markdown',
        files: ['**/*.md'],
        plugins: {
            markdown,
        },
        processor: 'markdown/markdown',
    },
    {
        name: 'ripl/markdown-code-blocks',
        files: ['**/*.md/*.ts', '**/*.md/*.js'],
        plugins: {
            '@stylistic': stylistic,
            'ripl': riplPlugin,
        },
        rules: {
            'no-console': 'off',
            'no-undef': 'off',
            'no-unused-vars': 'off',
            'no-unused-expressions': 'off',
            // Documentation snippets favor compact, illustrative code over
            // production-strictness rules, so relax those for fenced code blocks.
            'id-length': 'off',
            'no-multi-assign': 'off',
            '@stylistic/object-property-newline': 'off',
            '@stylistic/no-multi-spaces': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-unused-expressions': 'off',
            '@typescript-eslint/no-require-imports': 'off',
            '@typescript-eslint/no-empty-function': 'off',
            '@typescript-eslint/explicit-member-accessibility': 'off',
            '@stylistic/indent': ['error', INDENT],
            '@stylistic/semi': ['error', 'always'],
            '@stylistic/quotes': ['error', 'single', { 'avoidEscape': true }],
            '@stylistic/comma-dangle': ['error', {
                'arrays': 'always-multiline',
                'objects': 'always-multiline',
                'imports': 'always-multiline',
                'exports': 'always-multiline',
                'functions': 'never',
            }],
            '@stylistic/object-curly-spacing': ['error', 'always'],
            '@stylistic/object-curly-newline': ['error', {
                'ImportDeclaration': 'always',
            }],
            'ripl/import-export-spacing': 'error',
        },
    },

    // Lint <script> blocks in VitePress markdown files
    {
        name: 'ripl/vue-markdown',
        files: ['apps/website/**/*.md'],
        plugins: {
            vue,
            'ripl': riplPlugin,
        },
        languageOptions: {
            parser: vueParser,
            parserOptions: {
                parser: tseslint.parser,
                ecmaVersion: 2021,
                sourceType: 'module',
                extraFileExtensions: ['.md'],
            },
        },
        rules: {
            // Relax rules that don't apply in doc script blocks
            'no-console': 'off',
            'no-undef': 'off',
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-explicit-any': 'off',

            // Enforce stylistic rules
            '@stylistic/indent': ['error', INDENT],
            '@stylistic/semi': ['error', 'always'],
            '@stylistic/quotes': ['error', 'single', { 'avoidEscape': true }],
            '@stylistic/comma-dangle': ['error', {
                'arrays': 'always-multiline',
                'objects': 'always-multiline',
                'imports': 'always-multiline',
                'exports': 'always-multiline',
                'functions': 'never',
            }],
            '@stylistic/object-curly-spacing': ['error', 'always'],
            '@stylistic/object-curly-newline': ['error', {
                'ImportDeclaration': 'always',
            }],
            'ripl/import-export-spacing': 'error',
        },
    },

    // Lint <script> blocks in Vue single-file components (demos + app SFCs)
    {
        name: 'ripl/vue-sfc',
        files: ['**/*.vue'],
        plugins: {
            vue,
            'ripl': riplPlugin,
        },
        languageOptions: {
            parser: vueParser,
            parserOptions: {
                parser: tseslint.parser,
                ecmaVersion: 2021,
                sourceType: 'module',
                extraFileExtensions: ['.vue'],
            },
        },
        rules: {
            // Relax rules that don't apply cleanly to SFC <script setup> (template-only refs, auto-imports)
            'no-console': 'off',
            'no-undef': 'off',
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-explicit-any': 'off',

            // Enforce stylistic rules
            '@stylistic/indent': ['error', INDENT],
            '@stylistic/semi': ['error', 'always'],
            '@stylistic/quotes': ['error', 'single', { 'avoidEscape': true }],
            '@stylistic/comma-dangle': ['error', {
                'arrays': 'always-multiline',
                'objects': 'always-multiline',
                'imports': 'always-multiline',
                'exports': 'always-multiline',
                'functions': 'never',
            }],
            '@stylistic/object-curly-spacing': ['error', 'always'],
            '@stylistic/object-curly-newline': ['error', {
                'ObjectExpression': {
                    'minProperties': 2,
                    'multiline': true,
                    'consistent': true,
                },
                'ImportDeclaration': 'always',
                'ExportDeclaration': {
                    'minProperties': 2,
                },
            }],
            '@stylistic/member-delimiter-style': 'error',
            'ripl/import-export-spacing': 'error',

            // SFC block order: <template> first, then <script>, then <style>.
            'vue/block-order': ['error', {
                order: ['template', 'script', 'style'],
            }],
        },
    },

    // Playground examples run inside the docs editor with `context`, `scene` and
    // `renderer` injected into scope, so treat them as read-only globals.
    {
        name: 'ripl/playground-examples',
        files: ['apps/website/src/.vitepress/components/playground/examples/**/*.js'],
        languageOptions: {
            globals: {
                context: 'readonly',
                scene: 'readonly',
                renderer: 'readonly',
            },
        },
    },

    // Prefer keyed object-lookup dispatch over `switch` in library and extension
    // source (see AGENTS.md → Control Flow). The docs site under `apps/website/` is exempt.
    {
        name: 'ripl/no-switch',
        files: ['packages/*/src/**/*.ts', 'apps/*/src/**/*.ts', 'apps/*/src/**/*.vue'],
        ignores: ['apps/website/**'],
        rules: {
            'no-restricted-syntax': ['error', {
                selector: 'SwitchStatement',
                message: 'Use a keyed object-lookup dispatch instead of switch (see AGENTS.md → Control Flow).',
            }],
        },
    }
);
