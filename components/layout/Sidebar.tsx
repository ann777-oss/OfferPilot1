'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BadgeCheck,
  Briefcase,
  BookOpen,
  ChevronRight,
  History,
  LayoutDashboard,
  LogOut,
  Sparkles,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/dashboard', label: '工作台', icon: LayoutDashboard, tour: 'nav-dashboard' },
  { href: '/profile', label: '职业档案', icon: User, tour: 'nav-profile' },
  { href: '/jobs', label: '求职项目', icon: Briefcase, tour: 'nav-jobs' },
  { href: '/resumes', label: '简历中心', icon: History, tour: 'nav-resumes' },
  { href: '/interviews', label: '面试中心', icon: BookOpen, tour: 'nav-interviews' },
  { href: '/offers', label: 'Offer 管理', icon: BadgeCheck, tour: 'nav-offers' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? 'U';

  return (
    <aside data-tour="sidebar" className="sticky top-0 flex h-screen w-64 flex-col border-r border-gray-100 bg-white">
      <div className="border-b border-gray-100 p-6">
        <Link href="/dashboard" data-tour="app-logo" className="group flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="block text-sm font-bold leading-none text-gray-900">OfferPilot</span>
            <span className="text-[10px] font-medium uppercase tracking-wide text-blue-600">AI</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              data-tour={item.tour}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600')} />
              {item.label}
              {isActive && <ChevronRight className="ml-auto h-3 w-3 text-blue-400" />}
            </Link>
          );
        })}
      </nav>

      <div data-tour="account-panel" className="border-t border-gray-100 p-4">
        <div className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
            <span className="text-xs font-bold text-blue-700">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-gray-800">{user?.user_metadata?.full_name ?? '用户'}</p>
            <p className="truncate text-[10px] text-gray-400">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full justify-start gap-2 px-3 text-xs text-gray-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-3.5 w-3.5" />
          退出登录
        </Button>
      </div>
    </aside>
  );
}
