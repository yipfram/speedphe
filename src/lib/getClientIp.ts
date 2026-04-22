import type { NextRequest } from 'next/server';

const CLIENT_IP_HEADERS = [
  'x-forwarded-for',
  'x-real-ip',
  'cf-connecting-ip',
  'true-client-ip',
  'fastly-client-ip',
  'x-cluster-client-ip',
];

export function getClientIp(request: NextRequest): string | null {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const [firstValue] = forwardedFor.split(',');
    if (firstValue) {
      return firstValue.trim();
    }
  }

  for (const header of CLIENT_IP_HEADERS) {
    const value = request.headers.get(header);
    if (value) {
      return value;
    }
  }

  return null;
}
