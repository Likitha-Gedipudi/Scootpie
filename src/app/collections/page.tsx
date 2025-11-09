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
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">My Collections</h1>
              <p className="text-sm text-[#6B6B6B]">Organize your favorite fashion finds</p>
            </div>
            <button 
              onClick={() => setShowNewCollection(true)} 
              className="rounded-lg bg-[#1A1A1A] px-4 py-2 text-sm font-medium text-white hover:bg-[#2A2A2A] transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Collection
            </button>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A] mb-1">Collections</h1>
            <p className="text-xs text-[#6B6B6B]">Your favorites</p>
          </div>
          <button 
            onClick={() => setShowNewCollection(true)} 
            className="rounded-lg bg-[#1A1A1A] px-3 py-2 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {showNewCollection && (
          <div className="mb-6 bg-white rounded-xl p-4 shadow-sm border border-[#E5E5E5]">
              <div className="flex gap-2">
              <input
                type="text"
                  placeholder="Collection name"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && createCollection()}
                className="flex-1 rounded-lg border border-[#E5E5E5] px-4 py-2 text-sm text-[#1A1A1A] placeholder-[#9B9B9B] focus:outline-none focus:border-[#1A1A1A] transition-colors"
                />
              <button 
                onClick={createCollection} 
                className="rounded-lg bg-[#1A1A1A] px-4 py-2 text-sm font-medium text-white hover:bg-[#2A2A2A] transition-colors"
              >
                Create
              </button>
              <button 
                onClick={() => setShowNewCollection(false)} 
                className="rounded-lg bg-white border border-[#E5E5E5] px-4 py-2 text-sm font-medium text-[#6B6B6B] hover:bg-[#FAFAFA] transition-colors"
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
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedCollection?.id === collection.id
                  ? 'bg-[#1A1A1A] text-white'
                  : 'bg-white text-[#6B6B6B] border border-[#E5E5E5] hover:bg-[#FAFAFA]'
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
            <div key={item.id} className="group relative rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all bg-white">
              <div className="relative aspect-[3/4]">
                <Image
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-3">
                <p className="text-sm text-[#1A1A1A] font-medium mb-1 line-clamp-1">{item.product.name}</p>
                <p className="text-xs text-[#6B6B6B] mb-1">{item.product.brand}</p>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-base font-bold text-[#1A1A1A]">{formatPrice(item.product.price, item.product.currency)}</p>
                  <p className="text-xs text-[#6B6B6B]">{item.product.retailer}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    className="flex-1 rounded-lg bg-white border border-[#E5E5E5] px-3 py-2 text-xs font-medium text-[#1A1A1A] hover:bg-[#FAFAFA] transition-colors flex items-center justify-center gap-1"
                    onClick={() => window.open(item.product.productUrl, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                    Buy
                  </button>
                  <button 
                    className="rounded-lg bg-white border border-[#E5E5E5] p-2 hover:bg-[#FAFAFA] transition-colors"
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
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-[#E5E5E5]">
            <Heart className="mx-auto h-16 w-16 text-[#E5E5E5] mb-4" />
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">No items yet</h3>
            <p className="text-[#6B6B6B]">
              Start swiping to add items to this collection
            </p>
          </div>
        )}
      </div>
    </div>
    <Navigation />
    </>
  );
}
