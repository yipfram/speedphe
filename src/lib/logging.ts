type LogLevel = 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

interface LogRecord {
  level: LogLevel;
  event: string;
  timestamp: string;
  requestId?: string;
  route?: string;
  method?: string;
  status?: number;
  durationMs?: number;
  context?: LogContext;
}

type ErrorWithDetails = Error & {
  code?: string;
  hostname?: string;
  isLoggedClientError?: boolean;
  syscall?: string;
};

function escapeLogValue(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function formatLogValue(value: unknown): string {
  if (value === null) {
    return 'null';
  }

  if (value === undefined) {
    return 'undefined';
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (typeof value === 'string') {
    return `"${escapeLogValue(value)}"`;
  }

  if (Array.isArray(value)) {
    return `"${escapeLogValue(value.map((item) => formatLogValue(item)).join(','))}"`;
  }

  if (typeof value === 'object') {
    return `"${escapeLogValue(formatContext(value as LogContext))}"`;
  }

  return `"${escapeLogValue(String(value))}"`;
}

function formatContext(context: LogContext) {
  return Object.entries(context)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${formatLogValue(value)}`)
    .join(' ');
}

function formatLogRecord(record: LogRecord) {
  const segments = [
    `timestamp=${formatLogValue(record.timestamp)}`,
    `level=${record.level}`,
    `event=${formatLogValue(record.event)}`,
  ];

  if (record.requestId) {
    segments.push(`requestId=${formatLogValue(record.requestId)}`);
  }

  if (record.route) {
    segments.push(`route=${formatLogValue(record.route)}`);
  }

  if (record.method) {
    segments.push(`method=${record.method}`);
  }

  if (record.status !== undefined) {
    segments.push(`status=${record.status}`);
  }

  if (record.durationMs !== undefined) {
    segments.push(`durationMs=${record.durationMs}`);
  }

  if (record.context && Object.keys(record.context).length > 0) {
    segments.push(formatContext(record.context));
  }

  return segments.join(' ');
}

function emitLog(
  level: LogLevel,
  event: string,
  record: Omit<LogRecord, 'level' | 'event' | 'timestamp'>
) {
  const payload = formatLogRecord({
    level,
    event,
    timestamp: new Date().toISOString(),
    ...record,
  } satisfies LogRecord);

  if (typeof window === 'undefined') {
    const output = level === 'error' ? process.stderr : process.stdout;
    output.write(`${payload}\n`);
    return;
  }

  if (level === 'error') {
    console.error(payload);
    return;
  }

  console.warn(payload);
}

export function logServerEvent(
  level: LogLevel,
  event: string,
  record: Omit<LogRecord, 'level' | 'event' | 'timestamp'>
) {
  emitLog(level, event, record);
}

export function logClientError(event: string, context: LogContext) {
  emitLog('error', event, { context });
}

export function getRequestId(existingRequestId: string | null) {
  return existingRequestId?.trim() || crypto.randomUUID();
}

export function normalizeError(error: unknown): LogContext {
  if (!(error instanceof Error)) {
    return { message: 'Unknown error' };
  }

  const details = error as ErrorWithDetails;

  return {
    name: details.name,
    message: details.message,
    code: details.code,
    hostname: details.hostname,
    syscall: details.syscall,
  };
}

export function createLoggedClientError(message: string) {
  const error = new Error(message) as ErrorWithDetails;
  error.isLoggedClientError = true;
  return error;
}

export function isLoggedClientError(error: unknown) {
  return error instanceof Error && Boolean((error as ErrorWithDetails).isLoggedClientError);
}
