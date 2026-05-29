class StructuredLogger {
  constructor(context = 'system') {
    this.context = context;
  }

  child(subContext) {
    return new StructuredLogger(`${this.context}:${subContext}`);
  }

  log(level, message, meta = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      context: this.context,
      message,
      correlation_id: meta.correlationId || global.currentCorrelationId || null,
      ...meta
    };

    console.log(JSON.stringify(logEntry));
  }

  info(message, meta) {
    this.log('info', message, meta);
  }

  warn(message, meta) {
    this.log('warn', message, meta);
  }

  error(message, meta) {
    if (meta && meta.error instanceof Error) {
      meta.error_stack = meta.error.stack;
      meta.error_message = meta.error.message;
      delete meta.error;
    }
    this.log('error', message, meta);
  }

  debug(message, meta) {
    this.log('debug', message, meta);
  }

  // Latency metrics logging helper
  metric(metricName, durationMs, meta = {}) {
    this.log('info', `Metric: ${metricName}`, {
      metric_name: metricName,
      duration_ms: durationMs,
      ...meta
    });
  }
}

const logger = new StructuredLogger();
module.exports = logger;
