'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

type BeautifyMode = 'bullets' | 'description' | 'highlights';

export function useBeautify() {
  const [loading, setLoading] = useState<string | null>(null);

  async function beautify(
    key: string,
    mode: BeautifyMode,
    content: string | string[],
    context?: string
  ): Promise<string | string[] | null> {
    setLoading(key);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/beautify-content`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ mode, content, context }),
        }
      );
      const json = await res.json();
      if (json.error) return null;
      return json.result ?? null;
    } finally {
      setLoading(null);
    }
  }

  return { beautify, loading };
}
