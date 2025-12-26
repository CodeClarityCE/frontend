import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import pluginCypress from 'eslint-plugin-cypress/flat';
import eslintPluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import typescriptEslint from 'typescript-eslint';
import security from 'eslint-plugin-security';
import importPlugin from 'eslint-plugin-import';
import testingLibrary from 'eslint-plugin-testing-library';

/** @type {import('eslint').Linter.Config[]} */
export default typescriptEslint.config(
  // ==========================================
  // Ignore Patterns
  // ==========================================
  {
    ignores: [
      '**/*.d.ts',
      '**/coverage',
      '**/dist',
      '**/shadcn',
      '**/.yarn',
      '**/cypress',
      '.pnp.*',
      '**/node_modules/**',
      '**/public/**',
      '**/*.cjs',
      '**/*.mjs',
      '*.config.*',
    ],
  },

  // ==========================================
  // Base JavaScript Configuration (non-type-checked)
  // ==========================================
  eslint.configs.recommended,

  // ==========================================
  // TypeScript Type-Checked Configuration
  // ==========================================
  {
    files: ['**/*.{ts,vue}'],
    extends: [
      ...typescriptEslint.configs.recommendedTypeChecked,
      ...typescriptEslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        parser: typescriptEslint.parser,
        tsconfigRootDir: import.meta.dirname,
        project: ['./tsconfig.app.json', './tsconfig.node.json', './tsconfig.vitest.json'],
        extraFileExtensions: ['.vue'],
      },
    },
  },

  // ==========================================
  // Vue Configuration
  // ==========================================
  ...eslintPluginVue.configs['flat/recommended'],

  // ==========================================
  // Security Plugin
  // ==========================================
  security.configs.recommended,

  // ==========================================
  // Main Rules Configuration
  // ==========================================
  {
    files: ['**/*.{ts,vue}'],

    plugins: {
      import: importPlugin,
    },

    settings: {
      // Explicitly mark src/** as internal modules for import/order
      'import/internal-regex': '^@/',
    },

    rules: {
      // ==========================================
      // TypeScript Rules - Strictness
      // ==========================================

      // Warn on 'any' instead of disabling completely
      '@typescript-eslint/no-explicit-any': ['warn'],

      // Downgrade unsafe-* rules to warnings since they're symptoms of 'any' usage
      '@typescript-eslint/no-unsafe-member-access': ['warn'],
      '@typescript-eslint/no-unsafe-assignment': ['warn'],
      '@typescript-eslint/no-unsafe-argument': ['warn'],
      '@typescript-eslint/no-unsafe-call': ['warn'],
      '@typescript-eslint/no-unsafe-return': ['warn'],
      '@typescript-eslint/no-unsafe-enum-comparison': ['warn'],

      // Allow empty interfaces (common in Vue/TypeScript patterns)
      '@typescript-eslint/no-empty-object-type': ['off'],
      '@typescript-eslint/no-empty-interface': ['off'],

      // Support both _ and ___ prefixes for intentionally unused
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_+',
          varsIgnorePattern: '^_+',
          caughtErrorsIgnorePattern: '^_+',
          destructuredArrayIgnorePattern: '^_+',
          ignoreRestSiblings: true,
        },
      ],

      // Require explicit return types on exported functions
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowDirectConstAssertionInArrowFunctions: true,
          allowConciseArrowFunctionExpressionsStartingWithVoid: true,
        },
      ],

      // ==========================================
      // TypeScript Rules - Code Quality
      // ==========================================

      // Enforce consistent type imports (helps with tree-shaking)
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
          disallowTypeAnnotations: false,
        },
      ],

      // Prevent floating promises (critical for async code)
      '@typescript-eslint/no-floating-promises': ['warn'],

      // Disable require-await (many functions return Promise for API consistency)
      '@typescript-eslint/require-await': ['off'],

      // Prefer nullish coalescing (?? instead of ||)
      '@typescript-eslint/prefer-nullish-coalescing': ['warn'],

      // Prefer optional chaining (?.)
      '@typescript-eslint/prefer-optional-chain': ['warn'],

      // Prefer for-of loops (stylistic preference)
      '@typescript-eslint/prefer-for-of': ['warn'],

      // Allow empty constructors (common in dependency injection)
      '@typescript-eslint/no-empty-function': ['warn'],

      // No misused promises
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: false,
        },
      ],

      // Ban // @ts-ignore comments
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': true,
          'ts-nocheck': true,
          'ts-check': false,
          minimumDescriptionLength: 10,
        },
      ],

      // Naming conventions
      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: 'interface',
          format: ['PascalCase'],
        },
        {
          selector: 'class',
          format: ['PascalCase'],
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase'],
        },
        {
          selector: 'enum',
          format: ['PascalCase'],
        },
        {
          selector: 'enumMember',
          format: ['UPPER_CASE', 'PascalCase'],
        },
      ],

      // Restrict template expressions (allow complex types in templates)
      '@typescript-eslint/restrict-template-expressions': ['warn'],

      // ==========================================
      // General JavaScript Rules
      // ==========================================

      // Enforce === instead of ==
      eqeqeq: ['error', 'always', { null: 'ignore' }],

      // No var, use const/let
      'no-var': ['error'],

      // Prefer const when variable is never reassigned
      'prefer-const': ['error'],

      // No console.log in production code (use proper logging instead)
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Prevent infinite loops
      'no-constant-condition': ['error'],

      // No duplicate imports
      'no-duplicate-imports': ['error'],

      // Require default case in switch or comment
      'default-case': ['warn'],

      // Enforce return in array methods
      'array-callback-return': ['error'],

      // Prefer template literals over string concatenation
      'prefer-template': ['warn'],

      // No nested ternary operators (hard to read)
      'no-nested-ternary': ['warn'],

      // ==========================================
      // Security Rules (Built-in)
      // ==========================================

      // No eval
      'no-eval': ['error'],

      // No implied eval
      'no-implied-eval': ['error'],

      // No script URLs
      'no-script-url': ['error'],

      // No new Function()
      'no-new-func': ['error'],

      // Disable object injection warning - too many false positives with TypeScript
      'security/detect-object-injection': ['off'],

      // ==========================================
      // Code Quality & Complexity
      // ==========================================

      // Warn on high complexity
      complexity: ['warn', { max: 30 }],

      // Max nested callbacks
      'max-nested-callbacks': ['warn', { max: 4 }],

      // Max depth of nested blocks
      'max-depth': ['warn', { max: 4 }],

      // Max parameters in function
      'max-params': ['warn', { max: 12 }],

      // ==========================================
      // Import Rules
      // ==========================================

      'import/no-unresolved': 'off', // TypeScript handles this
      'import/no-duplicates': ['error'],
      'import/order': [
        'warn',
        {
          groups: [
            'builtin', // Node.js built-in modules
            'external', // npm packages
            'internal', // Internal modules (@/*)
            'parent', // Parent directories (../)
            'sibling', // Same directory (./)
            'index', // Index files
          ],
          'newlines-between': 'never',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
  },

  // ==========================================
  // Test Files Configuration
  // ==========================================
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/test/**/*.ts'],
    rules: {
      // More lenient rules for test files
      '@typescript-eslint/no-explicit-any': ['off'],
      '@typescript-eslint/no-unsafe-assignment': ['off'],
      '@typescript-eslint/no-unsafe-member-access': ['off'],
      '@typescript-eslint/no-unsafe-call': ['off'],
      '@typescript-eslint/no-unsafe-return': ['off'],
      '@typescript-eslint/no-unsafe-argument': ['off'],
      '@typescript-eslint/explicit-function-return-type': ['off'],
      '@typescript-eslint/unbound-method': ['off'],
      '@typescript-eslint/no-empty-function': ['off'],
      '@typescript-eslint/dot-notation': ['off'],
      '@typescript-eslint/no-floating-promises': ['off'],
      'no-console': ['off'],
      complexity: ['off'],
      'max-nested-callbacks': ['off'],
      'max-params': ['off'],

      // Vue test overrides
      'vue/multi-word-component-names': 'off',
      'vue/no-reserved-component-names': 'off',
      'vue/one-component-per-file': 'off',
      'vue/require-prop-types': 'off',
    },
  },

  // ==========================================
  // Cypress Configuration
  // ==========================================
  {
    files: ['cypress/**/*.{js,ts}'],
    ...pluginCypress.configs.recommended,
  },

  // ==========================================
  // Testing Library Configuration
  // ==========================================
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/tests/**/*.ts'],
    ...testingLibrary.configs['flat/vue'],
    rules: {
      // Relax rules that conflict with Vue testing patterns
      // Vue tests often need DOM access to verify parent-child relationships
      'testing-library/no-node-access': 'off',
      'testing-library/no-container': 'off',
      // Allow common naming patterns for render results in Vue tests
      'testing-library/render-result-naming-convention': 'off',
    },
  },

  // ==========================================
  // Prettier (must be last)
  // ==========================================
  eslintConfigPrettier
);
