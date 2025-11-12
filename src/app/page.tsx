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
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Floating Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[#E8E8E6]">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#1A1A1A] rounded-full flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-2xl font-serif font-semibold text-[#1A1A1A] tracking-[-0.04em]">Vesaki</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 font-serif text-sm tracking-tight text-[#1A1A1A]">
            <a href="#" className="hover:text-[#666] transition-colors">Shop</a>
            <a href="#" className="hover:text-[#666] transition-colors">About</a>
            <a href="#" className="hover:text-[#666] transition-colors">Try-On</a>
          </nav>
          <Link
            href="/sign-up"
            className="bg-[#1A1A1A] px-7 py-2.5 font-serif text-sm font-medium text-white hover:bg-[#2D2D2D] transition-all duration-300 rounded-full tracking-tight"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <div className="pt-40 pb-32 px-6 relative overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-[#E8E8E6]/30 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 right-10 w-[400px] h-[400px] bg-[#F5F5F3]/40 rounded-full blur-3xl opacity-50"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Hero Content */}
          <div className="text-center mb-24">
            <div className="inline-flex items-center gap-2 mb-8 px-6 py-3 bg-white rounded-full border border-[#E8E8E6] shadow-sm hover:shadow-md transition-shadow">
              <div className="w-2 h-2 bg-[#1A1A1A] rounded-full animate-pulse"></div>
              <span className="text-xs font-semibold text-[#1A1A1A] tracking-wider uppercase">AI-Powered Fashion Discovery</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-[#1A1A1A] tracking-[-0.04em] mb-8 leading-[1.05]">
              Never Wear
              <br />
              The Wrong Thing
              <br />
              Again
            </h1>
            <p className="text-xl md:text-2xl text-[#5A5A5A] mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              Your AI fashion stylist finds perfect outfits, shows you how they look on <span className="italic font-medium">you</span>, and saves hours of scrolling.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
              <Link
                href="/sign-up"
                className="group relative bg-[#1A1A1A] px-12 py-5 text-lg font-semibold text-white hover:bg-[#0A0A0A] hover:scale-105 transition-all duration-300 rounded-full shadow-lg hover:shadow-2xl w-full sm:w-auto overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Begin Your Journey
                  <ArrowUp className="w-5 h-5 rotate-90 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              </Link>
              <Link
                href="/sign-up"
                className="bg-white border-2 border-[#E8E8E6] px-12 py-5 text-lg font-semibold text-[#1A1A1A] hover:border-[#1A1A1A] hover:bg-[#FAFAF8] transition-all duration-300 rounded-full w-full sm:w-auto"
              >
                Explore Collections
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-8 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-[#E8E8E6] border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-[#D8D8D6] border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-[#C8C8C6] border-2 border-white"></div>
                </div>
                <span className="text-sm text-[#5A5A5A]">Join 50K+ style lovers</span>
              </div>
              <div className="h-6 w-px bg-[#E8E8E6]"></div>
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#1A1A1A] text-[#1A1A1A]" />
                  ))}
                </div>
                <span className="text-sm text-[#5A5A5A]">4.9/5 from 2,000+ reviews</span>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="mb-32 bg-gradient-to-br from-white to-[#FAFAF8] rounded-[3rem] p-12 md:p-20 shadow-md border border-[#E8E8E6]">
            <div className="text-center mb-20">
              <span className="inline-block text-xs font-semibold text-[#8A8A8A] tracking-widest uppercase mb-4 bg-[#F5F5F3] px-4 py-2 rounded-full">How It Works</span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#1A1A1A] tracking-[-0.04em]">Three Steps to Your Best Style</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-12 md:gap-16">
              <div className="text-center group">
                <div className="relative w-20 h-20 bg-gradient-to-br from-[#1A1A1A] to-[#3A3A3A] rounded-full flex items-center justify-center mx-auto mb-8 font-serif text-3xl font-bold text-white shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300">
                  1
                  <div className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/10 transition-colors"></div>
                </div>
                <h3 className="text-2xl font-serif font-bold text-[#1A1A1A] mb-4 tracking-[-0.02em]">Swipe Your Style</h3>
                <p className="text-base text-[#5A5A5A] leading-relaxed">Like Tinder, but for clothes. Our AI learns your taste with every swipe.</p>
              </div>
              <div className="text-center group">
                <div className="relative w-20 h-20 bg-gradient-to-br from-[#1A1A1A] to-[#3A3A3A] rounded-full flex items-center justify-center mx-auto mb-8 font-serif text-3xl font-bold text-white shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300">
                  2
                  <div className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/10 transition-colors"></div>
                </div>
                <h3 className="text-2xl font-serif font-bold text-[#1A1A1A] mb-4 tracking-[-0.02em]">Try It On</h3>
                <p className="text-base text-[#5A5A5A] leading-relaxed">See exactly how clothes look on you with AI-powered virtual try-on.</p>
              </div>
              <div className="text-center group">
                <div className="relative w-20 h-20 bg-gradient-to-br from-[#1A1A1A] to-[#3A3A3A] rounded-full flex items-center justify-center mx-auto mb-8 font-serif text-3xl font-bold text-white shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300">
                  3
                  <div className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/10 transition-colors"></div>
                </div>
                <h3 className="text-2xl font-serif font-bold text-[#1A1A1A] mb-4 tracking-[-0.02em]">Shop Smart</h3>
                <p className="text-base text-[#5A5A5A] leading-relaxed">Buy only what looks amazing on you. Save time, money, and returns.</p>
              </div>
            </div>
          </div>

          {/* Featured Collection */}
          <div className="relative py-20">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-transparent to-[#E8E8E6]"></div>
            <div className="text-center mb-12">
              <span className="inline-block text-xs font-medium text-[#8A8A8A] tracking-widest uppercase mb-3">Featured Selection</span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1A1A] tracking-[-0.03em] mb-4">This Week's Edit</h2>
              <p className="text-lg text-[#5A5A5A] max-w-xl mx-auto">Handpicked pieces that define modern elegance</p>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {trendingItems.map((item, index) => (
                <Link
                  key={index}
                  href="/sign-up"
                  className="group block"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-[#FAFAF8] to-[#F5F5F3] rounded-[2rem] mb-4 border border-[#E8E8E6]">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <button className="absolute top-4 right-4 w-10 h-10 bg-white/95 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full shadow-lg hover:scale-110">
                      <svg className="w-5 h-5 text-[#1A1A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                    <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-full">
                        <span className="text-xs font-medium text-[#1A1A1A]">View Details</span>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-[#1A1A1A] mb-2 line-clamp-2 leading-snug">{item.title}</h3>
                  <p className="text-lg font-semibold text-[#1A1A1A]">$120</p>
                </Link>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#1A1A1A] hover:gap-3 transition-all group"
              >
                <span>Explore Full Collection</span>
                <ArrowUp className="h-4 w-4 rotate-90 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Social Proof */}
          <div className="mb-32">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#1A1A1A] tracking-[-0.04em] mb-6">Loved by Style Seekers</h2>
              <p className="text-xl text-[#5A5A5A] font-light">Real people, real transformations</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 md:gap-10">
              <div className="bg-white rounded-3xl p-8 shadow-md border border-[#E8E8E6] hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#1A1A1A] text-[#1A1A1A]" />
                  ))}
                </div>
                <p className="text-sm text-[#1A1A1A] mb-6 leading-relaxed italic">"Finally, an app that gets my style! The virtual try-on saved me from so many bad purchases. Obsessed."</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E8E8E6]"></div>
                  <div>
                    <div className="text-sm font-semibold text-[#1A1A1A]">Sarah M.</div>
                    <div className="text-xs text-[#8A8A8A]">New York</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-3xl p-8 shadow-md border border-[#E8E8E6] hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#1A1A1A] text-[#1A1A1A]" />
                  ))}
                </div>
                <p className="text-sm text-[#1A1A1A] mb-6 leading-relaxed italic">"I used to spend hours shopping online. Now AI does it for me and I actually like everything I see."</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E8E8E6]"></div>
                  <div>
                    <div className="text-sm font-semibold text-[#1A1A1A]">James K.</div>
                    <div className="text-xs text-[#8A8A8A]">Los Angeles</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-3xl p-8 shadow-md border border-[#E8E8E6] hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#1A1A1A] text-[#1A1A1A]" />
                  ))}
                </div>
                <p className="text-sm text-[#1A1A1A] mb-6 leading-relaxed italic">"The AI chat gives better style advice than my friends. Plus it's available 24/7 and never judges."</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E8E8E6]"></div>
                  <div>
                    <div className="text-sm font-semibold text-[#1A1A1A]">Emma R.</div>
                    <div className="text-xs text-[#8A8A8A]">London</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="mb-32 bg-gradient-to-br from-[#1A1A1A] via-[#2A2A2A] to-[#1A1A1A] rounded-[3rem] p-12 md:p-20 text-white shadow-2xl relative overflow-hidden">
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 left-0 w-full h-full" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px'}}></div>
            </div>
            <div className="relative z-10">
              <div className="text-center mb-20">
                <h2 className="text-4xl md:text-5xl font-serif font-bold tracking-[-0.04em] mb-6">Everything You Need</h2>
                <p className="text-xl text-white/70 font-light">One app, infinite possibilities</p>
              </div>
              <div className="grid md:grid-cols-2 gap-10">
                <div className="flex gap-5 group hover:translate-x-2 transition-transform duration-300">
                  <div className="flex-shrink-0 w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-bold mb-3 tracking-[-0.02em]">AI That Learns You</h3>
                    <p className="text-base text-white/70 leading-relaxed">Gets smarter with every swipe. No more seeing things you'd never wear.</p>
                  </div>
                </div>
                <div className="flex gap-5 group hover:translate-x-2 transition-transform duration-300">
                  <div className="flex-shrink-0 w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300">
                    <ImageIcon className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-bold mb-3 tracking-[-0.02em]">Virtual Try-On</h3>
                    <p className="text-base text-white/70 leading-relaxed">See clothes on your body before buying. Revolutionary AR technology.</p>
                  </div>
                </div>
                <div className="flex gap-5 group hover:translate-x-2 transition-transform duration-300">
                  <div className="flex-shrink-0 w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300">
                    <Zap className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-bold mb-3 tracking-[-0.02em]">Chat Stylist 24/7</h3>
                    <p className="text-base text-white/70 leading-relaxed">Ask anything. "What should I wear to a wedding?" Get instant outfit ideas.</p>
                  </div>
                </div>
                <div className="flex gap-5 group hover:translate-x-2 transition-transform duration-300">
                  <div className="flex-shrink-0 w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300">
                    <Heart className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-bold mb-3 tracking-[-0.02em]">Smart Collections</h3>
                    <p className="text-base text-white/70 leading-relaxed">Save favorites. Build complete outfits. Never lose track of that perfect item.</p>
                  </div>
                </div>
                <div className="flex gap-5 group hover:translate-x-2 transition-transform duration-300">
                  <div className="flex-shrink-0 w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300">
                    <Shield className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-bold mb-3 tracking-[-0.02em]">500+ Brands</h3>
                    <p className="text-base text-white/70 leading-relaxed">Shop everywhere from one app. From streetwear to luxury, all in one place.</p>
                  </div>
                </div>
                <div className="flex gap-5 group hover:translate-x-2 transition-transform duration-300">
                  <div className="flex-shrink-0 w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300">
                    <Check className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-bold mb-3 tracking-[-0.02em]">Zero Regrets</h3>
                    <p className="text-base text-white/70 leading-relaxed">Buy less, love more. Our users return 80% fewer items.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="relative bg-[#1A1A1A] py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2D2D2D] via-[#1A1A1A] to-[#0A0A0A]"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-block mb-6 px-5 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
            <span className="text-xs font-medium text-white/90">Join the Fashion Revolution</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white mb-6 tracking-[-0.03em] leading-tight">
            Stop Guessing. Start Knowing.
          </h2>
          <p className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join 50,000+ people who found their perfect style with AI.
            <br />
            <span className="text-base">Free forever. No credit card required.</span>
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="group bg-white px-12 py-4 text-base font-semibold text-[#1A1A1A] hover:bg-white/90 transition-all duration-300 rounded-full shadow-2xl hover:shadow-white/20 w-full sm:w-auto"
            >
              <span>Begin Free</span>
            </Link>
            <Link
              href="/sign-up"
              className="border-2 border-white/30 px-12 py-4 text-base font-medium text-white hover:bg-white/10 transition-all duration-300 rounded-full w-full sm:w-auto"
            >
              View Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
