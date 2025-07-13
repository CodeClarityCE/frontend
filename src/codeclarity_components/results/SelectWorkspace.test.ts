import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia } from 'pinia';
import SelectWorkspace from './SelectWorkspace.vue';
import { WorkspacesOutput } from './workspace.entity';
import { ResultsRepository } from './results.repository';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';

// Mock stores
const mockUserStore = {
    getDefaultOrg: { id: 'org-1', name: 'Test Org' },
    getUser: {
        default_org: { id: 'org-1', name: 'Test Org' }
    }
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

// Mock results repository
const mockWorkspacesResponse = {
    data: {
        workspaces: ['workspace1', 'workspace2', 'workspace3'],
        package_manager: 'npm'
    }
};

vi.mock('./results.repository', () => ({
    ResultsRepository: vi.fn().mockImplementation(() => ({
        getSbomWorkspaces: vi.fn().mockResolvedValue(mockWorkspacesResponse)
    }))
}));

// Mock Shadcn select components
vi.mock('@/shadcn/ui/select', () => ({
    Select: {
        name: 'Select',
        template: '<div data-testid="select"><slot></slot></div>',
        emits: ['update:modelValue']
    },
    SelectContent: {
        name: 'SelectContent',
        template: '<div data-testid="select-content"><slot></slot></div>'
    },
    SelectGroup: {
        name: 'SelectGroup',
        template: '<div data-testid="select-group"><slot></slot></div>'
    },
    SelectItem: {
        name: 'SelectItem',
        template: '<div data-testid="select-item" :data-value="value"><slot></slot></div>',
        props: ['value']
    },
    SelectLabel: {
        name: 'SelectLabel',
        template: '<div data-testid="select-label"><slot></slot></div>'
    },
    SelectTrigger: {
        name: 'SelectTrigger',
        template: '<button data-testid="select-trigger" class="w-[180px]"><slot></slot></button>',
        props: ['class']
    },
    SelectValue: {
        name: 'SelectValue',
        template: '<span data-testid="select-value">Select a workspace</span>',
        props: ['placeholder']
    }
}));

describe('SelectWorkspace', () => {
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

    it('renders correctly with default props', async () => {
        wrapper = mount(SelectWorkspace, {
            global: {
                plugins: [pinia]
            }
        });

        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find('[data-testid="select"]').exists()).toBe(true);
        expect(wrapper.find('[data-testid="select-trigger"]').exists()).toBe(true);
    });

    it('renders with provided projectID and analysisID props', async () => {
        wrapper = mount(SelectWorkspace, {
            props: {
                projectID: 'project-123',
                analysisID: 'analysis-456'
            },
            global: {
                plugins: [pinia]
            }
        });

        await flushPromises();
        expect(wrapper.exists()).toBe(true);
    });

    it('displays workspace options after loading', async () => {
        wrapper = mount(SelectWorkspace, {
            props: {
                projectID: 'project-123',
                analysisID: 'analysis-456'
            },
            global: {
                plugins: [pinia]
            }
        });

        await flushPromises();

        const selectItems = wrapper.findAll('[data-testid="select-item"]');
        expect(selectItems.length).toBe(3);
        expect(selectItems[0].text()).toBe('workspace1');
        expect(selectItems[1].text()).toBe('workspace2');
        expect(selectItems[2].text()).toBe('workspace3');
    });

    it('shows select label correctly', async () => {
        wrapper = mount(SelectWorkspace, {
            props: {
                projectID: 'project-123',
                analysisID: 'analysis-456'
            },
            global: {
                plugins: [pinia]
            }
        });

        await flushPromises();

        const selectLabel = wrapper.find('[data-testid="select-label"]');
        expect(selectLabel.exists()).toBe(true);
        expect(selectLabel.text()).toBe('Workspaces');
    });

    it('displays placeholder text', () => {
        wrapper = mount(SelectWorkspace, {
            global: {
                plugins: [pinia]
            }
        });

        const selectValue = wrapper.find('[data-testid="select-value"]');
        expect(selectValue.exists()).toBe(true);
        expect(selectValue.text()).toBe('Select a workspace');
    });

    it('has correct CSS classes on trigger', () => {
        wrapper = mount(SelectWorkspace, {
            global: {
                plugins: [pinia]
            }
        });

        const selectTrigger = wrapper.find('[data-testid="select-trigger"]');
        expect(selectTrigger.classes()).toContain('w-[180px]');
    });

    it('handles repository error gracefully', async () => {
        const mockErrorRepo = {
            getSbomWorkspaces: vi.fn().mockRejectedValue(new Error('API Error'))
        };

        vi.mocked(ResultsRepository).mockImplementation(() => mockErrorRepo as any);

        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        wrapper = mount(SelectWorkspace, {
            props: {
                projectID: 'project-123',
                analysisID: 'analysis-456'
            },
            global: {
                plugins: [pinia]
            }
        });

        await flushPromises();

        expect(consoleError).toHaveBeenCalled();
        expect(wrapper.vm.error).toBe(true);

        consoleError.mockRestore();
    });

    it('does not call repository when no default org', async () => {
        const mockUserStoreNoOrg = {
            getDefaultOrg: null,
            getUser: null
        };

        vi.mocked(useUserStore).mockReturnValue(mockUserStoreNoOrg as any);

        const mockRepo = {
            getSbomWorkspaces: vi.fn()
        };

        vi.mocked(ResultsRepository).mockImplementation(() => mockRepo as any);

        wrapper = mount(SelectWorkspace, {
            props: {
                projectID: 'project-123',
                analysisID: 'analysis-456'
            },
            global: {
                plugins: [pinia]
            }
        });

        await flushPromises();

        expect(mockRepo.getSbomWorkspaces).not.toHaveBeenCalled();
    });

    it('does not call repository when not authenticated', async () => {
        const mockAuthStoreNotAuth = {
            getToken: null,
            getAuthenticated: false
        };

        vi.mocked(useAuthStore).mockReturnValue(mockAuthStoreNotAuth as any);

        const mockRepo = {
            getSbomWorkspaces: vi.fn()
        };

        vi.mocked(ResultsRepository).mockImplementation(() => mockRepo as any);

        wrapper = mount(SelectWorkspace, {
            props: {
                projectID: 'project-123',
                analysisID: 'analysis-456'
            },
            global: {
                plugins: [pinia]
            }
        });

        await flushPromises();

        expect(mockRepo.getSbomWorkspaces).not.toHaveBeenCalled();
    });

    it('calls repository with correct parameters', async () => {
        // Reset mocks to ensure clean state
        vi.mocked(useUserStore).mockReturnValue(mockUserStore as any);
        vi.mocked(useAuthStore).mockReturnValue(mockAuthStore as any);

        const mockRepo = {
            getSbomWorkspaces: vi.fn().mockResolvedValue(mockWorkspacesResponse)
        };

        vi.mocked(ResultsRepository).mockImplementation(() => mockRepo as any);

        wrapper = mount(SelectWorkspace, {
            props: {
                projectID: 'project-123',
                analysisID: 'analysis-456'
            },
            global: {
                plugins: [pinia]
            }
        });

        await flushPromises();

        expect(mockRepo.getSbomWorkspaces).toHaveBeenCalledWith({
            orgId: 'org-1',
            projectId: 'project-123',
            analysisId: 'analysis-456',
            bearerToken: 'test-token',
            handleBusinessErrors: true
        });
    });

    it('updates selected workspace model on selection', async () => {
        wrapper = mount(SelectWorkspace, {
            props: {
                projectID: 'project-123',
                analysisID: 'analysis-456',
                'onUpdate:selected_workspace': (value: string) => {
                    wrapper.setProps({ selected_workspace: value });
                }
            },
            global: {
                plugins: [pinia]
            }
        });

        await flushPromises();

        const select = wrapper.findComponent({ name: 'Select' });
        await select.vm.$emit('update:modelValue', 'workspace2');

        expect(wrapper.vm.selected_workspace).toBe('workspace2');
    });

    it('handles null/undefined selection gracefully', async () => {
        wrapper = mount(SelectWorkspace, {
            props: {
                projectID: 'project-123',
                analysisID: 'analysis-456'
            },
            global: {
                plugins: [pinia]
            }
        });

        await flushPromises();

        const select = wrapper.findComponent({ name: 'Select' });
        await select.vm.$emit('update:modelValue', null);

        expect(wrapper.vm.selected_workspace).toBe('');
    });

    it('has correct default values for props', () => {
        wrapper = mount(SelectWorkspace, {
            global: {
                plugins: [pinia]
            }
        });

        expect(wrapper.vm.projectID).toBe('');
        expect(wrapper.vm.analysisID).toBe('');
    });

    it('initializes workspaces as empty WorkspacesOutput', () => {
        wrapper = mount(SelectWorkspace, {
            global: {
                plugins: [pinia]
            }
        });

        expect(wrapper.vm.workspaces).toBeInstanceOf(WorkspacesOutput);
        expect(wrapper.vm.workspaces.workspaces).toBeUndefined();
    });

    it('has correct model defaults', () => {
        wrapper = mount(SelectWorkspace, {
            global: {
                plugins: [pinia]
            }
        });

        expect(wrapper.vm.error).toBe(false);
        expect(wrapper.vm.selected_workspace).toBe('.');
    });
});
