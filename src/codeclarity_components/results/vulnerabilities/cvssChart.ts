function getData(finding: any) {
    if (finding.severities.cvss_31 != null) {
        const base_score = finding.severities.cvss_31.base_score ?? 0.0;
        const exploitability = finding.severities.cvss_31.exploitability_score ?? 0.0;
        const impact = finding.severities.cvss_31.impact_score ?? 0.0;
        const max_exploitability = 3.9;
        const max_impact = 6.0;
        const max_base_score = 10.0;
        return [
            base_score / max_base_score == 0 ? 0.1 : base_score / max_base_score,
            impact / max_impact == 0 ? 0.1 : impact / max_impact,
            exploitability / max_exploitability == 0 ? 0.1 : exploitability / max_exploitability
        ];
    } else if (finding.severities.cvss_3 != null) {
        const base_score = finding.severities.cvss_3.base_score ?? 0.0;
        const exploitability = finding.severities.cvss_3.exploitability_score ?? 0.0;
        const impact = finding.severities.cvss_3.impact_score ?? 0.0;
        const max_exploitability = 3.9;
        const max_impact = 6.0;
        const max_base_score = 10.0;
        return [
            base_score / max_base_score == 0 ? 0.1 : base_score / max_base_score,
            impact / max_impact == 0 ? 0.1 : impact / max_impact,
            exploitability / max_exploitability == 0 ? 0.1 : exploitability / max_exploitability
        ];
    } else if (finding.severities.cvss_2 != null) {
        const base_score = finding.severities.cvss_2.base_score ?? 0.0;
        const exploitability = finding.severities.cvss_2.exploitability_score ?? 0.0;
        const impact = finding.severities.cvss_2.impact_score ?? 0.0;
        const max_exploitability = 10.0;
        const max_impact = 10.0;
        const max_base_score = 10.0;
        return [
            base_score / max_base_score == 0 ? 0.1 : base_score / max_base_score,
            impact / max_impact == 0 ? 0.1 : impact / max_impact,
            exploitability / max_exploitability == 0 ? 0.1 : exploitability / max_exploitability
        ];
    }
    return null;
}

function getRadarChartData(finding: any) {
    const data = getData(finding);
    const chart_data = {
        labels: ['Base Score', 'Impact', 'Exploitability'],
        datasets: [
            {
                data: data,
                fill: true,
                backgroundColor: 'rgb(0, 94, 102, 0.4)',
                borderColor: 'rgb(0, 94, 102)',
                pointBackgroundColor: 'rgb(0, 94, 102, 0.4)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(0, 94, 102, 0.4)',
                pointRadius: 0.0
            }
        ]
    };
    return chart_data;
}

function getRadarChartConfig() {
    const dependency_dist_config = {
        elements: {
            line: {
                borderWidth: 0
            }
        },
        plugins: {
            legend: {
                display: false
            },
            datalabels: {
                display: false
            }
        },
        scale: {
            beginAtZero: true,
            max: 1.0,
            min: 0,
            stepSize: 0.5
        },
        scales: {
            r: {
                pointLabels: {
                    display: false
                },
                ticks: {
                    display: false
                }
            }
        }
    };

    return dependency_dist_config;
}

export { getRadarChartData, getRadarChartConfig };
