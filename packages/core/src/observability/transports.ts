/**
 * Log Transports
 * Various destinations for log output
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  LogTransport,
  LogEntry,
  ConsoleTransportConfig,
  FileTransportConfig,
  CustomTransportConfig,
  LogLevel,
} from './types.js';
import { LOG_LEVELS } from './types.js';

// ============================================================================
// Console Transport
// ============================================================================

const COLORS = {
  reset: '\x1b[0m',
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m', // Green
  warn: '\x1b[33m', // Yellow
  error: '\x1b[31m', // Red
  timestamp: '\x1b[90m', // Gray
  category: '\x1b[35m', // Magenta
};

export class ConsoleTransport implements LogTransport {
  name = 'console';
  private level: LogLevel;
  private colors: boolean;
  private pretty: boolean;
  private timestamp: boolean;

  constructor(config: ConsoleTransportConfig = {}) {
    this.level = config.level || 'info';
    this.colors = config.colors ?? true;
    this.pretty = config.pretty ?? true;
    this.timestamp = config.timestamp ?? true;
  }

  write(entry: LogEntry): void {
    if (LOG_LEVELS[entry.level] < LOG_LEVELS[this.level]) {
      return;
    }

    if (this.pretty) {
      this.writePretty(entry);
    } else {
      this.writeJSON(entry);
    }
  }

  private writePretty(entry: LogEntry): void {
    const color = this.colors ? COLORS[entry.level] : '';
    const reset = this.colors ? COLORS.reset : '';
    const timestampColor = this.colors ? COLORS.timestamp : '';
    const categoryColor = this.colors ? COLORS.category : '';

    let output = '';

    if (this.timestamp) {
      output += `${timestampColor}[${entry.timestamp.toISOString()}]${reset} `;
    }

    output += `${color}${entry.level.toUpperCase()}${reset}`;

    if (entry.category) {
      output += ` ${categoryColor}[${entry.category}]${reset}`;
    }

    if (entry.requestId) {
      output += ` ${timestampColor}(${entry.requestId})${reset}`;
    }

    output += `: ${entry.message}`;

    console.log(output);

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      console.log('  Metadata:', entry.metadata);
    }

    if (entry.error) {
      console.error('  Error:', entry.error);
    }
  }

  private writeJSON(entry: LogEntry): void {
    const logObject = {
      timestamp: entry.timestamp.toISOString(),
      level: entry.level,
      message: entry.message,
      ...(entry.category && { category: entry.category }),
      ...(entry.requestId && { requestId: entry.requestId }),
      ...(entry.metadata && { metadata: entry.metadata }),
      ...(entry.error && {
        error: {
          message: entry.error.message,
          stack: entry.error.stack,
          name: entry.error.name,
        },
      }),
    };

    console.log(JSON.stringify(logObject));
  }

  async flush(): Promise<void> {
    // Console doesn't need flushing
  }

  async close(): Promise<void> {
    // Console doesn't need closing
  }
}

// ============================================================================
// File Transport
// ============================================================================

export class FileTransport implements LogTransport {
  name = 'file';
  private level: LogLevel;
  private filepath: string;
  private maxSize: number;
  private maxFiles: number;
  private rotate: boolean;
  private buffer: string[] = [];
  private writeInterval: NodeJS.Timeout | null = null;

  constructor(config: FileTransportConfig) {
    this.level = config.level || 'info';
    this.filepath = config.filepath;
    this.maxSize = config.maxSize || 10 * 1024 * 1024; // 10MB default
    this.maxFiles = config.maxFiles || 5;
    this.rotate = config.rotate ?? true;

    // Ensure directory exists
    const dir = path.dirname(this.filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Start periodic flush
    this.writeInterval = setInterval(() => this.flush(), 1000);
  }

  write(entry: LogEntry): void {
    if (LOG_LEVELS[entry.level] < LOG_LEVELS[this.level]) {
      return;
    }

    const logLine = JSON.stringify({
      timestamp: entry.timestamp.toISOString(),
      level: entry.level,
      message: entry.message,
      ...(entry.category && { category: entry.category }),
      ...(entry.requestId && { requestId: entry.requestId }),
      ...(entry.metadata && { metadata: entry.metadata }),
      ...(entry.error && {
        error: {
          message: entry.error.message,
          stack: entry.error.stack,
          name: entry.error.name,
        },
      }),
    });

    this.buffer.push(logLine);

    // Check if rotation is needed
    if (this.rotate) {
      this.checkRotation();
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const data = this.buffer.join('\n') + '\n';
    this.buffer = [];

    try {
      fs.appendFileSync(this.filepath, data, 'utf8');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private checkRotation(): void {
    try {
      if (!fs.existsSync(this.filepath)) return;

      const stats = fs.statSync(this.filepath);
      if (stats.size >= this.maxSize) {
        this.rotateFiles();
      }
    } catch (error) {
      console.error('Failed to check log file rotation:', error);
    }
  }

  private rotateFiles(): void {
    // Flush current buffer first
    this.flush();

    // Rotate existing files
    for (let i = this.maxFiles - 1; i > 0; i--) {
      const oldPath = `${this.filepath}.${i}`;
      const newPath = `${this.filepath}.${i + 1}`;

      if (fs.existsSync(oldPath)) {
        if (i === this.maxFiles - 1) {
          fs.unlinkSync(oldPath); // Delete oldest
        } else {
          fs.renameSync(oldPath, newPath);
        }
      }
    }

    // Rename current file
    if (fs.existsSync(this.filepath)) {
      fs.renameSync(this.filepath, `${this.filepath}.1`);
    }
  }

  async close(): Promise<void> {
    if (this.writeInterval) {
      clearInterval(this.writeInterval);
      this.writeInterval = null;
    }
    await this.flush();
  }
}

// ============================================================================
// Custom Transport
// ============================================================================

export class CustomTransport implements LogTransport {
  name = 'custom';
  private level: LogLevel;
  private handler: (entry: LogEntry) => void | Promise<void>;

  constructor(config: CustomTransportConfig) {
    this.level = config.level || 'info';
    this.handler = config.handler;
  }

  async write(entry: LogEntry): Promise<void> {
    if (LOG_LEVELS[entry.level] < LOG_LEVELS[this.level]) {
      return;
    }

    try {
      await this.handler(entry);
    } catch (error) {
      console.error('Custom transport handler failed:', error);
    }
  }

  async flush(): Promise<void> {
    // Custom handler is responsible for flushing if needed
  }

  async close(): Promise<void> {
    // Custom handler is responsible for cleanup if needed
  }
}

// ============================================================================
// Transport Factory
// ============================================================================

export function createConsoleTransport(config?: ConsoleTransportConfig): LogTransport {
  return new ConsoleTransport(config);
}

export function createFileTransport(config: FileTransportConfig): LogTransport {
  return new FileTransport(config);
}

export function createCustomTransport(config: CustomTransportConfig): LogTransport {
  return new CustomTransport(config);
}
