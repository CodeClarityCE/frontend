import type { InjectionKey, Ref } from "vue";

import type {
  FigureCatalog,
  FigureChoice,
  FigureDefinition,
  FigureMetric,
} from "../experiment-figure.entity";

/** Lets a result block start the composer, provided by the experiment page. */
export interface FigureComposerLink {
  catalog: Ref<FigureCatalog | null>;
  open: (definition: FigureDefinition) => void;
}

export const OPEN_AS_FIGURE: InjectionKey<FigureComposerLink> =
  Symbol("open-as-figure");

function allowed<T extends FigureChoice>(
  all: readonly T[],
  ids: readonly string[] | undefined,
): readonly T[] {
  return ids ? all.filter((choice) => ids.includes(choice.id)) : all;
}

function filtersValid(
  metric: FigureMetric,
  formFilters: readonly string[] | undefined,
  filters: Record<string, string>,
): boolean {
  const offered = allowed(metric.filters, formFilters);
  return Object.entries(filters).every(([id, value]) => {
    const filter = offered.find((item) => item.id === id);
    return (
      filter !== undefined &&
      (filter.kind === "date_range" ||
        filter.options.some((option) => option.id === value))
    );
  });
}

/** Whether the catalog offers this definition, so a block can open it. */
export function isInCatalog(
  catalog: FigureCatalog,
  definition: FigureDefinition,
): boolean {
  const metric = catalog.metrics.find((item) => item.id === definition.metric);
  const form = metric?.chart_forms.find(
    (item) => item.id === definition.chart_form,
  );
  if (!metric || !form) return false;
  const groupOk =
    definition.group_by === null ||
    allowed(metric.group_by, form.group_by).some(
      (group) => group.id === definition.group_by,
    );
  return groupOk && filtersValid(metric, form.filters, definition.filters);
}
