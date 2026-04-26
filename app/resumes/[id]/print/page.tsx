'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import ResumePreview from '@/components/resume/ResumePreview';
import type { ResumeVersion, ResumeContent } from '@/lib/types';

export default function ResumePrintPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [content, setContent] = useState<ResumeContent | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      let query = supabase.from('resume_versions').select('*').eq('id', id);
      if (user) query = query.eq('user_id', user.id);

      const { data } = await query.maybeSingle();
      if (data) {
        setContent((data as ResumeVersion).content as unknown as ResumeContent);
      }
      setReady(true);
    };

    load();
  }, [id, user]);

  useEffect(() => {
    if (ready && content) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [ready, content]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">正在加载简历...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-sm text-gray-500">简历不存在。</p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="no-print fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white px-6 py-3 flex items-center justify-between shadow-md">
        <span className="text-sm font-medium">打印预览 · 在打印对话框中选择"另存为 PDF"</span>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="bg-white text-blue-600 text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
          >
            打印 / 保存 PDF
          </button>
          <button
            onClick={() => window.close()}
            className="text-white/80 hover:text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
      <div className="pt-14 no-print" />
      <ResumePreview content={content} />
    </div>
  );
}
