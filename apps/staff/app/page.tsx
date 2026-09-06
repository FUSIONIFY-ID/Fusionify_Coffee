'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStaff } from '@/hooks/use-staff';

export default function Home() {
  const router = useRouter();
  const { staff } = useStaff();

  useEffect(() => {
    if (!staff) return;
    router.replace(
      staff.permissions.includes('finance.read') ? '/overview' : '/kds',
    );
  }, [router, staff]);

  return <main className="loading-page">Opening staff workspace…</main>;
}
