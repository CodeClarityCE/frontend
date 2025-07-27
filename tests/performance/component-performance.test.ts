import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { 
  measureComponentPerformance, 
  measureUpdatePerformance,
  stressTestComponent,
  detectMemoryLeaks,
  PerformanceTestSuite,
  PERFORMANCE_BENCHMARKS,
  FPSMonitor,
  RerenderCounter
} from '../utils/performance-utils';
// import { createTestWrapper } from '../utils/test-utils';

// Import components to test
import DataTable from '@/codeclarity_components/results/sbom/table/DataTable.vue';
import SearchBar from '@/base_components/filters/SearchBar.vue';
import UserAuthForm from '@/codeclarity_components/authentication/signin/UserAuthForm.vue';

describe.skip('Component Performance Tests', () => {
  let performanceSuite: PerformanceTestSuite;

  beforeEach(() => {
    performanceSuite = new PerformanceTestSuite();
  });

  describe('SearchBar Performance', () => {
    it('should render within performance budget', async () => {
      const metrics = await measureComponentPerformance(() => {
        return mount(SearchBar, {
          props: {
            placeholder: 'Search...'
          },
          global: {
            stubs: {
              Icon: true
            }
          }
        });
      });

      expect(metrics.renderTime).toBeLessThan(PERFORMANCE_BENCHMARKS.renderTime.good);
      expect(metrics.mountTime).toBeLessThan(PERFORMANCE_BENCHMARKS.mountTime.good);
    });

    it('should handle rapid typing efficiently', async () => {
      const wrapper = mount(SearchBar, {
        props: {
          placeholder: 'Search...'
        },
        global: {
          stubs: {
            Icon: true
          }
        }
      });

      const input = wrapper.find('input');
      
      const updateTime = await measureUpdatePerformance(
        wrapper,
        async () => {
          // Simulate rapid typing
          await input.setValue('t');
          await input.setValue('te');
          await input.setValue('tes');
          await input.setValue('test');
        }
      );

      expect(updateTime).toBeLessThan(PERFORMANCE_BENCHMARKS.updateTime.good);

      wrapper.unmount();
    });

    it('should not have memory leaks during intensive usage', async () => {
      const leakTest = await detectMemoryLeaks(() => {
        const wrapper = mount(SearchBar, {
          props: {
            placeholder: 'Search...'
          },
          global: {
            stubs: {
              Icon: true
            }
          }
        });

        // Simulate user interaction
        const input = wrapper.find('input');
        input.setValue('test search');
        input.trigger('input');

        return wrapper;
      }, 15);

      expect(leakTest.hasLeak).toBe(false);
      
      // Memory growth should be minimal (< 1MB)
      expect(leakTest.memoryGrowth).toBeLessThan(1024 * 1024);
    });

    it('should maintain FPS during animations', async () => {
      const wrapper = mount(SearchBar, {
        props: {
          placeholder: 'Search with animations...'
        },
        global: {
          stubs: {
            Icon: true
          }
        }
      });

      const fpsMonitor = new FPSMonitor();
      fpsMonitor.start();

      const input = wrapper.find('input');
      
      // Simulate user interactions that might trigger animations
      for (let i = 0; i < 10; i++) {
        await input.trigger('focus');
        await input.setValue(`search ${i}`);
        await input.trigger('blur');
        await new Promise(resolve => setTimeout(resolve, 16)); // ~60fps
      }

      const averageFPS = fpsMonitor.stop();
      
      // Should maintain at least 30 FPS
      expect(averageFPS).toBeGreaterThan(30);

      wrapper.unmount();
    });
  });

  describe('DataTable Performance', () => {
    const createMockData = (count: number) => 
      Array.from({ length: count }, (_, i) => ({
        id: `item-${i}`,
        name: `Item ${i}`,
        version: `1.0.${i}`,
        license: 'MIT',
        severity: ['low', 'medium', 'high', 'critical'][i % 4]
      }));

    const mockColumns = [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'version', header: 'Version' },
      { accessorKey: 'license', header: 'License' },
      { accessorKey: 'severity', header: 'Severity' }
    ];

    it('should handle small datasets efficiently', async () => {
      await performanceSuite.runTest('DataTable', 'Small Dataset (10 items)', () => {
        return mount(DataTable, {
          props: {
            columns: mockColumns,
            data: createMockData(10)
          },
          global: {
            stubs: {
              Icon: true,
              FlexRender: { template: '<div><slot /></div>' }
            }
          }
        });
      });

      const report = performanceSuite.generateReport();
      const test = report.results.find(r => r.test === 'Small Dataset (10 items)');
      
      expect(test?.passed).toBe(true);
      expect(test?.metrics.renderTime).toBeLessThan(PERFORMANCE_BENCHMARKS.renderTime.good);
    });

    it('should handle medium datasets with acceptable performance', async () => {
      await performanceSuite.runTest('DataTable', 'Medium Dataset (100 items)', () => {
        return mount(DataTable, {
          props: {
            columns: mockColumns,
            data: createMockData(100)
          },
          global: {
            stubs: {
              Icon: true,
              FlexRender: { template: '<div><slot /></div>' }
            }
          }
        });
      });

      const report = performanceSuite.generateReport();
      const test = report.results.find(r => r.test === 'Medium Dataset (100 items)');
      
      expect(test?.passed).toBe(true);
      expect(test?.metrics.renderTime).toBeLessThan(PERFORMANCE_BENCHMARKS.renderTime.good);
    });

    it('should perform stress test with large datasets', async () => {
      const stressResults = await stressTestComponent(
        (dataSize) => mount(DataTable, {
          props: {
            columns: mockColumns,
            data: createMockData(dataSize)
          },
          global: {
            stubs: {
              Icon: true,
              FlexRender: { template: '<div><slot /></div>' }
            }
          }
        }),
        [10, 50, 100, 500] // Test up to 500 items
      );

      // All small to medium datasets should perform well
      const smallDatasets = stressResults.filter(r => r.dataSize <= 100);
      smallDatasets.forEach(result => {
        expect(result.rating).not.toBe('poor');
      });

      // Large datasets should still be usable
      const largeDatasets = stressResults.filter(r => r.dataSize > 100);
      largeDatasets.forEach(result => {
        expect(result.metrics.renderTime).toBeLessThan(1000); // Max 1 second
      });
    });

    it('should handle sorting performance', async () => {
      const wrapper = mount(DataTable, {
        props: {
          columns: mockColumns,
          data: createMockData(200)
        },
        global: {
          stubs: {
            Icon: true,
            FlexRender: { template: '<div><slot /></div>' }
          }
        }
      });

      const rerenderCounter = new RerenderCounter(wrapper);
      rerenderCounter.start();

      const sortTime = await measureUpdatePerformance(
        wrapper,
        async () => {
          // Trigger sorting by updating the v-model prop
          await wrapper.setProps({ 
            sorting: [{ id: 'name', desc: false }] 
          });
        }
      );

      const rerenders = rerenderCounter.stop();

      expect(sortTime).toBeLessThan(PERFORMANCE_BENCHMARKS.updateTime.good);
      expect(rerenders).toBeLessThan(3); // Should minimize re-renders

      wrapper.unmount();
    });

    it('should handle filtering performance', async () => {
      const wrapper = mount(DataTable, {
        props: {
          columns: mockColumns,
          data: createMockData(300)
        },
        global: {
          stubs: {
            Icon: true,
            FlexRender: { template: '<div><slot /></div>' }
          }
        }
      });

      const filterTime = await measureUpdatePerformance(
        wrapper,
        async () => {
          // Trigger filtering by updating the v-model prop
          await wrapper.setProps({ 
            columnFilters: [{ id: 'name', value: 'Item 1' }] 
          });
        }
      );

      expect(filterTime).toBeLessThan(PERFORMANCE_BENCHMARKS.updateTime.fair);

      wrapper.unmount();
    });

    it('should not leak memory with large datasets', async () => {
      await performanceSuite.runMemoryLeakTest('DataTable', () => {
        return mount(DataTable, {
          props: {
            columns: mockColumns,
            data: createMockData(100)
          },
          global: {
            stubs: {
              Icon: true,
              FlexRender: { template: '<div><slot /></div>' }
            }
          }
        });
      });

      const report = performanceSuite.generateReport();
      const memoryTest = report.results.find(r => r.test === 'Memory Leak Detection');
      
      expect(memoryTest?.passed).toBe(true);
    });
  });

  describe('UserAuthForm Performance', () => {
    it('should render form quickly', async () => {
      await performanceSuite.runTest('UserAuthForm', 'Initial Render', () => {
        return mount(UserAuthForm, {
          global: {
            stubs: {
              Icon: true,
              Alert: { template: '<div><slot /></div>' },
              AlertDescription: { template: '<div><slot /></div>' }
            }
          }
        });
      });

      const report = performanceSuite.generateReport();
      const test = report.results.find(r => r.test === 'Initial Render');
      
      expect(test?.passed).toBe(true);
      expect(test?.metrics.renderTime).toBeLessThan(PERFORMANCE_BENCHMARKS.renderTime.good);
    });

    it('should handle form validation efficiently', async () => {
      const wrapper = mount(UserAuthForm, {
        global: {
          stubs: {
            Icon: true,
            Alert: { template: '<div><slot /></div>' },
            AlertDescription: { template: '<div><slot /></div>' }
          }
        }
      });

      const validationTime = await measureUpdatePerformance(
        wrapper,
        async () => {
          // Trigger form validation
          const form = wrapper.find('form');
          await form.trigger('submit');
        }
      );

      expect(validationTime).toBeLessThan(PERFORMANCE_BENCHMARKS.updateTime.good);

      wrapper.unmount();
    });

    it('should handle real-time validation without performance issues', async () => {
      const wrapper = mount(UserAuthForm, {
        global: {
          stubs: {
            Icon: true,
            Alert: { template: '<div><slot /></div>' },
            AlertDescription: { template: '<div><slot /></div>' }
          }
        }
      });

      const rerenderCounter = new RerenderCounter(wrapper);
      rerenderCounter.start();

      // Simulate typing in email field
      const emailInput = wrapper.find('input[name="email"]');
      
      for (const char of 'test@example.com') {
        await emailInput.setValue(emailInput.element.value + char);
        await wrapper.vm.$nextTick();
      }

      const rerenders = rerenderCounter.stop();
      
      // Should not re-render excessively during typing
      expect(rerenders).toBeLessThan(15); // One per character is acceptable

      wrapper.unmount();
    });
  });

  describe('Performance Test Suite Results', () => {
    it('should generate comprehensive performance report', async () => {
      // Run a few quick tests
      await performanceSuite.runTest('SearchBar', 'Quick Test', () => {
        return mount(SearchBar, {
          props: { placeholder: 'Test' },
          global: { stubs: { Icon: true } }
        });
      });

      const report = performanceSuite.generateReport();

      expect(report.summary.total).toBeGreaterThan(0);
      expect(report.summary.averageRenderTime).toBeGreaterThan(0);
      expect(report.summary.averageMountTime).toBeGreaterThan(0);
      expect(report.results).toHaveLength(report.summary.total);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should identify performance bottlenecks', async () => {
      // Create a deliberately slow component for testing
      const SlowComponent = {
        template: '<div>{{ slowComputation() }}</div>',
        methods: {
          slowComputation() {
            // Simulate very expensive computation that will exceed poor threshold
            // Use performance.now() to force execution every time
            const start = performance.now();
            let result = 0;
            // Run for at least 150ms to exceed the "poor" threshold of 100ms
            while (performance.now() - start < 150) {
              for (let i = 0; i < 10000; i++) {
                result += Math.random() * Math.sin(i) * Math.cos(i);
              }
            }
            return result;
          }
        }
      };

      await performanceSuite.runTest('SlowComponent', 'Expensive Computation', () => {
        return mount(SlowComponent);
      });

      const report = performanceSuite.generateReport();
      const slowTest = report.results.find(r => r.component === 'SlowComponent');
      
      // Should detect the performance issue
      expect(slowTest?.passed).toBe(false);
      expect(slowTest?.issues.length).toBeGreaterThan(0);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Memory Management', () => {
    it('should handle component lifecycle without leaks', async () => {
      const iterations = 10;
      let initialMemory: any;
      let finalMemory: any;

      // Get initial memory
      if (typeof window !== 'undefined' && (window.performance as any).memory) {
        initialMemory = (window.performance as any).memory.usedJSHeapSize;
      }

      // Create and destroy components
      for (let i = 0; i < iterations; i++) {
        const wrapper = mount(SearchBar, {
          props: { placeholder: 'Test' },
          global: { stubs: { Icon: true } }
        });

        await wrapper.vm.$nextTick();
        wrapper.unmount();
      }

      // Get final memory
      if (typeof window !== 'undefined' && (window.performance as any).memory) {
        finalMemory = (window.performance as any).memory.usedJSHeapSize;
      }

      if (initialMemory && finalMemory) {
        const memoryGrowth = finalMemory - initialMemory;
        // Memory growth should be minimal (< 1MB)
        expect(memoryGrowth).toBeLessThan(1024 * 1024);
      }
    });
  });

  afterEach(() => {
    // Clean up and print performance report
    if (performanceSuite) {
      const report = performanceSuite.generateReport();
      if (report.summary.failed > 0) {
        console.warn('Performance issues detected:');
        performanceSuite.printReport();
      }
    }
  });
});