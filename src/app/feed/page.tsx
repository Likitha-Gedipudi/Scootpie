'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { Flame, Sparkles, Tag, Loader2, Heart } from 'lucide-react';
import { Product } from '@/types';
import { Navigation } from '@/components/Navigation';

export default function FeedPage() {
  const [feedItems, setFeedItems] = useState<Product[]>([]);
  const [filter, setFilter] = useState<'all' | 'trending' | 'new' | 'editorial'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeed();
  }, [filter]);

  const loadFeed = async () => {
    setLoading(true);
    try {
      if (filter === 'all') {
        // Fetch all types for 'all' filter
        const [trendingRes, newRes, editorialRes, randomRes] = await Promise.all([
          fetch('/api/products?filter=trending&count=5'),
          fetch('/api/products?filter=new&count=5'),
          fetch('/api/products?filter=editorial&count=5'),
          fetch('/api/products?count=15'),
        ]);

        const [trending, newItems, editorial, random] = await Promise.all([
          trendingRes.json(),
          newRes.json(),
          editorialRes.json(),
          randomRes.json(),
        ]);

        // Combine and deduplicate products by ID
        const allProducts = [
          ...trending.products,
          ...newItems.products,
          ...editorial.products,
          ...random.products,
        ];
        const uniqueProducts = Array.from(
          new Map(allProducts.map((product) => [product.id, product])).values()
        );
        setFeedItems(uniqueProducts);
      } else {
        const response = await fetch(`/api/products?filter=${filter}&count=20`);
        if (response.ok) {
          const data = await response.json();
          setFeedItems(data.products);
        }
      }
    } catch (error) {
      console.error('Failed to load feed:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center pb-16 lg:pb-0 lg:pl-72">
        <Loader2 className="h-8 w-8 animate-spin text-[#1A1A1A]" />
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-[#FAFAFA] pb-16 lg:pb-0 lg:pl-72">
      <div className="lg:px-6 lg:py-6 p-4">
        {/* Desktop Header */}
        <div className="hidden lg:block mb-6">
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">Most Popular</h1>
          <p className="text-sm text-[#6B6B6B]">Trending styles curated for you</p>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden mb-4">
          <h1 className="text-xl font-bold text-[#1A1A1A] mb-1">Most Popular</h1>
          <p className="text-xs text-[#6B6B6B]">Trending styles</p>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${
              filter === 'all' 
                ? 'bg-[#1A1A1A] text-white' 
                : 'bg-white text-[#6B6B6B] border border-[#E5E5E5] hover:bg-[#FAFAFA]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('trending')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filter === 'trending' 
                ? 'bg-[#1A1A1A] text-white' 
                : 'bg-white text-[#6B6B6B] border border-[#E5E5E5] hover:bg-[#FAFAFA]'
            }`}
          >
            <Flame className="h-3.5 w-3.5" />
            Trending
          </button>
          <button
            onClick={() => setFilter('new')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filter === 'new' 
                ? 'bg-[#1A1A1A] text-white' 
                : 'bg-white text-[#6B6B6B] border border-[#E5E5E5] hover:bg-[#FAFAFA]'
            }`}
          >
            <Tag className="h-3.5 w-3.5" />
            New
          </button>
          <button
            onClick={() => setFilter('editorial')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filter === 'editorial' 
                ? 'bg-[#1A1A1A] text-white' 
                : 'bg-white text-[#6B6B6B] border border-[#E5E5E5] hover:bg-[#FAFAFA]'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Editorial
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {feedItems.map((item) => (
            <div key={item.id} className="group relative rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all cursor-pointer">
              <div className="relative aspect-[3/4]">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
                <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                  <Heart className="h-4 w-4 text-[#1A1A1A]" />
                </button>
                  </div>
              <div className="p-3">
                <p className="text-sm text-[#1A1A1A] font-medium mb-1 line-clamp-1">{item.name}</p>
                <p className="text-xs text-[#6B6B6B] mb-1">{item.brand}</p>
                <p className="text-base font-bold text-[#1A1A1A]">{formatPrice(item.price, item.currency)}</p>
                  </div>
              </div>
          ))}
        </div>
      </div>
    </div>
    <Navigation />
    </>
  );
}
