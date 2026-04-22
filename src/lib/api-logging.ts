import { NextRequest, NextResponse } from 'next/server';
import type { Pool, QueryResult, QueryResultRow } from 'pg';
import { getDatabaseErrorDetails } from '@/lib/db';
import { getRequestId, logServerEvent, normalizeError } from '@/lib/logging';

interface ApiRequestContext {
  method: string;
  requestId: string;
  route: string;
  startedAt: number;
}

interface ApiResponseOptions {
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
      error: message,
      requestId: requestContext.requestId,
    },
    {
      status,
      headers: buildHeaders(requestContext.requestId),
    }
  );
}

export async function runLoggedQuery<T extends QueryResultRow>(
  pool: Pool,
  sql: string,
  values: unknown[],
  requestContext: ApiRequestContext,
  operation: string
): Promise<QueryResult<T>> {
  const startedAt = Date.now();

  try {
    return await pool.query<T>(sql, values);
  } catch (error) {
    const details = getDatabaseErrorDetails(error);

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
        syscall: details.syscall,
        message: details.message,
      },
    });

    throw error;
  }
}
