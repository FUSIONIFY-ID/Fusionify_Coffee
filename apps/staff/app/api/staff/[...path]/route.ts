import { backendStaffFetch, forwardResponse } from '@/lib/backend';

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

type ProxyMethod = 'GET' | 'POST' | 'PUT' | 'PATCH';

async function proxy(
  request: Request,
  context: RouteContext,
  method: ProxyMethod,
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

export function PUT(request: Request, context: RouteContext) {
  return proxy(request, context, 'PUT');
}

export function PATCH(request: Request, context: RouteContext) {
  return proxy(request, context, 'PATCH');
}
