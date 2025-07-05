/**
 * Ultra-Simple Mock Data for Dashboard Development
 *
 * Just the basics - easy to understand and modify.
 */
export function useMockData() {
    // Simple dashboard stats
    const stats = {
        critical: 14,
        high: 10,
        projects: 24,
        score: 7.8
    };

    // Simple activity feed
    const activities = [
        {
            id: 1,
            title: 'Critical vulnerability found',
            description: 'CVE-2025-1234 needs attention',
            time: '2 hours ago',
            variant: 'danger',
            icon: 'solar:danger-triangle-bold'
        },
        {
            id: 2,
            title: 'Security patches applied',
            description: '5 vulnerabilities resolved',
            time: '1 day ago',
            variant: 'success',
            icon: 'solar:check-circle-bold'
        },
        {
            id: 3,
            title: 'New project scanned',
            description: 'Frontend-v2 added to dashboard',
            time: '2 days ago',
            variant: 'primary',
            icon: 'solar:add-circle-bold'
        }
    ];

    // Simple recommendations
    const recommendations = [
        {
            id: 1,
            title: 'Fix Critical Issues',
            description: '14 critical vulnerabilities need immediate attention',
            variant: 'danger',
            icon: 'solar:danger-triangle-bold'
        },
        {
            id: 2,
            title: 'Update Dependencies',
            description: '8 packages have security updates available',
            variant: 'primary',
            icon: 'solar:refresh-bold'
        },
        {
            id: 3,
            title: 'Review Licenses',
            description: 'Check new license requirements',
            variant: 'warning',
            icon: 'solar:document-text-bold'
        }
    ];

    return {
        stats,
        activities,
        recommendations
    };
}
