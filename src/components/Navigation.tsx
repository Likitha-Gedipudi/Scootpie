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
      <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-[#E8E6E3] flex-col z-50 shadow-luxury">
        {/* Logo */}
        <div className="p-6 border-b border-[#F2F1EF]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center bg-white shadow-soft rounded-2xl border border-[#E8E6E3]">
              <Sparkles className="h-6 w-6 text-[#9CAF9A]" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-[#2C2C2C] tracking-wide">vesaki</h1>
          </div>
        </div>

        {/* Nav Items */}
        <div className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3.5 text-sm font-medium tracking-wide transition-all duration-300 border-l-2 rounded-r-xl',
                  isActive
                    ? 'bg-gradient-to-r from-[#9CAF9A] to-[#8A9D88] text-white shadow-soft border-[#9CAF9A]'
                    : 'text-[#8B8B8B] hover:bg-[#F5F3F0] hover:text-[#2C2C2C] hover:border-[#E8B4B8] border-transparent'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="uppercase text-xs font-semibold tracking-wider">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#F2F1EF]">
          <div className="bg-gradient-to-br from-[#F5F3F0] to-white p-5 border border-[#E8E6E3] shadow-luxury rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1 w-1 rounded-full bg-[#E8B4B8]"></div>
              <p className="text-xs text-[#E8B4B8] uppercase tracking-widest font-semibold">Premium</p>
            </div>
            <p className="text-sm font-medium text-[#2C2C2C] mb-3 tracking-wide">Unlock unlimited access</p>
            <button className="w-full bg-gradient-to-r from-[#9CAF9A] to-[#8A9D88] px-4 py-2.5 text-xs font-semibold text-white hover:from-[#B5C4B3] hover:to-[#9CAF9A] transition-all duration-300 shadow-soft uppercase tracking-widest rounded-full">
              Upgrade
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E8E6E3] shadow-luxury backdrop-blur-sm">
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
                  'p-2 transition-all duration-300 border-t-2 rounded-xl',
                  isActive
                    ? 'bg-gradient-to-r from-[#9CAF9A] to-[#8A9D88] shadow-soft border-[#9CAF9A]'
                    : 'border-transparent'
                )}>
                  <Icon className={cn(
                    'h-5 w-5 transition-colors',
                    isActive ? 'text-white' : 'text-[#8B8B8B]'
                  )} />
                </div>
                <span className={cn(
                  'text-[10px] font-semibold uppercase tracking-wider',
                  isActive ? 'text-[#9CAF9A]' : 'text-[#8B8B8B]'
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
