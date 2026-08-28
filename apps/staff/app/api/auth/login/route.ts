import { backendPublicFetch, forwardResponse } from '@/lib/backend';

export async function POST(request: Request) {
  const response = await backendPublicFetch('/v1/staff/auth/login', {
    method: 'POST',
    body: await request.text(),
  });
  return forwardResponse(response);
}
