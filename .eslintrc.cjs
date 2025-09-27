module.exports = {
	root: true,
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:svelte/recommended',
		'prettier'
	],
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2020,
		extraFileExtensions: ['.svelte']
	},
	overrides: [
		{
			files: ['*.svelte'],
			parser: 'svelte-eslint-parser',
			parserOptions: {
				parser: {
					// Specify a parser for each lang.
					ts: '@typescript-eslint/parser',
					js: 'espree',
					typescript: '@typescript-eslint/parser'
				}
			}
		},
		{
			// Apply to all test files. Proper type checking in tests with mocks can be tedious and counterproductive.
			files: ['**/*.test.ts', '**/*.spec.ts'],
			rules: {
				'@typescript-eslint/no-explicit-any': 'off'
			}
		}
	],
	env: {
		browser: true,
		es2017: true,
		node: true
	},
	rules: {
		'no-undef': 'off',
		// no-undef has been turned off because of this:
		// basically, it causes issues and TS does those checks so it's redundant
		// https://typescript-eslint.io/linting/troubleshooting#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors

		// Enforce Svelte 5 syntax and best practices
		'svelte/valid-compile': 'error', // Catches mixed event handler syntax
		'svelte/no-immutable-reactive-statements': 'warn', // Flags $: statements that don't reference reactive values
		'svelte/no-reactive-functions': 'warn', // Flags functions defined in reactive statements (should use $derived)
		'svelte/no-reactive-literals': 'warn', // Flags literal values in reactive statements
		'svelte/require-store-reactive-access': 'error', // Enforces $ prefix for store access
		'svelte/prefer-destructured-store-props': 'warn', // Encourages destructuring store values

		// Encourage modern Svelte patterns
		'svelte/no-unused-svelte-ignore': 'warn',
		'svelte/no-useless-mustaches': 'warn',
		'svelte/shorthand-attribute': 'warn',
		'svelte/shorthand-directive': 'warn'
	}
};
