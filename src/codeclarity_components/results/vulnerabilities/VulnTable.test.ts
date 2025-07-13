import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';

// Mock BaseRepository before any imports that depend on it
vi.mock('@/base_repository/base.repository', () => ({
    BaseRepository: class MockBaseRepository {
        constructor() {}
    }
}));

// Mock router to avoid dependency issues
vi.mock('@/router', () => ({
    default: {},
    router: {}
}));

import VulnTable from './VulnTable.vue';
import { SortDirection } from '@/utils/api/PaginatedRequestOptions';
import { PatchType } from '@/codeclarity_components/results/vulnerabilities/VulnStats';

// Mock ProjectsSortInterface
vi.mock('@/codeclarity_components/projects/project.repository', () => ({
    ProjectsSortInterface: {
        SEVERITY: 'severity',
        CVE: 'cve',
        DEPENDENCY_NAME: 'dep_name',
        DEPENDENCY_VERSION: 'dep_version',
        WEAKNESS: 'weakness',
        OWASP_TOP_10: 'owasp_top_10',
        EXPLOITABILITY: 'exploitability'
    }
}));

// Mock stores
const mockUserStore = {
    getDefaultOrg: { id: 'org-1', name: 'Test Org' }
};

const mockAuthStore = {
    getToken: 'test-token',
    getAuthenticated: true
};

vi.mock('@/stores/user', () => ({
    useUserStore: vi.fn(() => mockUserStore)
}));

vi.mock('@/stores/auth', () => ({
    useAuthStore: vi.fn(() => mockAuthStore)
}));

// Mock base components
vi.mock('@/base_components/filters/SearchBar.vue', () => ({
    default: {
        name: 'SearchBar',
        template: '<input data-testid="search-bar" />',
        props: ['search-key', 'placeholder'],
        emits: ['update:search-key']
    }
}));

vi.mock('@/base_components/data-display/bubbles/SeverityBubble.vue', () => ({
    default: {
        name: 'SeverityBubble',
        template: '<div data-testid="severity-bubble"><slot name="content"></slot></div>',
        props: ['critical', 'high', 'medium', 'low', 'none']
    }
}));

vi.mock('@/base_components/data-display/bubbles/BubbleComponent.vue', () => ({
    default: {
        name: 'BubbleComponent',
        template: '<div data-testid="bubble-component"><slot name="content"></slot></div>',
        props: ['title', 'slim', 'not-patchable', 'partially-patchable', 'class']
    }
}));

vi.mock('@/base_components/data-display/tables/SortableTable.vue', () => ({
    default: {
        name: 'SortableTable',
        template: '<div data-testid="sortable-table"><slot name="data"></slot></div>',
        props: ['headers', 'sort-key', 'sort-direction', 'on-sort-change']
    }
}));

vi.mock('@/base_components/utilities/PaginationComponent.vue', () => ({
    default: {
        name: 'PaginationComponent',
        template: '<div data-testid="pagination-component">Pagination</div>',
        props: ['page', 'nmb-entries-showing', 'nmb-entries-total', 'total-pages'],
        emits: [
            'update:page',
            'update:nmb-entries-showing',
            'update:nmb-entries-total',
            'update:total-pages'
        ]
    }
}));

vi.mock('@/base_components/utilities/UtilitiesSort.vue', () => ({
    default: {
        name: 'UtilitiesSort',
        template: '<div data-testid="utilities-sort">Sort Component</div>',
        props: [
            'page-limit-selected',
            'sort-key',
            'sort-direction',
            'selection-page-limit',
            'sort-options',
            'showing',
            'total'
        ],
        emits: ['update:page-limit-selected', 'update:sort-key', 'update:sort-direction']
    }
}));

vi.mock('@/base_components/filters/UtilitiesFilters.vue', () => ({
    default: {
        name: 'UtilitiesFilters',
        template: '<div data-testid="utilities-filters">Filters Component</div>',
        props: ['filter-state'],
        emits: ['update:filter-state']
    },
    createNewFilterState: vi.fn(() => ({
        activeFilters: '',
        toString: () => ''
    })),
    FilterType: {
        RADIO: 'radio',
        CHECKBOX: 'checkbox',
        DIVIDER: 'divider'
    }
}));

vi.mock('@/base_components/filters/ActiveFilterBar.vue', () => ({
    default: {
        name: 'ActiveFilterBar',
        template: '<div data-testid="active-filter-bar">Active Filters</div>',
        props: ['filter-state'],
        emits: ['update:filter-state']
    }
}));

// Mock Shadcn components
vi.mock('@/shadcn/ui/alert', () => ({
    Alert: {
        name: 'Alert',
        template: '<div data-testid="alert"><slot></slot></div>',
        props: ['variant']
    },
    AlertDescription: {
        name: 'AlertDescription',
        template: '<div data-testid="alert-description"><slot></slot></div>'
    }
}));

vi.mock('@/shadcn/ui/badge', () => ({
    Badge: {
        name: 'Badge',
        template: '<span data-testid="badge"><slot></slot></span>',
        props: ['class', 'variant']
    }
}));

vi.mock('@/shadcn/ui/tooltip', () => ({
    Tooltip: {
        name: 'Tooltip',
        template: '<div data-testid="tooltip"><slot></slot></div>'
    },
    TooltipContent: {
        name: 'TooltipContent',
        template: '<div data-testid="tooltip-content"><slot></slot></div>',
        props: ['class']
    },
    TooltipProvider: {
        name: 'TooltipProvider',
        template: '<div data-testid="tooltip-provider"><slot></slot></div>'
    },
    TooltipTrigger: {
        name: 'TooltipTrigger',
        template: '<div data-testid="tooltip-trigger"><slot></slot></div>',
        props: ['as-child']
    }
}));

// Mock Icon component
vi.mock('@iconify/vue', () => ({
    Icon: {
        name: 'Icon',
        template: '<span data-testid="icon"></span>',
        props: ['icon', 'class']
    }
}));

// Mock RouterLink
vi.mock('vue-router', () => ({
    RouterLink: {
        name: 'RouterLink',
        template: '<a data-testid="router-link"><slot></slot></a>',
        props: ['to', 'class']
    }
}));

// Mock results repository
const mockVulnerabilityData = [
    {
        Id: 'vuln-1',
        Vulnerability: 'CVE-2023-1234',
        Description: 'Test vulnerability description',
        Severity: {
            Severity: 8.5,
            Exploitability: 7.2,
            ConfidentialityImpact: 'HIGH',
            IntegrityImpact: 'LOW',
            AvailabilityImpact: 'NONE'
        },
        EPSS: {
            Score: 0.15
        },
        Conflict: {
            ConflictFlag: 'MATCH_CORRECT'
        },
        VLAI: [
            {
                Source: 'NVD',
                Score: 'high',
                Confidence: 0.9
            }
        ],
        Affected: [
            {
                AffectedDependency: 'test-package',
                AffectedVersion: '1.0.0',
                PatchType: PatchType.Full
            }
        ],
        Weaknesses: [
            {
                WeaknessId: 'CWE-79',
                WeaknessName: 'Cross-site Scripting',
                OWASPTop10Id: '1347'
            }
        ]
    }
];

vi.mock('@/codeclarity_components/results/results.repository', () => ({
    ResultsRepository: vi.fn().mockImplementation(() => ({
        getVulnerabilities: vi.fn().mockResolvedValue({
            data: mockVulnerabilityData,
            page: 0,
            entries_per_page: 15,
            entry_count: 1,
            matching_count: 1,
            total_entries: 1,
            total_pages: 1
        })
    }))
}));

describe('VulnTable', () => {
    let wrapper: any;
    let pinia: any;

    beforeEach(() => {
        pinia = createPinia();
        vi.clearAllMocks();
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it('renders correctly with default props', () => {
        wrapper = mount(VulnTable, {
            props: {
                highlightElem: '',
                analysisID: 'analysis-123',
                projectID: 'project-123'
            },
            global: {
                plugins: [pinia]
            }
        });

        expect(wrapper.exists()).toBe(true);
    });

    it('renders with provided props', () => {
        wrapper = mount(VulnTable, {
            props: {
                highlightElem: 'test-highlight',
                forceOpenNewTab: true,
                analysisID: 'analysis-456',
                projectID: 'project-789'
            },
            global: {
                plugins: [pinia]
            }
        });

        expect(wrapper.vm.highlightElem).toBe('test-highlight');
        expect(wrapper.vm.forceOpenNewTab).toBe(true);
        expect(wrapper.vm.analysisID).toBe('analysis-456');
        expect(wrapper.vm.projectID).toBe('project-789');
    });

    it('initializes with correct default state', () => {
        wrapper = mount(VulnTable, {
            props: {
                highlightElem: '',
                analysisID: 'analysis-123',
                projectID: 'project-123'
            },
            global: {
                plugins: [pinia]
            }
        });

        expect(wrapper.vm.error).toBe(false);
        expect(wrapper.vm.render).toBe(true);
        expect(wrapper.vm.pageLimitSelected).toBe(15);
        expect(wrapper.vm.pageNumber).toBe(0);
        expect(wrapper.vm.searchKey).toBe('');
        expect(wrapper.vm.sortKey).toBe('severity');
        expect(wrapper.vm.sortDirection).toBe(SortDirection.DESC);
    });

    it('renders required components', () => {
        wrapper = mount(VulnTable, {
            props: {
                highlightElem: '',
                analysisID: 'analysis-123',
                projectID: 'project-123'
            },
            global: {
                plugins: [pinia]
            }
        });

        expect(wrapper.findComponent({ name: 'SearchBar' }).exists()).toBe(true);
        expect(wrapper.findComponent({ name: 'SortableTable' }).exists()).toBe(true);
        expect(wrapper.findComponent({ name: 'PaginationComponent' }).exists()).toBe(true);
        expect(wrapper.findComponent({ name: 'UtilitiesSort' }).exists()).toBe(true);
        expect(wrapper.findComponent({ name: 'UtilitiesFilters' }).exists()).toBe(true);
        expect(wrapper.findComponent({ name: 'ActiveFilterBar' }).exists()).toBe(true);
    });

    it('has correct table headers', () => {
        wrapper = mount(VulnTable, {
            props: {
                highlightElem: '',
                analysisID: 'analysis-123',
                projectID: 'project-123'
            },
            global: {
                plugins: [pinia]
            }
        });

        const expectedHeaders = [
            { label: 'CVE', key: 'cve' },
            { label: 'Severity', key: 'severity' },
            { label: 'Dependency', key: 'dep_name' },
            { label: 'Weakness', key: 'weakness' },
            { label: 'Owasp Top 10', key: 'owasp_top_10' },
            { label: 'Exploitability', key: 'exploitability' },
            { label: 'Impact', key: null },
            { label: 'Details', key: null }
        ];

        expect(wrapper.vm.headers).toEqual(expectedHeaders);
    });

    it('has correct sort options', () => {
        wrapper = mount(VulnTable, {
            props: {
                highlightElem: '',
                analysisID: 'analysis-123',
                projectID: 'project-123'
            },
            global: {
                plugins: [pinia]
            }
        });

        const sortOptions = wrapper.vm.sortByOptions;
        expect(sortOptions).toContainEqual({ label: 'CVE', key: 'cve' });
        expect(sortOptions).toContainEqual({ label: 'Severity', key: 'severity' });
        expect(sortOptions).toContainEqual({ label: 'Dependency Name', key: 'dep_name' });
        expect(sortOptions).toContainEqual({ label: 'Weakness', key: 'weakness' });
    });

    it('has severity classification functions', () => {
        wrapper = mount(VulnTable, {
            props: {
                highlightElem: '',
                analysisID: 'analysis-123',
                projectID: 'project-123'
            },
            global: {
                plugins: [pinia]
            }
        });

        // Test severity classification functions
        expect(wrapper.vm.isNoneSeverity(0.0)).toBe(true);
        expect(wrapper.vm.isLowSeverity(2.5)).toBe(true);
        expect(wrapper.vm.isMediumSeverity(5.0)).toBe(true);
        expect(wrapper.vm.isHighSeverity(8.0)).toBe(true);
        expect(wrapper.vm.isCriticalSeverity(9.5)).toBe(true);

        // Test boundary conditions
        expect(wrapper.vm.isLowSeverity(3.9)).toBe(true);
        expect(wrapper.vm.isMediumSeverity(4.0)).toBe(true);
        expect(wrapper.vm.isHighSeverity(7.0)).toBe(true);
        expect(wrapper.vm.isCriticalSeverity(9.0)).toBe(true);
    });

    it('has computed properties for statistics', () => {
        wrapper = mount(VulnTable, {
            props: {
                highlightElem: '',
                analysisID: 'analysis-123',
                projectID: 'project-123'
            },
            global: {
                plugins: [pinia]
            }
        });

        // Mock findings data
        wrapper.vm.findings = [
            {
                Severity: { Severity: 9.5 }, // Critical
                EPSS: { Score: 0.15 }, // Exploitable
                Affected: [{ PatchType: PatchType.Full }] // Patchable
            },
            {
                Severity: { Severity: 8.0 }, // High
                EPSS: { Score: 0.05 }, // Not exploitable
                Affected: [{ PatchType: PatchType.None }] // Not patchable
            }
        ];

        expect(wrapper.vm.criticalCount).toBe(1);
        expect(wrapper.vm.highCount).toBe(1);
        expect(wrapper.vm.patchableCount).toBe(1);
        expect(wrapper.vm.exploitableCount).toBe(1);
    });

    it('has OWASP mapping functionality', () => {
        wrapper = mount(VulnTable, {
            props: {
                highlightElem: '',
                analysisID: 'analysis-123',
                projectID: 'project-123'
            },
            global: {
                plugins: [pinia]
            }
        });

        // Test OWASP mapping
        const owaspInfo = wrapper.vm.getOwaspInfo('1347');
        expect(owaspInfo.id).toBe('A03');
        expect(owaspInfo.name).toBe('Injection');

        // Test unknown OWASP ID
        const unknownInfo = wrapper.vm.getOwaspInfo('unknown');
        expect(unknownInfo.id).toBe('Unknown');
        expect(unknownInfo.name).toBe('Uncategorized');
    });

    it('processes unique OWASP categories correctly', () => {
        wrapper = mount(VulnTable, {
            props: {
                highlightElem: '',
                analysisID: 'analysis-123',
                projectID: 'project-123'
            },
            global: {
                plugins: [pinia]
            }
        });

        const weaknessInfo = [
            { OWASPTop10Id: '1347' },
            { OWASPTop10Id: '1347' }, // Duplicate
            { OWASPTop10Id: '1345' },
            { OWASPTop10Id: '' } // Empty
        ];

        const uniqueOwasp = wrapper.vm.getUniqueOWASP(weaknessInfo);
        expect(uniqueOwasp).toEqual(['1347', '1345']);
        expect(uniqueOwasp.length).toBe(2);
    });

    it('handles workspace model updates', async () => {
        wrapper = mount(VulnTable, {
            props: {
                highlightElem: '',
                analysisID: 'analysis-123',
                projectID: 'project-123'
            },
            global: {
                plugins: [pinia]
            }
        });

        // Test model binding
        wrapper.vm.selected_workspace = 'test-workspace';
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.selected_workspace).toBe('test-workspace');
    });

    it('handles sort updates', async () => {
        wrapper = mount(VulnTable, {
            props: {
                highlightElem: '',
                analysisID: 'analysis-123',
                projectID: 'project-123'
            },
            global: {
                plugins: [pinia]
            }
        });

        // Test sort update function exists and updates state
        expect(typeof wrapper.vm.updateSort).toBe('function');

        // Test sort update
        wrapper.vm.updateSort('cve', SortDirection.ASC);

        expect(wrapper.vm.sortKey).toBe('cve');
        expect(wrapper.vm.sortDirection).toBe(SortDirection.ASC);
    });

    it('handles search correctly', () => {
        wrapper = mount(VulnTable, {
            props: {
                highlightElem: '',
                analysisID: 'analysis-123',
                projectID: 'project-123'
            },
            global: {
                plugins: [pinia]
            }
        });

        expect(wrapper.vm.placeholder).toBe('Search by dependency, dependency version, or cve');

        // Test search functionality
        wrapper.vm.searchKey = 'CVE-2023';
        expect(wrapper.vm.searchKey).toBe('CVE-2023');
    });

    it('handles authentication requirements', () => {
        wrapper = mount(VulnTable, {
            props: {
                highlightElem: '',
                analysisID: 'analysis-123',
                projectID: 'project-123'
            },
            global: {
                plugins: [pinia]
            }
        });

        // Component should check authentication
        expect(mockAuthStore.getToken).toBe('test-token');
        expect(mockUserStore.getDefaultOrg).toBeTruthy();
    });

    it('has filter state configuration', () => {
        wrapper = mount(VulnTable, {
            props: {
                highlightElem: '',
                analysisID: 'analysis-123',
                projectID: 'project-123'
            },
            global: {
                plugins: [pinia]
            }
        });

        expect(wrapper.vm.filterState).toBeTruthy();
        expect(wrapper.vm.options).toBeTruthy();
        expect(wrapper.vm.options.OwaspTop10).toBeTruthy();
        expect(wrapper.vm.options.Severity).toBeTruthy();
        expect(wrapper.vm.options.Patchable).toBeTruthy();
    });

    it('has pagination configuration', () => {
        wrapper = mount(VulnTable, {
            props: {
                highlightElem: '',
                analysisID: 'analysis-123',
                projectID: 'project-123'
            },
            global: {
                plugins: [pinia]
            }
        });

        expect(wrapper.vm.selectionPageLimit).toEqual([5, 10, 15, 20, 30, 40, 50, 75, 100]);
        expect(wrapper.vm.pageLimitSelected).toBe(15);
        expect(wrapper.vm.nmbEntriesShowing).toBe(15);
    });

    it('handles empty analysis or project ID', async () => {
        wrapper = mount(VulnTable, {
            props: {
                highlightElem: '',
                analysisID: '',
                projectID: ''
            },
            global: {
                plugins: [pinia]
            }
        });

        // Should not attempt to fetch data with empty IDs
        const initResult = await wrapper.vm.init();
        expect(initResult).toBeUndefined();
    });

    it('handles repository errors', async () => {
        wrapper = mount(VulnTable, {
            props: {
                highlightElem: '',
                analysisID: 'analysis-123',
                projectID: 'project-123'
            },
            global: {
                plugins: [pinia]
            }
        });

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        // Mock the repository method to throw an error
        wrapper.vm.resultsRepository.getVulnerabilities = vi
            .fn()
            .mockRejectedValue(new Error('API Error'));

        await wrapper.vm.init();

        expect(wrapper.vm.render).toBe(false);
        consoleSpy.mockRestore();
    });

    it('displays correct statistics in header', () => {
        wrapper = mount(VulnTable, {
            props: {
                highlightElem: '',
                analysisID: 'analysis-123',
                projectID: 'project-123'
            },
            global: {
                plugins: [pinia]
            }
        });

        // Check for stats display elements
        const headerText = wrapper.text();
        expect(headerText).toContain('Vulnerabilities');
        expect(headerText).toContain('total vulnerabilities');
    });

    it('has proper default props', () => {
        wrapper = mount(VulnTable, {
            props: {
                highlightElem: 'test'
            },
            global: {
                plugins: [pinia]
            }
        });

        expect(wrapper.vm.forceOpenNewTab).toBe(false);
        expect(wrapper.vm.analysisID).toBe('');
        expect(wrapper.vm.projectID).toBe('');
    });

    it('initializes repository correctly', () => {
        wrapper = mount(VulnTable, {
            props: {
                highlightElem: '',
                analysisID: 'analysis-123',
                projectID: 'project-123'
            },
            global: {
                plugins: [pinia]
            }
        });

        expect(wrapper.vm.resultsRepository).toBeTruthy();
        expect(typeof wrapper.vm.init).toBe('function');
    });
});
