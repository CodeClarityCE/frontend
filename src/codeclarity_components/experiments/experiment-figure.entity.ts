/** Figure types as the API serves them; the catalog itself lives on the API. */

export interface FigureChoice {
  id: string;
  label: string;
}

export interface FigureFilter extends FigureChoice {
  /** A date range instead of a list of options */
  kind?: "date_range";
  options: FigureChoice[];
}

export interface FigureChartForm extends FigureChoice {
  /** How it is drawn; a line when not given */
  mark?: "line" | "bar" | "point";
  /** The metric's group-bys and filters valid with this form, all when not given */
  group_by?: string[];
  filters?: string[];
}

export interface FigureMetric extends FigureChoice {
  chart_forms: FigureChartForm[];
  group_by: FigureChoice[];
  filters: FigureFilter[];
}

export interface FigureCatalog {
  metrics: FigureMetric[];
}

export interface FigureDefinition {
  metric: string;
  chart_form: string;
  group_by: string | null;
  /** Filter id to chosen option id; a filter left out is not applied */
  filters: Record<string, string>;
}

export interface Figure {
  id: string;
  name: string;
  definition: FigureDefinition;
  created_on: string;
  /** The Published results version it is tied to; null while a draft */
  metric_version: number | null;
}

/** One line of a Figure; a null value leaves a gap. */
export interface FigureSeries {
  key: string;
  label: string;
  values: (number | null)[];
  /** 95% band around values, on survival Figures */
  lower?: (number | null)[];
  upper?: (number | null)[];
  /** Exposures censored at each point, on survival Figures */
  censored?: number[];
}

export interface FigureData {
  x_title: string;
  y_title: string;
  labels: string[];
  series: FigureSeries[];
  /** YYYY-MM-DD open exposures are censored at, on survival Figures */
  censored_at?: string;
  /** Sample and exclusions after the Figure's filters */
  caption?: { n: string; exclusions: string[] };
}
