/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CAMPUSES } from '../data';
import { Campus } from '../types';
import { MapPin, CheckCircle2, ChevronDown, GraduationCap, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CampusSelectorProps {
  selectedCampus: Campus;
  onCampusChange: (campus: Campus) => void;
  campuses: Campus[];
  onShowToast?: (title: string, body: string) => void;
}

export default function CampusSelector({ selectedCampus, onCampusChange, campuses, onShowToast }: CampusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeCampuses = campuses.filter(c => c.active);
  const comingSoonCampuses = campuses.filter(c => !c.active);

  return (
    <div className="relative z-50">
      {/* Selector Trigger Button */}
      <button
        id="campus-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-[#1a080a] hover:bg-[#251012] border border-amber-500/20 shadow-lg text-amber-200 dark:text-amber-100 font-extrabold rounded-2xl transition-all duration-300 group text-sm"
      >
        <span className="p-1 bg-gradient-to-br from-amber-400 to-[#D4AF37] rounded-lg text-black group-hover:scale-110 transition-all duration-300">
          <GraduationCap className="w-3.5 h-3.5" />
        </span>
        <div className="text-left hidden sm:block">
          <p className="text-[9px] uppercase tracking-wider text-amber-400/80 font-black leading-none">Your Campus</p>
          <span className="font-bold flex items-center gap-1 text-white mt-0.5">
            {selectedCampus.name}
          </span>
        </div>
        <span className="sm:hidden font-black text-white text-xs truncate max-w-[120px]">
          {selectedCampus.name.split(' ')[0]}
        </span>
        <ChevronDown className={`w-4 h-4 text-amber-400/80 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop cover for closing */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              id="campus-selector-dropdown"
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#0c0406] rounded-[28px] shadow-2xl border border-gray-100 dark:border-[#291316] p-5 z-50 focus:outline-none"
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-[#291316]">
                <h3 className="font-black text-gray-800 dark:text-[#fafafa] flex items-center gap-1.5 text-sm font-display">
                  <MapPin className="w-4 h-4 text-[#E23744]" /> Choose University
                </h3>
                <span className="text-[10px] font-black text-amber-100 bg-[#E23744] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-2.5 h-2.5 text-amber-200 animate-pulse" /> Live Delivery
                </span>
              </div>

              {/* Active Campus Options */}
              <div className="space-y-2 mb-4">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">Active Hubs</p>
                {activeCampuses.map((campus) => {
                  const isSelected = campus.id === selectedCampus.id;
                  return (
                    <button
                      key={campus.id}
                      onClick={() => {
                        onCampusChange(campus);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-start gap-3 p-3 rounded-2xl text-left transition-all duration-300 relative overflow-hidden group ${
                        isSelected 
                          ? 'bg-[#1a080a] border border-[#E23744]/40 shadow-inner' 
                          : 'bg-gray-50 dark:bg-[#150a0c] hover:bg-gray-100 hover:dark:bg-[#1c0d10] border border-transparent'
                      }`}
                    >
                      <div className={`p-2 rounded-xl transition-all ${
                        isSelected ? 'bg-[#E23744] text-white' : 'bg-white dark:bg-[#251215] text-gray-400 border border-gray-200 dark:border-[#3c1a1e] group-hover:scale-105'
                      }`}>
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`font-black text-xs truncate ${isSelected ? 'text-amber-200 dark:text-amber-100' : 'text-gray-700 dark:text-[#e4e4e7]'}`}>
                          {campus.name}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-zinc-400 flex items-center gap-0.5 mt-0.5 font-medium">
                          <MapPin className="w-3 h-3 text-[#E23744] flex-shrink-0" /> {campus.location}
                        </p>
                      </div>

                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-[#E23744] self-center" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Upcoming expansion network */}
              <div className="space-y-2">
                <div className="flex items-center justify-between pl-1">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Expansion Voting</p>
                  <span className="text-[9px] font-black text-amber-200 bg-[#1a080a] border border-amber-500/10 px-1.5 py-0.5 rounded-md">Upcoming</span>
                </div>
                
                {comingSoonCampuses.map((campus) => (
                  <div
                    key={campus.id}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-zinc-50 dark:bg-[#150a0c]/80 border border-zinc-200/40 dark:border-[#291316]/55 text-left opacity-90 hover:opacity-100 transition-all"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 bg-white dark:bg-[#251215] rounded-xl text-zinc-400 border border-zinc-250 dark:border-zinc-800">
                        <GraduationCap className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-[11px] text-zinc-800 dark:text-zinc-200 truncate">
                          {campus.name}
                        </p>
                        <p className="text-[9px] text-zinc-400 truncate">
                          {campus.location}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onShowToast) {
                          onShowToast("Campus Expansion Vote", `Thanks for voting for ${campus.name}! We will expand here very soon once 100+ students sign up.`);
                        } else {
                          alert(`Thanks for voting for ${campus.name}! We will expand here very soon once 100+ students sign up.`);
                        }
                      }}
                      className="px-2.5 py-1 bg-[#E23744] hover:bg-red-750 text-white font-extrabold text-[9px] rounded-lg transition-all shadow-md flex-shrink-0"
                    >
                      Vote
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
