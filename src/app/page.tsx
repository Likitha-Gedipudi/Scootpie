import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowUp, Image as ImageIcon, Heart, Zap, Shield, Star, Check } from 'lucide-react';
import Image from 'next/image';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    try {
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
    } catch (error) {
      // If database query fails (e.g., table doesn't exist), redirect to onboarding
      // This handles cases where the database schema hasn't been set up yet
      console.error('Database query error:', error);
      redirect('/onboarding');
    }
  }

  const trendingItems = [
    { title: 'Suede bombers for everyday style', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400' },
    { title: 'Brown pants that sharpen any look', image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400' },
    { title: 'Cashmere sweaters that work anywhere', image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400' },
    { title: 'Hybrid boots for work and weekend', image: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400' },
  ];

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      {/* Floating Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#8B5CF6] rounded-lg flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">Vesaki</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#" className="hover:text-gray-900 transition-colors">Shop</a>
            <a href="#" className="hover:text-gray-900 transition-colors">About</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Try-On</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="relative bg-gradient-to-r from-[#8B5CF6]/90 to-[#7C3AED]/90 px-4 py-1.5 text-sm font-medium text-white hover:from-[#8B5CF6] hover:to-[#7C3AED] transition-all rounded-lg shadow-sm hover:shadow-md overflow-hidden group"
              style={{
                background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.9), rgba(124, 58, 237, 0.9))',
              }}
            >
              <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'linear-gradient(90deg, #8B5CF6, #7C3AED, #8B5CF6)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s linear infinite'
                }}
              ></div>
              <span className="relative z-10">Get Started</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="pt-24 pb-32 px-6 relative overflow-hidden">
        {/* SVG Noise Filter */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
          <defs>
            <filter id="noiseFilter">
              <feTurbulence 
                type="fractalNoise" 
                baseFrequency="0.65" 
                numOctaves="4" 
                stitchTiles="stitch"
              />
              <feColorMatrix type="saturate" values="0" />
            </filter>
          </defs>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" opacity="0.45" />
        </svg>
        
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#8B5CF6]/5 via-white to-white"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-3xl"></div>
        <div className="absolute top-20 right-1/4 w-72 h-72 bg-purple-400/10 rounded-full blur-3xl"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Hero Content */}
          <div className="text-center mb-16 pt-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full mb-8 shadow-sm">
              <div className="w-2 h-2 bg-[#8B5CF6] rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">AI-Powered Fashion Discovery</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-[1.1] tracking-tight">
              Your Personal
              <br />
              <span className="bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] bg-clip-text text-transparent">AI Stylist</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-16 max-w-3xl mx-auto leading-relaxed">
              Upload your photo, describe your style, and see how clothes look on <span className="font-semibold text-gray-900">you</span> before you buy
            </p>
          </div>

          {/* Main Interactive Section */}
          <div className="max-w-4xl mx-auto">
            {/* Photo Upload Section - Mobile Optimized */}
            <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-3xl border-2 border-dashed border-gray-300 p-6 md:p-10 mb-6 hover:border-[#8B5CF6] hover:shadow-2xl transition-all duration-300 group overflow-hidden">
              {/* Decorative background pattern */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B5CF6]/5 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-400/5 rounded-full blur-2xl"></div>
              </div>
              
              <div className="relative z-10 flex flex-col items-center text-center">
                {/* Icon */}
                <div className="relative mb-6">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-[#8B5CF6]/10 to-[#7C3AED]/5 rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm border border-[#8B5CF6]/10">
                    <svg className="w-10 h-10 md:w-12 md:h-12 text-[#8B5CF6]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  {/* Pulsing ring */}
                  <div className="absolute inset-0 rounded-3xl border-2 border-[#8B5CF6]/20 animate-ping opacity-10"></div>
                </div>
                
                {/* Text Content */}
                <div className="mb-6">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                    Upload Your Photo
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 max-w-md mx-auto leading-relaxed">
                    See how clothes look on <span className="font-semibold text-[#8B5CF6]">you</span> with AI try-on
                    <br className="hidden sm:block" />
                    <span className="text-xs text-gray-500 mt-1 block">Supports JPG, PNG • Max 10MB</span>
                  </p>
                </div>
                
                {/* Action Button */}
                <Link
                  href="/sign-up"
                  className="relative group/btn w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-[#8B5CF6]/90 to-[#7C3AED]/90 text-white rounded-xl hover:from-[#8B5CF6] hover:to-[#7C3AED] transition-all font-medium text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 overflow-hidden"
                  style={{
                    background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.9), rgba(124, 58, 237, 0.9))',
                    animation: 'borderAnimation 3s linear infinite'
                  }}
                >
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"
                    style={{
                      background: 'linear-gradient(90deg, #8B5CF6, #7C3AED, #8B5CF6)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 2s linear infinite'
                    }}
                  ></div>
                  <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="relative z-10">Choose Your Photo</span>
                  <ArrowUp className="w-4 h-4 rotate-90 group-hover/btn:translate-x-1 transition-transform relative z-10" />
                </Link>
                
                {/* Mobile-friendly hint */}
                <p className="text-xs text-gray-500 mt-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#8B5CF6]/40" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Your photos are private and secure
                </p>
              </div>
            </div>

            {/* Or Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">Or search without uploading</span>
              </div>
            </div>
            
            {/* Enhanced Prompt Input Field - Mobile Optimized */}
            <div className="bg-white rounded-2xl border-2 border-gray-300 shadow-xl hover:border-[#8B5CF6] focus-within:border-[#8B5CF6] transition-all overflow-hidden">
              <div className="p-4 md:p-6">
                <textarea
                  placeholder="Try: 'Show me a black leather jacket from Zara' or 'I need a red Gucci handbag for a wedding'"
                  rows={3}
                  className="w-full text-base md:text-lg text-gray-900 placeholder-gray-400 resize-none focus:outline-none"
                ></textarea>
                
                {/* Filters and Button - Stacked on Mobile */}
                <div className="flex flex-col gap-3 pt-4 border-t border-gray-200 mt-4">
                  {/* Filters Row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-1 min-w-[140px]">
                      <span className="text-xs md:text-sm text-gray-600 font-medium whitespace-nowrap">Gender:</span>
                      <select className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border-0 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 cursor-pointer">
                        <option>Unisex</option>
                        <option>Women</option>
                        <option>Men</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-[140px]">
                      <span className="text-xs md:text-sm text-gray-600 font-medium whitespace-nowrap">Style:</span>
                      <select className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border-0 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 cursor-pointer">
                        <option>All Styles</option>
                        <option>Casual</option>
                        <option>Formal</option>
                        <option>Streetwear</option>
                        <option>Luxury</option>
                        <option>Vintage</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Search Button - Full Width on Mobile */}
                  <button className="relative w-full px-5 py-2.5 bg-gradient-to-r from-[#8B5CF6]/90 to-[#7C3AED]/90 text-white rounded-xl hover:from-[#8B5CF6] hover:to-[#7C3AED] transition-all font-medium text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 group overflow-hidden"
                    style={{
                      background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.9), rgba(124, 58, 237, 0.9))',
                    }}
                  >
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background: 'linear-gradient(90deg, #8B5CF6, #7C3AED, #8B5CF6)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 2s linear infinite'
                      }}
                    ></div>
                    <span className="relative z-10">Search</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Trust Indicators - Mobile Optimized */}
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 mt-8 text-xs md:text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-[#8B5CF6]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="whitespace-nowrap">Free forever</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-[#8B5CF6]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="whitespace-nowrap">Data is private</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-[#8B5CF6]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="whitespace-nowrap">Instant results</span>
              </div>
            </div>
          </div>

          {/* Get Started Examples */}
          <div className="mt-28">
            <h3 className="text-sm font-semibold text-gray-700 mb-8 text-center">✨ Popular Searches</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
                <button className="group p-5 bg-white border border-gray-200 rounded-2xl hover:border-[#8B5CF6] hover:shadow-lg transition-all text-center hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B5CF6]/10 to-[#7C3AED]/5 flex items-center justify-center mx-auto mb-3 group-hover:from-[#8B5CF6]/20 group-hover:to-[#7C3AED]/10 group-hover:scale-110 transition-all">
                    <svg className="w-5 h-5 text-[#8B5CF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Red Gucci Jacket</p>
                </button>
                <button className="group p-5 bg-white border border-gray-200 rounded-2xl hover:border-[#8B5CF6] hover:shadow-lg transition-all text-center hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B5CF6]/10 to-[#7C3AED]/5 flex items-center justify-center mx-auto mb-3 group-hover:from-[#8B5CF6]/20 group-hover:to-[#7C3AED]/10 group-hover:scale-110 transition-all">
                    <svg className="w-5 h-5 text-[#8B5CF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Black H&M Jeans</p>
                </button>
                <button className="group p-5 bg-white border border-gray-200 rounded-2xl hover:border-[#8B5CF6] hover:shadow-lg transition-all text-center hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B5CF6]/10 to-[#7C3AED]/5 flex items-center justify-center mx-auto mb-3 group-hover:from-[#8B5CF6]/20 group-hover:to-[#7C3AED]/10 group-hover:scale-110 transition-all">
                    <svg className="w-5 h-5 text-[#8B5CF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Nike Air Max</p>
                </button>
                <button className="group p-5 bg-white border border-gray-200 rounded-2xl hover:border-[#8B5CF6] hover:shadow-lg transition-all text-center hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B5CF6]/10 to-[#7C3AED]/5 flex items-center justify-center mx-auto mb-3 group-hover:from-[#8B5CF6]/20 group-hover:to-[#7C3AED]/10 group-hover:scale-110 transition-all">
                    <svg className="w-5 h-5 text-[#8B5CF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900">White Zara Dress</p>
                </button>
                <button className="group p-5 bg-white border border-gray-200 rounded-2xl hover:border-[#8B5CF6] hover:shadow-lg transition-all text-center hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B5CF6]/10 to-[#7C3AED]/5 flex items-center justify-center mx-auto mb-3 group-hover:from-[#8B5CF6]/20 group-hover:to-[#7C3AED]/10 group-hover:scale-110 transition-all">
                    <svg className="w-5 h-5 text-[#8B5CF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Prada Handbag</p>
                </button>
                <button className="group p-5 bg-white border border-gray-200 rounded-2xl hover:border-[#8B5CF6] hover:shadow-lg transition-all text-center hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B5CF6]/10 to-[#7C3AED]/5 flex items-center justify-center mx-auto mb-3 group-hover:from-[#8B5CF6]/20 group-hover:to-[#7C3AED]/10 group-hover:scale-110 transition-all">
                    <svg className="w-5 h-5 text-[#8B5CF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Adidas Hoodie</p>
                </button>
                <button className="group p-5 bg-white border border-gray-200 rounded-2xl hover:border-[#8B5CF6] hover:shadow-lg transition-all text-center hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B5CF6]/10 to-[#7C3AED]/5 flex items-center justify-center mx-auto mb-3 group-hover:from-[#8B5CF6]/20 group-hover:to-[#7C3AED]/10 group-hover:scale-110 transition-all">
                    <svg className="w-5 h-5 text-[#8B5CF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Levi's Vintage Jeans</p>
                </button>
                <button className="group p-5 bg-white border border-gray-200 rounded-2xl hover:border-[#8B5CF6] hover:shadow-lg transition-all text-center hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B5CF6]/10 to-[#7C3AED]/5 flex items-center justify-center mx-auto mb-3 group-hover:from-[#8B5CF6]/20 group-hover:to-[#7C3AED]/10 group-hover:scale-110 transition-all">
                    <svg className="w-5 h-5 text-[#8B5CF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Balenciaga Sneakers</p>
                </button>
              </div>
            </div>
          </div>
        </div>

      {/* Decorative Separator */}
      <div className="relative py-16 md:py-20 overflow-hidden">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center">
          <div className="bg-white px-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]/20"></div>
              <div className="w-2 h-2 rounded-full bg-[#8B5CF6]/40"></div>
              <div className="w-3 h-3 rounded-full bg-[#8B5CF6]/70"></div>
              <div className="w-2 h-2 rounded-full bg-[#8B5CF6]/40"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]/20"></div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-24 px-6 bg-gradient-to-b from-white via-[#8B5CF6]/5 to-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full mb-6 shadow-sm">
              <span className="text-xs md:text-sm font-medium text-[#8B5CF6]">How It Works</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">Three Steps to Your Best Style</h2>
            <p className="text-lg md:text-xl text-gray-600">Simple, fast, and personalized—just like magic ✨</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="group bg-white p-6 md:p-8 rounded-2xl border border-gray-200 hover:border-[#8B5CF6]/50 transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="relative w-16 h-16 bg-gradient-to-br from-[#8B5CF6]/90 to-[#7C3AED]/90 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform shadow-md">
                <span className="text-2xl font-bold text-white">1</span>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#8B5CF6]/10 rounded-full blur-md"></div>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 text-center">Swipe Your Style</h3>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed text-center">Like Tinder, but for clothes. Our AI learns your taste with every swipe—no more seeing things you'd never wear.</p>
            </div>
            <div className="group bg-white p-6 md:p-8 rounded-2xl border border-gray-200 hover:border-[#8B5CF6]/50 transition-all hover:shadow-lg hover:-translate-y-1 md:mt-4">
              <div className="relative w-16 h-16 bg-gradient-to-br from-[#8B5CF6]/90 to-[#7C3AED]/90 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform shadow-md">
                <span className="text-2xl font-bold text-white">2</span>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#8B5CF6]/10 rounded-full blur-md"></div>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 text-center">Try It On</h3>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed text-center">See exactly how clothes look on your body with AI-powered virtual try-on. Revolutionary technology, zero trips to the fitting room.</p>
            </div>
            <div className="group bg-white p-6 md:p-8 rounded-2xl border border-gray-200 hover:border-[#8B5CF6]/50 transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="relative w-16 h-16 bg-gradient-to-br from-[#8B5CF6]/90 to-[#7C3AED]/90 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform shadow-md">
                <span className="text-2xl font-bold text-white">3</span>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#8B5CF6]/10 rounded-full blur-md"></div>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 text-center">Shop Smart</h3>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed text-center">Buy only what looks amazing on you. Save time, money, and returns. Our users return 80% fewer items.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Wavy Separator */}
      <div className="relative h-24">
        <svg className="absolute bottom-0 w-full h-24" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="#F9FAFB"/>
        </svg>
      </div>

      {/* Trending Now - Live Products Section */}
      <div className="bg-gray-50 py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full mb-6 shadow-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">Live from Top Stores</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">Trending Right Now 🔥</h2>
            <p className="text-xl text-gray-600">Real products, real prices, real-time updates</p>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingItems.map((item, index) => (
              <Link
                key={index}
                href="/sign-up"
                className="group block"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-white rounded-2xl mb-4 border-2 border-gray-200 group-hover:border-[#8B5CF6] transition-all group-hover:shadow-xl">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-gray-900">
                    New
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-[#8B5CF6] transition-colors">{item.title}</h3>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-gray-900">$120</p>
                  <span className="text-xs text-gray-500">Free Shipping</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/sign-up"
              className="relative inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#8B5CF6]/90 to-[#7C3AED]/90 text-white rounded-xl hover:from-[#8B5CF6] hover:to-[#7C3AED] transition-all font-medium text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 group overflow-hidden"
              style={{
                background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.9), rgba(124, 58, 237, 0.9))',
              }}
            >
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'linear-gradient(90deg, #8B5CF6, #7C3AED, #8B5CF6)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s linear infinite'
                }}
              ></div>
              <span className="relative z-10">Explore More Products</span>
              <ArrowUp className="h-4 w-4 rotate-90 group-hover:translate-x-1 transition-transform relative z-10" />
            </Link>
          </div>
        </div>
      </div>

      {/* Star Separator */}
      <div className="relative py-16 bg-white">
        <div className="flex justify-center items-center gap-4">
          <div className="h-px w-16 md:w-24 bg-gradient-to-r from-transparent to-gray-300"></div>
          <svg className="w-5 h-5 text-[#8B5CF6]/50" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <div className="h-px w-16 md:w-24 bg-gradient-to-l from-transparent to-gray-300"></div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="py-24 px-6 bg-white relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full mb-6">
              <span className="text-xs md:text-sm font-medium text-gray-600">⭐ 4.9/5 from 12,000+ reviews</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">Loved by Style Seekers</h2>
            <p className="text-lg md:text-xl text-gray-600">Real people, real transformations</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="group bg-gradient-to-br from-white to-gray-50 p-6 md:p-8 rounded-2xl border border-gray-200 hover:border-[#8B5CF6]/50 transition-all hover:shadow-lg hover:-translate-y-0.5">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#FCD34D]/80 text-[#FCD34D]/80" />
                ))}
              </div>
              <p className="text-sm md:text-base text-gray-700 mb-6 leading-relaxed">"Finally, an app that gets my style! The virtual try-on saved me from so many bad purchases. Obsessed. 💜"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B5CF6]/20 to-[#7C3AED]/10 border border-[#8B5CF6]/20 flex items-center justify-center text-[#8B5CF6] font-semibold text-sm">
                  SM
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Sarah Martinez</div>
                  <div className="text-xs text-gray-500">Fashion Blogger • NY</div>
                </div>
              </div>
            </div>
            <div className="group bg-gradient-to-br from-white to-gray-50 p-6 md:p-8 rounded-2xl border border-gray-200 hover:border-[#8B5CF6]/50 transition-all hover:shadow-lg hover:-translate-y-0.5">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#FCD34D]/80 text-[#FCD34D]/80" />
                ))}
              </div>
              <p className="text-sm md:text-base text-gray-700 mb-6 leading-relaxed">"I used to spend hours shopping online. Now AI does it for me and I actually like everything I see. Game changer! 🔥"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B5CF6]/20 to-[#7C3AED]/10 border border-[#8B5CF6]/20 flex items-center justify-center text-[#8B5CF6] font-semibold text-sm">
                  JK
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">James Kim</div>
                  <div className="text-xs text-gray-500">Creative Director • LA</div>
                </div>
              </div>
            </div>
            <div className="group bg-gradient-to-br from-white to-gray-50 p-6 md:p-8 rounded-2xl border border-gray-200 hover:border-[#8B5CF6]/50 transition-all hover:shadow-lg hover:-translate-y-0.5">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#FCD34D]/80 text-[#FCD34D]/80" />
                ))}
              </div>
              <p className="text-sm md:text-base text-gray-700 mb-6 leading-relaxed">"The AI chat gives better style advice than my friends. Plus it's available 24/7 and never judges. Best shopping buddy ever! ✨"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B5CF6]/20 to-[#7C3AED]/10 border border-[#8B5CF6]/20 flex items-center justify-center text-[#8B5CF6] font-semibold text-sm">
                  ER
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Emma Roberts</div>
                  <div className="text-xs text-gray-500">Entrepreneur • London</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zigzag Separator */}
      <div className="relative py-12 bg-gray-50">
        <svg className="w-full h-8" viewBox="0 0 1200 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 12L30 0L60 12L90 0L120 12L150 0L180 12L210 0L240 12L270 0L300 12L330 0L360 12L390 0L420 12L450 0L480 12L510 0L540 12L570 0L600 12L630 0L660 12L690 0L720 12L750 0L780 12L810 0L840 12L870 0L900 12L930 0L960 12L990 0L1020 12L1050 0L1080 12L1110 0L1140 12L1170 0L1200 12" stroke="#8B5CF6" strokeWidth="2" opacity="0.3"/>
        </svg>
      </div>

      {/* Features Section */}
      <div className="py-24 px-6 bg-gray-50 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full mb-6 shadow-sm">
              <span className="text-sm font-medium text-[#8B5CF6]">Why Choose Us</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">Everything You Need</h2>
            <p className="text-xl text-gray-600">One app, infinite possibilities</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="group flex gap-4 p-5 md:p-6 bg-white rounded-xl border border-gray-200 hover:border-[#8B5CF6]/50 transition-all hover:shadow-md">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#8B5CF6]/10 to-[#7C3AED]/5 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <Sparkles className="h-5 w-5 text-[#8B5CF6]/70" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1">AI That Learns You</h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed">Gets smarter with every swipe. No more seeing things you'd never wear.</p>
              </div>
            </div>
            <div className="group flex gap-4 p-5 md:p-6 bg-white rounded-xl border border-gray-200 hover:border-[#8B5CF6]/50 transition-all hover:shadow-md">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#8B5CF6]/10 to-[#7C3AED]/5 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <ImageIcon className="h-5 w-5 text-[#8B5CF6]/70" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1">Virtual Try-On</h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed">See clothes on your body before buying. Revolutionary AR technology.</p>
              </div>
            </div>
            <div className="group flex gap-4 p-5 md:p-6 bg-white rounded-xl border border-gray-200 hover:border-[#8B5CF6]/50 transition-all hover:shadow-md">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#8B5CF6]/10 to-[#7C3AED]/5 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <Zap className="h-5 w-5 text-[#8B5CF6]/70" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1">Chat Stylist 24/7</h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed">Ask anything. "What should I wear to a wedding?" Get instant outfit ideas.</p>
              </div>
            </div>
            <div className="group flex gap-4 p-5 md:p-6 bg-white rounded-xl border border-gray-200 hover:border-[#8B5CF6]/50 transition-all hover:shadow-md">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#8B5CF6]/10 to-[#7C3AED]/5 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <Heart className="h-5 w-5 text-[#8B5CF6]/70" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1">Smart Collections</h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed">Save favorites. Build complete outfits. Never lose track of that perfect item.</p>
              </div>
            </div>
            <div className="group flex gap-4 p-5 md:p-6 bg-white rounded-xl border border-gray-200 hover:border-[#8B5CF6]/50 transition-all hover:shadow-md">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#8B5CF6]/10 to-[#7C3AED]/5 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <Shield className="h-5 w-5 text-[#8B5CF6]/70" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1">500+ Brands</h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed">Shop everywhere from one app. From streetwear to luxury, all in one place.</p>
              </div>
            </div>
            <div className="group flex gap-4 p-5 md:p-6 bg-white rounded-xl border border-gray-200 hover:border-[#8B5CF6]/50 transition-all hover:shadow-md">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#8B5CF6]/10 to-[#7C3AED]/5 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <Check className="h-5 w-5 text-[#8B5CF6]/70" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1">Zero Regrets</h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed">Buy less, love more. Our users return 80% fewer items.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="relative bg-gray-900 py-24 px-6">
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-4 leading-tight">
            Stop Guessing. Start Knowing.
          </h2>
          <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Join 50,000+ people who found their perfect style with AI.
            <br />
            <span className="text-base">Free forever. No credit card required.</span>
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="relative px-6 py-2.5 bg-white text-gray-900 hover:bg-gray-100 transition-all rounded-xl font-medium text-sm shadow-lg hover:shadow-xl w-full sm:w-auto text-center overflow-hidden group"
            >
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.9), rgba(243, 244, 246, 0.9), rgba(255, 255, 255, 0.9))',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s linear infinite'
                }}
              ></div>
              <span className="relative z-10">Begin Free</span>
            </Link>
            <Link
              href="/sign-up"
              className="border-2 border-gray-700/50 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800/50 hover:border-gray-600 transition-all rounded-xl w-full sm:w-auto text-center"
            >
              View Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
