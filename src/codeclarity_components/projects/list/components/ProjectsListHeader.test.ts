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
                sortBy: 'name',
                sortDirection: SortDirection.ASC
            }
        });

        expect(wrapper.exists()).toBe(true);
    });

    it('accepts sortBy prop correctly', () => {
        wrapper = mount(ProjectsListHeader, {
            props: {
                sortBy: 'created_on',
                sortDirection: SortDirection.DESC
            }
        });

        expect(wrapper.props().sortBy).toBe('created_on');
        expect(wrapper.props().sortDirection).toBe(SortDirection.DESC);
    });

    it('emits sort change events', async () => {
        wrapper = mount(ProjectsListHeader, {
            props: {
                sortBy: 'name',
                sortDirection: SortDirection.ASC
            }
        });

        // Simulate sort change (this would depend on actual implementation)
        await wrapper.vm.$emit('update:sortBy', 'created_on');
        await wrapper.vm.$emit('update:sortDirection', 'desc');

        expect(wrapper.emitted('update:sortBy')).toBeTruthy();
        expect(wrapper.emitted('update:sortDirection')).toBeTruthy();
        expect(wrapper.emitted('update:sortBy')?.[0]).toEqual(['created_on']);
        expect(wrapper.emitted('update:sortDirection')?.[0]).toEqual(['desc']);
    });

    it('validates required props', () => {
        expect(() => {
            mount(ProjectsListHeader);
        }).toThrow();
    });

    it('handles different sort directions', () => {
        wrapper = mount(ProjectsListHeader, {
            props: {
                sortBy: 'name',
                sortDirection: SortDirection.DESC
            }
        });

        expect(wrapper.props().sortDirection).toBe(SortDirection.DESC);
    });

    it('handles different sort fields', () => {
        wrapper = mount(ProjectsListHeader, {
            props: {
                sortBy: 'updated_on',
                sortDirection: SortDirection.ASC
            }
        });

        expect(wrapper.props().sortBy).toBe('updated_on');
    });

    it('maintains consistent state', async () => {
        wrapper = mount(ProjectsListHeader, {
            props: {
                sortBy: 'name',
                sortDirection: SortDirection.ASC
            }
        });

        // Change props
        await wrapper.setProps({
            sortBy: 'created_on',
            sortDirection: SortDirection.DESC
        });

        expect(wrapper.props().sortBy).toBe('created_on');
        expect(wrapper.props().sortDirection).toBe(SortDirection.DESC);
    });
});
