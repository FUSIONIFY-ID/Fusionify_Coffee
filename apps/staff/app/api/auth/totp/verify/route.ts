import { backendPublicFetch, forwardResponse, setStaffSession } from '@/lib/backend';

type VerifyResponse = {
  accessToken: string;
  refreshToken: string;
};

export async function POST(request: Request) {
  const response = await backendPublicFetch('/v1/staff/auth/totp/verify', {
    method: 'POST',
    body: await request.text(),
  });

  if (!response.ok) return forwardResponse(response);

  const data = (await response.json()) as VerifyResponse;
  await setStaffSession(data);
  return Response.json({ success: true });
}
