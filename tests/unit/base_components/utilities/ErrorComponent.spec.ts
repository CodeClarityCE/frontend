import ErrorComponent from '@/base_components/utilities/ErrorComponent.vue';
import { render, screen } from '@testing-library/vue';
import { describe, it, expect, vi } from 'vitest';

const renderComponent = (props = {}, attrs = {}) => {
  return render(ErrorComponent, {
    props,
    attrs,
  });
};

describe('ErrorComponent', () => {
  describe('Rendering', () => {
    it('renders with default error text', () => {
      renderComponent();
      
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('renders error text as plain text content', () => {
      const { container } = renderComponent();
      
      expect(container.textContent).toBe('Error');
    });

    it('renders without any wrapper elements', () => {
      const { container } = renderComponent();
      
      // Should render as a text node without wrapper div/span
      expect(container.firstChild?.nodeType).toBe(Node.TEXT_NODE);
    });
  });

  describe('Component Structure', () => {
    it('has minimal DOM footprint', () => {
      const { container } = renderComponent();
      
      // Should contain only the text "Error"
      expect(container.innerHTML).toBe('Error');
    });

    it('renders consistently', () => {
      const { container: container1 } = renderComponent();
      const { container: container2 } = renderComponent();
      
      expect(container1.innerHTML).toBe(container2.innerHTML);
    });
  });

  describe('Props and Attributes', () => {
    it('ignores props since none are defined', () => {
      // Suppress Vue warning for intentional extraneous props test
      const originalWarn = console.warn;
      console.warn = vi.fn();
      
      renderComponent({ 
        message: 'Custom error',
        type: 'warning',
        severity: 'high'
      });
      
      // Restore console.warn
      console.warn = originalWarn;
      
      // Should still render the default "Error" text
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('accepts HTML attributes', () => {
      // Suppress Vue warning for intentional extraneous attributes test
      const originalWarn = console.warn;
      console.warn = vi.fn();
      
      const { container } = renderComponent({}, {
        'data-testid': 'error-component',
        'class': 'error-class',
      });
      
      // Restore console.warn
      console.warn = originalWarn;
      
      // Since there's no wrapper element, attributes won't be applied
      // This test documents the current behavior
      expect(container.textContent).toBe('Error');
    });
  });

  describe('Use Cases', () => {
    it('can be used as a placeholder error display', () => {
      renderComponent();
      
      const errorText = screen.getByText('Error');
      expect(errorText).toBeInTheDocument();
    });

    it('provides consistent error messaging', () => {
      // Multiple instances should render the same content
      const { unmount } = renderComponent();
      expect(screen.getByText('Error')).toBeInTheDocument();
      
      unmount();
      renderComponent();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides readable error text', () => {
      renderComponent();
      
      const errorText = screen.getByText('Error');
      expect(errorText).toBeInTheDocument();
      expect(errorText.textContent).toBe('Error');
    });

    it('is accessible to screen readers', () => {
      const { container } = renderComponent();
      
      // Text content should be accessible
      expect(container).toHaveTextContent('Error');
    });
  });

  describe('Performance', () => {
    it('has minimal rendering overhead', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        const { unmount } = renderComponent();
        unmount();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete 100 renders in reasonable time (under 500ms)
      // Note: Increased threshold to account for CI/test environment variability
      expect(duration).toBeLessThan(500);
    });

    it('creates minimal DOM elements', () => {
      const { container } = renderComponent();
      
      // Should only contain the text node
      expect(container.childNodes).toHaveLength(1);
      expect(container.firstChild?.nodeType).toBe(Node.TEXT_NODE);
    });
  });

  describe('Integration', () => {
    it('can be used in various contexts', () => {
      // Test that it renders correctly in different scenarios
      renderComponent();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('maintains functionality when re-rendered', () => {
      const { rerender } = renderComponent();
      expect(screen.getByText('Error')).toBeInTheDocument();
      
      rerender({});
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid mounting and unmounting', () => {
      for (let i = 0; i < 10; i++) {
        const { unmount } = renderComponent();
        expect(screen.getByText('Error')).toBeInTheDocument();
        unmount();
      }
    });

    it('renders correctly with no props or configuration', () => {
      const { container } = render(ErrorComponent);
      
      expect(container.textContent).toBe('Error');
    });
  });

  describe('Component Characteristics', () => {
    it('is a functional component with static content', () => {
      renderComponent();
      
      // Verify the static nature of the component
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('does not accept slots', () => {
      const { container } = render(ErrorComponent, {
        slots: {
          default: 'Custom Error Message',
        },
      });
      
      // Should still render "Error" as it's hardcoded in template
      expect(container.textContent).toBe('Error');
    });

    it('has predictable output', () => {
      const { container } = renderComponent();
      
      expect(container.innerHTML).toBe('Error');
      expect(container.textContent).toBe('Error');
    });
  });
});