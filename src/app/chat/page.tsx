'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, RotateCcw, ExternalLink, Trash2 } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import Image from 'next/image';

interface ChatProduct {
  name: string;
  imageUrl: string;
  productUrl: string;
  price?: number;
  currency?: string;
  brand?: string;
  retailer?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  outfitImage?: string;
  products?: ChatProduct[];
  baseImageUrl?: string; // The base image used for this try-on (for next iteration)
}

type ConversationSummary = { id: string; createdAt: string; lastMessageAt: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI stylist. Describe an item like 'red crop top from Zara' and I'll show it on you. Then add more items to build your complete outfit!",
      timestamp: new Date(),
    },
  ]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Initial load: list conversations and load latest one
  useEffect(() => {
    void refreshConversations();
    void loadLatestConversation();
  }, []);

  const refreshConversations = async () => {
    try {
      const res = await fetch('/api/chat?all=true');
      if (res.ok) {
        const data = await res.json();
        setConversations((data.conversations || []).map((c: any) => ({ id: c.id, createdAt: c.createdAt, lastMessageAt: c.lastMessageAt })));
      }
    } catch {}
  };

  const loadLatestConversation = async () => {
    try {
      const res = await fetch('/api/chat');
      if (res.ok) {
        const data = await res.json();
        if (data?.conversation?.id) {
          setConversationId(data.conversation.id);
        }
if (Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(
            data.messages.map((m: any) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              timestamp: new Date(m.createdAt),
              outfitImage: m.outfitImageUrl,
              products: m.outfitProducts,
            }))
          );
        }
      }
    } catch {}
  };

  const loadConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/chat?conversationId=${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = await res.json();
        setConversationId(id);
if (Array.isArray(data.messages)) {
          setMessages(
            data.messages.map((m: any) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              timestamp: new Date(m.createdAt),
              outfitImage: m.outfitImageUrl,
              products: m.outfitProducts,
            }))
          );
        }
      }
    } catch {}
  };

  const handleNewChat = () => {
    setConversationId(null);
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Starting a new outfit! Describe your first item (e.g., 'red crop top from Zara') and we'll build your look together.",
        timestamp: new Date(),
      },
    ]);
  };

  // Get current outfit items from last assistant message
  const getCurrentOutfit = () => {
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant' && m.products && m.products.length > 0);
    return lastAssistant?.products || [];
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    // IMPORTANT: Capture prior context BEFORE updating state
    // Otherwise we'll be using stale state
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant' && m.products && m.products.length > 0);
    const priorItems = lastAssistant?.products || [];
    const priorOutfitImage = lastAssistant?.outfitImage; // Use the last generated outfit image as base
    
    console.log('[CHAT UI] ===== SENDING REQUEST =====');
    console.log('[CHAT UI] Total messages in state:', messages.length);
    console.log('[CHAT UI] Last assistant message:', lastAssistant ? { id: lastAssistant.id, hasProducts: !!lastAssistant.products, hasImage: !!lastAssistant.outfitImage } : 'none');
    console.log('[CHAT UI] Prior items count:', priorItems.length);
    if (priorItems.length > 0) {
      console.log('[CHAT UI] Prior items:', priorItems.map((p: any) => ({ name: p.name, category: p.category })));
    }
    console.log('[CHAT UI] Prior outfit image:', priorOutfitImage ? `exists (${priorOutfitImage.slice(0, 60)}...)` : 'none');
    console.log('[CHAT UI] User message:', input);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, priorItems, priorOutfitImage, conversationId }),
      });
      console.log('[CHAT UI] Response status:', res.status);
      if (res.ok) {
        const data = await res.json();
        if (!conversationId && data?.conversationId) {
          setConversationId(data.conversationId);
          void refreshConversations();
        }
        console.log('[CHAT UI] Response data:', { 
          hasOutfitImage: !!data.message?.outfitImage, 
          productsCount: data.message?.products?.length || 0,
          content: data.message?.content
        });
        const assistantMessage: Message = {
          id: data.message.id,
          role: 'assistant',
          content: data.message.content,
          outfitImage: data.message.outfitImage,
          products: data.message.products,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        if (data.message.products && data.message.products.length > 0) {
          console.log('[CHAT UI] Products received:', data.message.products.map((p: any) => ({ name: p.name, brand: p.brand })));
        }
      } else {
        const text = await res.text();
        setMessages((prev) => [
          ...prev,
          { id: (Date.now()+1).toString(), role: 'assistant', content: 'Sorry, I could not process that request.', timestamp: new Date() },
        ]);
        console.error('[CHAT UI] Request failed:', res.status, text);
      }
    } catch (err) {
      console.error('[CHAT UI] Network error:', err);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now()+1).toString(), role: 'assistant', content: 'Network error. Please try again.', timestamp: new Date() },
      ]);
    } finally {
      setIsTyping(false);
      setInput('');
    }
  };

  const handleDeleteConversation = async () => {
    if (!conversationId) return;
    try {
      const res = await fetch(`/api/chat?conversationId=${encodeURIComponent(conversationId)}`, { method: 'DELETE' });
      if (res.ok) {
        setConversationId(null);
        await refreshConversations();
        await loadLatestConversation();
        if (!conversations.length) {
          setMessages([
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: "Hi! I'm your AI stylist. Describe an item like 'red crop top from Zara' and I'll show it on you. Then add more items to build your complete outfit!",
              timestamp: new Date(),
            },
          ]);
        }
      }
    } catch {}
  };

  const formatTs = (ts: string) => new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  return (
    <>
    <div className="flex flex-col h-screen bg-[#FAFAFA] pb-16 lg:pb-0 lg:pl-72">
      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between px-6 py-6 border-b border-[#E5E5E5]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A1A1A]">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">AI Stylist</h1>
            <p className="text-sm text-[#6B6B6B]">Your personal fashion assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={conversationId || ''}
            onChange={(e) => e.target.value ? loadConversation(e.target.value) : undefined}
            className="px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg bg-white text-[#1A1A1A]"
          >
            <option value="">Select chat…</option>
            {conversations.map((c) => (
              <option key={c.id} value={c.id}>Chat • {formatTs(c.lastMessageAt || c.createdAt)}</option>
            ))}
          </select>
          {conversationId && (
            <button
              onClick={handleDeleteConversation}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E5E5E5] bg-white hover:bg-[#FAFAFA] transition-colors text-sm text-[#B00020]"
              title="Delete current chat"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleNewChat}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E5E5E5] bg-white hover:bg-[#FAFAFA] transition-colors text-sm font-medium text-[#1A1A1A]"
          >
            <RotateCcw className="h-4 w-4" />
            New Chat
          </button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-4 border-b border-[#E5E5E5]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1A1A1A]">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">AI Stylist</h1>
            <p className="text-xs text-[#6B6B6B]">Fashion assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <select
            value={conversationId || ''}
            onChange={(e) => e.target.value ? loadConversation(e.target.value) : undefined}
            className="px-2 py-1.5 text-xs border border-[#E5E5E5] rounded-lg bg-white text-[#1A1A1A]"
          >
            <option value="">Chats…</option>
            {conversations.map((c) => (
              <option key={c.id} value={c.id}>Chat • {new Date(c.lastMessageAt || c.createdAt).toLocaleDateString()}</option>
            ))}
          </select>
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E5E5] bg-white hover:bg-[#FAFAFA] transition-colors text-xs font-medium text-[#1A1A1A]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            New
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0">
                <div className="h-9 w-9 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              </div>
            )}
            <div className={`max-w-[85%] lg:max-w-[70%] rounded-2xl p-4 ${message.role === 'user' ? 'bg-[#1A1A1A] text-white shadow-sm' : 'bg-white border border-[#E5E5E5] shadow-sm'}`}>
              <p className={`text-sm leading-relaxed ${message.role === 'user' ? 'text-white' : 'text-[#1A1A1A]'}`}>
                {message.content}
              </p>
              
              {/* Try-on outfit image - larger and more prominent */}
              {message.role === 'assistant' && message.outfitImage && (
                <div className="mt-4 overflow-hidden rounded-xl border border-[#E5E5E5] bg-gradient-to-br from-[#FAFAFA] to-[#F5F5F5] p-2">
                  <div className="relative w-full" style={{ aspectRatio: '3/4', maxHeight: '500px' }}>
                    <Image
                      src={message.outfitImage}
                      alt="Your virtual try-on"
                      fill
                      className="object-contain rounded-lg"
                      priority
                    />
                  </div>
                </div>
              )}
              
              {/* Product cards - improved design */}
              {message.role === 'assistant' && message.products && message.products.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide">Items in this outfit</p>
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                    {message.products.map((p, idx) => (
                      <a
                        key={idx}
                        href={p.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex-shrink-0 w-[160px] border border-[#E5E5E5] rounded-xl overflow-hidden bg-white hover:shadow-md hover:border-[#1A1A1A] transition-all"
                      >
                        <div className="relative w-full h-[140px] bg-[#FAFAFA]">
                          <Image
                            src={p.imageUrl}
                            alt={p.name}
                            fill
                            className="object-contain p-2"
                          />
                        </div>
                        <div className="p-3 space-y-1">
                          <div className="text-xs font-medium text-[#6B6B6B] truncate">{p.brand || p.retailer}</div>
                          <div className="text-sm font-semibold text-[#1A1A1A] line-clamp-2 leading-snug">{p.name}</div>
                          {p.price && p.price > 0 && (
                            <div className="text-sm font-bold text-[#1A1A1A]">
                              {p.currency === 'USD' ? '$' : p.currency === 'EUR' ? '€' : p.currency === 'GBP' ? '£' : ''}{p.price.toFixed(2)}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-xs text-[#1A1A1A] font-medium pt-1 group-hover:underline">
                            View product <ExternalLink className="h-3 w-3" />
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              <p suppressHydrationWarning className={`text-xs mt-3 ${message.role === 'user' ? 'text-white/60' : 'text-[#9B9B9B]'}`}>
                {new Date(message.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>
            {message.role === 'user' && (
              <div className="flex-shrink-0">
                <div className="h-9 w-9 rounded-full bg-white border border-[#E5E5E5] flex items-center justify-center">
                  <User className="h-4 w-4 text-[#1A1A1A]" />
                </div>
              </div>
            )}
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="h-9 w-9 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="rounded-2xl shadow-sm bg-white border border-[#E5E5E5] p-4">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#6B6B6B] animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-[#6B6B6B] animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 rounded-full bg-[#6B6B6B] animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 lg:p-6 border-t border-[#E5E5E5] bg-white shadow-lg">
        <div className="max-w-4xl mx-auto">
          {/* Current outfit indicator */}
          {getCurrentOutfit().length > 0 && (
            <div className="mb-3 p-3 bg-gradient-to-r from-[#F5F5F5] to-[#FAFAFA] rounded-lg border border-[#E5E5E5]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide">Current Outfit ({getCurrentOutfit().length} {getCurrentOutfit().length === 1 ? 'item' : 'items'})</div>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {getCurrentOutfit().slice(0, 5).map((item, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-md text-xs font-medium text-[#1A1A1A] border border-[#E5E5E5]">
                      {item.brand || item.retailer}
                      {getCurrentOutfit().length > 5 && idx === 4 && (
                        <span className="text-[#6B6B6B]">+{getCurrentOutfit().length - 5}</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Add to your outfit (e.g., 'black jeans from H&M', 'Nike sneakers')"
            className="flex-1 rounded-xl border-2 border-[#E5E5E5] px-4 py-3 text-sm text-[#1A1A1A] placeholder-[#9B9B9B] focus:outline-none focus:border-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A]/10 transition-all bg-white"
            disabled={isTyping}
          />
          <button 
            onClick={handleSend} 
            disabled={!input.trim() || isTyping} 
            className="rounded-xl bg-[#1A1A1A] px-4 py-3 text-white hover:bg-[#2A2A2A] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Send className="h-5 w-5" />
          </button>
          </div>
        </div>
      </div>
    </div>
    <Navigation />
    </>
  );
}
