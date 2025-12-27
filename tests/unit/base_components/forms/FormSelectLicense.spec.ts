import { render, screen } from '@testing-library/vue';
import { describe, it, expect, vi } from 'vitest';
import FormSelectLicense from '@/base_components/forms/FormSelectLicense.vue';
import type { License } from '@/codeclarity_components/results/licenses/License';

// Mock SearchBar component
vi.mock('@/base_components/filters/SearchBar.vue', () => ({
  default: {
    name: 'SearchBar',
    props: ['searchKey', 'placeholder'],
    emits: ['update:searchKey'],
    template: `
      <input 
        :placeholder="placeholder"
        :value="searchKey"
        @input="$emit('update:searchKey', $event.target.value)"
        data-testid="search-input"
      />
    `,
  },
}));

// Create mock license data
const createMockLicense = (overrides: Partial<License> = {}): License => ({
  deps_using_license: ['dep1', 'dep2'],
  description: 'Test license description',
  id: 'test-id',
  licenseId: 'test-license-id',
  license_category: 'permissive',
  license_compliance_violation: false,
  license_properties: {
    permissions: ['commercial-use', 'distribution'],
    conditions: ['include-copyright'],
    limitations: ['liability'],
    usage: 'permissive',
  },
  name: 'MIT License',
  references: ['https://opensource.org/licenses/MIT'],
  unable_to_infer: false,
  _key: 'mit-license',
  ...overrides,
});

const defaultProps = {
  placeholder: 'Select licenses',
  name: 'license-select',
  licenses: [
    createMockLicense({ name: 'MIT License', _key: 'mit', id: '1' }),
    createMockLicense({ name: 'Apache License 2.0', _key: 'apache', id: '2' }),
    createMockLicense({ name: 'GPL v3', _key: 'gpl', id: '3' }),
  ],
  data: new Set<string>(),
};

const renderComponent = (props = {}) => {
  const finalProps = { ...defaultProps, ...props };
  
  return render(FormSelectLicense, {
    props: finalProps,
    slots: {
      name: 'License Selection',
    },
  });
};

describe('FormSelectLicense', () => {
  describe('Component Structure', () => {
    it('renders with basic structure', () => {
      renderComponent();
      
      expect(screen.getByText('License Selection')).toBeInTheDocument();
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    it('renders main container with correct styling', () => {
      const { container } = renderComponent();
      
      expect(container.querySelector('.flex.flex-col.gap-2')).toBeInTheDocument();
    });

    it('renders label with correct association', () => {
      renderComponent();
      
      const label = screen.getByText('License Selection').closest('label');
      expect(label).toBeInTheDocument();
      expect(label).toHaveAttribute('for', defaultProps.name);
      expect(label).toHaveClass('text-gray-500', 'mb-1');
    });

    it('renders search input with correct attributes', () => {
      renderComponent();
      
      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toHaveAttribute('placeholder', 'Search for a license');
    });

    it('renders license container with correct styling', () => {
      const { container } = renderComponent();
      
      const licenseContainer = container.querySelector('.border.border-solid.border-gray-400.rounded.shadow-md');
      expect(licenseContainer).toBeInTheDocument();
      expect(licenseContainer).toHaveClass('w-full', 'py-3', 'px-5', 'h-72', 'overflow-y-scroll');
    });
  });

  describe('Props Handling', () => {
    it('accepts placeholder prop', () => {
      const customPlaceholder = 'Choose licenses';
      renderComponent({ placeholder: customPlaceholder });
      
      expect(screen.getByText('License Selection')).toBeInTheDocument();
    });

    it('accepts name prop for label association', () => {
      const customName = 'custom-license-select';
      renderComponent({ name: customName });
      
      const label = screen.getByText('License Selection').closest('label');
      expect(label).toHaveAttribute('for', customName);
    });

    it('accepts licenses array prop', () => {
      renderComponent({ licenses: [] });
      
      // Component should still render even with empty licenses
      expect(screen.getByText('License Selection')).toBeInTheDocument();
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    it('accepts disabled prop', () => {
      renderComponent({ disabled: true });
      
      // Component should render with disabled prop
      expect(screen.getByText('License Selection')).toBeInTheDocument();
    });

    it('accepts data model prop', () => {
      const selectedData = new Set(['mit', 'apache']);
      renderComponent({ data: selectedData });
      
      expect(screen.getByText('License Selection')).toBeInTheDocument();
    });
  });

  describe('Slot Support', () => {
    it('renders slot content for label', () => {
      renderComponent();
      
      expect(screen.getByText('License Selection')).toBeInTheDocument();
    });

    it('supports custom slot content', () => {
      render(FormSelectLicense, {
        props: defaultProps,
        slots: {
          name: 'Custom License Label',
        },
      });
      
      expect(screen.getByText('Custom License Label')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('integrates with SearchBar component', () => {
      renderComponent();
      
      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('placeholder', 'Search for a license');
    });

    it('provides v-model integration structure', () => {
      renderComponent();
      
      // Verify the component renders and provides the necessary structure
      // for v-model integration (testing the actual v-model binding would
      // require more complex setup)
      expect(screen.getByText('License Selection')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides accessible label', () => {
      renderComponent();
      
      const label = screen.getByText('License Selection').closest('label');
      expect(label).toBeInTheDocument();
      expect(label).toHaveAttribute('for', defaultProps.name);
    });

    it('provides accessible search input', () => {
      renderComponent();
      
      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('placeholder');
    });

    it('provides scrollable license container', () => {
      const { container } = renderComponent();
      
      const licenseContainer = container.querySelector('.overflow-y-scroll');
      expect(licenseContainer).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty props gracefully', () => {
      render(FormSelectLicense, {
        props: {
          placeholder: '',
          name: '',
          licenses: [],
        },
        slots: {
          name: '',
        },
      });
      
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    it('handles missing slot content', () => {
      render(FormSelectLicense, {
        props: defaultProps,
        // No slots provided
      });
      
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    it('renders consistently', () => {
      const { container: container1 } = renderComponent();
      const { container: container2 } = renderComponent();
      
      // Both should have the same basic structure
      expect(container1.querySelector('.flex.flex-col.gap-2')).toBeInTheDocument();
      expect(container2.querySelector('.flex.flex-col.gap-2')).toBeInTheDocument();
    });
  });

  describe('Component Characteristics', () => {
    it('is a complex form component with search and selection', () => {
      renderComponent();
      
      // Verify it has the expected complex structure
      expect(screen.getByText('License Selection')).toBeInTheDocument();
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      
      const { container } = renderComponent();
      expect(container.querySelector('.border')).toBeInTheDocument();
    });

    it('maintains component structure with different props', () => {
      const customProps = {
        placeholder: 'Custom placeholder',
        name: 'custom-name',
        licenses: [],
        disabled: true,
      };
      
      renderComponent(customProps);
      
      expect(screen.getByText('License Selection')).toBeInTheDocument();
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });
  });
});