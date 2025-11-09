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
      const response = await fetch('/api/tryon/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.imageUrl) {
          setTryOnImages(prev => new Map(prev).set(productId, data.imageUrl));
        }
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
  }, [userPhotoUrl, tryOnImages, generatingTryOns]);

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

  useEffect(() => {
    if (products.length > 0 && userPhotoUrl) {
      // Generate try-ons for initial products
      pregenerateTryOns(products, 0);
    }
  }, [products, userPhotoUrl, pregenerateTryOns]);

  // Pre-generate when approaching end of current batch
  useEffect(() => {
    if (products.length > 0 && userPhotoUrl && currentIndex > 0) {
      pregenerateTryOns(products, currentIndex);
    }
  }, [currentIndex, products, userPhotoUrl, pregenerateTryOns]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products?count=15');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
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
      await fetch('/api/swipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: products[currentIndex].id,
          direction,
          sessionId,
          cardPosition: currentIndex,
        }),
      });
    } catch (error) {
      console.error('Failed to save swipe:', error);
    }

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);

    // Pre-generate try-ons for upcoming products
    if (userPhotoUrl && nextIndex < products.length) {
      pregenerateTryOns(products, nextIndex);
    }

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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAFAFA]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#1A1A1A] mx-auto mb-4"></div>
          <p className="text-lg text-[#6B6B6B]">Loading your personalized recommendations...</p>
        </div>
      </div>
    );
  }

  if (!hasPhoto) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAFAFA] pb-16 lg:pb-0 lg:pl-72">
        <div className="text-center max-w-md px-4">
          <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-8">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">No Photos Found</h2>
            <p className="text-[#6B6B6B] mb-6">Please upload at least one photo to enable virtual try-on.</p>
            <a 
              href="/profile" 
              className="inline-block rounded-lg bg-[#1A1A1A] px-6 py-3 text-sm font-medium text-white hover:bg-[#2A2A2A] transition-colors"
            >
              Upload Photos
            </a>
          </div>
        </div>
      </div>
    );
  }

  const currentProduct = products[currentIndex];
  const remainingCards = products.length - currentIndex;
  const currentTryOnUrl = currentProduct ? tryOnImages.get(currentProduct.id) : undefined;
  const isGeneratingTryOn = currentProduct ? generatingTryOns.has(currentProduct.id) : false;

  return (
    <>
    <div className="flex flex-col h-screen bg-[#FAFAFA] pb-16 lg:pb-0 lg:pl-72">
      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between px-6 py-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">Discover Fashion</h1>
          <p className="text-sm text-[#6B6B6B]">Swipe to find your style</p>
        </div>
        <div className="rounded-lg bg-white border border-[#E5E5E5] px-4 py-2 text-sm font-medium text-[#1A1A1A]">
            {remainingCards} cards remaining
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-4">
        <h1 className="text-xl font-bold text-[#1A1A1A]">
          Discover
        </h1>
        <div className="rounded-lg bg-white border border-[#E5E5E5] px-3 py-1.5 text-xs font-medium text-[#1A1A1A]">
          {remainingCards} left
        </div>
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
              />
            </motion.div>
          )}
        </AnimatePresence>

        {!currentProduct && (
          <div className="flex flex-col items-center justify-center h-full">
            <RotateCcw className="h-16 w-16 text-[#6B6B6B] mb-4" />
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">No more cards!</h2>
            <p className="text-[#6B6B6B] mb-6">You've seen all available items</p>
            <button 
              onClick={loadProducts} 
              className="rounded-lg bg-[#1A1A1A] px-6 py-3 text-sm font-medium text-white hover:bg-[#2A2A2A] transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 pb-8 px-4">
        <button
          onClick={() => handleManualSwipe('left')}
          disabled={!currentProduct}
          className="h-14 w-14 rounded-full bg-white border border-[#E5E5E5] shadow-sm transition-all hover:shadow-md disabled:opacity-50 flex items-center justify-center"
        >
          <X className="h-6 w-6 text-[#1A1A1A]" />
        </button>
        
        <button
          onClick={() => handleManualSwipe('up')}
          disabled={!currentProduct}
          className="h-16 w-16 rounded-full bg-white border border-[#E5E5E5] shadow-sm transition-all hover:shadow-md disabled:opacity-50 flex items-center justify-center"
        >
          <Star className="h-7 w-7 text-[#1A1A1A]" />
        </button>
        
        <button
          onClick={() => handleManualSwipe('right')}
          disabled={!currentProduct}
          className="h-14 w-14 rounded-full bg-white border border-[#E5E5E5] shadow-sm transition-all hover:shadow-md disabled:opacity-50 flex items-center justify-center"
        >
          <Heart className="h-6 w-6 text-[#1A1A1A]" />
        </button>
      </div>
    </div>
    <Navigation />
    </>
  );
}
