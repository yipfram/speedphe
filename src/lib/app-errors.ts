export type AppErrorCode =
  | 'CONFIG_INVALID'
  | 'DB_QUERY_FAILED'
  | 'DB_UNREACHABLE'
  | 'GOOGLE_PLACES_UNAVAILABLE'
  | 'INTERNAL_SERVER_ERROR';

export type AppErrorSource = 'application' | 'config' | 'database' | 'google_places';

export interface AppErrorDetails {
  [key: string]: unknown;
}

interface AppErrorOptions {
  cause?: unknown;
  code: AppErrorCode;
  details?: AppErrorDetails;
  publicMessage: string;
  source: AppErrorSource;
  status: number;
}

export class AppError extends Error {
  code: AppErrorCode;
  details?: AppErrorDetails;
  publicMessage: string;
  source: AppErrorSource;
  status: number;

  constructor(message: string, options: AppErrorOptions) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = 'AppError';
    this.code = options.code;
    this.details = options.details;
    this.publicMessage = options.publicMessage;
    this.source = options.source;
    this.status = options.status;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function createConfigAppError(message: string, details?: AppErrorDetails, cause?: unknown) {
  return new AppError(message, {
    cause,
    code: 'CONFIG_INVALID',
    details,
    publicMessage: 'This service is temporarily unavailable. Please try again in a moment.',
    source: 'config',
    status: 503,
  });
}

export function createGooglePlacesAppError(
  operation: string,
  details?: AppErrorDetails,
  cause?: unknown
) {
  const originalMessage = cause instanceof Error ? cause.message : undefined;

  return new AppError(`Google Places request failed during ${operation}`, {
    cause,
    code: 'GOOGLE_PLACES_UNAVAILABLE',
    details: {
      operation,
      originalMessage,
      ...details,
    },
    publicMessage: "We couldn't load nearby places right now. Please try again in a moment.",
    source: 'google_places',
    status: 503,
  });
}

export function createInternalAppError(cause?: unknown, details?: AppErrorDetails) {
  return new AppError('Unhandled application error', {
    cause,
    code: 'INTERNAL_SERVER_ERROR',
    details,
    publicMessage: 'Something went wrong. Please try again in a moment.',
    source: 'application',
    status: 500,
  });
}

export function toAppError(error: unknown) {
  if (isAppError(error)) {
    return error;
  }

  return createInternalAppError(error);
}
