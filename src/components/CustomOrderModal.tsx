/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CakeItem, OrderItemCustomization, CartItem, GiftItem } from '../types';
import { GIFT_PRODUCTS } from '../data';
import { X, Calendar, MessageSquare, Plus, AlertCircle, ShoppingCart, Sparkles, Image as ImageIcon, Check, AlertTriangle, Utensils, Gift, QrCode } from 'lucide-react';
import { motion } from 'motion/react';

interface CustomOrderModalProps {
  cake: CakeItem;
  onClose: () => void;
  onAddToCart: (cartItem: CartItem) => void;
  onShowToast?: (title: string, body: string) => void;
  serviceMode?: 'delivery' | 'dinein';
  tableNumber?: string | null;
  gifts?: GiftItem[];
  onOpenQrScanner?: () => void;
}

export default function CustomOrderModal({ cake, onClose, onAddToCart, onShowToast, serviceMode, tableNumber, gifts = GIFT_PRODUCTS, onOpenQrScanner }: CustomOrderModalProps) {
  // Setup default state based on cake properties
  const [selectedFlavor, setSelectedFlavor] = useState(cake.flavors[0]);
  const [selectedWeight, setSelectedWeight] = useState(cake.weights[0]);
  const [message, setMessage] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [addCandles, setAddCandles] = useState(false);
  const [addKnife, setAddKnife] = useState(false);
  
  // Date time configuration. Default is tomorrow (24h later)
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [deliveryTime, setDeliveryTime] = useState('17:00');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customAnswers, setCustomAnswers] = useState<Record<string, any>>({});
  const [selectedGifts, setSelectedGifts] = useState<GiftItem[]>([]);
  
  // Schedulers live state
  const [isExpress, setIsExpress] = useState(false);
  
  // Validation feedback
  const [timeWarning, setTimeWarning] = useState<string | null>(null);
  const [calculatedPrice, setCalculatedPrice] = useState(cake.price);

  // Recalculate price when weight scales
  useEffect(() => {
    if (cake.weightPrices && cake.weightPrices[selectedWeight] !== undefined) {
      setCalculatedPrice(cake.weightPrices[selectedWeight]);
      return;
    }

    // Fallback standard weight factor: 0.5kg is baseline. 1.0kg is 1.8x baseline. 1.5kg is 2.5x baseline, etc.
    let factor = 1.0;
    if (selectedWeight === 1.0) factor = 1.8;
    else if (selectedWeight === 1.5) factor = 2.5;
    else if (selectedWeight === 2.0) factor = 3.2;
    else if (selectedWeight === 3.0) factor = 4.5;
    else if (selectedWeight === 0.3) factor = 0.85; // bento sizes
    
    setCalculatedPrice(cake.price * factor);
  }, [selectedWeight, cake.price, cake.weightPrices]);

  // SMART ORDER RULES CHECKER
  useEffect(() => {
    if (serviceMode === 'dinein') {
      setIsExpress(false);
      setTimeWarning(null);
      return;
    }
    if (!deliveryDate) return;

    // Use actual browser local time reference
    const currentAnchor = new Date();
    
    // Construct selection date/time object in local timezone
    const [year, month, day] = deliveryDate.split('-').map(Number);
    const [hours, minutes] = deliveryTime.split(':').map(Number);
    const selectedDateTime = new Date(year, month - 1, day, hours, minutes);

    const diffMs = selectedDateTime.getTime() - currentAnchor.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      setIsExpress(true);
      setTimeWarning("Custom orders require at least 24 hours advance notice.");
    } else {
      setIsExpress(false);
      setTimeWarning(null);
    }
  }, [deliveryDate, deliveryTime, serviceMode]);

  const handlePhotoSimulation = () => {
    setIsUploadingPhoto(true);
    setTimeout(() => {
      // Simulate successful image upload overlay
      setPhotoUrl('https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=200&auto=format&fit=crop&q=80');
      setIsUploadingPhoto(false);
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (timeWarning && serviceMode !== 'dinein') {
      if (onShowToast) {
        onShowToast("Scheduling Rule Conflict", "Custom orders require 24h advance prep. Adjust the date or select an instant kiosk item.");
      } else {
        alert("Rule Error: Please adjust your scheduled date/time to at least 24 hours in the future, or close this and reserve from the 'Need Cake Today?' Kiosk section.");
      }
      return;
    }
    
    // Validate custom questions
    if (cake.customQuestions && cake.customQuestions.length > 0) {
      for (const q of cake.customQuestions) {
        if (q.required) {
          const val = customAnswers[q.id];
          if (!val || (typeof val === 'string' && val.trim() === '')) {
             if (q.type !== 'checkbox') {
                  alert(`Please provide an answer for: ${q.question}`);
                  return;
             }
          }
        }
      }
    }

    const customization: OrderItemCustomization = {
      flavor: selectedFlavor,
      weight: selectedWeight,
      messageOnCake: message,
      photoUrl: photoUrl || undefined,
      addCandles,
      addKnife,
      pickupTime: serviceMode === 'dinein' ? 'Immediate (Dine-In)' : `${deliveryDate} @ ${deliveryTime}`,
      specialInstructions,
      customAnswers,
    };

    const cartId = `${cake.id}-${selectedFlavor}-${selectedWeight}-${message.replace(/\s+/g, '')}`;

    const cartItem: CartItem = {
      id: cartId,
      cakeId: cake.id,
      name: cake.name,
      basePrice: cake.price,
      price: calculatedPrice,
      image: cake.image,
      quantity,
      customization,
      isInstantKiosk: false,
      category: cake.category,
    };

    onAddToCart(cartItem);

    // Add selected companion gifts to cart
    selectedGifts.forEach(gift => {
      const giftCartItemId = `gift-${gift.id}-${Date.now()}`;
      const giftCartItem: CartItem = {
        id: giftCartItemId,
        cakeId: gift.id,
        name: gift.name,
        basePrice: gift.price,
        price: gift.price,
        image: gift.image,
        quantity: 1,
        category: gift.category,
        customization: {
          flavor: gift.partnerGallery,
          weight: 0,
          messageOnCake: '',
          addCandles: false,
          addKnife: false,
          pickupTime: serviceMode === 'dinein' ? 'Immediate (Dine-In)' : `${deliveryDate} @ ${deliveryTime}`
        }
      };
      onAddToCart(giftCartItem);
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Black backdrop layer */}
      <div className="fixed inset-0 bg-gray-950/70 backdrop-blur-md" onClick={onClose}></div>

      {/* Main interactive panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white dark:bg-[#0c0406] w-full max-w-lg md:max-w-2xl rounded-[32px] overflow-hidden shadow-2xl border border-gray-100 dark:border-[#291316] max-h-[92vh] flex flex-col z-50 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header visual banner */}
        <div className="bg-gradient-to-r from-[#120709] via-[#291316] to-[#E23744] text-white p-5 flex justify-between items-center relative flex-shrink-0 border-b border-amber-500/15">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-gradient-to-br from-amber-400 to-[#D4AF37] rounded-2xl shadow-md">
              <Sparkles className="w-5 h-5 text-black animate-spin" style={{ animationDuration: '8s' }} />
            </span>
            <div>
              <p className="text-[10px] bg-white/10 border border-white/10 inline-block px-2.5 py-0.5 rounded-full uppercase font-black tracking-wider text-amber-200">
                Artisan Customizer
              </p>
              <h2 className="text-base md:text-lg font-black tracking-tight font-display">{cake.name}</h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 bg-[#120709]/60 hover:bg-[#E23744] rounded-full text-white transition-all shadow-inner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable customizing forms */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
          
          {serviceMode === 'dinein' && !tableNumber && (
            <div className="p-4 rounded-2xl bg-[#FAF3D9] dark:bg-[#251D0B] border border-[#D4AF37]/40 text-[#2C1D06] dark:text-[#FEFAF6] text-xs flex flex-col gap-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black uppercase tracking-wider text-[#C49A25]">
                  <AlertTriangle className="w-4 h-4 text-[#C49A25] animate-bounce" />
                  <span>Dine-In Table QR Scan Required</span>
                </div>
                {onOpenQrScanner && (
                  <button
                    type="button"
                    onClick={onOpenQrScanner}
                    className="px-3 py-1.5 bg-gradient-to-r from-[#D01C2B] to-[#E23744] text-white text-[11px] font-extrabold rounded-xl shadow-md hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    Scan Table QR
                  </button>
                )}
              </div>
              <p className="font-medium leading-relaxed opacity-90 text-[11px]">
                To serve fresh bakes directly to your table, please scan your table's QR code.
              </p>
            </div>
          )}

          {/* Sizing/Weight and Quantity options section */}
          {(!cake.hideWeightSelection || !cake.hideQuantitySelection) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!cake.hideWeightSelection && (
                <div className={cake.hideQuantitySelection ? "sm:col-span-2" : ""}>
                  <label className="block text-xs font-black text-gray-800 dark:text-amber-100/85 uppercase tracking-widest mb-2.5">
                    {cake.category === 'Cupcakes' ? 'Customize Box Size' : cake.category === 'Bento Cakes' ? 'Bento Size (Kg)' : 'Customize Cake Weight (Kg)'}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {cake.weights.map((w) => {
                      const active = selectedWeight === w;
                      let displayLabel = `${w} kg`;
                      if (cake.category === 'Cupcakes') {
                        displayLabel = w === 0.5 ? '6 Pcs' : `${Math.round(w * 12)} Pcs`;
                      }
                      return (
                        <motion.button
                          key={w}
                          type="button"
                          onClick={() => setSelectedWeight(w)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`p-2.5 rounded-2xl font-black text-xs border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                            active
                              ? 'bg-[#E23744] border-[#E23744] text-white shadow-lg shadow-red-600/15'
                              : 'bg-gray-50 dark:bg-[#1a0d0f] border-gray-100 dark:border-[#291316] text-gray-700 dark:text-[#e4e4e7] hover:bg-gray-100 hover:dark:bg-[#1f0e11]'
                          }`}
                        >
                          <span>{displayLabel}</span>
                          <span className={`text-[9px] font-bold ${active ? 'text-amber-200' : 'text-gray-500 dark:text-[#a1a1aa]'}`}>
                            ₹{cake.weightPrices && cake.weightPrices[w] !== undefined ? cake.weightPrices[w] : Math.round(cake.price * (w === 1.0 ? 1.8 : w === 1.5 ? 2.5 : w === 2.0 ? 3.2 : w === 3.0 ? 4.5 : w === 0.3 ? 0.85 : 1.0))}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {!cake.hideQuantitySelection && (
                <div className={cake.hideWeightSelection ? "sm:col-span-2" : ""}>
                  <label className="block text-xs font-black text-gray-800 dark:text-amber-100/85 uppercase tracking-widest mb-2.5">
                    Quantity
                  </label>
                  <div className="flex items-center justify-between border border-gray-200 dark:border-[#3c1a1e] rounded-xl bg-gray-50 dark:bg-[#1a0d0f] p-1.5 h-[56px] w-full max-w-[160px]">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg bg-white dark:bg-[#2a1418] shadow-sm text-gray-600 dark:text-gray-300 font-black flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#3c1a1e] transition-colors"
                    >
                      -
                    </button>
                    <span className="font-bold text-base text-gray-900 dark:text-white mx-3">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 rounded-lg bg-white dark:bg-[#2a1418] shadow-sm text-gray-600 dark:text-gray-300 font-black flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#3c1a1e] transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Flavor Selection */}
          {!cake.hideFlavorSelection && cake.flavors && cake.flavors.length > 0 && (
            <div>
              <label className="block text-xs font-black text-gray-800 dark:text-amber-100/85 uppercase tracking-widest mb-2.5">
                Select Flavor / Variant
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {cake.flavors.map((flavor) => {
                  const active = selectedFlavor === flavor;
                  return (
                    <motion.button
                      key={flavor}
                      type="button"
                      onClick={() => setSelectedFlavor(flavor)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-2.5 rounded-2xl text-xs font-bold border transition-all text-left flex items-center justify-between ${
                        active
                          ? 'bg-amber-50 border-amber-400 text-amber-900 dark:bg-[#251D0B] dark:border-[#D4AF37]/50 dark:text-[#F3E5AB]'
                          : 'bg-gray-50 dark:bg-[#1a0d0f] border-gray-100 dark:border-[#291316] text-gray-700 dark:text-[#e4e4e7] hover:bg-gray-100 hover:dark:bg-[#1f0e11]'
                      }`}
                    >
                      <span className="truncate pr-2">{flavor}</span>
                      {active && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Frosting text with live UI indicator preview */}
          {!cake.hideMessageOnCake && cake.category !== 'Cupcakes' && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-black text-gray-800 dark:text-amber-100/80 uppercase tracking-widest">
                  Custom Text On Buttercream (Max 24 letters)
                </label>
                <span className={`text-[10px] font-bold ${message.length > 20 ? 'text-[#E23744] animate-pulse' : 'text-zinc-400'}`}>
                  {message.length}/24 chars
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-zinc-400">
                  <MessageSquare className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  maxLength={24}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. Happy Birthday Kriti! 🎓"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#1a0d0f] border border-gray-200 dark:border-[#3c1a1e] rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#E23744]/20 focus:border-[#E23744] text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Photo upload toggle if Category is Photo cakes */}
          {cake.category === 'Photo Cakes' && (
            <div className="p-4 bg-gray-50 dark:bg-[#1a0d0f] rounded-[24px] border border-gray-200 dark:border-[#3c1a1e]/50">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <label className="block text-xs font-black text-gray-800 dark:text-[#fafafa] uppercase tracking-widest">
                    📸 Edible Photo Grid Upload
                  </label>
                  <p className="text-[10px] text-gray-500 dark:text-[#a1a1aa] font-medium mt-0.5">Add an Instax snapshot memory directly printed on sugar shell.</p>
                </div>
                {photoUrl && (
                  <span className="text-[9px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-0.5">
                    <Check className="w-3.5 h-3.5" /> Uploaded
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 mt-2">
                {photoUrl ? (
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-zinc-200 dark:border-[#3c1a1e] shadow-md flex-shrink-0">
                    <img src={photoUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <button 
                      type="button" 
                      onClick={() => setPhotoUrl('')}
                      className="absolute top-0 right-0 bg-[#E23744] text-white p-0.5 rounded-bl shadow"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handlePhotoSimulation}
                    disabled={isUploadingPhoto}
                    className="flex-shrink-0 w-14 h-14 rounded-xl border-2 border-dashed border-rose-300 dark:border-[#3c1a1e] hover:border-[#E23744] bg-rose-50 dark:bg-rose-500/10 flex flex-col items-center justify-center p-1 text-[#E23744] hover:bg-rose-100 hover:dark:bg-rose-500/20 transition-all font-bold"
                  >
                    <ImageIcon className="w-5 h-5 text-rose-500" />
                    <span className="text-[8px] font-black mt-0.5">Choose</span>
                  </button>
                )}
                
                <div className="flex-1">
                  <input
                    type="text"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="Or paste external selfie image URL..."
                    className="w-full px-3 py-2 bg-white dark:bg-[#0c0406] border border-gray-200 dark:border-[#3c1a1e] rounded-xl text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-[#E23744]"
                  />
                  <p className="text-[9px] text-gray-400 mt-1">Accepts standard PNG, JPG templates. Max 4MB size.</p>
                </div>
              </div>
            </div>
          )}

          {/* Addons section */}
          {!cake.hideEventAddons && cake.category !== 'Cupcakes' && (
            <div>
              <label className="block text-xs font-black text-gray-800 dark:text-amber-100/80 uppercase tracking-widest mb-2">
                Event Conveniences (Free Add-ons!)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  type="button"
                  onClick={() => setAddCandles(!addCandles)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                    addCandles
                      ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-400 text-[#E23744]'
                      : 'bg-gray-50 dark:bg-[#1a0d0f]/80 border-gray-100 dark:border-[#291316] text-gray-700 dark:text-[#e4e4e7] hover:bg-gray-150 hover:dark:bg-[#1a0d0f]'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${addCandles ? 'bg-[#E23744] border-[#E23744] text-white' : 'bg-white dark:bg-[#120709] border-gray-300 dark:border-slate-600'}`}>
                    {addCandles && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-xs">Premium Candles</p>
                    <p className="text-[9px] text-[#E23744] dark:text-rose-400">Free set of 5</p>
                  </div>
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => setAddKnife(!addKnife)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                    addKnife
                      ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-400 text-[#E23744]'
                      : 'bg-gray-50 dark:bg-[#1a0d0f]/80 border-gray-100 dark:border-[#291316] text-gray-700 dark:text-[#e4e4e7] hover:bg-gray-150 hover:dark:bg-[#1a0d0f]'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${addKnife ? 'bg-[#E23744] border-[#E23744] text-white' : 'bg-white dark:bg-[#120709] border-gray-300 dark:border-slate-600'}`}>
                    {addKnife && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-xs">Birchwood Cake Knife</p>
                    <p className="text-[9px] text-[#E23744] dark:text-rose-400">Free organic knife</p>
                  </div>
                </motion.button>
              </div>
            </div>
          )}

          {/* Add a Gift Option (Campus Cakes Gifts) */}
          <div className="border-t border-dashed dark:border-[#3c1a1e] border-gray-200 dark:border-[#3c1a1e] pt-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-gray-800 dark:text-amber-100/80 uppercase tracking-widest flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-pink-500" /> Add a Gift
              </label>
              <span className="text-[9px] bg-pink-100 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Delivered with Cake</span>
            </div>
            
            <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
              Surprise your loved ones! Easily add premium hand-curated gifts delivered in sync with your cake order.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {gifts.map((gift) => {
                const isSelected = selectedGifts.some(g => g.id === gift.id);
                const toggleGift = () => {
                  if (isSelected) {
                    setSelectedGifts(prev => prev.filter(g => g.id !== gift.id));
                  } else {
                    setSelectedGifts(prev => [...prev, gift]);
                  }
                };

                return (
                  <motion.button
                    key={gift.id}
                    type="button"
                    onClick={toggleGift}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-2.5 rounded-2xl border flex items-center gap-3 transition-all text-left ${
                      isSelected
                        ? 'bg-pink-50/70 dark:bg-pink-950/20 border-pink-400 text-pink-900 dark:text-pink-300'
                        : 'bg-gray-50 dark:bg-[#1a0d0f]/80 border-gray-100 dark:border-[#291316] text-gray-700 dark:text-[#e4e4e7] hover:bg-gray-100 hover:dark:bg-[#1a0d0f]'
                    }`}
                  >
                    <img 
                      src={gift.image} 
                      alt={gift.name} 
                      className="w-11 h-11 object-cover rounded-xl border border-gray-100 dark:border-zinc-800 flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    
                    <div className="flex-1 min-w-0 pr-1">
                      <p className="font-extrabold text-[11px] truncate leading-tight">{gift.name}</p>
                      <p className="text-[10px] font-black text-pink-600 dark:text-pink-400 mt-1">₹{gift.price}</p>
                    </div>

                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-pink-500 border-pink-500 text-white' : 'bg-white dark:bg-[#120709] border-gray-300 dark:border-slate-600'}`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {cake.customQuestions && cake.customQuestions.length > 0 && (
            <div className="border-t border-dashed dark:border-[#3c1a1e] border-gray-200 dark:border-[#3c1a1e] pt-5 space-y-4">
              <label className="block text-xs font-black text-gray-800 dark:text-amber-100/80 uppercase tracking-widest mb-2">
                Custom Details
              </label>
              <div className="space-y-3">
                {cake.customQuestions.map((q) => (
                  <div key={q.id} className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase">
                      {q.question} {q.required && <span className="text-red-500">*</span>}
                    </label>
                    {q.type === 'text' && (
                      <input
                        type="text"
                        value={customAnswers[q.id] || ''}
                        onChange={(e) => setCustomAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1a0d0f] border border-gray-200 dark:border-[#3c1a1e] rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#E23744] text-gray-900 dark:text-white"
                      />
                    )}
                    {q.type === 'dropdown' && (
                      <select
                        value={customAnswers[q.id] || ''}
                        onChange={(e) => setCustomAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1a0d0f] border border-gray-200 dark:border-[#3c1a1e] rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#E23744] text-gray-900 dark:text-white scrollbar-none"
                      >
                        <option value="">Select option...</option>
                        {q.options?.map((opt, i) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                    {q.type === 'checkbox' && (
                      <label className="flex items-center gap-2 cursor-pointer bg-gray-50 dark:bg-[#1a0d0f]/80 p-2.5 rounded-xl border border-gray-200 dark:border-[#3c1a1e] text-xs font-semibold hover:bg-gray-100 dark:hover:bg-slate-800 transition-all select-none">
                        <input
                          type="checkbox"
                          checked={customAnswers[q.id] || false}
                          onChange={(e) => setCustomAnswers(prev => ({ ...prev, [q.id]: e.target.checked }))}
                          className="rounded border-gray-300 dark:border-slate-600 text-[#E23744] focus:ring-[#E23744] focus:ring-1 w-4 h-4 cursor-pointer"
                        />
                        <span className="text-gray-800 dark:text-gray-200">Yes</span>
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Schedulers & SMART ORDER RULES BANNER */}
          <div className="border-t border-dashed dark:border-[#3c1a1e] border-gray-200 dark:border-[#3c1a1e] pt-5 space-y-4">
            {serviceMode === 'dinein' ? (
              <div className="flex flex-col gap-2 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 rounded-[18px]">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-widest flex items-center gap-1.5">
                    <Utensils className="w-4 h-4 text-amber-500" /> {cake.category === 'Cupcakes' ? '3' : '5'}. Fast Table Delivery
                  </label>
                  <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300 uppercase tracking-wider bg-amber-100 dark:bg-amber-900/40 px-2.5 py-0.5 rounded-full select-none">Priority</span>
                </div>
                <p className="text-[10px] text-amber-800 dark:text-amber-400 font-medium leading-relaxed">
                  You are in Dine-In mode. Your order will be prepared immediately and served to your table. The 24-hour advance booking rule is waived.
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-black text-gray-800 dark:text-amber-100/80 uppercase tracking-widest flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#E23744] dark:text-rose-400" /> {cake.category === 'Cupcakes' ? '3' : '5'}. Select Campus Delivery Slot
                  </label>
                  <span className="text-[10px] font-extrabold text-[#E23744] uppercase tracking-wider bg-rose-55 dark:bg-rose-500/10 px-2.5 py-0.5 rounded-full select-none">24h rule active</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Date</span>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#1a0d0f] border border-gray-200 dark:border-[#3c1a1e] rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#E23744] text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Aprox. Hour</span>
                    <select
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#1a0d0f] border border-gray-200 dark:border-[#3c1a1e] rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#E23744] text-gray-900 dark:text-white scrollbar-none"
                    >
                      {Array.from({ length: 24 }).map((_, i) => {
                        const hour = i.toString().padStart(2, '0');
                        const labelHour = i % 12 === 0 ? 12 : i % 12;
                        const ampm = i >= 12 ? 'PM' : 'AM';
                        return (
                          <React.Fragment key={i}>
                            <option value={`${hour}:00`}>{`${labelHour.toString().padStart(2, '0')}:00 ${ampm}`}</option>
                            <option value={`${hour}:30`}>{`${labelHour.toString().padStart(2, '0')}:30 ${ampm}`}</option>
                          </React.Fragment>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Smart Order Rules Alert Container */}
                {isExpress ? (
                  <div className="p-4 bg-red-600 rounded-[18px] border border-red-500 flex items-start gap-3 text-white shadow-xl shadow-red-600/20">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-100" />
                    <div className="leading-relaxed flex-1">
                      <p className="font-black text-xs uppercase tracking-wider mb-1">Order Validation Failed</p>
                      <p className="text-red-50 font-medium text-[11px]">
                        {timeWarning}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-55 dark:bg-emerald-500/10 rounded-2xl border border-emerald-150 flex items-start gap-2.5 text-emerald-800">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="text-[10px] leading-relaxed">
                      <p className="font-extrabold text-emerald-900 dark:text-emerald-400">✓ Smart Order validation approved</p>
                      <p className="text-gray-500 dark:text-zinc-500 font-medium">Your scheduled checkout is more than 24 hours out. Fresh, on-time baking is fully guaranteed.</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Special instructions box */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Special culinary/hostel gate notes</span>
            <textarea
              placeholder="e.g. Please leave with hostel security guard, ring when you reach Block B entrance, etc."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1a0d0f] border border-gray-200 dark:border-[#3c1a1e] rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#E23744] text-gray-900 dark:text-white h-[60px] resize-none"
            />
          </div>
        </form>

        {/* Footer actions panel (Sticky price) */}
        <div className="bg-gray-50 dark:bg-[#14080a]/90 border-t border-gray-100 dark:border-[#291316] p-4 md:p-5 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase leading-none">Net Total Value</p>
            <p className="text-xl font-black text-gray-900 dark:text-amber-100 mt-1 font-display">₹{Math.round(calculatedPrice * quantity + selectedGifts.reduce((acc, g) => acc + g.price, 0))}</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white dark:bg-[#251215]/40 border border-gray-200 dark:border-[#3c1a1e] hover:bg-gray-100 hover:dark:bg-[#251215] text-gray-700 dark:text-[#e4e4e7] font-extrabold rounded-xl text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={(serviceMode !== 'dinein' && !!timeWarning) || (serviceMode === 'dinein' && !tableNumber)}
              className={`px-6 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all ${
                (serviceMode !== 'dinein' && timeWarning) || (serviceMode === 'dinein' && !tableNumber)
                  ? 'bg-gray-200 dark:bg-[#1a0d0f] text-gray-400 cursor-not-allowed'
                  : 'bg-[#E23744] hover:bg-red-750 text-white shadow-xl shadow-red-600/20 hover:scale-[1.03] active:scale-95'
              }`}
            >
              <ShoppingCart className="w-4 h-4" /> 
              {serviceMode === 'dinein' && !tableNumber ? 'QR Scan Required' : 'Add to Campus Cart'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
