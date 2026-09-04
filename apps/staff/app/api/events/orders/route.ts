import {
  backendStaffFetch,
  forwardStreamingResponse,
} from '@/lib/backend';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const response = await backendStaffFetch('/v1/staff/orders/events', {
    headers: { Accept: 'text/event-stream' },
  });
  return forwardStreamingResponse(response);
}
