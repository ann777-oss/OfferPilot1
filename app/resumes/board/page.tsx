'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';

export default function LegacyBoardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/jobs?view=board');
  }, [router]);

  return (
    <AppLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">正在跳转到新的求职项目看板...</p>
        </div>
      </div>
    </AppLayout>
  );
}
