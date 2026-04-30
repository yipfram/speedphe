import { NextRequest, NextResponse } from 'next/server';
import type { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { toAppError } from '@/lib/app-errors';
import { createDatabaseAppError, getDatabaseErrorDetails } from '@/lib/db';
import { getRequestId, logServerEvent, normalizeError } from '@/lib/logging';

interface ApiRequestContext {
  method: string;
  requestId: string;
  route: string;
  startedAt: number;
}

interface ApiResponseOptions {
  code?: string;
  context?: Record<string, unknown>;
  status?: number;
}

function buildHeaders(requestId: string) {
  return {
    'x-request-id': requestId,
  };
}

function getDurationMs(startedAt: number) {
  return Date.now() - startedAt;
}

function withRequestId(body: unknown, requestId: string, status: number) {
  if (status < 400 || body === null || typeof body !== 'object' || Array.isArray(body)) {
    return body;
  }

  return {
    ...(body as Record<string, unknown>),
    requestId,
  };
}

export function createApiRequestContext(request: NextRequest, route: string): ApiRequestContext {
  return {
    method: request.method,
    requestId: getRequestId(request.headers.get('x-request-id')),
    route,
    startedAt: Date.now(),
  };
}

export function apiJsonResponse(
  requestContext: ApiRequestContext,
  body: unknown,
  options: ApiResponseOptions = {}
) {
  const status = options.status ?? 200;

  logServerEvent(status >= 400 ? 'warn' : 'info', 'api.request.complete', {
    requestId: requestContext.requestId,
    route: requestContext.route,
    method: requestContext.method,
    status,
    durationMs: getDurationMs(requestContext.startedAt),
    context: options.context,
  });

  return NextResponse.json(withRequestId(body, requestContext.requestId, status), {
    status,
    headers: buildHeaders(requestContext.requestId),
  });
}

export function apiErrorResponse(
  requestContext: ApiRequestContext,
  message: string,
  error: unknown,
  options: ApiResponseOptions = {}
) {
  const status = options.status ?? 500;

  logServerEvent('error', 'api.request.error', {
    requestId: requestContext.requestId,
    route: requestContext.route,
    method: requestContext.method,
    status,
    durationMs: getDurationMs(requestContext.startedAt),
    context: {
      ...options.context,
      error: normalizeError(error),
    },
  });

  return NextResponse.json(
    {
      code: options.code,
      error: message,
      requestId: requestContext.requestId,
    },
    {
      status,
      headers: buildHeaders(requestContext.requestId),
    }
  );
}

export function apiAppErrorResponse(
  requestContext: ApiRequestContext,
  error: unknown,
  options: Omit<ApiResponseOptions, 'code' | 'status'> = {}
) {
  const appError = toAppError(error);

  return apiErrorResponse(requestContext, appError.publicMessage, appError, {
    code: appError.code,
    context: {
      ...options.context,
      details: appError.details,
      source: appError.source,
    },
    status: appError.status,
  });
}

export async function runLoggedQuery<T extends QueryResultRow>(
  pool: Pool,
  sql: string,
  values: unknown[],
  requestContext: ApiRequestContext,
  operation: string
): Promise<QueryResult<T>> {
  const startedAt = Date.now();
  let client: PoolClient;

  try {
    client = await pool.connect();
  } catch (error) {
    const details = getDatabaseErrorDetails(error);
    const appError = createDatabaseAppError(error, `${operation}.connect`);

    logServerEvent('error', 'db.connection.error', {
      requestId: requestContext.requestId,
      route: requestContext.route,
      method: requestContext.method,
      durationMs: getDurationMs(startedAt),
      context: {
        operation,
        classification: details.classification,
        errorCode: details.errorCode,
        hostname: details.hostname,
        originalMessage: details.originalMessage,
        syscall: details.syscall,
      },
    });

    throw appError;
  }

  try {
    return await client.query<T>(sql, values);
  } catch (error) {
    const details = getDatabaseErrorDetails(error);
    const appError = createDatabaseAppError(error, `${operation}.query`);

    logServerEvent('error', 'db.query.error', {
      requestId: requestContext.requestId,
      route: requestContext.route,
      method: requestContext.method,
      durationMs: getDurationMs(startedAt),
      context: {
        operation,
        classification: details.classification,
        errorCode: details.errorCode,
        hostname: details.hostname,
        originalMessage: details.originalMessage,
        queryStatus: details.status,
        syscall: details.syscall,
      },
    });

    throw appError;
  } finally {
    client.release();
  }
}
