/**
 * Structured Logger Utility
 *
 * Provides consistent logging with log levels:
 * - debug: Development-only debugging information
 * - info: General operational information
 * - warn: Warning messages for potential issues
 * - error: Error messages for actual errors
 *
 * In production (NODE_ENV === 'production'), debug logs are suppressed.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
}

class Logger {
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * Format log entry as structured JSON
   */
  private format(level: LogLevel, message: string, context?: LogContext): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(context && Object.keys(context).length > 0 ? { context } : {}),
    };
  }

  /**
   * Output log entry to console
   */
  private output(level: LogLevel, message: string, context?: LogContext): void {
    const entry = this.format(level, message, context);

    switch (level) {
      case 'debug':
        console.debug(JSON.stringify(entry));
        break;
      case 'info':
        console.info(JSON.stringify(entry));
        break;
      case 'warn':
        console.warn(JSON.stringify(entry));
        break;
      case 'error':
        console.error(JSON.stringify(entry));
        break;
    }
  }

  /**
   * Debug level - only logs in non-production environments
   */
  debug(message: string, context?: LogContext): void {
    if (this.isProduction) return;
    this.output('debug', message, context);
  }

  /**
   * Info level - general operational information
   */
  info(message: string, context?: LogContext): void {
    this.output('info', message, context);
  }

  /**
   * Warn level - potential issues that don't block operation
   */
  warn(message: string, context?: LogContext): void {
    this.output('warn', message, context);
  }

  /**
   * Error level - actual errors that need attention
   */
  error(message: string, context?: LogContext): void {
    this.output('error', message, context);
  }
}

export const logger = new Logger();
