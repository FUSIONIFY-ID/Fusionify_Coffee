'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiJson } from '@/lib/client-api';
import type { StaffProfile } from '@/lib/types';

export function useStaff() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    apiJson<StaffProfile>('/api/staff/me')
      .then((profile) => {
        if (active) setStaff(profile);
      })
      .catch(() => {
        if (active) router.replace('/login');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  return { staff, loading };
}
