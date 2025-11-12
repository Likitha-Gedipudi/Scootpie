'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils';
import { Heart, Plus, ExternalLink, Trash2, Loader2 } from 'lucide-react';
import { Navigation } from '@/components/Navigation';

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  currency: string;
  retailer: string;
  imageUrl: string;
  productUrl: string;
}

interface CollectionItem {
  id: string;
  product: Product;
  tryOnImageUrl?: string | null;
}

interface Collection {
  id: string;
  name: string;
  isDefault: boolean;
  items: CollectionItem[];
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/collections');
      if (response.ok) {
        const data = await response.json();
        setCollections(data.collections);
        if (data.collections.length > 0) {
          setSelectedCollection(data.collections[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch collections:', error);
    }
    setLoading(false);
  };

  const createCollection = async () => {
    if (newCollectionName.trim()) {
      try {
        const response = await fetch('/api/collections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newCollectionName }),
        });

        if (response.ok) {
          await fetchCollections();
          setNewCollectionName('');
          setShowNewCollection(false);
        }
      } catch (error) {
        console.error('Failed to create collection:', error);
      }
    }
  };

  const removeItem = async (collectionId: string, itemId: string) => {
    try {
      const response = await fetch(`/api/collections/${collectionId}/items/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCollections();
      }
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-[#8B5CF6]/5 to-white flex items-center justify-center relative overflow-hidden">
        {/* Noise Background */}
        <svg className="absolute inset-0 w-full h-full opacity-65 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <filter id="noise-collections-loading">
            <feTurbulence type="fractalNoise" baseFrequency="0.80" numOctaves="4" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#noise-collections-loading)"/>
        </svg>
        <Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6] relative z-10" />
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-white via-[#8B5CF6]/5 to-white pb-16 lg:pb-0 lg:pl-56 relative">
      {/* Noise Background - Fixed */}
      <div className="fixed inset-0 pointer-events-none z-0 lg:left-56">
        <svg className="w-full h-full opacity-65" xmlns="http://www.w3.org/2000/svg">
          <filter id="noise-collections">
            <feTurbulence type="fractalNoise" baseFrequency="0.80" numOctaves="4" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#noise-collections)"/>
        </svg>
      </div>
      
      {/* Floating Gradient Orbs - Fixed */}
      <div className="fixed top-20 right-10 w-72 h-72 bg-[#8B5CF6]/10 rounded-full blur-3xl animate-pulse pointer-events-none z-0 lg:left-[calc(224px+10rem)]"></div>
      <div className="fixed bottom-20 left-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse pointer-events-none z-0 lg:left-[calc(224px+2.5rem)]" style={{animationDelay: '1s'}}></div>
      
      <div className="relative z-10">
      <div className="lg:px-6 lg:py-6 p-4">
        {/* Desktop Header */}
        <div className="hidden lg:block mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-serif font-bold text-[#1A1A1A] mb-2 tracking-[-0.04em]">My Collections</h1>
              <p className="text-sm text-[#5A5A5A] font-light">Organize your favorite fashion finds</p>
            </div>
            <button 
              onClick={() => setShowNewCollection(true)} 
              className="relative bg-gradient-to-r from-[#8B5CF6]/90 to-[#7C3AED]/90 px-5 py-2 text-sm font-medium text-white hover:from-[#8B5CF6] hover:to-[#7C3AED] transition-all rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 overflow-hidden group"
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
              <Plus className="h-4 w-4 relative z-10" />
              <span className="relative z-10">New Collection</span>
            </button>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-[#1A1A1A] mb-1 tracking-[-0.04em]">Collections</h1>
            <p className="text-xs text-[#5A5A5A] font-light">Your favorites</p>
          </div>
          <button 
            onClick={() => setShowNewCollection(true)} 
            className="relative bg-gradient-to-r from-[#8B5CF6]/90 to-[#7C3AED]/90 px-3 py-2 text-sm font-medium text-white rounded-xl shadow-md hover:shadow-lg overflow-hidden group"
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
            <Plus className="h-4 w-4 relative z-10" />
          </button>
        </div>

        {showNewCollection && (
          <div className="mb-6 bg-white rounded-xl p-4 shadow-md border border-[#E8E8E6]">
              <div className="flex gap-2">
              <input
                type="text"
                  placeholder="Collection name"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && createCollection()}
                className="flex-1 rounded-full border border-[#E8E8E6] px-4 py-2 text-sm text-[#1A1A1A] placeholder-[#8A8A8A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10 focus:border-[#1A1A1A] transition-all"
                />
              <button 
                onClick={createCollection} 
                className="relative bg-gradient-to-r from-[#8B5CF6]/90 to-[#7C3AED]/90 px-4 py-2 text-sm font-medium text-white rounded-xl shadow-md hover:shadow-lg overflow-hidden group"
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
                <span className="relative z-10">Create</span>
              </button>
              <button 
                onClick={() => setShowNewCollection(false)} 
                className="bg-white border border-[#E8E8E6] px-4 py-2 text-sm font-medium text-[#5A5A5A] hover:bg-[#FAFAF8] transition-all rounded-full"
              >
                  Cancel
              </button>
            </div>
              </div>
        )}

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {collections.map((collection) => (
            <button
              key={collection.id}
              onClick={() => setSelectedCollection(collection)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedCollection?.id === collection.id
                  ? 'bg-gradient-to-r from-[#8B5CF6]/90 to-[#7C3AED]/90 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-[#8B5CF6]/30 shadow-sm'
              }`}
            >
              {collection.isDefault && <Heart className="h-3.5 w-3.5" />}
              {collection.name}
              <span className="text-xs opacity-75">({collection.items.length})</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {selectedCollection?.items.map((item) => (
            <div key={item.id} className="group relative rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all bg-white border border-[#E8E8E6]">
              <div className="relative aspect-[3/4]">
                <Image
                  src={item.tryOnImageUrl || item.product.imageUrl}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                />
                {item.tryOnImageUrl && (
                  <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] font-medium text-[#1A1A1A] border border-[#E8E8E6]">
                    Virtual Try-On
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm text-[#1A1A1A] font-medium mb-1 line-clamp-1">{item.product.name}</p>
                <p className="text-xs text-[#5A5A5A] mb-1 font-light">{item.product.brand}</p>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-base font-semibold text-[#1A1A1A]">{formatPrice(item.product.price, item.product.currency)}</p>
                  <p className="text-xs text-[#8A8A8A] font-light">{item.product.retailer}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    className="flex-1 rounded-full bg-white border border-[#E8E8E6] px-3 py-2 text-xs font-medium text-[#1A1A1A] hover:bg-[#FAFAF8] transition-all flex items-center justify-center gap-1 shadow-sm"
                    onClick={() => {
                      const raw = item.product.productUrl;
                      const url = raw?.startsWith('http') ? raw : `https://${raw}`;
                      try { window.open(url, '_blank', 'noopener,noreferrer'); } catch (_) {}
                    }}
                  >
                    <ExternalLink className="h-3 w-3" />
                    View product
                  </button>
                  <button 
                    className="rounded-full bg-white border border-[#E8E8E6] p-2 hover:bg-[#FAFAF8] transition-all shadow-sm"
                    onClick={() => removeItem(selectedCollection.id, item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-[#1A1A1A]" />
                  </button>
                </div>
              </div>
                </div>
          ))}
        </div>

        {selectedCollection && selectedCollection.items.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl shadow-md border border-[#E8E8E6]">
            <Heart className="mx-auto h-16 w-16 text-[#E8E8E6] mb-4" />
            <h3 className="text-lg font-serif font-bold text-[#1A1A1A] mb-2 tracking-[-0.02em]">No items yet</h3>
            <p className="text-[#5A5A5A] font-light">
              Start swiping to add items to this collection
            </p>
          </div>
        )}
      </div>
      </div>
    </div>
    <Navigation />
    </>
  );
}
