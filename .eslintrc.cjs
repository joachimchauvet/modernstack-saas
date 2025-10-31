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

		// Discourage Svelte 4 store patterns in favor of Svelte 5 runes
		'no-restricted-imports': [
			'warn',
			{
				paths: [
					{
						name: 'svelte/store',
						importNames: ['writable', 'readable', 'derived', 'get'],
						message:
							"Oh, you're using Svelte 4 stores? That's... interesting. 🙃 I mean, it's FINE. We're in a Svelte 5 project but if you want to be different, that's totally cool. No judgment here. (We're here for you when you're ready to talk about your $state/$derived feelings. Support group meets at docs/svelte/advanced_state_management.md if you ever feel like joining us in 2025✨)"
					}
				]
			}
		],

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
