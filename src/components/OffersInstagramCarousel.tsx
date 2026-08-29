import React, { useState, useEffect } from 'react';
import { 
  Sparkles, ChevronLeft, ChevronRight, Check, Copy, Tag, Percent
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Coupon, UserProfile } from '../types';
import { brandLogo } from '../assets/logo';

interface OffersInstagramCarouselProps {
  coupons: Coupon[];
  user: UserProfile;
  onApplyCoupon: (code: string) => void;
  onShowToast: (title: string, desc: string) => void;
}

export default function OffersInstagramCarousel({ 
  coupons, 
  user,
  onApplyCoupon, 
  onShowToast 
}: OffersInstagramCarouselProps) {
  // Only show active and unexhausted coupons
  const activeCoupons = coupons.filter(c => c.isActive && c.usersUsed.length < c.usageLimit);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-play interval
  useEffect(() => {
    if (activeCoupons.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeCoupons.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeCoupons.length]);

  if (activeCoupons.length === 0) {
    return null; // Don't show anything if there are no coupons
  }

  const currentCoupon = activeCoupons[currentIndex];

  // Helper to determine theme classes based on current coupon index
  const getTheme = (index: number) => {
    const themes = [
      {
        container: "bg-gradient-to-r from-zinc-950 via-[#220c10] to-[#120507] border-rose-500/20 dark:border-rose-500/10",
        glowLeft: "bg-rose-500/10",
        glowRight: "bg-amber-500/10",
        radial: "bg-[radial-gradient(circle_at_30%_30%,rgba(190,24,74,0.2),transparent_60%)]",
        radialBottom: "bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08),transparent_70%)]",
        brandText: "text-[#D4AF37]",
        titleText: "from-[#FEFAF6] via-[#FCECEF] to-[#ffd0d9]",
        sloganText: "text-[#D4AF37]",
        codeBadge: "bg-rose-500/15 border-rose-500/30 text-rose-300",
        discountPrice: "text-rose-400",
        discountBadge: "text-[#D4AF37]",
        actionBtn: "from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 shadow-rose-600/20 hover:shadow-rose-600/35",
        logoRing: "from-[#D4AF37] via-rose-500 to-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)]",
        indicatorActive: "bg-rose-500"
      },
      {
        container: "bg-gradient-to-r from-zinc-950 via-[#041a12] to-[#020d09] border-emerald-500/20 dark:border-emerald-500/10",
        glowLeft: "bg-emerald-500/10",
        glowRight: "bg-yellow-500/10",
        radial: "bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.2),transparent_60%)]",
        radialBottom: "bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.08),transparent_70%)]",
        brandText: "text-amber-300",
        titleText: "from-[#F0FDF4] via-[#DCFCE7] to-[#86EFAC]",
        sloganText: "text-emerald-400",
        codeBadge: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
        discountPrice: "text-emerald-400",
        discountBadge: "text-amber-300",
        actionBtn: "from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-600/20 hover:shadow-emerald-600/35",
        logoRing: "from-amber-400 via-emerald-500 to-teal-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]",
        indicatorActive: "bg-emerald-500"
      },
      {
        container: "bg-gradient-to-r from-zinc-950 via-[#061226] to-[#020812] border-blue-500/20 dark:border-blue-500/10",
        glowLeft: "bg-blue-500/10",
        glowRight: "bg-indigo-500/10",
        radial: "bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.2),transparent_60%)]",
        radialBottom: "bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08),transparent_70%)]",
        brandText: "text-cyan-300",
        titleText: "from-[#F0F9FF] via-[#E0F2FE] to-[#7DD3FC]",
        sloganText: "text-blue-400",
        codeBadge: "bg-blue-500/15 border-blue-500/30 text-blue-300",
        discountPrice: "text-cyan-400",
        discountBadge: "text-cyan-300",
        actionBtn: "from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-blue-600/20 hover:shadow-blue-600/35",
        logoRing: "from-cyan-400 via-blue-500 to-indigo-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]",
        indicatorActive: "bg-blue-500"
      },
      {
        container: "bg-gradient-to-r from-zinc-950 via-[#170624] to-[#0b0312] border-purple-500/20 dark:border-purple-500/10",
        glowLeft: "bg-purple-500/10",
        glowRight: "bg-fuchsia-500/10",
        radial: "bg-[radial-gradient(circle_at_30%_30%,rgba(168,85,247,0.2),transparent_60%)]",
        radialBottom: "bg-[radial-gradient(circle_at_center,rgba(217,70,239,0.08),transparent_70%)]",
        brandText: "text-fuchsia-300",
        titleText: "from-[#FAF5FF] via-[#F3E8FF] to-[#D8B4FE]",
        sloganText: "text-fuchsia-400",
        codeBadge: "bg-purple-500/15 border-purple-500/30 text-purple-300",
        discountPrice: "text-fuchsia-400",
        discountBadge: "text-fuchsia-300",
        actionBtn: "from-purple-500 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-700 shadow-purple-600/20 hover:shadow-purple-600/35",
        logoRing: "from-purple-400 via-fuchsia-500 to-rose-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]",
        indicatorActive: "bg-purple-500"
      },
      {
        container: "bg-gradient-to-r from-zinc-950 via-[#221204] to-[#0f0802] border-amber-500/20 dark:border-amber-500/10",
        glowLeft: "bg-amber-500/10",
        glowRight: "bg-orange-500/10",
        radial: "bg-[radial-gradient(circle_at_30%_30%,rgba(245,158,11,0.2),transparent_60%)]",
        radialBottom: "bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.08),transparent_70%)]",
        brandText: "text-amber-400",
        titleText: "from-[#FFFBEB] via-[#FEF3C7] to-[#FDE68A]",
        sloganText: "text-amber-500",
        codeBadge: "bg-amber-500/15 border-amber-500/30 text-amber-300",
        discountPrice: "text-amber-400",
        discountBadge: "text-amber-400",
        actionBtn: "from-amber-400 to-orange-600 hover:from-amber-500 hover:to-orange-700 shadow-orange-600/20 hover:shadow-orange-600/35",
        logoRing: "from-amber-500 via-orange-500 to-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.4)]",
        indicatorActive: "bg-amber-500"
      }
    ];
    return themes[index % themes.length];
  };

  const currentTheme = getTheme(currentIndex);

  // Helper to calculate pricing showcase dynamically to mirror the screenshot layout
  const getPricingShowcase = (coupon: Coupon) => {
    const baseOriginalPrice = 1250; // standard premium celebration cake price
    let discountedPrice = baseOriginalPrice;
    
    if (coupon.discountType === 'percentage') {
      discountedPrice = Math.round(baseOriginalPrice * (1 - coupon.discountValue / 100));
    } else {
      discountedPrice = baseOriginalPrice - coupon.discountValue;
    }

    return {
      original: baseOriginalPrice,
      discounted: Math.max(0, discountedPrice)
    };
  };

  const handleApply = (code: string) => {
    onApplyCoupon(code);
  };

  const handleCopy = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    onShowToast('Promo Code Copied!', `"${code}" is ready. Paste at checkout for premium savings!`);
  };

  const priceDetails = getPricingShowcase(currentCoupon);

  return (
    <div className="w-full space-y-3 my-4">
      {/* Dynamic Promo Banner exactly resembling the image */}
      <div className={`relative overflow-hidden w-full rounded-2xl md:rounded-3xl ${currentTheme.container} border shadow-[0_4px_30px_rgba(0,0,0,0.4)]`}>
        
        {/* Absolute Background Glowing Gradients */}
        <div className={`absolute inset-0 ${currentTheme.radial} pointer-events-none`} />
        <div className={`absolute inset-x-0 bottom-0 h-1/2 ${currentTheme.radialBottom} pointer-events-none`} />
        
        {/* Floating Decorative Particle Elements */}
        <div className={`absolute top-2 left-1/4 w-12 h-12 ${currentTheme.glowLeft} rounded-full blur-xl animate-pulse pointer-events-none`} />
        <div className={`absolute bottom-2 right-1/4 w-16 h-16 ${currentTheme.glowRight} rounded-full blur-xl animate-pulse pointer-events-none`} />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 items-center text-white px-6 py-5 md:py-6 gap-5 md:gap-4 select-none">
          
          {/* LEFT PANEL: Logo & Slogan (Analogous to the "JEE 2027 KI RACE SHURU HO CHUKI HAI" left side) */}
          <div className="md:col-span-5 flex flex-col md:border-r md:border-white/10 pr-2 space-y-2">
            <div className="flex items-center gap-2.5">
              <motion.div 
                className={`w-10 h-10 rounded-full bg-gradient-to-tr ${currentTheme.logoRing} p-[1.5px] shrink-0 overflow-hidden`}
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 360]
                }}
                transition={{
                  scale: {
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  },
                  rotate: {
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                  }
                }}
              >
                <div className="w-full h-full rounded-full bg-black overflow-hidden flex items-center justify-center">
                  <img 
                    src={brandLogo} 
                    className="w-full h-full object-cover rounded-full" 
                    alt="Campus Cakes Logo" 
                  />
                </div>
              </motion.div>
              <span className={`text-[10px] uppercase font-black tracking-[0.2em] ${currentTheme.brandText}`}>Campus Cakes Exclusive Offer</span>
            </div>
            
            <div className="space-y-1">
              <h4 className={`text-lg md:text-xl font-black font-display tracking-tight leading-tight uppercase bg-clip-text text-transparent bg-gradient-to-r ${currentTheme.titleText}`}>
                {currentCoupon.occasion}
              </h4>
              <p className={`text-[10px] md:text-[11px] font-bold ${currentTheme.sloganText} uppercase tracking-wide`}>
                CELEBRATION DEALS START NOW • ENJOY EXTRA SAVINGS
              </p>
            </div>
          </div>

          {/* MIDDLE PANEL: Main Package details & pricing (Analogous to the center "Lakshya JEE 2.0" + crossed pricing) */}
          <div className="md:col-span-4 flex flex-col justify-center space-y-1.5 pl-0 md:pl-2">
            <div className={`inline-flex items-center gap-1.5 ${currentTheme.codeBadge} px-3 py-1 rounded-xl w-fit`}>
              <Tag className="w-3.5 h-3.5" />
              <span className="text-[11px] font-black tracking-wide uppercase">
                CODE: {currentCoupon.code}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              {/* Crossed Price */}
              <span className="text-zinc-400 line-through text-xs md:text-sm font-semibold">
                ₹{priceDetails.original}
              </span>
              
              {/* Discounted Promotional Price */}
              <span className={`text-xl md:text-2xl font-black ${currentTheme.discountPrice} font-mono tracking-tight flex items-center`}>
                ₹{priceDetails.discounted}/-
              </span>
              
              <span className={`text-[9px] font-extrabold uppercase ${currentTheme.discountBadge}`}>
                ({currentCoupon.discountType === 'percentage' ? `${currentCoupon.discountValue}% Off` : `₹${currentCoupon.discountValue} Off`})
              </span>
            </div>
          </div>

          {/* RIGHT PANEL: Claim CTA & Actions (Analogous to the right side "Enroll Now" orange pill) */}
          <div className="md:col-span-3 flex flex-row md:flex-col items-center justify-between md:justify-center gap-3 w-full">
            {/* Direct copy shortcut option */}
            <button
              onClick={(e) => handleCopy(currentCoupon.code, e)}
              className="text-[10px] font-black uppercase tracking-wider text-zinc-300 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 px-3 py-2 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Code
            </button>

            {/* Direct primary action enrollment/claim button */}
            <button
              onClick={() => handleApply(currentCoupon.code)}
              className={`px-5 py-2.5 bg-gradient-to-r ${currentTheme.actionBtn} text-white font-extrabold text-xs uppercase tracking-widest rounded-full transition-all duration-300 active:scale-95 cursor-pointer flex items-center gap-1.5`}
            >
              Apply Deal &gt;
            </button>
          </div>

        </div>

        {/* Carousel Side Arrows */}
        {activeCoupons.length > 1 && (
          <>
            <button 
              onClick={() => setCurrentIndex((prev) => (prev - 1 + activeCoupons.length) % activeCoupons.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-all cursor-pointer z-20 border border-white/5"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setCurrentIndex((prev) => (prev + 1) % activeCoupons.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-all cursor-pointer z-20 border border-white/5"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Indicator Dots exactly mirroring the screenshot */}
      {activeCoupons.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-1">
          {activeCoupons.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? `w-4 ${currentTheme.indicatorActive}` : 'w-2 bg-gray-300 dark:bg-zinc-800'}`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
