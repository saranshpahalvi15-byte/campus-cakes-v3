import React, { useState } from 'react';
import { GiftItem } from '../types';
import { GIFT_PRODUCTS } from '../data';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Star, Gift, Shield, ChevronRight, Tag, Heart } from 'lucide-react';

interface GiftsSectionProps {
  gifts?: GiftItem[];
  onAddGiftToCart: (gift: GiftItem) => void;
}

export default function GiftsSection({ gifts = GIFT_PRODUCTS, onAddGiftToCart }: GiftsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const categories = ['All', 'Flowers', 'Chocolates', 'Cards', 'Toys', 'Decorations'];

  const filteredGifts = selectedCategory === 'All'
    ? gifts
    : gifts.filter(g => g.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div id="gifts-section" className="space-y-8">
      {/* Elegantly styled luxury hero banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative p-8 md:p-11 bg-gradient-to-br from-[#1E0B1A] via-[#0D040A] to-[#250A21] rounded-[40px] border-2 border-pink-400/25 shadow-[0_25px_60px_-15px_rgba(236,72,153,0.15)] overflow-hidden text-white"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(236,72,153,0.15),transparent_60%)] pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-96 h-96 bg-gradient-to-tr from-pink-500/10 to-transparent rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
          <div className="space-y-4 max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-500/10 border border-pink-400/30 text-[9px] font-black text-pink-300 uppercase tracking-[0.2em] leading-none shadow-sm">
              <Sparkles className="w-3 h-3 text-pink-400 animate-spin" /> Partner Gift Galleries
            </div>
            
            <h1 className="text-3xl md:text-4.5xl font-extrabold font-serif tracking-tight text-white leading-none">
              Campus Cakes Gifts <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-pink-400 italic font-serif">Curated Surprises, Sourced Globally</span>
            </h1>
            
            <p className="text-xs md:text-sm text-zinc-300 font-medium leading-relaxed max-w-xl">
              Make your celebration twice as memorable! We partner with elite local florists, luxury chocolate ateliers, and craft card designers near campus to handdeliver beautiful accompanying gifts alongside your premium cakes.
            </p>
            
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-3 text-[10px] uppercase font-black tracking-widest text-pink-300">
              <span className="flex items-center gap-1.5 bg-[#1F0A1B]/80 border border-pink-400/20 px-3 py-1.5 rounded-xl">
                <Shield className="w-3.5 h-3.5 text-pink-400" /> VETTED PARTNER GALLERIES
              </span>
              <span className="flex items-center gap-1.5 bg-[#1F0A1B]/80 border border-pink-400/20 px-3 py-1.5 rounded-xl">
                <Gift className="w-3.5 h-3.5 text-pink-400" /> DELIVERED IN SYNC WITH CAKE
              </span>
            </div>
          </div>

          <div className="relative shrink-0 select-none group mt-4 lg:mt-0">
            <div className="w-36 h-36 md:w-44 md:h-44 rounded-full bg-gradient-to-br from-pink-500/20 to-rose-500/10 border border-pink-400/30 flex items-center justify-center relative shadow-lg">
              <Gift className="w-16 h-16 text-pink-300 animate-bounce-slow" />
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center text-[10px] font-black text-white shadow-md">🎁</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Category selector slider */}
      <div className="flex gap-2.5 overflow-x-auto scrollbar-none py-1 border-b border-gray-150/50 dark:border-zinc-800/60 pb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4.5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/15'
                : 'bg-gray-100 dark:bg-[#1a0d17]/50 text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-white border border-transparent hover:border-pink-500/20'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Gifts Grid layout */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={selectedCategory}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          {filteredGifts.map((gift) => (
            <motion.div
              key={gift.id}
              className="bg-white dark:bg-[#12070f] rounded-3xl border border-gray-150 dark:border-pink-500/10 shadow-xs hover:shadow-xl dark:hover:shadow-pink-500/5 transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:border-pink-400/30"
            >
              <div className="p-4 space-y-4">
                {/* Gift Image with badge */}
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800">
                  <img 
                    src={gift.image} 
                    alt={gift.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute top-3 left-3 bg-white/90 dark:bg-[#1E0B1A]/95 backdrop-blur-md text-[9px] font-black uppercase text-pink-600 dark:text-pink-400 px-2.5 py-1 rounded-lg border border-pink-500/20 shadow-xs">
                    {gift.category}
                  </span>
                  
                  <span className="absolute top-3 right-3 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-lg text-[9px] font-bold text-white flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {gift.rating}
                  </span>
                </div>

                {/* Gift details */}
                <div className="space-y-1.5 min-h-[90px]">
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-[#FEFAF6] font-serif leading-tight group-hover:text-pink-500 dark:group-hover:text-pink-400 transition-colors">
                    {gift.name}
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-zinc-400 leading-normal line-clamp-2">
                    {gift.description}
                  </p>
                </div>
              </div>

              {/* Gift Price & Button action */}
              <div className="p-4 pt-0 border-t border-gray-100 dark:border-pink-500/5 bg-gray-50/50 dark:bg-[#1a0c16]/25 flex items-center justify-between">
                <div>
                  <p className="text-[8px] text-zinc-400 uppercase leading-none font-sans">Gift Price</p>
                  <p className="text-base font-black text-pink-600 dark:text-pink-400 mt-1 font-mono">₹{gift.price}</p>
                </div>
                
                <button
                  onClick={() => onAddGiftToCart(gift)}
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:brightness-110 text-white font-extrabold text-xs rounded-xl shadow-md shadow-pink-500/15 transition-all cursor-pointer active:scale-95 flex items-center gap-1 font-display"
                >
                  <Gift className="w-3.5 h-3.5" /> Add Gift
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
