/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { KioskCake, Campus } from '../types';
import { KIOSK_INVENTORY } from '../data';
import { Flame, Clock, Zap, ShoppingBag, ShieldCheck, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface KioskSectionProps {
  selectedCampus: Campus;
  onReserveCake: (kioskCake: KioskCake) => void;
  inventory: KioskCake[];
}

export default function KioskSection({ selectedCampus, onReserveCake, inventory }: KioskSectionProps) {
  const [liveInventory, setLiveInventory] = useState<KioskCake[]>([]);

  useEffect(() => {
    const safeInventory = Array.isArray(inventory) ? inventory : [];
    const filtered = safeInventory.filter(item => {
      if (!item || !item.campusIds || !Array.isArray(item.campusIds) || item.campusIds.length === 0) return true;
      return selectedCampus?.id ? item.campusIds.includes(selectedCampus.id) : true;
    });
    setLiveInventory(filtered);
  }, [inventory, selectedCampus]);

  return (
    <div id="quick-pick-section" className="relative overflow-hidden bg-gradient-to-br from-[#1A0507] via-[#070102] to-[#160406] rounded-[36px] p-6 md:p-8 border border-[#D4AF37]/35 mb-14 shadow-2xl">
      {/* Decorative badges */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#F3E5AB] bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/30 shadow-sm">
          <Zap className="w-3 h-3 text-[#D4AF37] animate-bounce" /> Hot Kiosk Live
        </span>
      </div>

      <div className="max-w-2xl mb-8">
        <div className="flex items-center gap-1.5 text-[#D4AF37] font-extrabold uppercase tracking-widest text-xs mb-2">
          <Flame className="w-3.5 h-3.5 text-[#D4AF37]" /> Instant Gratification
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight font-display font-serif">
          Need Fresh Cake Today? <span className="text-[#E23744]">Pick Up in 10 Mins!</span>
        </h2>
        <p className="text-zinc-300 mt-2.5 text-sm md:text-base leading-relaxed">
          Forgot a milestone or celebrating post-exam cramming? No pre-order needed. Pick one of our 
          ready-baked gourmet flavors in real-time at the <strong className="text-[#F3E5AB]">{selectedCampus.location}</strong>. Stock updates live!
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {liveInventory.length === 0 ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-[#FCFAF7] dark:bg-[#0F0506] rounded-xl p-4 border border-[#D4AF37]/10 flex flex-col justify-between animate-pulse space-y-3">
              <div className="rounded-xl bg-gray-200 dark:bg-zinc-800 h-32 w-full" />
              <div className="space-y-2 pb-2">
                <div className="h-4 bg-gray-350 dark:bg-zinc-700 rounded w-2/3" />
                <div className="h-3 bg-gray-355 dark:bg-zinc-700 rounded w-1/2" />
              </div>
              <div className="h-9 bg-gray-350 dark:bg-zinc-700 rounded-xl w-full" />
            </div>
          ))
        ) : (
          liveInventory.map((item) => {
            const isOut = item.remainingStock === 0;
            const isLow = item.remainingStock > 0 && item.remainingStock <= 2;
            const percentageLeft = (item.remainingStock / item.totalStock) * 100;
  
            return (
              <motion.div
                key={item.id}
                whileHover={isOut ? {} : { y: -6, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 350, damping: 22 }}
                className={`bg-[#FCFAF7] dark:bg-[#120709] rounded-3xl p-4 border flex flex-col justify-between relative transition-all duration-300 ${
                  isOut 
                    ? 'border-gray-200 dark:border-[#3c1a1e]/60 opacity-60 filter grayscale-[50%]' 
                    : 'border-[#D4AF37]/25 dark:border-[#3C2216]/80 shadow-[0_4px_24px_-10px_rgba(212,175,55,0.04)] hover:shadow-[0_12px_32px_-5px_rgba(212,175,55,0.15)] hover:border-[#D4AF37]/50'
                }`}
              >
                {/* Image and relative tags */}
                <div className="relative rounded-2xl overflow-hidden h-32 mb-3.5 bg-gray-50 dark:bg-[#1a0d0f]">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Instant Pickup tag */}
                  <span className="absolute top-2 left-2 text-[8px] font-black uppercase text-white bg-black/85 backdrop-blur-md px-2 py-0.5 rounded-md flex items-center gap-1 tracking-widest border border-white/10">
                    <Clock className="w-2.5 h-2.5 text-[#D4AF37]" /> 10-MIN PICKUP
                  </span>

                  {isOut ? (
                    <div className="absolute inset-0 bg-black/75 flex items-center justify-center backdrop-blur-[1px]">
                      <span className="text-white font-black text-[9px] px-3 py-1 bg-gradient-to-r from-zinc-700 to-zinc-900 rounded-full border border-zinc-650 shadow-lg tracking-wider">
                        SOLD OUT TODAY
                      </span>
                    </div>
                  ) : isLow ? (
                    <span className="absolute bottom-2 right-2 text-[8px] font-black uppercase text-white bg-gradient-to-r from-red-600 to-[#E23744] px-2.5 py-0.5 rounded-full animate-pulse tracking-wider select-none shadow-md">
                      ONLY {item.remainingStock} LEFT!
                    </span>
                  ) : null}
                </div>

                {/* Text metadata */}
                <div className="mb-3">
                  <h3 className="font-black text-zinc-900 dark:text-[#FEFAF6] text-base leading-tight truncate font-display">
                    {item.name}
                  </h3>
                  <p className="text-[10px] text-[#C49A25] mt-1.5 flex items-center gap-1 font-extrabold uppercase tracking-widest font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                    {item.flavor}
                  </p>
                  <div className="text-sm font-black text-[#E23744] dark:text-[#D4AF37] mt-1.5 flex items-baseline font-mono pb-1 border-b border-dashed border-[#D4AF37]/15">
                    <span className="text-[10px] font-bold font-sans pr-0.5">₹</span>{item.price}
                  </div>
                </div>

                {/* Progress bar state visualization */}
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-zinc-500 dark:text-zinc-400 font-bold">Kiosk Stock Level</span>
                    <span className={`font-black ${isOut ? 'text-red-650' : isLow ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {item.remainingStock}/{item.totalStock} left
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-150 dark:bg-[#1a0d0f] rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOut ? 'bg-zinc-450' : isLow ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      }`} 
                      style={{ width: `${percentageLeft}%` }}
                    />
                  </div>
                </div>

                {/* CTA button */}
                <motion.button
                  disabled={isOut}
                  whileHover={isOut ? {} : { scale: 1.02 }}
                  whileTap={isOut ? {} : { scale: 0.98 }}
                  onClick={() => onReserveCake(item)}
                  className={`w-full py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer ${
                    isOut
                      ? 'bg-zinc-100 dark:bg-[#1a0d0f]/80 text-zinc-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#D4AF37] via-[#FFF3CD] to-[#C5A02B] hover:brightness-110 text-black shadow-lg shadow-amber-500/15 border border-[#D4AF37]/35'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  {isOut ? 'Back Tomorrow' : 'Reserve for Pick Up'}
                </motion.button>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Trust guarantees badge footer */}
      <div className="mt-6 pt-5 border-t border-dashed dark:border-[#3c1a1e] border-gray-200 dark:border-[#3c1a1e]/80 flex flex-wrap gap-4 items-center justify-between text-xs text-gray-650 dark:text-zinc-400 font-bold">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Reserved items held for <strong className="text-white">90 minutes</strong> under premium deep refrigeration.</span>
        </div>
        <div className="flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-600 animate-pulse" />
          <span>Location: Locate the orange logo stall in campus canteen</span>
        </div>
      </div>
    </div>
  );
}
