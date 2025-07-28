describe('Performance Monitoring E2E Tests', () => {
  beforeEach(() => {
    // Set up performance monitoring
    cy.window().then((win) => {
      // Clear any existing performance marks
      win.performance.clearMarks();
      win.performance.clearMeasures();
    });
  });

  describe('Page Load Performance', () => {
    it('should load login page within performance budget', () => {
      // Start performance measurement
      cy.window().then((win) => {
        win.performance.mark('test-start');
      });

      cy.visit('/login');
      
      // Wait for page to be fully loaded
      cy.getByCy('login-form').should('be.visible');
      
      cy.window().then((win) => {
        win.performance.mark('test-end');
        win.performance.measure('page-load', 'test-start', 'test-end');
        
        const measures = win.performance.getEntriesByName('page-load');
        const loadTime = measures[0]?.duration;
        
        // Login page should load within 2 seconds
        expect(loadTime).to.be.lessThan(2000);
      });
    });

    it('should load dashboard efficiently after login', () => {
      cy.login();
      
      cy.window().then((win) => {
        win.performance.mark('dashboard-start');
      });
      
      cy.visit('/dashboard');
      cy.waitForPageLoad();
      
      cy.window().then((win) => {
        win.performance.mark('dashboard-end');
        win.performance.measure('dashboard-load', 'dashboard-start', 'dashboard-end');
        
        const measures = win.performance.getEntriesByName('dashboard-load');
        const loadTime = measures[0]?.duration;
        
        // Dashboard should load within 3 seconds
        expect(loadTime).to.be.lessThan(3000);
      });
    });

    it('should handle cold start performance', () => {
      // Clear cache to simulate cold start
      cy.clearCookies();
      cy.clearLocalStorage();
      
      cy.window().then((win) => {
        // Clear browser cache if possible
        if ('caches' in win) {
          win.caches.keys().then((cacheNames) => {
            cacheNames.forEach((cacheName) => {
              win.caches.delete(cacheName);
            });
          });
        }
      });
      
      const startTime = Date.now();
      cy.visit('/');
      cy.contains('Sign In').should('be.visible');
      
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        // Cold start should complete within 5 seconds
        expect(loadTime).to.be.lessThan(5000);
      });
    });
  });

  describe('Runtime Performance', () => {
    beforeEach(() => {
      cy.login();
    });

    it('should handle table sorting without performance degradation', () => {
      cy.fixture('vulnerabilities.json').then((vulns) => {
        cy.mockApi('GET', '/api/vulnerabilities', vulns.largeDataset || vulns.tableData);
      });
      
      cy.visit('/vulnerabilities');
      cy.waitForLoading();
      
      cy.window().then((win) => {
        win.performance.mark('sort-start');
      });
      
      // Trigger sorting
      cy.getByCy('sort-severity').click();
      
      // Wait for sort to complete
      cy.getByCy('vulnerability-table').should('be.visible');
      
      cy.window().then((win) => {
        win.performance.mark('sort-end');
        win.performance.measure('table-sort', 'sort-start', 'sort-end');
        
        const measures = win.performance.getEntriesByName('table-sort');
        const sortTime = measures[0]?.duration;
        
        // Table sorting should complete within 500ms
        expect(sortTime).to.be.lessThan(500);
      });
    });

    it('should handle search filtering efficiently', () => {
      cy.visit('/projects');
      cy.waitForLoading();
      
      cy.window().then((win) => {
        win.performance.mark('search-start');
      });
      
      // Type in search
      cy.getByCy('project-search').type('react');
      
      // Wait for search results
      cy.getByCy('search-results').should('be.visible');
      
      cy.window().then((win) => {
        win.performance.mark('search-end');
        win.performance.measure('search-filter', 'search-start', 'search-end');
        
        const measures = win.performance.getEntriesByName('search-filter');
        const searchTime = measures[0]?.duration;
        
        // Search filtering should be near-instant (< 200ms)
        expect(searchTime).to.be.lessThan(200);
      });
    });

    it('should maintain frame rate during animations', () => {
      cy.visit('/dashboard');
      
      // Monitor FPS during modal opening
      let frameCount = 0;
      const measureFrames = () => {
        frameCount++;
        if (frameCount < 60) { // Monitor for ~1 second at 60fps
          requestAnimationFrame(measureFrames);
        }
      };
      
      cy.window().then((win) => {
        const startTime = win.performance.now();
        win.requestAnimationFrame(measureFrames);
        
        // Trigger modal animation
        cy.getByCy('quick-run-analysis').click();
        cy.getByCy('analysis-modal').should('be.visible');
        
        cy.then(() => {
          const endTime = win.performance.now();
          const duration = endTime - startTime;
          const fps = (frameCount / duration) * 1000;
          
          // Should maintain at least 30 FPS during animations
          expect(fps).to.be.greaterThan(30);
        });
      });
    });

    it('should handle rapid user interactions', () => {
      cy.visit('/projects');
      cy.waitForLoading();
      
      cy.window().then((win) => {
        win.performance.mark('rapid-interactions-start');
      });
      
      // Simulate rapid user interactions
      cy.getByCy('project-search').type('test');
      cy.getByCy('language-filter').click();
      cy.getByCy('filter-javascript').click();
      cy.getByCy('sort-dropdown').click();
      cy.getByCy('sort-by-date').click();
      cy.getByCy('view-toggle-list').click();
      
      cy.waitForLoading();
      
      cy.window().then((win) => {
        win.performance.mark('rapid-interactions-end');
        win.performance.measure('rapid-interactions', 'rapid-interactions-start', 'rapid-interactions-end');
        
        const measures = win.performance.getEntriesByName('rapid-interactions');
        const interactionTime = measures[0]?.duration;
        
        // Rapid interactions should complete within 1 second
        expect(interactionTime).to.be.lessThan(1000);
      });
    });
  });

  describe('Memory Performance', () => {
    beforeEach(() => {
      cy.login();
    });

    it('should not accumulate memory during navigation', () => {
      let initialMemory: number;
      let finalMemory: number;
      
      cy.window().then((win) => {
        if ((win.performance as any).memory) {
          initialMemory = (win.performance as any).memory.usedJSHeapSize;
        }
      });
      
      // Navigate through multiple pages
      const pages = ['/dashboard', '/projects', '/vulnerabilities', '/settings', '/dashboard'];
      
      pages.forEach(page => {
        cy.visit(page);
        cy.waitForPageLoad();
      });
      
      cy.window().then((win) => {
        if ((win.performance as any).memory) {
          finalMemory = (win.performance as any).memory.usedJSHeapSize;
          
          const memoryGrowth = finalMemory - initialMemory;
          const growthMB = memoryGrowth / (1024 * 1024);
          
          // Memory growth should be reasonable (< 10MB for navigation)
          expect(growthMB).to.be.lessThan(10);
        }
      });
    });

    it('should handle large dataset memory efficiently', () => {
      // Mock large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        name: `Item ${i}`,
        severity: ['low', 'medium', 'high', 'critical'][i % 4]
      }));
      
      cy.mockApi('GET', '/api/vulnerabilities', largeDataset);
      
      let beforeMemory: number;
      let afterMemory: number;
      
      cy.window().then((win) => {
        if ((win.performance as any).memory) {
          beforeMemory = (win.performance as any).memory.usedJSHeapSize;
        }
      });
      
      cy.visit('/vulnerabilities');
      cy.waitForLoading();
      
      // Interact with the large dataset
      cy.getByCy('search-input').type('Item 5');
      cy.getByCy('sort-name').click();
      cy.getByCy('page-next').click();
      
      cy.window().then((win) => {
        if ((win.performance as any).memory) {
          afterMemory = (win.performance as any).memory.usedJSHeapSize;
          
          const memoryUsed = (afterMemory - beforeMemory) / (1024 * 1024);
          
          // Large dataset should not use excessive memory (< 20MB)
          expect(memoryUsed).to.be.lessThan(20);
        }
      });
    });
  });

  describe('Network Performance', () => {
    beforeEach(() => {
      cy.login();
    });

    it('should handle slow network gracefully', () => {
      // Simulate slow network
      cy.intercept('GET', '/api/projects', {
        delay: 2000,
        statusCode: 200,
        fixture: 'projects.json'
      }).as('slowProjects');
      
      const startTime = Date.now();
      cy.visit('/projects');
      
      // Should show loading state immediately
      cy.getByCy('loading-spinner').should('be.visible');
      
      cy.wait('@slowProjects');
      cy.waitForLoading();
      
      cy.then(() => {
        const totalTime = Date.now() - startTime;
        
        // Should handle slow network within reasonable time
        expect(totalTime).to.be.lessThan(3000);
      });
    });

    it('should optimize API request patterns', () => {
      let requestCount = 0;
      
      cy.intercept('GET', '/api/**', (req) => {
        requestCount++;
        req.continue();
      }).as('apiRequests');
      
      cy.visit('/dashboard');
      cy.waitForPageLoad();
      
      cy.then(() => {
        // Dashboard should not make excessive API requests
        expect(requestCount).to.be.lessThan(10);
      });
    });

    it('should cache static resources effectively', () => {
      cy.visit('/dashboard');
      cy.waitForPageLoad();
      
      // Navigate away and back
      cy.visit('/projects');
      cy.waitForPageLoad();
      
      const startTime = Date.now();
      cy.visit('/dashboard');
      cy.waitForPageLoad();
      
      cy.then(() => {
        const returnTime = Date.now() - startTime;
        
        // Return navigation should be faster due to caching
        expect(returnTime).to.be.lessThan(1000);
      });
    });
  });

  describe('Resource Performance', () => {
    it('should load critical resources prioritized', () => {
      cy.visit('/login');
      
      cy.window().then((win) => {
        const navigation = win.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const resources = win.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        
        // Check that CSS loads before JS for better perceived performance
        const cssResources = resources.filter(r => r.name.includes('.css'));
        const jsResources = resources.filter(r => r.name.includes('.js'));
        
        if (cssResources.length > 0 && jsResources.length > 0) {
          const cssLoadTime = cssResources[0].responseEnd - navigation.fetchStart;
          const jsLoadTime = jsResources[0].responseEnd - navigation.fetchStart;
          
          // CSS should load before or around the same time as JS
          expect(cssLoadTime).to.be.lessThan(jsLoadTime + 100);
        }
      });
    });

    it('should minimize layout shifts', () => {
      cy.visit('/dashboard');
      
      // Wait for all content to load
      cy.waitForPageLoad();
      
      cy.window().then((win) => {
        // Get layout shift entries if available
        const observer = new win.PerformanceObserver((list) => {
          const entries = list.getEntries();
          let cumulativeLayoutShift = 0;
          
          entries.forEach((entry: any) => {
            if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
              cumulativeLayoutShift += entry.value;
            }
          });
          
          // Cumulative Layout Shift should be minimal (< 0.1 is good)
          expect(cumulativeLayoutShift).to.be.lessThan(0.1);
        });
        
        observer.observe({ entryTypes: ['layout-shift'] });
      });
    });
  });

  describe('Performance Budgets', () => {
    it('should meet Core Web Vitals thresholds', () => {
      cy.visit('/dashboard');
      cy.waitForPageLoad();
      
      cy.window().then((win) => {
        // Check for Web Vitals if available
        const navigation = win.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        // First Contentful Paint should be < 1.8s (good)
        const fcp = win.performance.getEntriesByName('first-contentful-paint')[0];
        if (fcp) {
          expect(fcp.startTime).to.be.lessThan(1800);
        }
        
        // Largest Contentful Paint should be < 2.5s (good)
        const lcp = win.performance.getEntriesByName('largest-contentful-paint')[0];
        if (lcp) {
          expect(lcp.startTime).to.be.lessThan(2500);
        }
        
        // Time to Interactive should be reasonable
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        expect(loadTime).to.be.lessThan(3000);
      });
    });

    it('should stay within bundle size limits', () => {
      cy.visit('/dashboard');
      
      cy.window().then((win) => {
        const resources = win.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        
        let totalJSSize = 0;
        let totalCSSSize = 0;
        
        resources.forEach(resource => {
          if (resource.name.includes('.js')) {
            totalJSSize += resource.transferSize || 0;
          } else if (resource.name.includes('.css')) {
            totalCSSSize += resource.transferSize || 0;
          }
        });
        
        // JavaScript bundle should be reasonable (< 500KB)
        expect(totalJSSize).to.be.lessThan(500 * 1024);
        
        // CSS bundle should be minimal (< 100KB)
        expect(totalCSSSize).to.be.lessThan(100 * 1024);
      });
    });
  });

  describe('Performance Regression Detection', () => {
    it('should detect performance regressions in key metrics', () => {
      const performanceBaseline = {
        loginPageLoad: 2000,
        dashboardLoad: 3000,
        tableSort: 500,
        searchFilter: 200
      };
      
      // Test login page load
      cy.window().then((win) => {
        win.performance.mark('login-start');
      });
      
      cy.visit('/login');
      cy.getByCy('login-form').should('be.visible');
      
      cy.window().then((win) => {
        win.performance.mark('login-end');
        win.performance.measure('login-load', 'login-start', 'login-end');
        
        const measures = win.performance.getEntriesByName('login-load');
        const loadTime = measures[0]?.duration;
        
        // Should not regress beyond baseline + 20%
        expect(loadTime).to.be.lessThan(performanceBaseline.loginPageLoad * 1.2);
      });
    });

    it('should maintain performance across browser sessions', () => {
      // First session
      cy.clearCookies();
      cy.clearLocalStorage();
      
      const firstSessionStart = Date.now();
      cy.visit('/dashboard');
      cy.waitForPageLoad();
      const firstSessionTime = Date.now() - firstSessionStart;
      
      // Second session (with cache)
      const secondSessionStart = Date.now();
      cy.reload();
      cy.waitForPageLoad();
      const secondSessionTime = Date.now() - secondSessionStart;
      
      // Second session should be faster or similar
      expect(secondSessionTime).to.be.lessThan(firstSessionTime * 1.5);
    });
  });

  afterEach(() => {
    // Log performance metrics for monitoring
    cy.window().then((win) => {
      const navigation = win.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const measures = win.performance.getEntriesByName();
      
      if (navigation) {
        cy.log(`Page Load Time: ${navigation.loadEventEnd - navigation.fetchStart}ms`);
        cy.log(`DOM Content Loaded: ${navigation.domContentLoadedEventEnd - navigation.fetchStart}ms`);
      }
      
      measures.forEach(measure => {
        cy.log(`${measure.name}: ${measure.duration}ms`);
      });
    });
  });
});