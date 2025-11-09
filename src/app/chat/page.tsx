'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Bot, User } from 'lucide-react';
import { Navigation } from '@/components/Navigation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your personal styling assistant. I can help you find the perfect outfit for any occasion. What are you looking for today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Great! Based on your request for "${input}", I'd recommend checking out some of our latest collections. Let me show you some options that match your style!`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <>
    <div className="flex flex-col h-screen bg-[#FAFAFA] pb-16 lg:pb-0 lg:pl-72">
      {/* Desktop Header */}
      <div className="hidden lg:flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A1A1A]">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">AI Stylist</h1>
          <p className="text-sm text-[#6B6B6B]">Your personal fashion assistant</p>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden flex items-center gap-3 px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1A1A1A]">
          <Bot className="h-4 w-4 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A]">AI Stylist</h1>
          <p className="text-xs text-[#6B6B6B]">Fashion assistant</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
            <div className={`max-w-[70%] rounded-xl p-3 shadow-sm ${message.role === 'user' ? 'bg-[#1A1A1A] text-white' : 'bg-white border border-[#E5E5E5]'}`}>
              <p className={message.role === 'user' ? 'text-white text-sm' : 'text-[#1A1A1A] text-sm'}>
                  {message.content}
                </p>
              <p className={`text-xs mt-1.5 ${message.role === 'user' ? 'text-white/70' : 'text-[#6B6B6B]'}`}>
                  {message.timestamp.toLocaleTimeString()}
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
            <div className="rounded-xl shadow-sm bg-white border border-[#E5E5E5] p-3">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#6B6B6B] animate-bounce"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-[#6B6B6B] animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-[#6B6B6B] animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
                </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[#E5E5E5] bg-white">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything about fashion..."
            className="flex-1 rounded-lg border border-[#E5E5E5] px-4 py-2.5 text-sm text-[#1A1A1A] placeholder-[#9B9B9B] focus:outline-none focus:border-[#1A1A1A] transition-colors bg-white"
            disabled={isTyping}
          />
          <button 
            onClick={handleSend} 
            disabled={!input.trim() || isTyping} 
            className="rounded-lg bg-[#1A1A1A] p-2.5 text-white hover:bg-[#2A2A2A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
    <Navigation />
    </>
  );
}
