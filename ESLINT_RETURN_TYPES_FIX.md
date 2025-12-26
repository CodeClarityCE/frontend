# ESLint Return Type Fixes - Progress Report

## Summary

This document tracks the progress of fixing all `@typescript-eslint/explicit-function-return-type` warnings in the frontend codebase.

## Current Status

- **Total Warnings Remaining**: 344
- **Files Fixed**: 10+ files
- **Estimated Files Remaining**: 100+

## Files Already Fixed

### Completed Fixes

1. ✅ `/src/base_components/data-display/charts/radarChart.ts` (4 warnings)
   - Fixed D3 callback functions with `this` context typing
   - Added return types to all internal functions

2. ✅ `/src/base_components/layout/ExpandableBox.vue` (1 warning)
   - Fixed `expandBox()` function with `: void` return type

3. ✅ `/src/base_components/ui/loaders/LoadingButton.vue` (3 warnings)
   - Fixed `setLoading()`, `setDisabled()`, and `toggle()` functions

4. ✅ `/src/codeclarity_components/analyses/create/AnalysisCreate.vue` (9 warnings)
   - Fixed all async functions with `: Promise<void>`
   - Fixed all sync functions with `: void`
   - Functions: `getProject`, `fetchAvailableAnalyzers`, `onSubmit`, `getAnalyzer`, `onSubmitSBOM`, `validateAllConfigurations`, `applyConfigSilently`, `showFinalConfigurationToast`, `createAnalysisStart`

5. ✅ `/src/codeclarity_components/analyses/create/components/ScheduleSelector.vue` (7 warnings)
   - Fixed all helper functions with appropriate return types
   - Functions: `initializeSchedule`, `updateScheduleData`, `updateScheduleType`, `setDate`, `setTime`, `updateDateTimeIfComplete`, `confirmDateTime`

6. ✅ `/src/codeclarity_components/analyses/create/components/SelectVulnerabilityPolicy.vue` (1 warning)
   - Fixed `fetchVulnerabilityPolicies()` with `: Promise<void>`

7. ✅ `/src/codeclarity_components/authentication/email/ConfirmRegistration.vue` (1 warning)
   - Fixed `init()` function with `: Promise<void>`

8. ✅ `/src/codeclarity_components/authentication/password_reset/PasswordResetRequestForm.vue` (1 warning)
   - Fixed `submit()` function with `: Promise<void>`

9. ✅ `/src/codeclarity_components/authentication/oauth/OAuth2Callback.vue` (1 warning)
   - Fixed `finalizeAutentication()` with `: Promise<void>`

10. ✅ `/src/codeclarity_components/dashboard/composables/useMockData.ts` (1 warning)
    - Added complete return type definition for exported composable

11. ✅ `/src/codeclarity_components/dashboard/composables/useDashboardData.ts` (2 warnings)
    - Added complete return type definition for exported composable
    - Fixed `loadDashboardData()` with `: Promise<void>`

## Common Fix Patterns

### Pattern 1: Simple void functions
```typescript
// Before
function myFunction() {
    // do something
}

// After
function myFunction(): void {
    // do something
}
```

### Pattern 2: Async functions
```typescript
// Before
async function fetchData() {
    await someAsyncCall();
}

// After
async function fetchData(): Promise<void> {
    await someAsyncCall();
}
```

### Pattern 3: Arrow functions
```typescript
// Before
const handler = () => {
    doSomething();
};

// After
const handler = (): void => {
    doSomething();
};
```

### Pattern 4: D3 callbacks with `this` context
```typescript
// Before
.on('click', function() {
    d3.select(this).style('fill', 'red');
})

// After
.on('click', function(this: SVGElement): void {
    d3.select(this).style('fill', 'red');
})
```

### Pattern 5: Functions returning values
```typescript
// Before
function calculateTotal() {
    return items.reduce((sum, item) => sum + item.price, 0);
}

// After
function calculateTotal(): number {
    return items.reduce((sum, item) => sum + item.price, 0);
}
```

### Pattern 6: Composables with complex return types
```typescript
// Before
export function useMyComposable() {
    const data = ref<string>('');
    async function load() { ... }
    return { data, load };
}

// After
export function useMyComposable(): {
    data: Ref<string>;
    load: () => Promise<void>;
} {
    const data = ref<string>('');
    async function load(): Promise<void> { ... }
    return { data, load };
}
```

## Remaining Work

### Files Needing Fixes (Partial List)

The following files still have `explicit-function-return-type` warnings:

#### Vue Components
- `/src/base_components/filters/UtilitiesFilters.vue`
- `/src/base_components/ui/modals/PositionedModal.vue`
- `/src/codeclarity_components/authentication/email/PasswordResetForm.vue`
- `/src/codeclarity_components/authentication/signin/UserAuthForm.vue`
- `/src/codeclarity_components/authentication/signup/SignupForm.vue`
- `/src/codeclarity_components/authentication/signup/SocialSetup.vue`
- `/src/codeclarity_components/dashboard/charts/ExposureOverview.vue`
- `/src/codeclarity_components/header/components/UserNav.vue`
- `/src/codeclarity_components/organizations/analyzers/AnalyzerCreate.vue`
- `/src/codeclarity_components/organizations/analyzers/AnalyzerEdit.vue`
- `/src/codeclarity_components/organizations/analyzers/AnalyzersList.vue`
- `/src/codeclarity_components/organizations/analyzers/shared/AnalyzerFormFields.vue`
- `/src/codeclarity_components/organizations/analyzers/shared/WorkflowDesigner.vue`
- And many more...

#### TypeScript Files
- `/src/codeclarity_components/analyses/analysis.repository.ts`
- `/src/codeclarity_components/organizations/analyzers/Analyzer.ts`
- `/src/codeclarity_components/organizations/analyzers/AnalyzerTemplatesRepository.ts`
- `/src/codeclarity_components/organizations/analyzers/create_analyzer.http.ts`
- `/src/codeclarity_components/organizations/analyzers/shared/analyzerUtils.ts`
- `/src/codeclarity_components/organizations/organization.entity.ts`
- `/src/codeclarity_components/organizations/policy/create/create_policy.http.ts`
- `/src/codeclarity_components/organizations/policy/license/columns.ts`
- `/src/codeclarity_components/organizations/policy/vulnerability/useVulnerabilityPolicyActions.ts`
- `/src/codeclarity_components/results/graph.entity.ts`
- `/src/codeclarity_components/results/patching/Patching.ts`
- `/src/codeclarity_components/results/results.repository.ts`
- `/src/codeclarity_components/results/sbom/exports/sbomExportUtils.ts`
- `/src/codeclarity_components/results/sbom/table/columns.ts`
- `/src/codeclarity_components/results/sbom/utils/packageManagerUtils.ts`
- `/src/codeclarity_components/results/vulnerabilities/VulnDetails/VulnDetails.types.ts`
- `/src/codeclarity_components/results/vulnerabilities/VulnStats.ts`
- And more...

#### Test Files
- `/tests/setup.ts`
- `/tests/test-utils/setup.ts`
- `/tests/utils/accessibility-utils.ts`
- `/tests/utils/component-mocks.ts`
- `/tests/utils/performance-utils.ts`
- `/tests/utils/test-analytics.ts`
- `/tests/utils/test-utils.ts`
- `/tests/utils/visual-utils.ts`

## Recommended Approach to Complete

### Method 1: Manual File-by-File (Safest)

1. Get list of files with warnings:
   ```bash
   yarn lint 2>&1 | grep "explicit-function-return-type" | awk '{print $1}' | cut -d':' -f1-2 | sort -u
   ```

2. For each file:
   - Read the file to understand function signatures
   - Add appropriate return types based on function behavior
   - Use patterns documented above
   - Run lint to verify

### Method 2: Automated with TypeScript Compiler API (Recommended for Large Scale)

Create a TypeScript script using the compiler API to:
1. Parse each file's AST
2. Find function declarations without return types
3. Infer return type from function body
4. Add explicit return type annotation

### Method 3: IDE Assistance

If using VSCode with TypeScript:
1. Open file with warning
2. Cursor on function declaration
3. Use "Quick Fix" (Cmd/Ctrl + .)
4. Select "Infer return type"

### Method 4: Batch Fix with eslint --fix (Limited)

Some cases can be auto-fixed:
```bash
yarn lint --fix
```

However, this ESLint rule doesn't have an auto-fixer, so manual intervention is required.

## Testing After Fixes

After adding return types, verify:

1. **Lint passes**:
   ```bash
   yarn lint
   ```

2. **Types are correct**:
   ```bash
   yarn type-check
   ```

3. **Build succeeds**:
   ```bash
   yarn build
   ```

4. **Tests pass**:
   ```bash
   yarn test:unit
   ```

## Notes

- Most functions in this codebase are either `: void` or `: Promise<void>`
- Event handlers and callbacks typically return `: void`
- Async functions always return `: Promise<T>` where T is the resolved type
- Composables should have fully typed return objects
- D3 callbacks often need `this` context typing

## Progress Tracking

To track progress, run:
```bash
# Count remaining warnings
yarn lint 2>&1 | grep "explicit-function-return-type" | wc -l

# Get unique files with warnings
yarn lint 2>&1 | grep "explicit-function-return-type" | awk '{print $1}' | cut -d':' -f1 | sort -u | wc -l
```

## Completion Checklist

- [ ] Fix all Vue component warnings
- [ ] Fix all TypeScript utility file warnings
- [ ] Fix all test file warnings
- [ ] Run final lint verification
- [ ] Run type-check
- [ ] Run build
- [ ] Run all tests
- [ ] Commit changes

## Last Updated

Date: 2025-12-12
Warnings Remaining: 344
Files Fixed: 11
