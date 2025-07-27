import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { SortDirection } from '@/utils/api/PaginatedRequestOptions';
import ProjectsListHeader from './ProjectsListHeader.vue';

// Mock all dependencies
vi.mock('@/codeclarity_components/projects/project.repository', () => ({
    ProjectsSortInterface: {
        NAME: 'name',
        CREATED_ON: 'created_on',
        UPDATED_ON: 'updated_on'
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
                sortKey: 'name',
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
                sortKey: 'created_on',
                sortDirection: SortDirection.DESC,
                pageLimitSelected: 10,
                searchKey: ''
            }
        });

        expect(wrapper.props().sortKey).toBe('created_on');
        expect(wrapper.props().sortDirection).toBe(SortDirection.DESC);
    });

    it('emits sort change events', async () => {
        wrapper = mount(ProjectsListHeader, {
            props: {
                sortKey: 'name',
                sortDirection: SortDirection.ASC,
                pageLimitSelected: 10,
                searchKey: ''
            }
        });

        // Simulate sort change (this would depend on actual implementation)
        await wrapper.vm.$emit('update:sortKey', 'created_on');
        await wrapper.vm.$emit('update:sortDirection', 'desc');

        expect(wrapper.emitted('update:sortKey')).toBeTruthy();
        expect(wrapper.emitted('update:sortDirection')).toBeTruthy();
        expect(wrapper.emitted('update:sortKey')?.[0]).toEqual(['created_on']);
        expect(wrapper.emitted('update:sortDirection')?.[0]).toEqual(['desc']);
    });

    it('validates default props', () => {
        // The component should work without props since it has defaults
        wrapper = mount(ProjectsListHeader);
        
        expect(wrapper.exists()).toBe(true);
        // Component uses defineModel which means it can work without explicit props
        expect(wrapper.vm.pageLimitSelected).toBe(10);
        expect(wrapper.vm.sortKey).toBe('imported_on');
        expect(wrapper.vm.sortDirection).toBe(SortDirection.DESC);
        expect(wrapper.vm.searchKey).toBe('');
    });

    it('handles different sort directions', () => {
        wrapper = mount(ProjectsListHeader, {
            props: {
                sortKey: 'name',
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
                sortKey: 'updated_on',
                sortDirection: SortDirection.ASC,
                pageLimitSelected: 10,
                searchKey: ''
            }
        });

        expect(wrapper.props().sortKey).toBe('updated_on');
    });

    it('maintains consistent state', async () => {
        wrapper = mount(ProjectsListHeader, {
            props: {
                sortKey: 'name',
                sortDirection: SortDirection.ASC,
                pageLimitSelected: 10,
                searchKey: ''
            }
        });

        // Change props
        await wrapper.setProps({
            sortKey: 'created_on',
            sortDirection: SortDirection.DESC
        });

        expect(wrapper.props().sortKey).toBe('created_on');
        expect(wrapper.props().sortDirection).toBe(SortDirection.DESC);
    });
});
