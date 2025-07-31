/**
 * Comprehensive monitoring and alerting system
 */

export interface MetricData {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: number;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: "gt" | "lt" | "eq" | "gte" | "lte";
  threshold: number;
  window: number; // in milliseconds
  severity: "low" | "medium" | "high" | "critical";
  enabled: boolean;
  cooldown: number; // in milliseconds
}

export interface Alert {
  id: string;
  ruleId: string;
  message: string;
  severity: string;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
}

export interface SystemHealth {
  status: "healthy" | "degraded" | "unhealthy";
  checks: Record<
    string,
    {
      status: "pass" | "fail" | "warn";
      message: string;
      timestamp: number;
    }
  >;
  lastUpdated: number;
}

class MetricsCollector {
  private metrics: Map<string, MetricData[]> = new Map();
  private maxMetricsPerName = 1000; // Keep last 1000 metrics per name

  record(metric: MetricData): void {
    const { name } = metric;
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricList = this.metrics.get(name)!;
    metricList.push({
      ...metric,
      timestamp: metric.timestamp || Date.now(),
    });

    // Keep only the last maxMetricsPerName metrics
    if (metricList.length > this.maxMetricsPerName) {
      metricList.splice(0, metricList.length - this.maxMetricsPerName);
    }
  }

  getMetrics(name: string, since?: number): MetricData[] {
    const metrics = this.metrics.get(name) || [];
    if (since) {
      return metrics.filter((m) => (m.timestamp || 0) >= since);
    }
    return metrics;
  }

  getLatestMetric(name: string): MetricData | null {
    const metrics = this.metrics.get(name);
    return metrics && metrics.length > 0 ? metrics[metrics.length - 1] : null;
  }

  getAggregatedMetrics(
    name: string,
    window: number
  ): {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
  } {
    const since = Date.now() - window;
    const metrics = this.getMetrics(name, since);

    if (metrics.length === 0) {
      return { count: 0, sum: 0, avg: 0, min: 0, max: 0 };
    }

    const values = metrics.map((m) => m.value);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: metrics.length,
      sum,
      avg: sum / metrics.length,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  clearOldMetrics(olderThan: number): void {
    const cutoff = Date.now() - olderThan;
    for (const [name, metrics] of this.metrics) {
      const filtered = metrics.filter((m) => (m.timestamp || 0) >= cutoff);
      this.metrics.set(name, filtered);
    }
  }
}

class AlertManager {
  private rules: Map<string, AlertRule> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private lastTriggered: Map<string, number> = new Map();

  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
  }

  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  evaluateRules(metrics: MetricsCollector): Alert[] {
    const newAlerts: Alert[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      const lastTriggered = this.lastTriggered.get(rule.id) || 0;
      if (Date.now() - lastTriggered < rule.cooldown) continue;

      const aggregated = metrics.getAggregatedMetrics(rule.metric, rule.window);
      let shouldTrigger = false;

      switch (rule.condition) {
        case "gt":
          shouldTrigger = aggregated.avg > rule.threshold;
          break;
        case "lt":
          shouldTrigger = aggregated.avg < rule.threshold;
          break;
        case "eq":
          shouldTrigger = aggregated.avg === rule.threshold;
          break;
        case "gte":
          shouldTrigger = aggregated.avg >= rule.threshold;
          break;
        case "lte":
          shouldTrigger = aggregated.avg <= rule.threshold;
          break;
      }

      if (shouldTrigger) {
        const alert: Alert = {
          id: `${rule.id}_${Date.now()}`,
          ruleId: rule.id,
          message: `${rule.name}: ${rule.metric} is ${rule.condition} ${rule.threshold} (current: ${aggregated.avg.toFixed(2)})`,
          severity: rule.severity,
          timestamp: Date.now(),
          resolved: false,
        };

        this.alerts.set(alert.id, alert);
        this.lastTriggered.set(rule.id, Date.now());
        newAlerts.push(alert);
      }
    }

    return newAlerts;
  }

  resolveAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
    }
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter((a) => !a.resolved);
  }

  getAlertsBySeverity(severity: string): Alert[] {
    return Array.from(this.alerts.values()).filter(
      (a) => a.severity === severity
    );
  }

  clearOldAlerts(olderThan: number): void {
    const cutoff = Date.now() - olderThan;
    for (const [id, alert] of this.alerts) {
      if (alert.timestamp < cutoff) {
        this.alerts.delete(id);
      }
    }
  }
}

class HealthChecker {
  private checks: Map<
    string,
    () => Promise<{ status: "pass" | "fail" | "warn"; message: string }>
  > = new Map();

  addCheck(
    name: string,
    check: () => Promise<{ status: "pass" | "fail" | "warn"; message: string }>
  ): void {
    this.checks.set(name, check);
  }

  async runHealthCheck(): Promise<SystemHealth> {
    const results: Record<
      string,
      { status: "pass" | "fail" | "warn"; message: string; timestamp: number }
    > = {};
    let hasFailures = false;
    let hasWarnings = false;

    for (const [name, check] of this.checks) {
      try {
        const result = await check();
        results[name] = {
          ...result,
          timestamp: Date.now(),
        };

        if (result.status === "fail") hasFailures = true;
        if (result.status === "warn") hasWarnings = true;
      } catch (error) {
        results[name] = {
          status: "fail",
          message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
          timestamp: Date.now(),
        };
        hasFailures = true;
      }
    }

    let status: "healthy" | "degraded" | "unhealthy";
    if (hasFailures) {
      status = "unhealthy";
    } else if (hasWarnings) {
      status = "degraded";
    } else {
      status = "healthy";
    }

    return {
      status,
      checks: results,
      lastUpdated: Date.now(),
    };
  }
}

class MonitoringSystem {
  private metrics = new MetricsCollector();
  private alerts = new AlertManager();
  private health = new HealthChecker();
  private interval: NodeJS.Timeout | null = null;

  // Convenience methods for common metrics
  incrementCounter(name: string, tags?: Record<string, string>): void {
    const current = this.metrics.getLatestMetric(name);
    const value = current ? current.value + 1 : 1;
    this.metrics.record({ name, value, tags });
  }

  recordGauge(
    name: string,
    value: number,
    tags?: Record<string, string>
  ): void {
    this.metrics.record({ name, value, tags });
  }

  recordTiming(
    name: string,
    duration: number,
    tags?: Record<string, string>
  ): void {
    this.metrics.record({ name, value: duration, tags });
  }

  recordError(error: Error, context?: Record<string, string>): void {
    this.incrementCounter("errors.total", {
      type: error.name,
      message: error.message,
      ...context,
    });
  }

  recordApiCall(endpoint: string, duration: number, status: number): void {
    this.recordTiming("api.calls.duration", duration, { endpoint });
    this.incrementCounter("api.calls.total", {
      endpoint,
      status: status.toString(),
    });
  }

  recordPaymentAttempt(
    amount: number,
    currency: string,
    success: boolean
  ): void {
    this.incrementCounter("payments.attempts", {
      currency,
      success: success.toString(),
    });
    if (success) {
      this.recordGauge("payments.amount", amount, { currency });
    }
  }

  recordWebhookEvent(eventType: string, success: boolean): void {
    this.incrementCounter("webhooks.events", {
      type: eventType,
      success: success.toString(),
    });
  }

  // Alert management
  addAlertRule(rule: AlertRule): void {
    this.alerts.addRule(rule);
  }

  getActiveAlerts(): Alert[] {
    return this.alerts.getActiveAlerts();
  }

  resolveAlert(alertId: string): void {
    this.alerts.resolveAlert(alertId);
  }

  // Health checks
  addHealthCheck(
    name: string,
    check: () => Promise<{ status: "pass" | "fail" | "warn"; message: string }>
  ): void {
    this.health.addCheck(name, check);
  }

  async getSystemHealth(): Promise<SystemHealth> {
    return this.health.runHealthCheck();
  }

  // Metrics queries
  getMetrics(name: string, since?: number): MetricData[] {
    return this.metrics.getMetrics(name, since);
  }

  getAggregatedMetrics(name: string, window: number) {
    return this.metrics.getAggregatedMetrics(name, window);
  }

  // Start monitoring
  startMonitoring(intervalMs: number = 30000): void {
    if (this.interval) {
      clearInterval(this.interval);
    }

    this.interval = setInterval(async () => {
      try {
        // Evaluate alert rules
        const newAlerts = this.alerts.evaluateRules(this.metrics);

        // Log new alerts
        for (const alert of newAlerts) {
          console.error(`🚨 ALERT: ${alert.message} (${alert.severity})`);
        }

        // Clean up old data
        this.metrics.clearOldMetrics(24 * 60 * 60 * 1000); // 24 hours
        this.alerts.clearOldAlerts(7 * 24 * 60 * 60 * 1000); // 7 days
      } catch (error) {
        console.error("Monitoring error:", error);
      }
    }, intervalMs);
  }

  stopMonitoring(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  // Get system statistics
  getSystemStats(): {
    metrics: Record<string, number>;
    alerts: { active: number; total: number };
    health: SystemHealth | null;
  } {
    const metricNames = Array.from(this.metrics["metrics"].keys());
    const metrics: Record<string, number> = {};

    for (const name of metricNames) {
      const latest = this.metrics.getLatestMetric(name);
      if (latest) {
        metrics[name] = latest.value;
      }
    }

    const activeAlerts = this.alerts.getActiveAlerts();
    const totalAlerts = Array.from(this.alerts["alerts"].values()).length;

    return {
      metrics,
      alerts: {
        active: activeAlerts.length,
        total: totalAlerts,
      },
      health: null, // Would need async call to get current health
    };
  }
}

// Global monitoring instance
export const monitoring = new MonitoringSystem();

// Pre-configure common alert rules
monitoring.addAlertRule({
  id: "high_error_rate",
  name: "High Error Rate",
  metric: "errors.total",
  condition: "gt",
  threshold: 10,
  window: 5 * 60 * 1000, // 5 minutes
  severity: "high",
  enabled: true,
  cooldown: 5 * 60 * 1000, // 5 minutes
});

monitoring.addAlertRule({
  id: "payment_failure_rate",
  name: "High Payment Failure Rate",
  metric: "payments.attempts",
  condition: "gt",
  threshold: 5,
  window: 10 * 60 * 1000, // 10 minutes
  severity: "critical",
  enabled: true,
  cooldown: 10 * 60 * 1000, // 10 minutes
});

monitoring.addAlertRule({
  id: "webhook_failure_rate",
  name: "Webhook Processing Failures",
  metric: "webhooks.events",
  condition: "gt",
  threshold: 3,
  window: 5 * 60 * 1000, // 5 minutes
  severity: "medium",
  enabled: true,
  cooldown: 5 * 60 * 1000, // 5 minutes
});

// Start monitoring by default
monitoring.startMonitoring();

// Export convenience functions
export const recordMetric = monitoring.recordGauge.bind(monitoring);
export const recordError = monitoring.recordError.bind(monitoring);
export const recordApiCall = monitoring.recordApiCall.bind(monitoring);
export const recordPayment = monitoring.recordPaymentAttempt.bind(monitoring);
export const recordWebhook = monitoring.recordWebhookEvent.bind(monitoring);
