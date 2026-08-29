import { backendPublicFetch, forwardResponse } from '@/lib/backend';

export async function GET(request: Request) {
  const incoming = new URL(request.url);
  const language = incoming.searchParams.get('lang') ?? 'EN';
  const response = await backendPublicFetch(
    `/v1/catalog/preview?lang=${encodeURIComponent(language)}`,
  );
  return forwardResponse(response);
}
