import React from 'react';
import { motion } from 'motion/react';
import { 
  Heart, Sparkles, Target, Compass, ShieldCheck, Award, Tag, Zap, Code, Users, Gift
} from 'lucide-react';
import { brandLogo } from '../assets/logo';

export default function AboutSection() {
  const values = [
    {
      icon: <Award className="w-5 h-5 text-amber-500" />,
      title: "Quality First",
      desc: "Every cake is freshly prepared using premium, direct-sourced ingredients by master pastry chefs."
    },
    {
      icon: <Heart className="w-5 h-5 text-rose-500" />,
      title: "Customer Happiness",
      desc: "Every milestone, birthday, and exam party matters. We are dedicated to delivering joy in every box."
    },
    {
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      title: "Innovation",
      desc: "Smart digital features, offline-first portal tools, real-time dispatch logs, and customized interactive options."
    },
    {
      icon: <Tag className="w-5 h-5 text-emerald-500" />,
      title: "Affordability",
      desc: "Great celebrations shouldn't break the student budget. We offer sweet values and real loyalty rewards."
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-blue-500" />,
      title: "Trust & Transparency",
      desc: "Honest upfront pricing, guaranteed safe coordination, and timely delivery. No hidden service charges."
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="space-y-12"
    >
      {/* 1. HERO BRAND INTRO */}
      <div className="relative rounded-[36px] overflow-hidden bg-gradient-to-br from-[#1c0d10] via-[#0b0405] to-[#1a0a0d] border border-[#D4AF37]/20 p-8 md:p-14 text-center shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-[#D4AF37] to-red-500" />
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#E23744]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          {/* Embossed Logo Accent */}
          <div className="flex justify-center">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 2 }}
              className="w-24 h-24 rounded-full p-[2px] bg-gradient-to-tr from-[#D4AF37] via-amber-400 to-[#D4AF37] shadow-xl overflow-hidden"
            >
              <div className="w-full h-full bg-black rounded-full overflow-hidden p-[1px]">
                <img src={brandLogo} className="w-full h-full object-cover rounded-full" alt="Campus Cakes" />
              </div>
            </motion.div>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] font-black tracking-widest text-[#D4AF37] uppercase bg-[#D4AF37]/10 px-3 py-1.5 rounded-full border border-[#D4AF37]/25 inline-block">
              Sweetening College Campus Life
            </span>
            <h1 className="text-3xl md:text-5xl font-black font-display text-white tracking-tight">
              About <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-amber-300 to-[#C5A02B] italic">Campus Cakes</span>
            </h1>
          </div>

          <p className="text-sm md:text-base text-zinc-300 font-medium leading-relaxed max-w-2xl mx-auto font-sans">
            Crafting premium custom delicacies, cute bento treats, and unforgettable memories for every dorm room, study lounge, and canteen.
          </p>
        </div>
      </div>

      {/* 2. THE STORY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 bg-white dark:bg-[#120709] rounded-[32px] p-6 md:p-10 border border-gray-100 dark:border-[#291316] shadow-lg flex flex-col justify-center">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#E23744]">
              <Compass className="w-5 h-5 text-[#E23744]" />
              <h2 className="text-xs font-black uppercase tracking-widest">Our Story</h2>
            </div>
            <h3 className="text-2xl md:text-3xl font-black font-display text-gray-950 dark:text-[#FEFAF6] tracking-tight leading-tight">
              Simplifying Campus Celebrations Since Day One
            </h3>
            <div className="w-16 h-[3px] bg-gradient-to-r from-[#E23744] to-transparent rounded-full" />
            <p className="text-sm text-gray-600 dark:text-zinc-300 font-medium leading-relaxed pt-2">
              Campus Cakes was founded with the idea of making celebrations on college campuses simple, affordable, and memorable. We recognized that students often struggle to find high-quality gourmet items—including handcrafted cakes, customized birthday themes, cute single-serving bento treat boxes, and shared cupcake packs—that are budget-friendly, highly personalized, and easy to order.
            </p>
            <p className="text-sm text-gray-600 dark:text-zinc-300 font-medium leading-relaxed">
              By combining fresh baking with smart technology, Campus Cakes was created to deliver a seamless ordering experience designed specifically for students and educational institutions. We have evolved beyond a simple cake shop into a complete campus celebration hub, supplying premium cupcakes, custom photo confectionery, emergency kiosk refreshments, and memorable sweet surprises directly to student coordination points.
            </p>
          </div>
        </div>

        {/* Brand visual quote block */}
        <div className="lg:col-span-5 bg-gradient-to-tr from-[#E23744]/10 via-[#FAF3D9]/20 to-rose-500/5 dark:from-[#2a0c0e] dark:to-[#120709] rounded-[32px] p-8 border border-[#E23744]/15 dark:border-[#291316] flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#D4AF37]/15 to-transparent rounded-full blur-2xl" />
          <div className="text-4xl text-[#E23744]/30 font-serif font-black">“</div>
          <p className="text-base md:text-lg font-serif italic font-semibold text-gray-950 dark:text-rose-100 leading-relaxed relative z-10">
            Every order placed with Campus Cakes represents someone's special moment. We ensure those moments remain sweet, flawless, and completely stress-free.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#D4AF37] to-amber-500 flex items-center justify-center p-[1px]">
              <div className="w-full h-full bg-white dark:bg-black rounded-full flex items-center justify-center text-[10px] font-bold text-[#D4AF37]">CC</div>
            </div>
            <div>
              <p className="text-xs font-black text-gray-900 dark:text-white">Campus Cakes Promise</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Est. 2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. FOUNDERS SPOTLIGHT */}
      <div className="bg-white dark:bg-[#120709] rounded-[36px] p-6 md:p-10 border border-gray-100 dark:border-[#291316] shadow-xl space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <Users className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">Our Leadership</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-black font-display text-gray-950 dark:text-white tracking-tight">
            Meet the Founders
          </h2>
          <p className="text-xs md:text-sm text-gray-500 dark:text-zinc-400 font-semibold max-w-xl mx-auto">
            The creative minds combining professional entrepreneurship and engineering to revolutionize campus celebrations.
          </p>
          <div className="w-24 h-[3px] bg-[#D4AF37] mx-auto mt-2 rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          {/* Founder 1: Tanisha */}
          <div className="bg-gray-50 dark:bg-[#180a0d]/40 rounded-3xl p-6 border border-gray-150/70 dark:border-[#291316] hover:border-red-500/20 transition-all group relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-rose-500/5 to-transparent rounded-full" />
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E23744]/15 to-rose-500/10 dark:from-[#E23744]/25 dark:to-transparent border border-red-500/20 flex items-center justify-center text-red-600 dark:text-rose-400 shrink-0 font-display text-2xl font-black italic">
                  T
                </div>
                <div>
                  <h4 className="text-lg font-black text-gray-950 dark:text-white leading-tight">Tanisha</h4>
                  <p className="text-[11px] text-[#E23744] dark:text-rose-400 font-black uppercase tracking-widest mt-0.5">Founder & Brand Visionary</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-zinc-300 font-medium leading-relaxed">
                Tanisha envisioned a student-first celebration brand that makes premium, customized treats and confectionery more accessible, affordable, and convenient for every occasion. Her commitment to student-centric aesthetics, flavor curation, and local premium partnerships forms the soul of our brand.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-dashed border-gray-200 dark:border-[#291316] flex items-center justify-between text-[10px] text-gray-400 font-bold">
              <span>Brand Development</span>
              <Gift className="w-4 h-4 text-rose-400" />
            </div>
          </div>

          {/* Founder 2: Saransh */}
          <div className="bg-gray-50 dark:bg-[#180a0d]/40 rounded-3xl p-6 border border-gray-150/70 dark:border-[#291316] hover:border-amber-500/20 transition-all group relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-full" />
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/15 to-[#D4AF37]/10 dark:from-amber-500/25 dark:to-transparent border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 font-display text-2xl font-black italic">
                  S
                </div>
                <div>
                  <h4 className="text-lg font-black text-gray-950 dark:text-white leading-tight">Saransh</h4>
                  <p className="text-[11px] text-[#C49A25] dark:text-amber-400 font-black uppercase tracking-widest mt-0.5">Co-Founder & Technical Architect</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-zinc-300 font-medium leading-relaxed">
                Complementing the vision, Saransh spearheaded the technology and digital innovation behind the brand by designing and developing the website, the user-friendly portal ecosystem, and the interactive chatbot that powers the online Campus Cakes experience.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-dashed border-gray-200 dark:border-[#291316] flex items-center justify-between text-[10px] text-gray-400 font-bold">
              <span>Software Engineering</span>
              <Code className="w-4 h-4 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="p-5 bg-[#FAF7F2] dark:bg-[#1a0f11] rounded-2xl border border-[#D4AF37]/15 text-center text-xs md:text-sm font-medium text-gray-700 dark:text-zinc-300 leading-relaxed">
          Together, Tanisha and Saransh combined entrepreneurship, creativity, and technology to build more than just a bakery—they created a modern, technology-driven platform where customers enjoy seamless online ordering, smart digital features, real-time tracking, and unforgettable memories.
        </div>
      </div>

      {/* 4. AIM AND VISION GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Our Aim Card */}
        <div className="bg-white dark:bg-[#120709] rounded-[32px] p-6 md:p-8 border border-gray-100 dark:border-[#291316] shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#E23744]/5 to-transparent rounded-full" />
          <div className="space-y-4">
            <div className="p-3 bg-red-50 dark:bg-red-500/10 rounded-2xl w-11 h-11 flex items-center justify-center text-[#E23744]">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black text-gray-950 dark:text-white font-display">Our Aim</h3>
            <p className="text-xs md:text-sm text-gray-500 dark:text-zinc-300 font-semibold leading-relaxed">
              Our aim is to make premium-quality cakes accessible to every student by offering affordable pricing, hassle-free online ordering, complete customization, and reliable service. We strive to simplify celebrations through innovative features, exceptional customer support, and consistently delicious products that create memorable experiences.
            </p>
          </div>
        </div>

        {/* Our Vision Card */}
        <div className="bg-white dark:bg-[#120709] rounded-[32px] p-6 md:p-8 border border-gray-100 dark:border-[#291316] shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#D4AF37]/5 to-transparent rounded-full" />
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl w-11 h-11 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black text-gray-950 dark:text-white font-display">Our Vision</h3>
            <p className="text-xs md:text-sm text-gray-500 dark:text-zinc-300 font-semibold leading-relaxed">
              Our vision is to become India's leading campus-focused cake brand by revolutionizing how students celebrate special moments. We aspire to build a technology-driven platform that connects colleges nationwide, delivers exceptional customer experiences, empowers young entrepreneurs, and becomes the first choice for every campus celebration.
            </p>
          </div>
        </div>
      </div>

      {/* 5. OUR VALUES */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-[#E23744] bg-[#E23744]/10 px-3 py-1 rounded-full">Core Pillars</span>
          <h2 className="text-2xl md:text-3xl font-black font-display text-gray-950 dark:text-white tracking-tight">
            Our Shared Values
          </h2>
          <p className="text-xs md:text-sm text-gray-500 dark:text-zinc-400 font-semibold max-w-lg mx-auto">
            At Campus Cakes, our values guide everything we do—from kitchen sanitation to UI state code.
          </p>
          <div className="w-16 h-[2px] bg-[#E23744] mx-auto mt-2 rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {values.map((v, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -4 }}
              className="bg-white dark:bg-[#120709] rounded-2xl p-5 border border-gray-100 dark:border-[#291316] shadow-sm space-y-3"
            >
              <div className="p-2.5 bg-gray-50 dark:bg-[#1a0d0f] rounded-xl w-10 h-10 flex items-center justify-center shrink-0 border border-gray-100 dark:border-[#291316]">
                {v.icon}
              </div>
              <h4 className="font-bold text-sm text-gray-950 dark:text-white">{v.title}</h4>
              <p className="text-xs text-gray-400 dark:text-zinc-400 font-medium leading-relaxed">{v.desc}</p>
            </motion.div>
          ))}
          
          {/* Custom value promo panel */}
          <div className="bg-gradient-to-br from-[#E23744] to-[#C0262D] rounded-2xl p-5 text-white flex flex-col justify-between sm:col-span-2 lg:col-span-1 shadow-lg shadow-red-500/10">
            <div>
              <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse mb-3" />
              <h4 className="font-black text-sm text-white font-display uppercase tracking-wider">A Student-First Promise</h4>
              <p className="text-[11px] text-red-100 leading-relaxed font-semibold mt-1">
                We are building the benchmark of university celebration platforms. Guaranteed fresh, highly customizable, and instantly dispatchable.
              </p>
            </div>
            <div className="text-[10px] font-black text-[#FEFAF6] uppercase tracking-wider mt-4">
              ✨ Inspiring Future Leaders
            </div>
          </div>
        </div>
      </div>

    </motion.div>
  );
}
