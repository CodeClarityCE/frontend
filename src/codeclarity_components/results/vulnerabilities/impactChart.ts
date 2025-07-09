function getData(finding: any) {
    if (finding.severities.cvss_31 != null) {
        const confidentiality = getContinousFromDiscreteCVSS3(
            finding.severities.cvss_31.confidentiality_impact
        );
        const availability = getContinousFromDiscreteCVSS3(
            finding.severities.cvss_31.availability_impact
        );
        const integrity = getContinousFromDiscreteCVSS3(
            finding.severities.cvss_31.integrity_impact
        );
        const max_confidentiality = 0.56;
        const max_availability = 0.56;
        const max_integrity = 0.56;
        return [
            confidentiality / max_confidentiality == 0
                ? 0.1
                : confidentiality / max_confidentiality,
            integrity / max_integrity == 0 ? 0.1 : integrity / max_integrity,
            availability / max_availability == 0 ? 0.1 : availability / max_availability
        ];
    } else if (finding.severities.cvss_3 != null) {
        const confidentiality = getContinousFromDiscreteCVSS3(
            finding.severities.cvss_3.confidentiality_impact
        );
        const availability = getContinousFromDiscreteCVSS3(
            finding.severities.cvss_3.availability_impact
        );
        const integrity = getContinousFromDiscreteCVSS3(finding.severities.cvss_3.integrity_impact);
        const max_confidentiality = 0.56;
        const max_availability = 0.56;
        const max_integrity = 0.56;
        return [
            confidentiality / max_confidentiality == 0
                ? 0.1
                : confidentiality / max_confidentiality,
            integrity / max_integrity == 0 ? 0.1 : integrity / max_integrity,
            availability / max_availability == 0 ? 0.1 : availability / max_availability
        ];
    } else if (finding.severities.cvss_2 != null) {
        const confidentiality = getContinousFromDiscreteCVSS2(
            finding.severities.cvss_2.confidentiality_impact
        );
        const availability = getContinousFromDiscreteCVSS2(
            finding.severities.cvss_2.availability_impact
        );
        const integrity = getContinousFromDiscreteCVSS2(finding.severities.cvss_2.integrity_impact);
        const max_confidentiality = 0.66;
        const max_availability = 0.66;
        const max_integrity = 0.66;
        return [
            confidentiality / max_confidentiality == 0
                ? 0.1
                : confidentiality / max_confidentiality,
            integrity / max_integrity == 0 ? 0.1 : integrity / max_integrity,
            availability / max_availability == 0 ? 0.1 : availability / max_availability
        ];
    }
    return null;
}

function getContinousFromDiscreteCVSS2(value: string) {
    if (value == 'COMPLETE') {
        return 0.66;
    } else if (value == 'PARTIAL') {
        return 0.275;
    } else {
        return 0.0;
    }
}

function getContinousFromDiscreteCVSS3(value: string) {
    if (value == 'HIGH') {
        return 0.56;
    } else if (value == 'LOW') {
        return 0.22;
    } else {
        return 0.0;
    }
}

function getRadarChartData(finding: any) {
    const data = getData(finding);
    if (!data) return null;

    // Convert to d3 RadarChart format
    const d3_data = [
        {
            name: 'Impact Scores',
            axes: [
                {
                    axis: 'Confidentiality',
                    value: data[0] * 100 // Convert to percentage for d3
                },
                {
                    axis: 'Integrity',
                    value: data[1] * 100
                },
                {
                    axis: 'Availability',
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

export {
    getRadarChartData,
    getRadarChartConfig,
    getContinousFromDiscreteCVSS2,
    getContinousFromDiscreteCVSS3
};
