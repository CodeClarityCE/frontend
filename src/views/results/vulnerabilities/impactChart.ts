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

    const chart_data = {
        labels: ['Confidentiality', 'Availability', 'Integrity'],
        datasets: [
            {
                data: data,
                fill: true,
                backgroundColor: 'rgb(0, 80, 128, 0.4)',
                borderColor: 'rgb(0, 80, 128)',
                pointBackgroundColor: 'rgb(0, 80, 128, 0.4)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(0, 80, 128, 0.4)',
                pointRadius: 0.0
            }
        ]
    };
    return chart_data;
}

function getRadarChartConfig() {
    const dependency_dist_config = {
        spanGaps: true,
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

export {
    getRadarChartData,
    getRadarChartConfig,
    getContinousFromDiscreteCVSS2,
    getContinousFromDiscreteCVSS3
};
