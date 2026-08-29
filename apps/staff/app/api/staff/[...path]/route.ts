import { backendStaffFetch, forwardResponse } from '@/lib/backend';

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function proxy(
  request: Request,
  context: RouteContext,
  method: 'GET' | 'POST' | 'PATCH',
) {
  const { path } = await context.params;
  const incoming = new URL(request.url);
  const suffix = path.map(encodeURIComponent).join('/');
  const body = method === 'GET' ? undefined : await request.text();
  const idempotencyKey = request.headers.get('idempotency-key');

  const response = await backendStaffFetch(
    `/v1/staff/${suffix}${incoming.search}`,
    {
      method,
      body,
      headers: idempotencyKey
        ? { 'Idempotency-Key': idempotencyKey }
        : undefined,
    },
  );
  return forwardResponse(response);
}

export function GET(request: Request, context: RouteContext) {
  return proxy(request, context, 'GET');
}

export function POST(request: Request, context: RouteContext) {
  return proxy(request, context, 'POST');
}

export function PATCH(request: Request, context: RouteContext) {
  return proxy(request, context, 'PATCH');
}
