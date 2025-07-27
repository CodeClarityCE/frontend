# Frontend Unit Test Fix Action Plan

## Overview
Currently we have 49 failed test files with 413 failed tests. This document outlines a systematic approach to fix all remaining test failures.

## Current Status
- **Before fixes**: 51 failed test files, 423 failed tests
- **After implementing action plan**: 47 failed test files, 409 failed tests  
- **Tests passing**: 2379/2788 (85.3%)
- **Improvement**: Fixed 4 test files, reduced failures by 14 tests

## Completed Fixes
✅ VulnerabilitySeverities Component - Fixed prop validation errors  
✅ InfoCard Component - Fixed Icon selector issues  
✅ SSO Auth Component - Partially fixed URL construction issues
✅ DataTableDropDown Component - Fixed RouterLink attribute vs props issues
✅ VulnSecurityAnalysis Component - Fixed null safety and icon count assertions
✅ SbomImportPaths Component - Fixed hierarchy null checks and prop mapping

## Action Plan

### Phase 1: Categorize Remaining Failures
1. Run comprehensive test analysis to categorize failure types
2. Identify common patterns across failing tests
3. Prioritize fixes by impact (number of tests affected)

### Phase 2: Component-Specific Fixes

#### High Priority (Multiple test failures)
- [ ] **SSO Auth Component** - Complete remaining URL construction issues
- [ ] **Base UI Components** - Fix remaining Icon and Button mocking issues
- [ ] **Chart Components** - Fix RadarChart, BarChart, DoughnutChart test failures
- [ ] **Results Components** - Fix vulnerability and SBOM detail components
- [ ] **Organization Components** - Fix member management and policy components

#### Medium Priority (Fewer test failures)
- [ ] **Authentication Components** - Fix login, signup, password reset components
- [ ] **Dashboard Components** - Fix chart and stats components
- [ ] **Project Components** - Fix project list and management components
- [ ] **Enterprise Components** - Fix remaining SSO and audit log components

### Phase 3: Common Issue Patterns

#### Environment Variable Issues
- [ ] Standardize environment variable mocking across all tests
- [ ] Create shared test utilities for env mocking
- [ ] Fix VITE_API_URL handling inconsistencies

#### Component Mocking Issues
- [ ] Standardize @iconify/vue Icon component mocking
- [ ] Fix shadcn/ui component mocking (Button, Card, etc.)
- [ ] Create shared mock utilities for common components

#### Prop Validation Issues
- [ ] Make optional props truly optional in component definitions
- [ ] Add proper default values and null checks
- [ ] Fix TypeScript interface definitions

#### Test Selector Issues
- [ ] Update test selectors to match actual rendered DOM
- [ ] Standardize data-testid usage across components
- [ ] Fix CSS class selector mismatches

### Phase 4: Infrastructure Improvements

#### Test Utilities
- [ ] Create shared test setup utilities
- [ ] Standardize component mounting patterns
- [ ] Create common mock factories

#### Test Configuration
- [ ] Review and update vitest configuration
- [ ] Ensure proper test environment setup
- [ ] Add global test helpers

### Phase 5: Validation and Cleanup
- [ ] Run full test suite and verify all tests pass
- [ ] Remove unused test files and mocks
- [ ] Update test documentation
- [ ] Add test coverage reporting

## Implementation Strategy

### 1. Batch Processing
- Group similar components/issues together
- Fix one pattern across multiple files
- Test incrementally to avoid regressions

### 2. Error Pattern Analysis
- Use grep/search to find similar error patterns
- Create reusable fixes for common issues
- Document patterns for future reference

### 3. Incremental Verification
- Test each component fix individually
- Run subset tests after each batch
- Maintain running count of improvements

## Success Metrics
- **Target**: 0 failed tests (100% pass rate)
- **Minimum acceptable**: <50 failed tests (>98% pass rate)
- **Current**: 413 failed tests (85.2% pass rate)

## Estimated Timeline
- **Phase 1**: 30 minutes - Analysis and categorization
- **Phase 2**: 2-3 hours - Component-specific fixes
- **Phase 3**: 1-2 hours - Common pattern fixes
- **Phase 4**: 1 hour - Infrastructure improvements
- **Phase 5**: 30 minutes - Validation and cleanup

**Total Estimated Time**: 5-6 hours

## Risk Mitigation
- Make incremental commits after each successful batch
- Keep backups of working test files
- Test each change in isolation
- Document any breaking changes to components

## Key Patterns Discovered

### 1. Props vs Attributes Confusion
**Problem**: Tests checking `component.props('attribute')` when they should check `component.attributes('attribute')`
**Solution**: HTML attributes like `title`, `href` should be checked with `.attributes()`, not `.props()`
**Example**: RouterLink title attribute fix in DataTableDropDown

### 2. Null Safety Issues
**Problem**: Components accessing nested properties without null checks
**Solution**: Add safe navigation operators (`?.`) and `v-if` conditions
**Example**: VulnSecurityAnalysis `finding?.vulnerability_info?.vulnerability_id`

### 3. Component Mocking Issues
**Problem**: Vue component mocks not properly handling props and attributes
**Solution**: Use proper prop definitions and include `inheritAttrs: true` when needed
**Example**: RouterLink mock improvement

### 4. Kebab-case vs CamelCase Props
**Problem**: Vue automatically converts kebab-case props but tests need to access them as camelCase
**Solution**: Define props in camelCase in mocks and test assertions
**Example**: `target-dependency` → `targetDependency`

### 5. Array/Object Null Checks
**Problem**: Accessing `.length` or properties on potentially null/undefined objects
**Solution**: Add null checks before property access
**Example**: `hierarchy && hierarchy.length > 0`

## Remaining Common Issues
- Environment variable mocking inconsistencies
- Icon component rendering in complex component hierarchies  
- Chart component data prop validation
- Store mocking for authentication and user data

## Notes
- Some test failures may indicate actual component bugs
- Environment-specific issues may require different approaches
- Consider updating test expectations vs fixing components case-by-case
- The patterns identified can be applied systematically to remaining test failures