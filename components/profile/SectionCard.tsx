import { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function SectionCard({ icon: Icon, title, description, children, action, className }: SectionCardProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-100 overflow-hidden', className)}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
            {description && <p className="text-xs text-gray-400">{description}</p>}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
