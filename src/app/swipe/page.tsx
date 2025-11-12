'use client';

import { useState, useEffect, useCallback } from 'react';
import { SwipeCard } from '@/components/swipe/SwipeCard';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';
import { generateSessionId } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { Heart, X, Star, RotateCcw, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation } from '@/components/Navigation';

interface TryOnImage {
  productId: string;
  imageUrl: string;
  loading: boolean;
}

export default function SwipePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null);
  const [tryOnImages, setTryOnImages] = useState<Map<string, string>>(new Map());
  const [generatingTryOns, setGeneratingTryOns] = useState<Set<string>>(new Set());
  const [hasPhoto, setHasPhoto] = useState(true);
  const [query, setQuery] = useState('');
  
  const {
    sessionId,
    setSessionId,
    leftSwipeCount,
    incrementLeftSwipeCount,
    resetLeftSwipeCount,
    setSelectedProduct,
  } = useStore();

  // Fetch user's primary photo
  const fetchUserPhoto = useCallback(async () => {
    try {
      const response = await fetch('/api/user/photo/primary');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.photo) {
          setUserPhotoUrl(data.photo.url);
          setHasPhoto(true);
        } else {
          setHasPhoto(false);
        }
      } else {
        setHasPhoto(false);
      }
    } catch (error) {
      console.error('Failed to fetch user photo:', error);
      setHasPhoto(false);
    }
  }, []);

  // Generate try-on image for a product
  const generateTryOn = useCallback(async (productId: string) => {
    if (tryOnImages.has(productId) || generatingTryOns.has(productId)) {
      return; // Already generated or generating
    }

    if (!userPhotoUrl) {
      return; // No user photo available
    }

    setGeneratingTryOns(prev => new Set(prev).add(productId));

    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      let imageUrl: string | undefined;

      if (product.isExternal) {
        // Direct generation using image URL and user photo
        const response = await fetch('/api/tryon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userPhotoUrl,
            productImageUrl: product.imageUrl,
            productName: product.name,
            productDescription: product.description,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && (data.imageUrl || data.imageData)) {
            imageUrl = data.imageUrl || `data:image/png;base64,${data.imageData}`;
          }
        }
      } else {
        // Use cached/DB-based generation
        console.log('[SWIPE] Generating try-on for product:', productId);
        const response = await fetch('/api/tryon/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        });
        console.log('[SWIPE] Try-on API response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('[SWIPE] Try-on API response data:', data);
          if (data.success && data.imageUrl) {
            imageUrl = data.imageUrl;
          }
        } else {
          const errorText = await response.text();
          console.error('[SWIPE] Try-on API error:', response.status, errorText);
        }
      }

      if (imageUrl) {
        setTryOnImages(prev => new Map(prev).set(productId, imageUrl!));
      }
    } catch (error) {
      console.error(`Failed to generate try-on for product ${productId}:`, error);
    } finally {
      setGeneratingTryOns(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  }, [userPhotoUrl, tryOnImages, generatingTryOns, products]);

  // Pre-generate try-ons for upcoming products
  const pregenerateTryOns = useCallback(async (products: Product[], startIndex: number) => {
    if (!userPhotoUrl) return;

    // Generate try-ons for next 3 products
    const nextProducts = products.slice(startIndex, startIndex + 3);
    for (const product of nextProducts) {
      if (!tryOnImages.has(product.id) && !generatingTryOns.has(product.id)) {
        generateTryOn(product.id);
      }
    }
  }, [userPhotoUrl, tryOnImages, generatingTryOns, generateTryOn]);

  useEffect(() => {
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    fetchUserPhoto();
    loadProducts();
  }, [setSessionId, fetchUserPhoto]);

  // DISABLED: Auto try-on generation to avoid API quota exhaustion
  // Users can manually generate try-ons by tapping a button on the card instead
  // useEffect(() => {
  //   if (products.length > 0 && userPhotoUrl) {
  //     // Generate try-ons for initial products
  //     pregenerateTryOns(products, 0);
  //   }
  // }, [products, userPhotoUrl, pregenerateTryOns]);

  // // Pre-generate when approaching end of current batch
  // useEffect(() => {
  //   if (products.length > 0 && userPhotoUrl && currentIndex > 0) {
  //     pregenerateTryOns(products, currentIndex);
  //   }
  // }, [currentIndex, products, userPhotoUrl, pregenerateTryOns]);

  const loadProducts = async (search?: string) => {
    setLoading(true);
    try {
      const url = search && search.trim().length > 0
        ? `/api/search/products?q=${encodeURIComponent(search.trim())}&count=15`
        : `/api/search/products?q=${encodeURIComponent('trending fashion apparel')}&count=15`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
        setCurrentIndex(0);
        setTryOnImages(new Map());
        setGeneratingTryOns(new Set());
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    }
    setLoading(false);
  };

  const handleSwipe = async (direction: 'left' | 'right' | 'up') => {
    if (currentIndex >= products.length) return;

    if (direction === 'left') {
      incrementLeftSwipeCount();
      
      if (leftSwipeCount + 1 >= 15) {
        alert('Looks like you\'re not finding what you like. Let me help you refine your preferences!');
        resetLeftSwipeCount();
      }
    } else {
      resetLeftSwipeCount();
    }

    // Save swipe to database
    try {
      const likedProduct = products[currentIndex];
      const likedTryOn = tryOnImages.get(likedProduct.id);
      await fetch('/api/swipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: likedProduct.id,
          direction,
          sessionId,
          cardPosition: currentIndex,
          product: likedProduct,
          tryOnImageUrl: likedTryOn,
        }),
      });
    } catch (error) {
      console.error('Failed to save swipe:', error);
    }

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);

    // DISABLED: Pre-generate try-ons for upcoming products (to avoid API quota)
    // if (userPhotoUrl && nextIndex < products.length) {
    //   pregenerateTryOns(products, nextIndex);
    // }

    // Load more products when running low
    if (nextIndex >= products.length - 5) {
      try {
        const response = await fetch('/api/products?count=15');
        if (response.ok) {
          const data = await response.json();
          setProducts((prev) => [...prev, ...data.products]);
        }
      } catch (error) {
        console.error('Failed to load more products:', error);
      }
    }
  };

  const handleCardTap = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleManualSwipe = (direction: 'left' | 'right' | 'up') => {
    handleSwipe(direction);
  };

  // Compute current product and try-on state before any early returns
  const currentProduct = products[currentIndex];
  const remainingCards = products.length - currentIndex;
  const currentTryOnUrl = currentProduct ? tryOnImages.get(currentProduct.id) : undefined;
  const isGeneratingTryOn = currentProduct ? generatingTryOns.has(currentProduct.id) : false;

  // Auto-generate try-on for the current card (quota-friendly: current item only)
  useEffect(() => {
    if (currentProduct && userPhotoUrl && !currentTryOnUrl && !isGeneratingTryOn) {
      generateTryOn(currentProduct.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProduct?.id, userPhotoUrl]);

  if (loading) {
    return (
      <>
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-white via-[#8B5CF6]/5 to-white pb-16 lg:pb-0 lg:pl-56 relative overflow-hidden">
        {/* Noise Background */}
        <svg className="absolute inset-0 w-full h-full opacity-65 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <filter id="noise-swipe-loading">
            <feTurbulence type="fractalNoise" baseFrequency="0.80" numOctaves="4" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#noise-swipe-loading)"/>
        </svg>
        <div className="text-center relative z-10">
          <Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6] mx-auto mb-4" />
          <p className="text-lg text-gray-700 font-light">Loading your personalized recommendations...</p>
        </div>
      </div>
      <Navigation />
      </>
    );
  }

  if (!hasPhoto) {
    return (
      <>
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-white via-[#8B5CF6]/5 to-white pb-16 lg:pb-0 lg:pl-56 relative overflow-hidden">
        {/* Noise Background */}
        <svg className="absolute inset-0 w-full h-full opacity-65 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <filter id="noise-swipe-nophoto">
            <feTurbulence type="fractalNoise" baseFrequency="0.80" numOctaves="4" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#noise-swipe-nophoto)"/>
        </svg>
        <div className="text-center max-w-md px-4 relative z-10">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No Photos Found</h2>
            <p className="text-gray-600 mb-6 font-light">Please upload at least one photo to enable virtual try-on.</p>
            <a 
              href="/profile" 
              className="relative inline-flex bg-gradient-to-r from-[#8B5CF6]/90 to-[#7C3AED]/90 px-6 py-2.5 text-sm font-medium text-white rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 overflow-hidden group transition-all"
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
              <span className="relative z-10">Upload Photos</span>
            </a>
          </div>
        </div>
      </div>
      <Navigation />
      </>
    );
  }

  return (
    <>
    <div className="flex flex-col h-screen bg-gradient-to-br from-white via-[#8B5CF6]/5 to-white pb-16 lg:pb-0 lg:pl-56 relative">
      {/* Noise Background - Fixed positioning */}
      <div className="fixed inset-0 pointer-events-none z-0 lg:left-56">
        <svg className="w-full h-full opacity-65" xmlns="http://www.w3.org/2000/svg">
          <filter id="noise-swipe">
            <feTurbulence type="fractalNoise" baseFrequency="0.80" numOctaves="4" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#noise-swipe)"/>
        </svg>
      </div>
      
      {/* Floating Gradient Orbs - Fixed positioning */}
      <div className="fixed top-20 right-10 w-72 h-72 bg-[#8B5CF6]/10 rounded-full blur-3xl animate-pulse pointer-events-none z-0 lg:left-[calc(224px+10rem)]"></div>
      <div className="fixed bottom-20 left-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse pointer-events-none z-0 lg:left-[calc(224px+2.5rem)]" style={{animationDelay: '1s'}}></div>
      
      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between h-14 px-6 border-b border-gray-200 bg-white relative z-10 shrink-0">
        <div>
          <h1 className="text-lg font-semibold">Discover Fashion</h1>
        </div>
        <div className="flex items-center gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadProducts(query);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search fashion..."
              className="border border-[#E8E8E6] bg-white px-4 py-2 text-sm text-[#1A1A1A] placeholder-[#8A8A8A] rounded-full focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10 focus:border-[#1A1A1A] transition-all"
            />
            <button
              type="submit"
              className="relative bg-gradient-to-r from-[#8B5CF6]/90 to-[#7C3AED]/90 px-5 py-2 text-sm font-medium text-white rounded-xl shadow-md hover:shadow-lg overflow-hidden group"
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
            </button>
          </form>
          <div className="bg-white border border-[#E8E8E6] px-5 py-2.5 text-sm font-medium text-[#1A1A1A] rounded-full shadow-sm">
            {remainingCards} remaining
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden px-4 py-4 space-y-3 border-b border-gray-200/50 bg-white/80 backdrop-blur-xl relative z-10 shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-serif font-bold text-[#1A1A1A] tracking-[-0.04em]">Discover</h1>
          <div className="bg-white border border-[#E8E8E6] px-3 py-2 text-xs font-medium text-[#1A1A1A] rounded-full shadow-sm">
            {remainingCards} left
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadProducts(query);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search fashion"
            className="flex-1 border border-[#E8E8E6] bg-white px-4 py-2 text-sm text-[#1A1A1A] placeholder-[#8A8A8A] rounded-full focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10 focus:border-[#1A1A1A] transition-all"
          />
          <button
            type="submit"
            className="relative bg-gradient-to-r from-[#8B5CF6]/90 to-[#7C3AED]/90 px-4 py-2 text-xs font-medium text-white rounded-xl shadow-md overflow-hidden group"
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
            <span className="relative z-10">Go</span>
          </button>
        </form>
      </div>

      <div className="flex-1 relative flex items-center justify-center px-4 py-6 w-full z-10 min-h-0">
        <AnimatePresence>
          {currentProduct && (
            <motion.div
              key={currentProduct.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md mx-auto"
            >
              <SwipeCard
                product={currentProduct}
                tryOnImageUrl={currentTryOnUrl}
                onSwipe={handleSwipe}
                onTap={() => handleCardTap(currentProduct)}
                isLoading={isGeneratingTryOn}
                onGenerateTryOn={() => generateTryOn(currentProduct.id)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {!currentProduct && (
          <div className="flex flex-col items-center justify-center h-full">
            <RotateCcw className="h-16 w-16 text-[#8A8A8A] mb-4" />
            <h2 className="text-2xl font-serif font-bold text-[#1A1A1A] mb-3 tracking-[-0.02em]">No more items</h2>
            <p className="text-[#5A5A5A] mb-8 font-light">You've seen all available items</p>
            <button 
              onClick={() => loadProducts(query)} 
              className="relative bg-gradient-to-r from-[#8B5CF6]/90 to-[#7C3AED]/90 px-6 py-2.5 text-sm font-medium text-white rounded-xl shadow-lg hover:shadow-xl overflow-hidden group"
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
              <span className="relative z-10">Load More</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-6 pb-6 lg:pb-8 px-4 relative z-10">
        <button
          onClick={() => handleManualSwipe('left')}
          disabled={!currentProduct || isGeneratingTryOn}
          className="h-14 w-14 rounded-full bg-white border-2 border-[#E8E8E6] shadow-sm transition-all hover:shadow-md hover:border-[#1A1A1A] disabled:opacity-50 flex items-center justify-center group"
        >
          <X className="h-6 w-6 text-[#8A8A8A] group-hover:text-[#1A1A1A] transition-colors" />
        </button>
        
        <button
          onClick={() => handleManualSwipe('up')}
          disabled={!currentProduct || isGeneratingTryOn}
          className="h-16 w-16 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] border-2 border-white shadow-lg transition-all hover:scale-105 disabled:opacity-50 flex items-center justify-center group rounded-full"
        >
          <Star className="h-7 w-7 text-white fill-current" />
        </button>
        
        <button
          onClick={() => handleManualSwipe('right')}
          disabled={!currentProduct || isGeneratingTryOn}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] border-2 border-white shadow-lg transition-all hover:shadow-xl hover:scale-105 disabled:opacity-50 flex items-center justify-center group"
        >
          <Heart className="h-6 w-6 text-white fill-current" />
        </button>
      </div>
    </div>
    <Navigation />
    </>
  );
}
