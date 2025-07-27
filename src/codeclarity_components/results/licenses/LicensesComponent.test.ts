import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import LicensesComponent from './LicensesComponent.vue';
import { License } from './License';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import { ResultsRepository } from '@/codeclarity_components/results/results.repository';

// Mock modules with proper default values
vi.mock('@/stores/user', () => ({
    useUserStore: vi.fn(() => ({
        getDefaultOrg: { id: 'default-org-id' }
    }))
}));

vi.mock('@/stores/auth', () => ({
    useAuthStore: vi.fn(() => ({
        getToken: 'default-token'
    }))
}));

vi.mock('@/codeclarity_components/results/results.repository');

// Mock the projects repository to provide ProjectsSortInterface
vi.mock('@/codeclarity_components/projects/project.repository', () => ({
    ProjectsSortInterface: {
        LICENSE_TYPE: 'type'
    }
}));

// Mock SortDirection enum
vi.mock('@/utils/api/PaginatedRequestOptions', () => ({
    SortDirection: {
        DESC: 'DESC',
        ASC: 'ASC'
    }
}));

// Mock BaseRepository to avoid dependency issues
vi.mock('@/utils/api/BaseRepository', () => ({
    BaseRepository: class MockBaseRepository {
        constructor() {}
    }
}));

// Mock Icon component
vi.mock('@iconify/vue', () => ({
    Icon: {
        name: 'Icon',
        template: '<div data-testid="icon" :data-icon="icon">{{ icon }}</div>',
        props: ['icon', 'class']
    }
}));

// Mock child components
vi.mock('@/base_components/filters/SearchBar.vue', () => ({
    default: {
        name: 'SearchBar',
        template: '<div data-testid="search-bar"></div>',
        props: ['placeholder', 'modelValue'],
        emits: ['update:modelValue']
    }
}));

vi.mock('@/base_components/ui/loaders/BoxLoader.vue', () => ({
    default: {
        name: 'BoxLoader',
        template: '<div data-testid="box-loader">Loading...</div>'
    }
}));

vi.mock('./LicenseComponent.vue', () => ({
    default: {
        name: 'LicenseComponent',
        template: '<div data-testid="license-component">License Component</div>',
        props: ['license', 'last', 'analysisID', 'projectID']
    }
}));

vi.mock('@/base_components/utilities/PaginationComponent.vue', () => ({
    default: {
        name: 'PaginationComponent',
        template: '<div data-testid="pagination"></div>',
        props: [
            'pageNumber',
            'totalPages',
            'nmbEntriesShowing',
            'nmbEntriesTotal',
            'pageLimitSelected',
            'selectionPageLimit'
        ],
        emits: ['updatePageNumber', 'updatePageLimit']
    }
}));

vi.mock('@/base_components/utilities/UtilitiesSort.vue', () => ({
    default: {
        name: 'UtilitiesSort',
        template: '<div data-testid="utilities-sort"></div>',
        props: ['sortByOptions', 'sortKey', 'sortDirection'],
        emits: ['update:sortKey', 'update:sortDirection']
    }
}));

vi.mock('@/base_components/filters/UtilitiesFilters.vue', () => ({
    default: {
        name: 'UtilitiesFilters',
        template: '<div data-testid="utilities-filters"></div>',
        props: ['filterState'],
        emits: ['filterApplied']
    },
    createNewFilterState: vi.fn(() => ({})),
    FilterType: {
        RADIO: 'RADIO'
    }
}));

vi.mock('@/base_components/filters/ActiveFilterBar.vue', () => ({
    default: {
        name: 'ActiveFilterBar',
        template: '<div data-testid="active-filter-bar"></div>',
        props: ['filterState'],
        emits: ['filterRemoved']
    }
}));

describe.skip('LicensesComponent.vue', () => {
    let mockUserStore: any;
    let mockAuthStore: any;
    let mockResultsRepository: any;

    beforeEach(() => {
        setActivePinia(createPinia());

        mockUserStore = {
            getDefaultOrg: { id: 'org-123' }
        };
        mockAuthStore = {
            getToken: 'mock-token'
        };

        // Reset the mocked functions to use the test-specific stores
        vi.mocked(useUserStore).mockReturnValue(mockUserStore);
        vi.mocked(useAuthStore).mockReturnValue(mockAuthStore);

        mockResultsRepository = {
            getLicenses: vi.fn().mockResolvedValue(createMockResponse([]))
        };
        vi.mocked(ResultsRepository).mockImplementation(() => mockResultsRepository);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    const createMockLicense = (overrides = {}): License => {
        const license = new License();
        license.id = 'MIT';
        license.licenseId = 'MIT';
        license.name = 'MIT License';
        license.description = 'A permissive license';
        license.license_category = 'Permissive';
        license.deps_using_license = ['package1', 'package2'];
        license.references = ['https://opensource.org/licenses/MIT'];
        license.license_compliance_violation = false;
        license.unable_to_infer = false;
        license.license_properties = {
            permissions: ['commercial-use'],
            conditions: ['include-copyright'],
            limitations: ['liability'],
            usage: 'Permissive use'
        };
        license._key = 'license_key_123';
        return Object.assign(license, overrides);
    };

    const createMockResponse = (licenses: License[] = []) => ({
        data: licenses,
        page: 0,
        entries_per_page: 10,
        entry_count: licenses.length,
        matching_count: licenses.length,
        total_entries: licenses.length,
        total_pages: 1
    });

    const createWrapper = (props = {}) => {
        const defaultProps = {
            analysisID: 'analysis-123',
            projectID: 'project-456'
        };

        return mount(LicensesComponent, {
            props: { ...defaultProps, ...props },
            global: {
                stubs: {
                    Icon: true
                }
            }
        });
    };

    it('renders correctly with required props', () => {
        const wrapper = createWrapper();

        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find('[data-testid="search-bar"]').exists()).toBe(true);
        expect(wrapper.find('[data-testid="utilities-sort"]').exists()).toBe(true);
    });

    it('shows loading state initially', () => {
        const wrapper = createWrapper();

        expect((wrapper.vm as any).render).toBe(false);
    });

    it('calls API with correct parameters on init', async () => {
        const mockLicenses = [createMockLicense()];
        mockResultsRepository.getLicenses.mockResolvedValue(createMockResponse(mockLicenses));

        const wrapper = createWrapper({
            analysisID: 'analysis-789',
            projectID: 'project-123'
        });

        // Trigger init by calling it directly since watch might not trigger in test
        await (wrapper.vm as any).init();

        expect(mockResultsRepository.getLicenses).toHaveBeenCalledWith({
            orgId: 'org-123',
            projectId: 'project-123',
            analysisId: 'analysis-789',
            workspace: '.',
            bearerToken: 'mock-token',
            pagination: {
                page: 0,
                entries_per_page: 10
            },
            sort: {
                sortKey: 'type',
                sortDirection: 'DESC'
            },
            active_filters: '',
            search_key: ''
        });
    });

    it('updates state after successful API call', async () => {
        const wrapper = createWrapper();

        const mockLicenses = [createMockLicense(), createMockLicense({ id: 'Apache-2.0' })];
        const mockResponse = createMockResponse(mockLicenses);
        mockResponse.total_entries = 50;
        mockResponse.total_pages = 5;

        mockResultsRepository.getLicenses.mockResolvedValue(mockResponse);
        await (wrapper.vm as any).init();

        expect((wrapper.vm as any).render).toBe(true);
        expect((wrapper.vm as any).nmbEntriesTotal).toBe(50);
        expect((wrapper.vm as any).totalPages).toBe(5);
    });

    it('calls API with correct structure', async () => {
        const wrapper = createWrapper();
        await (wrapper.vm as any).init();

        expect(mockResultsRepository.getLicenses).toHaveBeenCalledWith(
            expect.objectContaining({
                orgId: 'org-123',
                projectId: 'project-456',
                analysisId: 'analysis-123',
                workspace: '.',
                bearerToken: 'mock-token'
            })
        );
    });

    it('has correct computed properties for empty state', () => {
        const wrapper = createWrapper();

        expect((wrapper.vm as any).uniqueLicenseCount).toBe(0);
        expect((wrapper.vm as any).totalDependencies).toBe(0);
        expect((wrapper.vm as any).copyleftLicenseCount).toBe(0);
        expect((wrapper.vm as any).permissiveLicenseCount).toBe(0);
    });

    it('handles API error gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const wrapper = createWrapper();

        mockResultsRepository.getLicenses.mockRejectedValue(new Error('API Error'));
        await (wrapper.vm as any).init();

        expect(consoleSpy).toHaveBeenCalledWith('error', expect.any(Error));

        consoleSpy.mockRestore();
    });

    it('throws error when no default org', async () => {
        mockUserStore.getDefaultOrg = null;

        const wrapper = createWrapper();

        await expect((wrapper.vm as any).init()).rejects.toThrow('No default org selected');
    });

    it('throws error when no auth token', async () => {
        mockAuthStore.getToken = null;

        const wrapper = createWrapper();

        await expect((wrapper.vm as any).init()).rejects.toThrow('No default org selected');
    });

    it('returns early when missing projectID or analysisID', async () => {
        const wrapper = createWrapper({ projectID: '', analysisID: 'analysis-123' });

        await (wrapper.vm as any).init();

        expect(mockResultsRepository.getLicenses).not.toHaveBeenCalled();
    });

    it('updates search key reactively', async () => {
        const wrapper = createWrapper();

        expect((wrapper.vm as any).searchKey).toBe('');

        (wrapper.vm as any).searchKey = 'MIT';

        expect((wrapper.vm as any).searchKey).toBe('MIT');
    });

    it('updates sort options reactively', async () => {
        const wrapper = createWrapper();

        expect((wrapper.vm as any).sortKey).toBe('type');
        expect((wrapper.vm as any).sortDirection).toBe('DESC');

        (wrapper.vm as any).sortKey = 'id';
        (wrapper.vm as any).sortDirection = 'ASC';

        expect((wrapper.vm as any).sortKey).toBe('id');
        expect((wrapper.vm as any).sortDirection).toBe('ASC');
    });

    it('updates pagination options reactively', async () => {
        const wrapper = createWrapper();

        expect((wrapper.vm as any).pageNumber).toBe(0);
        expect((wrapper.vm as any).pageLimitSelected).toBe(10);

        (wrapper.vm as any).pageNumber = 2;
        (wrapper.vm as any).pageLimitSelected = 20;

        expect((wrapper.vm as any).pageNumber).toBe(2);
        expect((wrapper.vm as any).pageLimitSelected).toBe(20);
    });

    it('has correct sort by options', () => {
        const wrapper = createWrapper();

        const sortByOptions = (wrapper.vm as any).sortByOptions;
        expect(sortByOptions).toEqual([
            { key: 'type', label: 'Type' },
            { key: 'dep_count', label: 'Nmb. of deps' },
            { key: 'id', label: 'License Id' }
        ]);
    });

    it('has correct page limit selections', () => {
        const wrapper = createWrapper();

        const selectionPageLimit = (wrapper.vm as any).selectionPageLimit;
        expect(selectionPageLimit).toEqual([5, 10, 20, 30, 40, 50, 75, 100]);
    });

    it('has correct placeholder text', () => {
        const wrapper = createWrapper();

        expect((wrapper.vm as any).placeholder).toBe('Search by licenses');
    });

    it('initializes filter state correctly', () => {
        const wrapper = createWrapper();

        const filterState = (wrapper.vm as any).filterState;
        expect(filterState).toBeDefined();
    });

    it('handles empty license array', async () => {
        mockResultsRepository.getLicenses.mockResolvedValue(createMockResponse([]));

        const wrapper = createWrapper();
        await (wrapper.vm as any).init();

        expect((wrapper.vm as any).uniqueLicenseCount).toBe(0);
        expect((wrapper.vm as any).totalDependencies).toBe(0);
        expect((wrapper.vm as any).copyleftLicenseCount).toBe(0);
        expect((wrapper.vm as any).permissiveLicenseCount).toBe(0);
    });

    it('has correct basic structure and data properties', () => {
        const wrapper = createWrapper();

        expect((wrapper.vm as any).render).toBe(false);
        expect((wrapper.vm as any).sortDirection).toBe('DESC');
        expect((wrapper.vm as any).sortKey).toBe('type');
        expect((wrapper.vm as any).pageLimitSelected).toBe(10);
        expect((wrapper.vm as any).searchKey).toBe('');
        expect((wrapper.vm as any).placeholder).toBe('Search by licenses');
    });
});
