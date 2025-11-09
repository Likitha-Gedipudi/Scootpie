'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, LayoutGrid, MessageCircle, Layers, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/swipe', label: 'Swipe', icon: Layers },
  { href: '/collections', label: 'Collections', icon: Heart },
  { href: '/feed', label: 'Feed', icon: LayoutGrid },
  { href: '/chat', label: 'Chat', icon: MessageCircle },
  { href: '/profile', label: 'Profile', icon: User },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-[#E5E5E5] flex-col z-50">
        {/* Logo */}
        <div className="p-6 border-b border-[#E5E5E5]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A1A1A]">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">vesaki</h1>
          </div>
        </div>

        {/* Nav Items */}
        <div className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-[#1A1A1A] text-white'
                    : 'text-[#6B6B6B] hover:bg-[#FAFAFA] hover:text-[#1A1A1A]'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E5E5E5]">
          <div className="rounded-lg bg-[#FAFAFA] p-4 border border-[#E5E5E5]">
            <p className="text-xs text-[#6B6B6B] mb-1">Premium Features</p>
            <p className="text-sm font-medium text-[#1A1A1A] mb-2">Unlock unlimited swipes</p>
            <button className="w-full rounded-lg bg-[#1A1A1A] px-4 py-2 text-sm font-medium text-white hover:bg-[#2A2A2A] transition-colors">
              Upgrade Now
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E5E5E5]">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-1 min-w-[60px] transition-all"
              >
                <div className={cn(
                  'rounded-lg p-2 transition-all',
                  isActive
                    ? 'bg-[#1A1A1A]'
                    : ''
                )}>
                  <Icon className={cn(
                    'h-5 w-5 transition-colors',
                    isActive ? 'text-white' : 'text-[#6B6B6B]'
                  )} />
                </div>
                <span className={cn(
                  'text-xs font-medium',
                  isActive ? 'text-[#1A1A1A]' : 'text-[#6B6B6B]'
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
