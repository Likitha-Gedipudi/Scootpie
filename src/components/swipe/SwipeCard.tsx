'use client';

import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import Image from 'next/image';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Heart, X, Star } from 'lucide-react';
import { useState } from 'react';

interface SwipeCardProps {
  product: Product;
  tryOnImageUrl?: string;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  onTap: () => void;
  style?: React.CSSProperties;
  isLoading?: boolean;
  onGenerateTryOn?: () => void;
}

export function SwipeCard({ product, tryOnImageUrl, onSwipe, onTap, style, isLoading = false, onGenerateTryOn }: SwipeCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [imageError, setImageError] = useState(false);
  
  const rotateZ = useTransform(x, [-200, 200], [-20, 20]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    
    if (Math.abs(info.offset.y) > threshold && info.offset.y < 0) {
      onSwipe('up');
    } else if (info.offset.x > threshold) {
      onSwipe('right');
    } else if (info.offset.x < -threshold) {
      onSwipe('left');
    }
  };

  return (
    <motion.div
      style={{
        x,
        y,
        rotateZ,
        opacity,
        ...style,
      }}
      drag={!isLoading}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 1.05 }}
      className={`absolute w-full h-full ${isLoading ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
    >
      <div
        onClick={onTap}
        className="relative w-full h-full bg-white shadow-luxury-lg overflow-hidden rounded-3xl border border-[#E8E6E3] hover:border-[#E8B4B8] transition-all duration-300"
      >
        <div className="relative flex h-full w-full flex-col">
          {/* Image area (does not get covered by info card) */}
          <div className="relative flex-1 bg-white">
            {isLoading && !tryOnImageUrl && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#FAFAFA] z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9CAF9A] mx-auto mb-3"></div>
                  <p className="text-sm text-[#8B8B8B] tracking-wide">Generating your try-on...</p>
                </div>
              </div>
            )}
            {!isLoading && !tryOnImageUrl && onGenerateTryOn && (
              <button
                onClick={(e) => { e.stopPropagation(); onGenerateTryOn(); }}
                className="absolute top-4 right-4 z-10 bg-gradient-to-r from-[#9CAF9A] to-[#8A9D88] px-4 py-2 text-xs font-semibold text-white hover:from-[#B5C4B3] hover:to-[#9CAF9A] transition-all duration-300 shadow-soft uppercase tracking-widest rounded-full"
              >
                Try On
              </button>
            )}
            {imageError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-[#F5F3F0]">
                <div className="text-center p-6">
                  <div className="text-4xl mb-3">👕</div>
                  <p className="text-sm text-[#8B8B8B] tracking-wide">Image unavailable</p>
                </div>
              </div>
            ) : (
              <Image
                src={tryOnImageUrl || product.imageUrl}
                alt={product.name}
                fill
                className="object-contain"
                priority
                unoptimized={tryOnImageUrl?.startsWith('data:')}
                onError={() => {
                  console.error(`Failed to load image for product ${product.id}: ${tryOnImageUrl || product.imageUrl}`);
                  setImageError(true);
                }}
              />
            )}
            {tryOnImageUrl && (
              <div className="absolute top-4 right-4 bg-gradient-to-r from-[#E8B4B8] to-[#D99FA4] px-4 py-2 shadow-soft rounded-full">
                <span className="text-xs font-semibold text-white uppercase tracking-widest">Virtual Try-On</span>
              </div>
            )}
          </div>

          {/* Info area (now below image, not covering it) */}
          <div className="border-t border-[#F2F1EF] bg-white px-5 py-5">
            <h3 className="text-lg font-serif font-bold text-[#2C2C2C] mb-2 tracking-wide">{product.name}</h3>
            <p className="text-[#8B8B8B] text-sm mb-3 tracking-wide uppercase font-semibold">{product.brand}</p>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-[#9CAF9A] tracking-wider">{formatPrice(product.price, product.currency)}</span>
                <span className="bg-[#F5F3F0] px-3 py-1 text-xs font-semibold text-[#8B8B8B] uppercase tracking-wider rounded-full border border-[#E8E6E3]">{product.retailer}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const url = product.productUrl?.startsWith('http')
                    ? product.productUrl
                    : `https://${product.productUrl}`;
                  try {
                    window.open(url, '_blank', 'noopener,noreferrer');
                  } catch (_) {
                    // no-op
                  }
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="bg-gradient-to-r from-[#9CAF9A] to-[#8A9D88] px-4 py-2 text-xs font-semibold text-white hover:from-[#B5C4B3] hover:to-[#9CAF9A] transition-all duration-300 shadow-soft uppercase tracking-widest rounded-full"
              >
                View
              </button>
            </div>
          </div>
        </div>

        {/* Swipe labels */}
        <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: useTransform(x, [-100, -50, 0], [1, 0.5, 0]).get() }}
            className="bg-[#E39B9B] text-white px-5 py-2.5 font-semibold text-sm flex items-center gap-2 shadow-luxury-lg rounded-full border border-white"
          >
            <X className="h-4 w-4" />
            <span className="uppercase tracking-widest">Pass</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: useTransform(x, [0, 50, 100], [0, 0.5, 1]).get() }}
            className="bg-white text-[#9CAF9A] px-5 py-2.5 font-semibold text-sm flex items-center gap-2 shadow-luxury-lg rounded-full border-2 border-[#9CAF9A]"
          >
            <Heart className="h-4 w-4 fill-current" />
            <span className="uppercase tracking-widest">Love</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: useTransform(y, [-100, -50, 0], [1, 0.5, 0]).get() }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-[#E8B4B8] to-[#F5CDD1] text-white px-6 py-3 font-semibold text-sm flex items-center gap-2 pointer-events-none shadow-luxury-lg rounded-full border-2 border-white"
        >
          <Star className="h-5 w-5 fill-current" />
          <span className="uppercase tracking-widest">Favorite</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
