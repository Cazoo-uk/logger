module.exports = {
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: [
        'plugin:@typescript-eslint/recommended',
        'prettier',
    ],
    parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 2018,
        sourceType: 'module',
    },
    rules: {
        // Special ESLint rules or overrides go here.
    },
    ignorePatterns: ['test/'],
}
