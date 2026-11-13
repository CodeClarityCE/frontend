import eslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginVue from "eslint-plugin-vue";
import globals from "globals";
import typescriptEslint from "typescript-eslint";
import security from "eslint-plugin-security";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import testingLibrary from "eslint-plugin-testing-library";

import designSystem from "./eslint-rules/design-system.js";
import designSystemAllowlist from "./eslint-rules/design-system-allowlist.json" with { type: "json" };

/** @type {import('eslint').Linter.Config[]} */
export default typescriptEslint.config(
  // ==========================================
  // Ignore Patterns
  // ==========================================
  {
    ignores: [
      "**/*.d.ts",
      "**/coverage",
      "**/dist",
      "**/shadcn",
      "**/cypress",
      "**/e2e/**",
      "**/node_modules/**",
      "**/.pnpm-store/**",
      "**/public/**",
      "**/*.cjs",
      "**/*.mjs",
      "*.config.*",
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
    files: ["**/*.{ts,vue}"],
    extends: [
      ...typescriptEslint.configs.recommendedTypeChecked,
      ...typescriptEslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
      parserOptions: {
        parser: typescriptEslint.parser,
        tsconfigRootDir: import.meta.dirname,
        project: [
          "./tsconfig.app.json",
          "./tsconfig.node.json",
          "./tsconfig.vitest.json",
        ],
        extraFileExtensions: [".vue"],
      },
    },
  },

  // ==========================================
  // Vue Configuration
  // ==========================================
  ...eslintPluginVue.configs["flat/recommended"],

  // ==========================================
  // Security Plugin
  // ==========================================
  security.configs.recommended,

  // ==========================================
  // Main Rules Configuration
  // ==========================================
  {
    files: ["**/*.{ts,vue}"],

    plugins: {
      "simple-import-sort": simpleImportSort,
    },

    rules: {
      // ==========================================
      // TypeScript Rules - Strictness
      // ==========================================

      // Warn on 'any' instead of disabling completely
      "@typescript-eslint/no-explicit-any": ["warn"],

      // Downgrade unsafe-* rules to warnings since they're symptoms of 'any' usage
      "@typescript-eslint/no-unsafe-member-access": ["warn"],
      "@typescript-eslint/no-unsafe-assignment": ["warn"],
      "@typescript-eslint/no-unsafe-argument": ["warn"],
      "@typescript-eslint/no-unsafe-call": ["warn"],
      "@typescript-eslint/no-unsafe-return": ["warn"],
      "@typescript-eslint/no-unsafe-enum-comparison": ["warn"],

      // Allow empty interfaces (common in Vue/TypeScript patterns)
      "@typescript-eslint/no-empty-object-type": ["off"],
      "@typescript-eslint/no-empty-interface": ["off"],

      // Support both _ and ___ prefixes for intentionally unused
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_+",
          varsIgnorePattern: "^_+",
          caughtErrorsIgnorePattern: "^_+",
          destructuredArrayIgnorePattern: "^_+",
          ignoreRestSiblings: true,
        },
      ],

      // Require explicit return types on exported functions
      "@typescript-eslint/explicit-function-return-type": [
        "warn",
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
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
          disallowTypeAnnotations: false,
        },
      ],

      // Prevent floating promises (critical for async code)
      "@typescript-eslint/no-floating-promises": ["warn"],

      // Disable require-await (many functions return Promise for API consistency)
      "@typescript-eslint/require-await": ["off"],

      // Prefer nullish coalescing (?? instead of ||)
      "@typescript-eslint/prefer-nullish-coalescing": ["warn"],

      // Prefer optional chaining (?.)
      "@typescript-eslint/prefer-optional-chain": ["warn"],

      // Prefer for-of loops (stylistic preference)
      "@typescript-eslint/prefer-for-of": ["warn"],

      // Allow empty constructors (common in dependency injection)
      "@typescript-eslint/no-empty-function": ["warn"],

      // No misused promises
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: false,
        },
      ],

      // Ban // @ts-ignore comments
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-expect-error": "allow-with-description",
          "ts-ignore": true,
          "ts-nocheck": true,
          "ts-check": false,
          minimumDescriptionLength: 10,
        },
      ],

      // Naming conventions
      "@typescript-eslint/naming-convention": [
        "warn",
        {
          selector: "interface",
          format: ["PascalCase"],
        },
        {
          selector: "class",
          format: ["PascalCase"],
        },
        {
          selector: "typeAlias",
          format: ["PascalCase"],
        },
        {
          selector: "enum",
          format: ["PascalCase"],
        },
        {
          selector: "enumMember",
          format: ["UPPER_CASE", "PascalCase"],
        },
      ],

      // Restrict template expressions (allow complex types in templates)
      "@typescript-eslint/restrict-template-expressions": ["warn"],

      // ==========================================
      // General JavaScript Rules
      // ==========================================

      // Enforce === instead of ==
      eqeqeq: ["error", "always", { null: "ignore" }],

      // No var, use const/let
      "no-var": ["error"],

      // Prefer const when variable is never reassigned
      "prefer-const": ["error"],

      // No console.log in production code (use proper logging instead)
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // Prevent infinite loops
      "no-constant-condition": ["error"],

      // No duplicate imports
      "no-duplicate-imports": ["error"],

      // Require default case in switch or comment
      "default-case": ["warn"],

      // Enforce return in array methods
      "array-callback-return": ["error"],

      // Prefer template literals over string concatenation
      "prefer-template": ["warn"],

      // No nested ternary operators (hard to read)
      "no-nested-ternary": ["warn"],

      // ==========================================
      // Security Rules (Built-in)
      // ==========================================

      // No eval
      "no-eval": ["error"],

      // No implied eval
      "no-implied-eval": ["error"],

      // No script URLs
      "no-script-url": ["error"],

      // No new Function()
      "no-new-func": ["error"],

      // Disable object injection warning - too many false positives with TypeScript
      "security/detect-object-injection": ["off"],

      // ==========================================
      // Code Quality & Complexity
      // ==========================================

      // Warn on high complexity
      complexity: ["warn", { max: 30 }],

      // Max nested callbacks
      "max-nested-callbacks": ["warn", { max: 4 }],

      // Max depth of nested blocks
      "max-depth": ["warn", { max: 4 }],

      // Max parameters in function
      "max-params": ["warn", { max: 12 }],

      // ==========================================
      // Import Rules
      // ==========================================

      "no-duplicate-imports": ["error"],

      // Use simple-import-sort for reliable import ordering
      // Groups: polyfills first, then external packages, then @/ internal imports, then relative imports
      "simple-import-sort/imports": [
        "warn",
        {
          groups: [
            // Side-effect polyfills that must load first (e.g., reflect-metadata)
            // \u0000 prefix matches side-effect imports (no specifiers)
            ["^\\u0000reflect-metadata"],
            // External packages (npm modules)
            ["^@?\\w"],
            // Internal @/ imports
            ["^@/"],
            // Parent imports (..)
            ["^\\.\\."],
            // Sibling imports (./)
            ["^\\./"],
            // Side-effect imports (css, etc.) - at the end
            ["^\\u0000"],
          ],
        },
      ],
      "simple-import-sort/exports": "warn",
    },
  },

  // ==========================================
  // Test Files Configuration
  // ==========================================
  {
    files: ["**/*.spec.ts", "**/*.test.ts", "**/test/**/*.ts"],
    rules: {
      // More lenient rules for test files
      "@typescript-eslint/no-explicit-any": ["off"],
      "@typescript-eslint/no-unsafe-assignment": ["off"],
      "@typescript-eslint/no-unsafe-member-access": ["off"],
      "@typescript-eslint/no-unsafe-call": ["off"],
      "@typescript-eslint/no-unsafe-return": ["off"],
      "@typescript-eslint/no-unsafe-argument": ["off"],
      "@typescript-eslint/explicit-function-return-type": ["off"],
      "@typescript-eslint/unbound-method": ["off"],
      "@typescript-eslint/no-empty-function": ["off"],
      "@typescript-eslint/dot-notation": ["off"],
      "@typescript-eslint/no-floating-promises": ["off"],
      "no-console": ["off"],
      complexity: ["off"],
      "max-nested-callbacks": ["off"],
      "max-params": ["off"],

      // Vue test overrides
      "vue/multi-word-component-names": "off",
      "vue/no-reserved-component-names": "off",
      "vue/one-component-per-file": "off",
      "vue/require-prop-types": "off",
    },
  },

  // ==========================================
  // Testing Library Configuration
  // ==========================================
  {
    files: ["**/*.spec.ts", "**/*.test.ts", "**/tests/**/*.ts"],
    ...testingLibrary.configs["flat/vue"],
    rules: {
      // Relax rules that conflict with Vue testing patterns
      // Vue tests often need DOM access to verify parent-child relationships
      "testing-library/no-node-access": "off",
      "testing-library/no-container": "off",
      // Allow common naming patterns for render results in Vue tests
      "testing-library/render-result-naming-convention": "off",
    },
  },

  // ==========================================
  // Design System Guardrail
  // ==========================================
  // Bans raw colours, stray icon sets and removed components. Allowlisted files only ever leave the list.
  {
    files: ["src/**/*.{js,ts,vue}"],
    ignores: ["**/*.spec.ts", "**/*.test.ts", "**/__tests__/**"],
    plugins: {
      local: { rules: { "design-system": designSystem } },
    },
    rules: {
      "local/design-system": [
        "error",
        {
          root: import.meta.dirname,
          allowlist: designSystemAllowlist,
          logoIconSets: ["simple-icons", "devicon"],
          // Add { name, path } here when a home-grown component is replaced.
          removedComponents: [
            {
              name: "InfoCard",
              path: "src/base_components/ui/cards/InfoCard.vue",
            },
            {
              name: "StatCard",
              path: "src/base_components/ui/cards/StatCard.vue",
            },
            {
              name: "BoxLoader",
              path: "src/base_components/ui/loaders/BoxLoader.vue",
            },
            {
              name: "PageHeader",
              path: "src/base_components/layout/PageHeader.vue",
            },
            {
              name: "BubbleComponent",
              path: "src/base_components/data-display/bubbles/BubbleComponent.vue",
            },
            {
              name: "SeverityBubble",
              path: "src/base_components/data-display/bubbles/SeverityBubble.vue",
            },
            {
              name: "LineChart",
              path: "src/base_components/data-display/charts/LineChart.vue",
            },
            {
              name: "RadarChart",
              path: "src/base_components/data-display/charts/RadarChart.vue",
            },
            {
              name: "WaffleChart",
              path: "src/base_components/data-display/charts/WaffleChart.vue",
            },
            {
              name: "HeaderComponent",
              path: "src/codeclarity_components/header/HeaderComponent.vue",
            },
            {
              name: "MainNav",
              path: "src/codeclarity_components/header/components/MainNav.vue",
            },
            {
              name: "SearchHeader",
              path: "src/codeclarity_components/header/components/SearchHeader.vue",
            },
            {
              name: "TeamSwitcher",
              path: "src/codeclarity_components/header/components/TeamSwitcher.vue",
            },
            {
              name: "UserNav",
              path: "src/codeclarity_components/header/components/UserNav.vue",
            },
            {
              name: "LanguageBadge",
              path: "src/base_components/ui/LanguageBadge.vue",
            },
            {
              name: "VerticalCard",
              path: "src/base_components/ui/cards/VerticalCard.vue",
            },
            {
              name: "LoadingContainer",
              path: "src/base_components/ui/loaders/LoadingContainer.vue",
            },
            {
              name: "FaqBox",
              path: "src/base_components/layout/FaqBox.vue",
            },
            {
              name: "LoadingButton",
              path: "src/base_components/ui/loaders/LoadingButton.vue",
            },
            {
              name: "LoadingSubmitButton",
              path: "src/base_components/ui/loaders/LoadingSubmitButton.vue",
            },
            {
              name: "FormTextField",
              path: "src/base_components/forms/FormTextField.vue",
            },
            {
              name: "BarChart",
              path: "src/base_components/data-display/charts/BarChart.vue",
            },
            {
              name: "DoughnutChart",
              path: "src/base_components/data-display/charts/DoughnutChart.vue",
            },
            {
              name: "GroupedBarChart",
              path: "src/base_components/data-display/charts/GroupedBarChart.vue",
            },
            {
              name: "TreeChart",
              path: "src/base_components/data-display/charts/TreeChart.vue",
            },
            {
              name: "TreeChartLegend",
              path: "src/base_components/data-display/charts/TreeChartLegend.vue",
            },
            {
              name: "PatchingSummary",
              path: "src/codeclarity_components/results/patching/PatchingSummary.vue",
            },
            {
              name: "SbomImportPaths",
              path: "src/codeclarity_components/results/sbom/SbomDetails/SbomImportPaths.vue",
            },
            {
              name: "ComposerDependencyTree",
              path: "src/codeclarity_components/results/sbom/ComposerDependencyTree.vue",
            },
            {
              name: "DataTable",
              path: "src/codeclarity_components/results/sbom/table/DataTable.vue",
            },
            {
              name: "DataTableDropDown",
              path: "src/codeclarity_components/results/sbom/table/DataTableDropDown.vue",
            },
            {
              name: "SortSelector",
              path: "src/base_components/data-display/tables/SortSelector.vue",
            },
            {
              name: "SortableTable",
              path: "src/base_components/data-display/tables/SortableTable.vue",
            },
            {
              name: "ActiveFilterBar",
              path: "src/base_components/filters/ActiveFilterBar.vue",
            },
            {
              name: "SearchBar",
              path: "src/base_components/filters/SearchBar.vue",
            },
            {
              name: "UtilitiesFilters",
              path: "src/base_components/filters/UtilitiesFilters.vue",
            },
            {
              name: "FormInlineCheckboxField",
              path: "src/base_components/forms/FormInlineCheckboxField.vue",
            },
            {
              name: "FormSelectField",
              path: "src/base_components/forms/FormSelectField.vue",
            },
            {
              name: "FormSelectLicense",
              path: "src/base_components/forms/FormSelectLicense.vue",
            },
            {
              name: "ExpandableBox",
              path: "src/base_components/layout/ExpandableBox.vue",
            },
            {
              name: "DonutLoader",
              path: "src/base_components/ui/loaders/DonutLoader.vue",
            },
            {
              name: "LoadingComponent",
              path: "src/base_components/ui/loaders/LoadingComponent.vue",
            },
            {
              name: "TextLoader",
              path: "src/base_components/ui/loaders/TextLoader.vue",
            },
            {
              name: "CenteredModal",
              path: "src/base_components/ui/modals/CenteredModal.vue",
            },
            {
              name: "PositionedModal",
              path: "src/base_components/ui/modals/PositionedModal.vue",
            },
            {
              name: "ErrorComponent",
              path: "src/base_components/utilities/ErrorComponent.vue",
            },
            {
              name: "PaginationComponent",
              path: "src/base_components/utilities/PaginationComponent.vue",
            },
            {
              name: "SemverToString",
              path: "src/base_components/utilities/SemverToString.vue",
            },
            {
              name: "UtilitiesSort",
              path: "src/base_components/utilities/UtilitiesSort.vue",
            },
            {
              name: "AnalyzerComp",
              path: "src/codeclarity_components/analyses/create/components/AnalyzerComp.vue",
            },
            {
              name: "DashboardFooter",
              path: "src/codeclarity_components/dashboard/layout/DashboardFooter.vue",
            },
            {
              name: "InviteItem",
              path: "src/codeclarity_components/organizations/invites/invite/InviteItem.vue",
            },
            {
              name: "ListItem",
              path: "src/codeclarity_components/organizations/list/ListItem.vue",
            },
            {
              name: "MemberItem",
              path: "src/codeclarity_components/organizations/members/members/MemberItem.vue",
            },
            {
              name: "VulnerabilityPoliciesView",
              path: "src/codeclarity_components/organizations/policy/VulnerabilityPoliciesView.vue",
            },
            {
              name: "DataTable",
              path: "src/codeclarity_components/organizations/policy/create/DataTable.vue",
            },
            {
              name: "PolicyCreate",
              path: "src/codeclarity_components/organizations/policy/create/PolicyCreate.vue",
            },
            {
              name: "PolicyEdit",
              path: "src/codeclarity_components/organizations/policy/edit/PolicyEdit.vue",
            },
            {
              name: "LicensePolicyDataTable",
              path: "src/codeclarity_components/organizations/policy/license/LicensePolicyDataTable.vue",
            },
            {
              name: "VulnerabilityDataTable",
              path: "src/codeclarity_components/organizations/policy/vulnerability/VulnerabilityDataTable.vue",
            },
            {
              name: "VulnerabilityPolicyCreate",
              path: "src/codeclarity_components/organizations/policy/vulnerability/VulnerabilityPolicyCreate.vue",
            },
            {
              name: "VulnerabilityPolicyEdit",
              path: "src/codeclarity_components/organizations/policy/vulnerability/VulnerabilityPolicyEdit.vue",
            },
            {
              name: "AnalysisItem",
              path: "src/codeclarity_components/projects/list/components/AnalysisItem.vue",
            },
            {
              name: "AnalysisList",
              path: "src/codeclarity_components/projects/list/components/AnalysisList.vue",
            },
            {
              name: "AnalysisListImproved",
              path: "src/codeclarity_components/projects/list/components/AnalysisListImproved.vue",
            },
            {
              name: "NoProjects",
              path: "src/codeclarity_components/projects/list/components/NoProjects.vue",
            },
            {
              name: "ProjectItem",
              path: "src/codeclarity_components/projects/list/components/ProjectItem.vue",
            },
            {
              name: "ProjectItemImproved",
              path: "src/codeclarity_components/projects/list/components/ProjectItemImproved.vue",
            },
            {
              name: "ProjectsList",
              path: "src/codeclarity_components/projects/list/components/ProjectsList.vue",
            },
            {
              name: "ProjectsListHeader",
              path: "src/codeclarity_components/projects/list/components/ProjectsListHeader.vue",
            },
            {
              name: "VulnsGraph",
              path: "src/codeclarity_components/results/vulnerabilities/graphs/VulnsGraph.vue",
            },
            {
              name: "BulletLegend",
              path: "src/codeclarity_components/results/vulnerabilities/graphs/components/BulletLegend.vue",
            },
            {
              name: "OwaspTopTen",
              path: "src/codeclarity_components/results/vulnerabilities/graphs/components/OwaspTopTen.vue",
            },
            {
              name: "SecurityImpact",
              path: "src/codeclarity_components/results/vulnerabilities/graphs/components/SecurityImpact.vue",
            },
            {
              name: "VulnerabilitiesInfo",
              path: "src/codeclarity_components/results/vulnerabilities/graphs/components/VulnerabilitiesInfo.vue",
            },
            {
              name: "OrgAuditLogItem",
              path: "src/enterprise_components/activity_logs/audit/OrgAuditLogItem.vue",
            },
          ],
        },
      ],
    },
  },

  // ==========================================
  // Prettier (must be last)
  // ==========================================
  eslintConfigPrettier,
);
