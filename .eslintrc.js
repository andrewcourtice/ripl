const INDENT = 4;

module.exports = {
    root: true,
    parserOptions: {
        parser: '@typescript-eslint/parser',
        sourceType: 'module',
        lib: [
            'DOM',
            'DOM.Iterable',
            'ESNext',
            'WebWorker',
            'WebWorker.ImportScripts',
        ],
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    env: {
        'es2021': true,
        'browser': true,
        'node': true,
        'jest': true,
        'worker': true,
        'shared-node-browser': true,
    },
    rules: {

        // Disabled rules that conflict with TS rules
        // See @typescript-eslint/indent below
        // https://github.com/eslint/eslint/issues/13956
        'indent': 'off',

        // Base rules
        'eqeqeq': 'error',
        'key-spacing': 'error',
        'keyword-spacing': 'error',
        'no-alert': 'error',
        'no-multi-assign': 'error',
        'no-multi-spaces': 'error',
        'no-nested-ternary': 'error',
        'no-return-await': 'error', // https://jakearchibald.com/2017/await-vs-return-vs-return-await/
        'no-throw-literal': 'error',
        'no-trailing-spaces': 'error',
        'no-unneeded-ternary': 'error',
        'no-useless-rename': 'error',
        'no-useless-return': 'error',
        'no-var': 'error',
        'no-whitespace-before-property': 'error',
        'object-property-newline': 'error',
        'prefer-exponentiation-operator': 'error',
        'space-infix-ops': 'error',

        'array-bracket-newline': ['error', 'consistent'],
        'brace-style': ['error', '1tbs'],
        'linebreak-style': ['error', 'unix'],
        'object-curly-spacing': ['error', 'always'],
        'semi': ['error', 'always'],

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
            ],
        }],

        'comma-dangle': ['error', {
            'arrays': 'always-multiline',
            'objects': 'always-multiline',
            'imports': 'always-multiline',
            'exports': 'always-multiline',
            'functions': 'never',
        }],

        'no-console': ['error', {
            'allow': [
                'warn',
                'error',
            ],
        }],

        'object-curly-newline': ['error', {
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

        'prefer-const': ['error', {
            'destructuring': 'all',
        }],

        'quotes': ['error', 'single', {
            'avoidEscape': true,
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

        // Typescript specific rules
        '@typescript-eslint/indent': ['error', INDENT],
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-inferrable-types': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-empty-function': 'warn',
        '@typescript-eslint/member-delimiter-style': 'error',

    },
};