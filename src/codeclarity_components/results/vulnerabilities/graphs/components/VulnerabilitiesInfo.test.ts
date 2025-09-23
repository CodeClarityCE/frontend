import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import VulnerabilitiesInfo from './VulnerabilitiesInfo.vue';

// Mock DoughnutChart component
vi.mock('@/base_components/data-display/charts/DoughnutChart.vue', () => ({
    default: {
        name: 'DoughnutChart',
        props: ['id', 'data', 'options'],
        template: '<div class="mock-doughnut-chart" :id="id">DoughnutChart</div>'
    }
}));

// Mock BulletLegend component
vi.mock('./BulletLegend.vue', () => ({
    default: {
        name: 'BulletLegend',
        props: ['items'],
        template: '<div class="mock-bullet-legend">BulletLegend</div>'
    }
}));

describe('VulnerabilitiesInfo.vue', () => {
    const createMockStats = (overrides = {}) => {
        return {
            number_of_critical: 5,
            number_of_high: 12,
            number_of_medium: 8,
            number_of_low: 3,
            number_of_none: 2,
            ...overrides
        };
    };

    const createWrapper = (stats = createMockStats()) => {
        return mount(VulnerabilitiesInfo, {
            props: {
                stats
            }
        });
    };

    describe('Component Rendering', () => {
        it('should render the main container', () => {
            const wrapper = createWrapper();

            expect(wrapper.find('.p-2').exists()).toBe(true);
            expect(wrapper.find('.flex.flex-row.justify-center.items-center.gap-2').exists()).toBe(
                true
            );
        });

        it('should render DoughnutChart component', () => {
            const wrapper = createWrapper();

            const doughnutChart = wrapper.findComponent({ name: 'DoughnutChart' });
            expect(doughnutChart.exists()).toBe(true);
            expect(doughnutChart.props('id')).toBe('vulnDoughnutChart');
        });

        it('should render BulletLegend component', () => {
            const wrapper = createWrapper();

            const bulletLegend = wrapper.findComponent({ name: 'BulletLegend' });
            expect(bulletLegend.exists()).toBe(true);
        });
    });

    describe('Data Processing', () => {
        it('should create correct doughnut chart data structure', () => {
            const stats = createMockStats({
                number_of_critical: 3,
                number_of_high: 7,
                number_of_medium: 5,
                number_of_low: 2,
                number_of_none: 1
            });
            const wrapper = createWrapper(stats);

            const doughnutChart = wrapper.findComponent({ name: 'DoughnutChart' });
            const chartData = doughnutChart.props('data');

            expect(chartData).toHaveLength(5);

            const expectedData = [
                { label: 'Critical', color: '#000000', count: 3 },
                { label: 'High', color: '#bf1313', count: 7 },
                { label: 'Medium', color: '#ffc107', count: 5 },
                { label: 'Low', color: '#5a9d09', count: 2 },
                { label: 'None', color: '#09889d', count: 1 }
            ];

            expect(chartData).toEqual(expectedData);
        });

        it('should use predefined color scheme', () => {
            const wrapper = createWrapper();

            const doughnutChart = wrapper.findComponent({ name: 'DoughnutChart' });
            const chartData = doughnutChart.props('data');

            const expectedColors = ['#000000', '#bf1313', '#ffc107', '#5a9d09', '#09889d'];

            chartData.forEach((item: any, index: number) => {
                expect(item.color).toBe(expectedColors[index]);
            });
        });

        it('should map severity levels correctly', () => {
            const stats = createMockStats({
                number_of_critical: 10,
                number_of_high: 20,
                number_of_medium: 30,
                number_of_low: 40,
                number_of_none: 50
            });
            const wrapper = createWrapper(stats);

            const doughnutChart = wrapper.findComponent({ name: 'DoughnutChart' });
            const chartData = doughnutChart.props('data');

            const criticalItem = chartData.find((item: any) => item.label === 'Critical');
            const highItem = chartData.find((item: any) => item.label === 'High');
            const mediumItem = chartData.find((item: any) => item.label === 'Medium');
            const lowItem = chartData.find((item: any) => item.label === 'Low');
            const noneItem = chartData.find((item: any) => item.label === 'None');

            expect(criticalItem.count).toBe(10);
            expect(highItem.count).toBe(20);
            expect(mediumItem.count).toBe(30);
            expect(lowItem.count).toBe(40);
            expect(noneItem.count).toBe(50);
        });
    });

    describe('Props Validation', () => {
        it('should accept stats prop with severity counts', () => {
            const stats = createMockStats();
            const wrapper = createWrapper(stats);

            expect(wrapper.props('stats')).toEqual(stats);
        });

        it('should pass data to DoughnutChart component', () => {
            const wrapper = createWrapper();

            const doughnutChart = wrapper.findComponent({ name: 'DoughnutChart' });
            const chartData = doughnutChart.props('data');

            expect(Array.isArray(chartData)).toBe(true);
            expect(chartData.length).toBe(5);

            chartData.forEach((item: any) => {
                expect(item).toHaveProperty('label');
                expect(item).toHaveProperty('color');
                expect(item).toHaveProperty('count');
            });
        });

        it('should pass same data to BulletLegend component', () => {
            const wrapper = createWrapper();

            const doughnutChart = wrapper.findComponent({ name: 'DoughnutChart' });
            const bulletLegend = wrapper.findComponent({ name: 'BulletLegend' });

            expect(bulletLegend.props('items')).toEqual(doughnutChart.props('data'));
        });
    });

    describe('Edge Cases', () => {
        it('should handle zero severity counts', () => {
            const stats = createMockStats({
                number_of_critical: 0,
                number_of_high: 0,
                number_of_medium: 0,
                number_of_low: 0,
                number_of_none: 0
            });
            const wrapper = createWrapper(stats);

            const doughnutChart = wrapper.findComponent({ name: 'DoughnutChart' });
            const chartData = doughnutChart.props('data');

            chartData.forEach((item: any) => {
                expect(item.count).toBe(0);
            });
        });

        it('should handle large severity counts', () => {
            const stats = createMockStats({
                number_of_critical: 9999,
                number_of_high: 8888,
                number_of_medium: 7777,
                number_of_low: 6666,
                number_of_none: 5555
            });
            const wrapper = createWrapper(stats);

            const doughnutChart = wrapper.findComponent({ name: 'DoughnutChart' });
            const chartData = doughnutChart.props('data');

            expect(chartData.find((item: any) => item.label === 'Critical').count).toBe(9999);
            expect(chartData.find((item: any) => item.label === 'High').count).toBe(8888);
            expect(chartData.find((item: any) => item.label === 'Medium').count).toBe(7777);
            expect(chartData.find((item: any) => item.label === 'Low').count).toBe(6666);
            expect(chartData.find((item: any) => item.label === 'None').count).toBe(5555);
        });

        it('should handle missing severity properties', () => {
            const stats = {} as any;
            const wrapper = createWrapper(stats);

            const doughnutChart = wrapper.findComponent({ name: 'DoughnutChart' });
            const chartData = doughnutChart.props('data');

            chartData.forEach((item: any) => {
                expect(item.count).toBeUndefined();
            });
        });

        it('should handle null severity values', () => {
            const stats = createMockStats({
                number_of_critical: null,
                number_of_high: null,
                number_of_medium: null,
                number_of_low: null,
                number_of_none: null
            });
            const wrapper = createWrapper(stats);

            const doughnutChart = wrapper.findComponent({ name: 'DoughnutChart' });
            const chartData = doughnutChart.props('data');

            chartData.forEach((item: any) => {
                expect(item.count).toBeNull();
            });
        });

        it('should handle negative severity counts', () => {
            const stats = createMockStats({
                number_of_critical: -1,
                number_of_high: -5,
                number_of_medium: 10,
                number_of_low: 0,
                number_of_none: -2
            });
            const wrapper = createWrapper(stats);

            const doughnutChart = wrapper.findComponent({ name: 'DoughnutChart' });
            const chartData = doughnutChart.props('data');

            expect(chartData.find((item: any) => item.label === 'Critical').count).toBe(-1);
            expect(chartData.find((item: any) => item.label === 'High').count).toBe(-5);
            expect(chartData.find((item: any) => item.label === 'Medium').count).toBe(10);
            expect(chartData.find((item: any) => item.label === 'Low').count).toBe(0);
            expect(chartData.find((item: any) => item.label === 'None').count).toBe(-2);
        });
    });

    describe('Chart Options', () => {
        it('should pass empty options to DoughnutChart', () => {
            const wrapper = createWrapper();

            const doughnutChart = wrapper.findComponent({ name: 'DoughnutChart' });
            expect(doughnutChart.props('options')).toEqual({});
        });

        it('should use correct chart ID', () => {
            const wrapper = createWrapper();

            const doughnutChart = wrapper.findComponent({ name: 'DoughnutChart' });
            expect(doughnutChart.props('id')).toBe('vulnDoughnutChart');
        });
    });

    describe('Color Scheme', () => {
        it('should maintain consistent color assignments', () => {
            const wrapper = createWrapper();

            const doughnutChart = wrapper.findComponent({ name: 'DoughnutChart' });
            const chartData = doughnutChart.props('data');

            expect(chartData[0].color).toBe('#000000'); // Critical
            expect(chartData[1].color).toBe('#bf1313'); // High
            expect(chartData[2].color).toBe('#ffc107'); // Medium
            expect(chartData[3].color).toBe('#5a9d09'); // Low
            expect(chartData[4].color).toBe('#09889d'); // None
        });

        it('should assign colors in severity order', () => {
            const wrapper = createWrapper();

            const doughnutChart = wrapper.findComponent({ name: 'DoughnutChart' });
            const chartData = doughnutChart.props('data');

            const labels = chartData.map((item: any) => item.label);
            expect(labels).toEqual(['Critical', 'High', 'Medium', 'Low', 'None']);
        });
    });

    describe('Layout and Styling', () => {
        it('should have correct CSS classes for layout', () => {
            const wrapper = createWrapper();

            expect(wrapper.find('.p-2').exists()).toBe(true);
            expect(wrapper.find('.flex.flex-row.justify-center.items-center.gap-2').exists()).toBe(
                true
            );
        });

        it('should center align chart and legend with gap', () => {
            const wrapper = createWrapper();

            const container = wrapper.find('.flex.flex-row.justify-center.items-center.gap-2');
            expect(container.exists()).toBe(true);
            expect(container.classes()).toContain('justify-center');
            expect(container.classes()).toContain('items-center');
            expect(container.classes()).toContain('gap-2');
        });

        it('should arrange legend and chart horizontally', () => {
            const wrapper = createWrapper();

            const container = wrapper.find('.flex.flex-row');
            expect(container.exists()).toBe(true);
            expect(container.classes()).toContain('flex-row');
        });
    });

    describe('Component Integration', () => {
        it('should maintain consistent data between chart and legend', () => {
            const wrapper = createWrapper();

            const doughnutChart = wrapper.findComponent({ name: 'DoughnutChart' });
            const bulletLegend = wrapper.findComponent({ name: 'BulletLegend' });

            const chartData = doughnutChart.props('data');
            const legendItems = bulletLegend.props('items');

            expect(chartData).toEqual(legendItems);
            expect(chartData.length).toBe(legendItems.length);
        });

        it('should pass complete data structure to both components', () => {
            const wrapper = createWrapper();

            const doughnutChart = wrapper.findComponent({ name: 'DoughnutChart' });
            const bulletLegend = wrapper.findComponent({ name: 'BulletLegend' });

            const chartData = doughnutChart.props('data');
            const legendItems = bulletLegend.props('items');

            [chartData, legendItems].forEach((data) => {
                expect(data).toHaveLength(5);
                data.forEach((item: any) => {
                    expect(item).toHaveProperty('label');
                    expect(item).toHaveProperty('color');
                    expect(item).toHaveProperty('count');
                    expect(typeof item.label).toBe('string');
                    expect(typeof item.color).toBe('string');
                });
            });
        });
    });

    describe('Data Structure Integrity', () => {
        it('should maintain proper data structure format', () => {
            const wrapper = createWrapper();

            const doughnutChart = wrapper.findComponent({ name: 'DoughnutChart' });
            const chartData = doughnutChart.props('data');

            expect(Array.isArray(chartData)).toBe(true);

            chartData.forEach((item: any) => {
                expect(item).toHaveProperty('label');
                expect(item).toHaveProperty('color');
                expect(item).toHaveProperty('count');
                expect(typeof item.label).toBe('string');
                expect(typeof item.color).toBe('string');
                expect(item.label).toMatch(/^(Critical|High|Medium|Low|None)$/);
                expect(item.color).toMatch(/^#[0-9a-fA-F]{6}$/);
            });
        });

        it('should maintain severity level order', () => {
            const wrapper = createWrapper();

            const doughnutChart = wrapper.findComponent({ name: 'DoughnutChart' });
            const chartData = doughnutChart.props('data');

            const labels = chartData.map((item: any) => item.label);
            expect(labels).toEqual(['Critical', 'High', 'Medium', 'Low', 'None']);
        });
    });

    describe('Data Integrity', () => {
        it('should use data from initial props', () => {
            const stats = createMockStats({
                number_of_critical: 15,
                number_of_high: 25,
                number_of_medium: 35,
                number_of_low: 45,
                number_of_none: 55
            });
            const wrapper = createWrapper(stats);

            const doughnutChart = wrapper.findComponent({ name: 'DoughnutChart' });
            const chartData = doughnutChart.props('data');

            expect(chartData.find((item: any) => item.label === 'Critical').count).toBe(15);
            expect(chartData.find((item: any) => item.label === 'High').count).toBe(25);
            expect(chartData.find((item: any) => item.label === 'Medium').count).toBe(35);
            expect(chartData.find((item: any) => item.label === 'Low').count).toBe(45);
            expect(chartData.find((item: any) => item.label === 'None').count).toBe(55);
        });
    });
});
