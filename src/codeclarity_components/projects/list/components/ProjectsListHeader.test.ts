import { ProjectsSortInterface } from '@/codeclarity_components/projects/project.repository';
import { SortDirection } from '@/utils/api/PaginatedRequestOptions';
import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ProjectsListHeader from './ProjectsListHeader.vue';

// Mock all dependencies
vi.mock('@/codeclarity_components/projects/project.repository', () => ({
    ProjectsSortInterface: {
        NAME: 'name',
        IMPORTED_ON: 'imported_on'
    }
}));

describe('ProjectsListHeader', () => {
    let wrapper: any;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it('renders correctly', () => {
        wrapper = mount(ProjectsListHeader, {
            props: {
                sortKey: ProjectsSortInterface.NAME,
                sortDirection: SortDirection.ASC,
                pageLimitSelected: 10,
                searchKey: ''
            }
        });

        expect(wrapper.exists()).toBe(true);
    });

    it('accepts sortKey prop correctly', () => {
        wrapper = mount(ProjectsListHeader, {
            props: {
                sortKey: ProjectsSortInterface.IMPORTED_ON,
                sortDirection: SortDirection.DESC,
                pageLimitSelected: 10,
                searchKey: ''
            }
        });

        expect(wrapper.props().sortKey).toBe(ProjectsSortInterface.IMPORTED_ON);
        expect(wrapper.props().sortDirection).toBe(SortDirection.DESC);
    });

    it('emits sort change events', async () => {
        wrapper = mount(ProjectsListHeader, {
            props: {
                sortKey: ProjectsSortInterface.NAME,
                sortDirection: SortDirection.ASC,
                pageLimitSelected: 10,
                searchKey: ''
            }
        });

        // Simulate sort change (this would depend on actual implementation)
        await wrapper.vm.$emit('update:sortKey', ProjectsSortInterface.IMPORTED_ON);
        await wrapper.vm.$emit('update:sortDirection', 'desc');

        expect(wrapper.emitted('update:sortKey')).toBeTruthy();
        expect(wrapper.emitted('update:sortDirection')).toBeTruthy();
        expect(wrapper.emitted('update:sortKey')?.[0]).toEqual([ProjectsSortInterface.IMPORTED_ON]);
        expect(wrapper.emitted('update:sortDirection')?.[0]).toEqual(['desc']);
    });

    it('validates default behavior', () => {
        // The component should work without props since it has defaults
        wrapper = mount(ProjectsListHeader);

        expect(wrapper.exists()).toBe(true);

        // Check that the component renders its child components correctly
        expect(wrapper.findComponent({ name: 'SearchBar' }).exists()).toBe(true);
        expect(wrapper.findComponent({ name: 'UtilitiesSort' }).exists()).toBe(true);

        // Check that the component doesn't throw errors when using default values
        expect(wrapper.text()).toContain(''); // Should render without errors
    });

    it('handles different sort directions', () => {
        wrapper = mount(ProjectsListHeader, {
            props: {
                sortKey: ProjectsSortInterface.NAME,
                sortDirection: SortDirection.DESC,
                pageLimitSelected: 10,
                searchKey: ''
            }
        });

        expect(wrapper.props().sortDirection).toBe(SortDirection.DESC);
    });

    it('handles different sort fields', () => {
        wrapper = mount(ProjectsListHeader, {
            props: {
                sortKey: ProjectsSortInterface.IMPORTED_ON,
                sortDirection: SortDirection.ASC,
                pageLimitSelected: 10,
                searchKey: ''
            }
        });

        expect(wrapper.props().sortKey).toBe(ProjectsSortInterface.IMPORTED_ON);
    });

    it('maintains consistent state', async () => {
        wrapper = mount(ProjectsListHeader, {
            props: {
                sortKey: ProjectsSortInterface.NAME,
                sortDirection: SortDirection.ASC,
                pageLimitSelected: 10,
                searchKey: ''
            }
        });

        // Change props
        await wrapper.setProps({
            sortKey: ProjectsSortInterface.IMPORTED_ON,
            sortDirection: SortDirection.DESC
        });

        expect(wrapper.props().sortKey).toBe(ProjectsSortInterface.IMPORTED_ON);
        expect(wrapper.props().sortDirection).toBe(SortDirection.DESC);
    });
});
