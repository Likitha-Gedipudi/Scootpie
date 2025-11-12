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
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#FAF8F5] via-[#F5F1E8] to-[#FAF8F5]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#8B1A1A] mx-auto mb-4"></div>
          <p className="text-lg text-[#6B6459] tracking-wide">Loading your personalized recommendations...</p>
        </div>
      </div>
    );
  }

  if (!hasPhoto) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#FAF8F5] via-[#F5F1E8] to-[#FAF8F5] pb-16 lg:pb-0 lg:pl-72">
        <div className="text-center max-w-md px-4">
          <div className="bg-white shadow-luxury-lg border border-[#D9D0C1] p-8">
            <h2 className="text-2xl font-serif font-bold text-[#1C1410] mb-3 tracking-wide">No Photos Found</h2>
            <p className="text-[#6B6459] mb-6 tracking-wide">Please upload at least one photo to enable virtual try-on.</p>
            <a 
              href="/profile" 
              className="inline-block bg-gradient-to-r from-[#8B1A1A] to-[#5C1010] px-8 py-3 text-sm font-semibold text-[#FAF8F5] hover:from-[#5C1010] hover:to-[#8B1A1A] transition-all duration-300 shadow-luxury uppercase tracking-widest border border-[#D4AF37]/20"
            >
              Upload Photos
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="flex flex-col h-screen bg-gradient-to-br from-[#FAF8F5] via-[#F5F1E8] to-[#FAF8F5] pb-16 lg:pb-0 lg:pl-72">
      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between px-8 py-8 border-b border-[#D9D0C1] bg-white/50 backdrop-blur-sm">
        <div className="flex-1 pr-6">
          <h1 className="text-3xl font-serif font-bold text-[#1C1410] mb-2 tracking-wide">Discover Fashion</h1>
          <p className="text-sm text-[#6B6459] tracking-wide">Swipe to curate your style</p>
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
              placeholder="Search luxury fashion..."
              className="border border-[#D9D0C1] bg-white/90 px-4 py-2 text-sm tracking-wide focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] focus:border-[#D4AF37]/50 transition-all"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-[#8B1A1A] to-[#5C1010] px-5 py-2 text-sm font-semibold text-[#FAF8F5] hover:from-[#5C1010] hover:to-[#8B1A1A] transition-all duration-300 shadow-luxury uppercase tracking-widest border border-[#D4AF37]/20"
            >
              Search
            </button>
          </form>
          <div className="bg-white/90 border border-[#D9D0C1] px-5 py-2.5 text-sm font-medium text-[#1C1410] shadow-luxury tracking-wide">
            {remainingCards} remaining
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden px-4 py-4 space-y-3 border-b border-[#D9D0C1] bg-white/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-serif font-bold text-[#1C1410] tracking-wide">Discover</h1>
          <div className="bg-white/90 border border-[#D9D0C1] px-3 py-2 text-xs font-semibold text-[#1C1410] shadow-luxury uppercase tracking-wider">
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
            className="flex-1 border border-[#D9D0C1] bg-white/90 px-4 py-2 text-sm tracking-wide focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] focus:border-[#D4AF37]/50 transition-all"
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-[#8B1A1A] to-[#5C1010] px-4 py-2 text-xs font-semibold text-[#FAF8F5] hover:from-[#5C1010] hover:to-[#8B1A1A] transition-all duration-300 shadow-luxury uppercase tracking-widest border border-[#D4AF37]/20"
          >
            Go
          </button>
        </form>
      </div>

      <div className="flex-1 relative px-4 py-8 lg:max-w-xl lg:mx-auto w-full">
        <AnimatePresence>
          {currentProduct && (
            <motion.div
              key={currentProduct.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="absolute inset-0"
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
            <RotateCcw className="h-16 w-16 text-[#6B6459] mb-4" />
            <h2 className="text-2xl font-serif font-bold text-[#1C1410] mb-3 tracking-wide">No more items</h2>
            <p className="text-[#6B6459] mb-8 tracking-wide">You've seen all available items</p>
            <button 
              onClick={() => loadProducts(query)} 
              className="bg-gradient-to-r from-[#8B1A1A] to-[#5C1010] px-8 py-3 text-sm font-semibold text-[#FAF8F5] hover:from-[#5C1010] hover:to-[#8B1A1A] transition-all duration-300 shadow-luxury uppercase tracking-widest border border-[#D4AF37]/20"
            >
              Load More
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-6 pb-8 px-4">
        <button
          onClick={() => handleManualSwipe('left')}
          disabled={!currentProduct || isGeneratingTryOn}
          className="h-14 w-14 rounded-full bg-white/90 border-2 border-[#D9D0C1] shadow-luxury transition-all hover:shadow-luxury-lg hover:border-[#8B1A1A] disabled:opacity-50 flex items-center justify-center group"
        >
          <X className="h-6 w-6 text-[#6B6459] group-hover:text-[#8B1A1A] transition-colors" />
        </button>
        
        <button
          onClick={() => handleManualSwipe('up')}
          disabled={!currentProduct || isGeneratingTryOn}
          className="h-16 w-16 bg-gradient-to-r from-[#D4AF37] to-[#B8941F] border-2 border-white shadow-luxury-lg transition-all hover:scale-105 disabled:opacity-50 flex items-center justify-center group"
        >
          <Star className="h-7 w-7 text-white fill-current" />
        </button>
        
        <button
          onClick={() => handleManualSwipe('right')}
          disabled={!currentProduct || isGeneratingTryOn}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-[#8B1A1A] to-[#5C1010] border-2 border-[#D4AF37]/30 shadow-luxury transition-all hover:shadow-luxury-lg hover:scale-105 disabled:opacity-50 flex items-center justify-center group"
        >
          <Heart className="h-6 w-6 text-white fill-current" />
        </button>
      </div>
    </div>
    <Navigation />
    </>
  );
}
