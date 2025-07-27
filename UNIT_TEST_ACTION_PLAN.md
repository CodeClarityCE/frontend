# Frontend Unit Test Action Plan

## Current State Summary

- **Total Test Files**: 136 (51 failed, 85 passed)
- **Total Tests**: 2788 (394 failed, 2394 passed)
- **Error Count**: 135 errors
- **Success Rate**: 85.8% (tests), 62.5% (files)

## Major Issues Identified

### 1. Plugin Already Applied Warnings
Multiple Vue warnings about "Plugin has already been applied to target app" affecting:
- VulnList component tests
- VulnTable component tests
- PatchingPatches component tests
- Other Vue components

### 2. Store Import/Mock Issues
- `useProjectsMainStore` is not a function in ProjectsListHeader tests
- Missing or improperly mocked store dependencies

### 3. Performance Test Failures
- DataTable performance tests failing due to render times exceeding budgets:
  - Small datasets: 93.91ms (expected < 33ms)
  - Medium datasets: 79.08ms (expected < 33ms)
  - Large datasets: marked as "poor" performance
  - Sorting performance: 32.59ms (expected < 20ms)

### 4. Component Rendering Issues
- ProjectsView component failing to render expected content
- Invalid prop warnings (e.g., TreeChart with undefined id)
- Unhandled errors during render/update cycles

### 5. Test Environment Issues
- Memory leaks in some components
- Timeout issues in async tests
- MSW (Mock Service Worker) handler warnings

## Action Plan

### Phase 1: Fix Critical Infrastructure Issues (Priority: High)

#### 1.1 Fix Vue Plugin Multiple Registration
- [ ] Review test setup files and ensure plugins are only registered once
- [ ] Create a shared test setup configuration
- [ ] Update vitest configuration to use proper setup files

#### 1.2 Fix Store Mocking Issues
- [ ] Create proper store mocks for all Pinia stores
- [ ] Ensure consistent store mocking across all test files
- [ ] Update import paths and mock configurations

#### 1.3 Update Test Environment Configuration
- [ ] Review and update vitest.config.ts
- [ ] Ensure proper jsdom environment setup
- [ ] Configure proper test globals and mocks

### Phase 2: Fix Component-Specific Issues (Priority: Medium)

#### 2.1 Fix Failing Component Tests
- [ ] ProjectsView: Fix rendering and prop handling
- [ ] ProjectsListHeader: Fix store dependencies
- [ ] TreeChart: Handle undefined props gracefully
- [ ] VulnList/VulnTable: Fix plugin registration issues

#### 2.2 Update Component Props and Validation
- [ ] Add proper prop validation and defaults
- [ ] Handle edge cases (undefined, null values)
- [ ] Update test assertions to match actual component behavior

### Phase 3: Performance Optimization (Priority: Medium)

#### 3.1 Optimize DataTable Component
- [ ] Implement virtualization for large datasets
- [ ] Add memoization for expensive computations
- [ ] Optimize sorting and filtering algorithms
- [ ] Update performance test thresholds to realistic values

#### 3.2 General Performance Improvements
- [ ] Review and optimize component render cycles
- [ ] Implement lazy loading where appropriate
- [ ] Add performance monitoring to CI pipeline

### Phase 4: Test Quality Improvements (Priority: Low)

#### 4.1 Improve Test Coverage
- [ ] Add missing unit tests for uncovered components
- [ ] Increase branch coverage for critical paths
- [ ] Add edge case testing

#### 4.2 Test Maintenance
- [ ] Remove deprecated test patterns
- [ ] Update to latest testing library best practices
- [ ] Document testing conventions and patterns

## Implementation Steps

### Week 1: Critical Fixes
1. Fix Vue plugin registration issues
2. Create comprehensive store mocks
3. Update test configuration files
4. Fix top 10 failing test files

### Week 2: Component Fixes
1. Fix remaining component test failures
2. Update prop validations
3. Handle edge cases properly
4. Ensure all unit tests pass

### Week 3: Performance & Quality
1. Optimize slow components
2. Update performance benchmarks
3. Add missing test coverage
4. Documentation and cleanup

## Success Metrics

- [ ] 100% of unit tests passing
- [ ] No Vue warnings in test output
- [ ] All performance tests within budget
- [ ] Test execution time < 30 seconds
- [ ] Zero flaky tests

## Resources Needed

- Vue Test Utils documentation review
- Vitest configuration optimization
- Performance profiling tools
- Team code review for major changes

## Risk Mitigation

- Create feature branches for each phase
- Run tests in CI before merging
- Keep old tests as reference during migration
- Document all breaking changes

## Next Steps

1. Start with Phase 1.1 - Fix Vue plugin registration
2. Create a test utilities directory for shared mocks
3. Set up daily test run monitoring
4. Schedule weekly progress reviews