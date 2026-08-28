import { backendStaffFetch, clearStaffSession, forwardResponse } from '@/lib/backend';

export async function POST() {
  const response = await backendStaffFetch('/v1/staff/auth/logout', {
    method: 'POST',
  });
  await clearStaffSession();
  return forwardResponse(response);
}
