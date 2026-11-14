import { inject, type InjectionKey, type Ref, ref } from "vue";

import { CHART_WIDTH } from "./chart-format";

/** The width charts lay out at; the export step narrows it for one column. */
export const CHART_LAYOUT_WIDTH: InjectionKey<Ref<number>> =
  Symbol("chart-layout-width");

export function useChartWidth(): Ref<number> {
  return inject(CHART_LAYOUT_WIDTH, ref(CHART_WIDTH));
}
