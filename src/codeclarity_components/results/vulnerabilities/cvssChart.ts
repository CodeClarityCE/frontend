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
    if (!data) return null;

    // Convert to d3 RadarChart format
    const d3_data = [
        {
            name: 'CVSS Scores',
            axes: [
                {
                    axis: 'Base Score',
                    value: data[0] * 100 // Convert to percentage for d3
                },
                {
                    axis: 'Impact',
                    value: data[1] * 100
                },
                {
                    axis: 'Exploitability',
                    value: data[2] * 100
                }
            ]
        }
    ];
    return d3_data;
}

function getRadarChartConfig() {
    // Return d3 RadarChart configuration
    const d3_config = {
        w: 300,
        h: 300,
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
        levels: 5,
        maxValue: 100,
        labelFactor: 1.15,
        wrapWidth: 40,
        opacityArea: 0.35,
        dotRadius: 3,
        opacityCircles: 0.1,
        strokeWidth: 2,
        roundStrokes: false,
        legend: false
    };

    return d3_config;
}

export { getRadarChartData, getRadarChartConfig };
