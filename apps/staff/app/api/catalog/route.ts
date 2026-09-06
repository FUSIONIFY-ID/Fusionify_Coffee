import { backendPublicFetch, forwardResponse } from '@/lib/backend';

export async function GET(request: Request) {
  const incoming = new URL(request.url);
  const language = incoming.searchParams.get('lang') ?? 'EN';
  const outletId = incoming.searchParams.get('outletId');
  const query = new URLSearchParams({ lang: language });
  if (outletId) query.set('outletId', outletId);
  const response = await backendPublicFetch(`/v1/catalog?${query.toString()}`);
  return forwardResponse(response);
}
