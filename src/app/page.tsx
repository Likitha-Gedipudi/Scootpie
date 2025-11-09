import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowUp, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    // Check if user has completed onboarding
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      // User hasn't completed onboarding
      redirect('/onboarding');
    } else {
      // User has completed onboarding
      redirect('/swipe');
    }
  }

  const trendingItems = [
    { title: 'Suede bombers for everyday style', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400' },
    { title: 'Brown pants that sharpen any look', image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400' },
    { title: 'Cashmere sweaters that work anywhere', image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400' },
    { title: 'Hybrid boots for work and weekend', image: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400' },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="absolute top-0 right-0 p-6 z-10">
        <Link
          href="/sign-up"
          className="rounded-lg bg-[#1A1A1A] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#2A2A2A] transition-colors"
        >
          Sign up
        </Link>
      </header>

      {/* Hero Section */}
      <div className="mx-auto max-w-4xl px-6 pt-32 pb-16 text-center">
        {/* Logo Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-[#1A1A1A] flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-4 text-6xl font-bold text-[#1A1A1A]">
          Vesaki
        </h1>
        <p className="text-lg text-[#6B6B6B] mb-12">
          Your personal AI fashion agent
        </p>

        {/* Gender Toggle */}
        <div className="mb-8 inline-flex rounded-lg bg-white p-1 shadow-sm border border-[#E5E5E5]">
          <button className="rounded-md px-6 py-2.5 text-sm font-medium text-[#6B6B6B] transition-all hover:bg-[#FAFAFA]">
            Womens
          </button>
          <button className="rounded-md bg-[#1A1A1A] px-6 py-2.5 text-sm font-medium text-white transition-all">
            Mens
          </button>
        </div>

        {/* Search Box */}
        <div className="mx-auto max-w-2xl mb-16">
          <div className="relative rounded-xl bg-white p-3 shadow-sm border border-[#E5E5E5]">
            <div className="flex items-center gap-3">
              <button className="pl-2">
                <ImageIcon className="h-5 w-5 text-[#6B6B6B]" />
              </button>
              <input
                type="text"
                placeholder="Search product..."
                className="flex-1 py-2 text-base text-[#1A1A1A] placeholder-[#9B9B9B] focus:outline-none"
              />
              <button className="mr-2 rounded-lg bg-[#1A1A1A] p-2.5 text-white hover:bg-[#2A2A2A] transition-colors">
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Trending Section */}
        <div className="text-left">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#1A1A1A]">Most Popular</h2>
          </div>

          {/* Trending Cards */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              {trendingItems.map((item, index) => (
                <Link
                  key={index}
                  href="/sign-up"
                  className="group relative flex-shrink-0 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all"
                >
                  <div className="relative aspect-[3/4]">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                    <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                      <svg className="w-4 h-4 text-[#1A1A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-[#1A1A1A] font-medium mb-1 line-clamp-1">{item.title}</p>
                    <p className="text-base font-bold text-[#1A1A1A]">$120.00</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
