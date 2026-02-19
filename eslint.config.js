import {
    fileURLToPath,
} from 'node:url';

import {
    includeIgnoreFile,
} from '@eslint/compat';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';
import globals from 'globals';

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url));

const INDENT = 4;

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    includeIgnoreFile(gitignorePath),
    {
        name: 'ripl/main',
        plugins: {
            '@stylistic': stylistic,
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

            'camelcase': ['warn', { // remove when API changes to camelcase
                'properties': 'never',
                'ignoreDestructuring': true,
            }],

            'id-length': ['error', {
                'min': 2,
                'exceptions': [
                    '_',
                    'i',
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

            // Typescript specific rules
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-inferrable-types': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-empty-function': 'warn',
        },
    }
);
