export type MetricLabels = Record<string, string>;

export class MetricsRegistry {
  // Map<`${name}:${sortedLabelsString}`, number>
  private counters = new Map<string, number>();
  // Map<string, number>
  private gauges = new Map<string, number>();

  private formatKey(name: string, labels: MetricLabels = {}): string {
    const sorted = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return sorted ? `${name}{${sorted}}` : name;
  }

  incrementCounter(name: string, value = 1, labels: MetricLabels = {}): void {
    const key = this.formatKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  }

  getCounter(name: string, labels: MetricLabels = {}): number {
    const key = this.formatKey(name, labels);
    return this.counters.get(key) || 0;
  }

  setGauge(name: string, value: number): void {
    this.gauges.set(name, value);
  }

  getGauge(name: string): number {
    return this.gauges.get(name) || 0;
  }

  calculateBanRate(): number {
    const active = this.getGauge('tikbot_accounts_active');
    const banned = this.getGauge('tikbot_accounts_banned');
    const total = active + banned;
    if (total === 0) return 0;
    return Number(((banned / total) * 100).toFixed(2));
  }

  exportPrometheusMetrics(): string {
    const lines: string[] = [];

    for (const [key, val] of this.counters.entries()) {
      lines.push(`${key} ${val}`);
    }

    for (const [key, val] of this.gauges.entries()) {
      lines.push(`${key} ${val}`);
    }

    return lines.join('\n');
  }
}
