// src/shared/metrics/metricsCollector.ts
import EventEmitter from "events";

type LabelMap = Record<string, string>;

type MetricEntry = {
  type: string;
  name: string;
  value: number;
  labels: LabelMap;
  timestamp: number;
};

class MetricsCollector extends EventEmitter {
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();
  private histograms = new Map<string, number[]>();
  private summaries = new Map<string, number[]>();
  private buffer: MetricEntry[] = [];
  private prometheusMode = false;

  incrementCounter(name: string, value = 1, labels: LabelMap = {}): number {
    const key = this.formatKey(name, labels);
    const newValue = (this.counters.get(key) || 0) + value;
    this.counters.set(key, newValue);
    this.emitMetric("counter", name, newValue, labels);
    return newValue;
  }

  setGauge(name: string, value: number, labels: LabelMap = {}): number {
    const key = this.formatKey(name, labels);
    this.gauges.set(key, value);
    this.emitMetric("gauge", name, value, labels);
    return value;
  }

  observeHistogram(
    name: string,
    value: number,
    labels: LabelMap = {}
  ): number[] {
    const key = this.formatKey(name, labels);
    const bucket = this.histograms.get(key) || [];
    bucket.push(value);
    this.histograms.set(key, bucket);
    this.emitMetric("histogram", name, value, labels);
    return bucket;
  }

  recordTiming(
    name: string,
    startTime: number,
    labels: LabelMap = {}
  ): number[] {
    const duration = Date.now() - startTime;
    return this.observeHistogram(name, duration, labels);
  }

  enablePrometheusMode(): this {
    this.prometheusMode = true;
    return this;
  }

  getPrometheusMetrics(): string {
    if (!this.prometheusMode) throw new Error("Prometheus mode not enabled");

    const lines: string[] = [];

    for (const [key, value] of this.counters.entries()) {
      const [name, labels] = this.parseKey(key);
      lines.push(`# TYPE ${name} counter`, `${name}${labels} ${value}`);
    }

    for (const [key, value] of this.gauges.entries()) {
      const [name, labels] = this.parseKey(key);
      lines.push(`# TYPE ${name} gauge`, `${name}${labels} ${value}`);
    }

    for (const [key, values] of this.histograms.entries()) {
      const [name, labels] = this.parseKey(key);
      const sum = values.reduce((a, b) => a + b, 0);
      const count = values.length;
      lines.push(
        `# TYPE ${name} histogram`,
        `${name}_sum${labels} ${sum}`,
        `${name}_count${labels} ${count}`
      );
    }

    return lines.join("\n");
  }

  getAllMetrics() {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(this.histograms),
    };
  }

  resetMetrics() {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.summaries.clear();
    this.buffer = [];
  }

  private formatKey(name: string, labels: LabelMap): string {
    if (!Object.keys(labels).length) return name;
    const labelString = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(",");
    return `${name}{${labelString}}`;
  }

  private parseKey(key: string): [string, string] {
    const match = key.match(/^(.+?)\{(.+?)\}$/);
    if (!match) return [key, ""];
    return [match[1], `{${match[2]}}`];
  }

  private emitMetric(
    type: string,
    name: string,
    value: number,
    labels: LabelMap
  ): void {
    const entry: MetricEntry = {
      type,
      name,
      value,
      labels,
      timestamp: Date.now(),
    };
    this.buffer.push(entry);
    this.emit("metric", entry);
    if (this.buffer.length > 10_000) this.buffer = this.buffer.slice(-5_000);
  }
}

export const rawMetricsCollector = new MetricsCollector();

/**
 * Factory that namespaces metric names by component/module
 */
export function getMetricsCollector(namespace: string) {
  return {
    incrementCounter: (metric: string, value = 1, labels: LabelMap = {}) =>
      rawMetricsCollector.incrementCounter(
        `${namespace}_${metric}`,
        value,
        labels
      ),

    setGauge: (metric: string, value: number, labels: LabelMap = {}) =>
      rawMetricsCollector.setGauge(`${namespace}_${metric}`, value, labels),

    observeHistogram: (metric: string, value: number, labels: LabelMap = {}) =>
      rawMetricsCollector.observeHistogram(
        `${namespace}_${metric}`,
        value,
        labels
      ),

    recordTiming: (metric: string, start: number, labels: LabelMap = {}) =>
      rawMetricsCollector.recordTiming(`${namespace}_${metric}`, start, labels),

    getAllMetrics: () => rawMetricsCollector.getAllMetrics(),
    enablePrometheusMode: () => rawMetricsCollector.enablePrometheusMode(),
    getPrometheusMetrics: () => rawMetricsCollector.getPrometheusMetrics(),
  };
}
