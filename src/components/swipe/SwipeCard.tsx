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
}

export function SwipeCard({ product, tryOnImageUrl, onSwipe, onTap, style, isLoading = false }: SwipeCardProps) {
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
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 1.05 }}
      className="absolute w-full h-full cursor-grab active:cursor-grabbing"
    >
      <div
        onClick={onTap}
        className="relative w-full h-full bg-white rounded-xl shadow-lg overflow-hidden border border-[#E5E5E5]"
      >
        <div className="relative h-full w-full">
          {isLoading && !tryOnImageUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#FAFAFA] z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A1A1A] mx-auto mb-3"></div>
                <p className="text-sm text-[#6B6B6B]">Generating try-on...</p>
              </div>
            </div>
          )}
          {imageError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#F5F5F5]">
              <div className="text-center p-6">
                <div className="text-4xl mb-3">👕</div>
                <p className="text-sm text-[#6B6B6B]">Image unavailable</p>
              </div>
            </div>
          ) : (
            <Image
              src={tryOnImageUrl || product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              priority
              unoptimized={tryOnImageUrl?.startsWith('data:')}
              onError={() => {
                console.error(`Failed to load image for product ${product.id}: ${tryOnImageUrl || product.imageUrl}`);
                setImageError(true);
              }}
            />
          )}
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
          {tryOnImageUrl && (
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm">
              <span className="text-xs font-medium text-[#1A1A1A]">Virtual Try-On</span>
            </div>
          )}
        </div>
        
        {/* Bottom Info Card */}
        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-bold text-[#1A1A1A] mb-1">{product.name}</h3>
          <p className="text-[#6B6B6B] text-sm mb-2">{product.brand}</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-[#1A1A1A]">{formatPrice(product.price, product.currency)}</span>
            <span className="rounded-lg bg-[#F5F5F5] px-3 py-1 text-xs font-medium text-[#1A1A1A]">{product.retailer}</span>
          </div>
        </div>

        <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: useTransform(x, [-100, -50, 0], [1, 0.5, 0]).get() }}
            className="bg-[#1A1A1A] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg"
          >
            <X className="h-4 w-4" />
            NOPE
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: useTransform(x, [0, 50, 100], [0, 0.5, 1]).get() }}
            className="bg-[#1A1A1A] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg"
          >
            <Heart className="h-4 w-4" />
            LIKE
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: useTransform(y, [-100, -50, 0], [1, 0.5, 0]).get() }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#1A1A1A] text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 pointer-events-none shadow-lg"
        >
          <Star className="h-5 w-5" />
          SUPER LIKE
        </motion.div>
      </div>
    </motion.div>
  );
}
