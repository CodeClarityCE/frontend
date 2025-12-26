<script setup lang="ts">
import type {
  BarChartData,
  BarChartOptions,
} from "@/base_components/data-display/charts/barChart";
import BarChart from "@/base_components/data-display/charts/BarChart.vue";
import BulletLegend from "./BulletLegend.vue";

// Props
const props = defineProps<{
  stats: {
    number_of_owasp_top_10_2021_a1: number;
    number_of_owasp_top_10_2021_a2: number;
    number_of_owasp_top_10_2021_a3: number;
    number_of_owasp_top_10_2021_a4: number;
    number_of_owasp_top_10_2021_a5: number;
    number_of_owasp_top_10_2021_a6: number;
    number_of_owasp_top_10_2021_a7: number;
    number_of_owasp_top_10_2021_a8: number;
    number_of_owasp_top_10_2021_a9: number;
    number_of_owasp_top_10_2021_a10: number;
    number_of_vulnerabilities: number;
  };
}>();

const owaspLabels = [
  "A01: Broken Access Control",
  "A02: Cryptographic Failures",
  "A03: Injection",
  "A04: Insecure Design",
  "A05: Security Misconfiguration",
  "A06: Vulnerable and Outdated Components",
  "A07: Identification and Authentication Failures",
  "A08: Software and Data Integrity Failures",
  "A09: Security Logging and Monitoring Failures",
  "A10: Server-Side Request Forgery",
];

const owaspColors = [
  "#003532", // A01
  "#1A4876", // A02
  "#008491", // A03
  "#40E0D0", // A04
  "#FFD700", // A05
  "#FF8C00", // A06
  "#FF4500", // A07
  "#800080", // A08
  "#00CED1", // A09
  "#696969", // A10
  "#D3D3D3", // Uncategorized
];
const owaspValues = [
  props.stats.number_of_owasp_top_10_2021_a1,
  props.stats.number_of_owasp_top_10_2021_a2,
  props.stats.number_of_owasp_top_10_2021_a3,
  props.stats.number_of_owasp_top_10_2021_a4,
  props.stats.number_of_owasp_top_10_2021_a5,
  props.stats.number_of_owasp_top_10_2021_a6,
  props.stats.number_of_owasp_top_10_2021_a7,
  props.stats.number_of_owasp_top_10_2021_a8,
  props.stats.number_of_owasp_top_10_2021_a9,
  props.stats.number_of_owasp_top_10_2021_a10,
];

// data construction
const barChartLabels: string[] = [];
const barChartValues: number[] = [];
const barChartColors: string[] = [];

let colorIndex = 0;
let owaspTotal = 0;

// only consider non null values
owaspValues.forEach((value, index) => {
  if (value > 0) {
    barChartLabels.push(owaspLabels[index] ?? "");
    barChartValues.push(value);
    barChartColors.push(owaspColors[colorIndex] ?? "#D3D3D3");
    owaspTotal += value;
    colorIndex++;
  }
});

// number of uncategorized
if (owaspTotal < props.stats.number_of_vulnerabilities) {
  const uncategorizedCount = props.stats.number_of_vulnerabilities - owaspTotal;
  barChartLabels.push("Uncategorized");
  barChartValues.push(uncategorizedCount);
  barChartColors.push(owaspColors[10] ?? "#D3D3D3");
}

// construction of barChartData
const barChartData: BarChartData = [];

for (let i = 0; i < barChartLabels.length; i++) {
  barChartData.push({
    label: barChartLabels[i] ?? "",
    color: barChartColors[i] ?? "#D3D3D3",
    count: barChartValues[i] ?? 0,
  });
}

const barChartOptions: BarChartOptions = {}; // to complete if needed

// const fakeSampleBarChartData = [
//   {
//     label: 'A01: Broken Access Control',
//     color: '#003532',
//     count: 5
//   },
//   {
//     label: 'A02: Cryptographic Failures',
//     color: '#1A4876',
//     count: 3
//   },
//   {
//     label: 'A03: Injection',
//     color: '#008491',
//     count: 8
//   },
//   {
//     label: 'A05: Security Misconfiguration',
//     color: '#FFD700',
//     count: 2
//   },
//   {
//     label: 'A07: Identification and Authentication Failures',
//     color: '#FF4500',
//     count: 7
//   },
//   {
//     label: 'Uncategorized',
//     color: '#D3D3D3',
//     count: 5
//   }
// ];
</script>

<template>
  <div class="p-2">
    <div class="flex flex-col justify-center items-center gap-2">
      <BarChart
        :id="'barChartOwaspTopTen'"
        :data="barChartData"
        :options="barChartOptions"
      />
      <BulletLegend :items="barChartData" />
    </div>
  </div>
</template>
