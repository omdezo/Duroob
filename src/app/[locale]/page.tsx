'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useMotionValue, useSpring, useInView } from 'framer-motion';
import { ArrowRight, Sparkles, MapPin, Compass } from 'lucide-react';

/* ── 4K Oman Images Portfolio ── */
const IMG = {
  hero: '/images/oman_desert.png',
  wadi: '/images/oman_wadi.png',
  mosque: '/images/oman_mosque.png',
  mountain: '/images/oman_mountain.png',
  fort: '/images/oman_fort.png',
  coast: '/images/oman_coast.png',
  market: '/images/oman_market.png',
  culture: '/images/oman_culture.png',
};

// ── CUSTOM GLOBAL CURSOR ──
function CustomCursor({ ar }: { ar: boolean }) {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const scale = useMotionValue(1);
  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);
  const scaleSpring = useSpring(scale, springConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);
    };
    
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() === 'a' || target.tagName.toLowerCase() === 'button' || target.closest('a') || target.closest('button')) {
        scale.set(2.5);
      } else {
        scale.set(1);
      }
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);
    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [cursorX, cursorY, scale]);

  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 rounded-full border border-white/50 pointer-events-none z-[100] mix-blend-difference hidden md:flex items-center justify-center backdrop-blur-[1px]"
      style={{ x: cursorXSpring, y: cursorYSpring, scale: scaleSpring }}
    >
      <div className="w-1.5 h-1.5 bg-white rounded-full" />
    </motion.div>
  );
}

// ── PRELOADER ──
function Preloader({ ar, onComplete }: { ar: boolean, onComplete: () => void }) {
  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: '-100%' }}
      transition={{ delay: 2, duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
      onAnimationComplete={onComplete}
      className="fixed inset-0 z-[110] bg-[#0d0d0d] flex items-center justify-center"
    >
      <div className="overflow-hidden">
        <motion.h1 
          initial={{ y: '100%' }}
          animate={{ y: '0%' }}
          transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1], delay: 0.2 }}
          className="text-4xl sm:text-6xl text-[#d4a880] tracking-widest font-serif"
        >
          {ar ? 'دُروب' : 'DUROOB'}
        </motion.h1>
      </div>
    </motion.div>
  );
}

// ── TEXT REVEAL COMPONENT ──
function TextReveal({ children, className = '', delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10%' });
  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={inView ? { y: 0, opacity: 1 } : {}}
        transition={{ duration: 0.9, delay, ease: [0.33, 1, 0.68, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export default function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const ar = locale === 'ar';
  const [loaded, setLoaded] = useState(false);

  // Hero refs
  const heroRef = useRef(null);
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const clipPathHero = useTransform(heroProgress, [0, 1], ['circle(150% at 50% 50%)', 'circle(0% at 50% 50%)']);
  const heroImageScale = useTransform(heroProgress, [0, 1], [1, 1.3]);
  const heroTextY = useTransform(heroProgress, [0, 1], ['0%', '100%']);
  const heroOpacity = useTransform(heroProgress, [0, 0.6], [1, 0]);

  // Horizontal Scroll refs
  const horizContainerRef = useRef(null);
  const { scrollYProgress: horizProgress } = useScroll({ target: horizContainerRef, offset: ['start start', 'end end'] });
  const x = useTransform(horizProgress, [0, 1], ['0%', ar ? '60%' : '-60%']);

  // 3D Card Planner
  const plannerRef = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springRotateX = useSpring(rotateX, { damping: 30, stiffness: 200 });
  const springRotateY = useSpring(rotateY, { damping: 30, stiffness: 200 });

  const handlePlannerMove = (e: React.MouseEvent) => {
    if (!plannerRef.current) return;
    const rect = plannerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const dampen = 20; // Max rotation angle
    const rX = ((mouseY / height) - 0.5) * -dampen;
    const rY = ((mouseX / width) - 0.5) * dampen;
    
    rotateX.set(rX);
    rotateY.set(rY);
  };
  const handlePlannerLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  // Image Grid Magnetic refs
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const gridMouseX = useMotionValue(0);
  const gridMouseY = useMotionValue(0);
  const rx = useSpring(gridMouseX, { damping: 40, stiffness: 150 });
  const ry = useSpring(gridMouseY, { damping: 40, stiffness: 150 });

  const handleGridMove = (e: React.MouseEvent) => {
    if (!gridContainerRef.current) return;
    const { left, top, width, height } = gridContainerRef.current.getBoundingClientRect();
    gridMouseX.set((e.clientX - left - width / 2) * 0.05); // Subtle movement factor
    gridMouseY.set((e.clientY - top - height / 2) * 0.05);
  };
  const handleGridLeave = () => {
    gridMouseX.set(0);
    gridMouseY.set(0);
  };

  return (
    <div className="bg-[#0b0b0b] text-[#f5f5f5] min-h-screen selection:bg-[#d4a880]/30 selection:text-white" dir={ar ? 'rtl' : 'ltr'}>
      <Preloader ar={ar} onComplete={() => setLoaded(true)} />
      <CustomCursor ar={ar} />

      {/* =========================================
                      1. HERO SECTION (CINEMATIC)
          ========================================= */}
      <section ref={heroRef} className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        {/* Background 4K Image that zooms out */}
        <motion.div style={{ scale: heroImageScale, clipPath: clipPathHero }} className="absolute inset-0 z-0 origin-center">
          <img src={IMG.hero} alt="Oman Desert 4K" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30" /> {/* Dimmer */}
        </motion.div>

        {/* Floating Hero Text */}
        <motion.div style={{ y: heroTextY, opacity: heroOpacity }} className="relative z-10 flex flex-col items-center justify-center text-center px-4 mix-blend-plus-lighter">
          <div className="overflow-hidden mb-6">
            <motion.p 
              initial={{ y: '100%' }} animate={loaded ? { y: 0 } : {}} transition={{ delay: 0.2, duration: 1 }}
              className="text-xs sm:text-sm uppercase tracking-[0.6em] text-[#d4a880]" style={{ fontFamily: 'system-ui, sans-serif' }}>
              {ar ? 'اكتشف جوهر الجمال' : 'Discover True Beauty'}
            </motion.p>
          </div>
          <div className="overflow-visible py-4">
            <motion.h1
              initial={{ y: '100%', rotate: 2, opacity: 0 }} animate={loaded ? { y: 0, rotate: 0, opacity: 1 } : {}} transition={{ delay: 0.4, duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
              className="text-[clamp(4rem,10vw,12rem)] font-light leading-[1] tracking-tight antialiased" style={{ fontFamily: ar ? "'Amiri', serif" : "'Playfair Display', serif" }}>
              {ar ? 'عُـــمــان' : 'O M A N'}
            </motion.h1>
          </div>
          <motion.div 
            initial={{ opacity: 0 }} animate={loaded ? { opacity: 1 } : {}} transition={{ delay: 1.5, duration: 1 }}
            className="absolute -bottom-32 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
            <span className="text-[10px] uppercase tracking-widest text-white/50">{ar ? 'مرر للأسفل' : 'Scroll Down'}</span>
            <motion.div animate={{ height: ['0%', '100%', '0%'], top: ['0%', '0%', '100%'] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} className="w-[1px] h-16 bg-white/30 relative overflow-hidden">
               <motion.div className="absolute top-0 left-0 w-full h-full bg-white" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* =========================================
                      2. INTRODUCTION / PHILOSOPHY
          ========================================= */}
      <section className="py-32 md:py-48 px-6 lg:px-24 bg-[#0b0b0b] relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Main value prop */}
          <div className="text-center mb-20">
            <TextReveal>
              <p className="text-[#d4a880] text-xs uppercase tracking-[0.3em] mb-6" style={{ fontFamily: 'system-ui, sans-serif' }}>
                {ar ? 'ما هو دُروب؟' : 'What is Duroob?'}
              </p>
            </TextReveal>
            <TextReveal delay={0.1}>
              <h2 className="text-[clamp(1.8rem,3.5vw,3.5rem)] font-light leading-[1.3] text-white/90 max-w-4xl mx-auto">
                {ar ? (
                  <>منصة سياحية ذكية تبني لك <span className="italic text-[#d4a880]">خطة رحلة مثالية</span> في عُمان — مدعومة بالخوارزميات والذكاء الاصطناعي.</>
                ) : (
                  <>A smart platform that builds your <span className="italic text-[#d4a880]">perfect trip plan</span> in Oman — powered by algorithms and AI.</>
                )}
              </h2>
            </TextReveal>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                num: '01',
                titleEn: 'AI Trip Planner',
                titleAr: 'مخطط رحلات ذكي',
                descEn: 'Tell us your days, budget, and interests. Our algorithm analyzes 30+ destinations across 6 regions to build your ideal itinerary — minute by minute.',
                descAr: 'أخبرنا بعدد الأيام والميزانية واهتماماتك. خوارزميتنا تحلل أكثر من 30 وجهة عبر 6 مناطق لبناء خطة مثالية — دقيقة بدقيقة.',
              },
              {
                num: '02',
                titleEn: 'Smart Chat Assistant',
                titleAr: 'مساعد محادثة ذكي',
                descEn: 'Just type "3 days in Muscat" and our AI understands. It speaks Arabic and English, remembers context, and builds plans conversationally.',
                descAr: 'فقط اكتب "3 أيام في مسقط" والذكاء الاصطناعي يفهم. يتحدث العربية والإنجليزية، يتذكر السياق، ويبني خططاً تفاعلية.',
              },
              {
                num: '03',
                titleEn: 'Safety & Cost Scores',
                titleAr: 'تقييم السلامة والتكلفة',
                descEn: 'Every plan gets safety, enjoyment, and cost efficiency scores. Compare 3 budget tiers side by side to find the best value.',
                descAr: 'كل خطة تحصل على تقييم للسلامة والمتعة وكفاءة التكلفة. قارن 3 مستويات ميزانية جنباً إلى جنب لإيجاد أفضل قيمة.',
              },
            ].map((f, i) => (
              <TextReveal key={f.num} delay={i * 0.15}>
                <div>
                  <span className="text-[#d4a880] text-sm font-mono mb-4 block" style={{ fontFamily: 'system-ui, sans-serif' }}>{f.num}</span>
                  <h3 className="text-xl text-white/90 font-normal mb-3">{ar ? f.titleAr : f.titleEn}</h3>
                  <p className="text-white/40 text-sm leading-relaxed" style={{ fontFamily: 'system-ui, sans-serif' }}>{ar ? f.descAr : f.descEn}</p>
                </div>
              </TextReveal>
            ))}
          </div>

          {/* Stats bar */}
          <TextReveal delay={0.4}>
            <div className="mt-20 flex items-center justify-center gap-12 md:gap-20 text-center" style={{ fontFamily: 'system-ui, sans-serif' }}>
              {[
                { n: '30+', lEn: 'Destinations', lAr: 'وجهة' },
                { n: '6', lEn: 'Regions', lAr: 'مناطق' },
                { n: '2', lEn: 'Languages', lAr: 'لغتين' },
                { n: '∞', lEn: 'Plans', lAr: 'خطط' },
              ].map(s => (
                <div key={s.lEn}>
                  <p className="text-2xl md:text-3xl font-bold text-[#d4a880]">{s.n}</p>
                  <p className="text-xs text-white/30 mt-1 uppercase tracking-wider">{ar ? s.lAr : s.lEn}</p>
                </div>
              ))}
            </div>
          </TextReveal>
        </div>
      </section>

      {/* =========================================
                      3. HORIZONTAL SCROLL REGIONS
          ========================================= */}
      <section ref={horizContainerRef} className="h-[400vh] relative bg-[#0b0b0b] z-10">
        <div className="sticky top-0 h-screen flex items-center">

          {/* Section Title Overlay — outside overflow container */}
          <div className={`absolute top-12 md:top-24 ${ar ? 'right-6 md:right-24' : 'left-6 md:left-24'} z-20`}>
            <TextReveal>
              <h3 className="text-4xl md:text-7xl font-light leading-tight">
                {ar ? 'وجهات' : 'Destinations'} <br/>
                <span className="italic text-[#d4a880]">{ar ? 'لا تُنسى' : 'Unforgettable'}</span>
              </h3>
            </TextReveal>
          </div>

          <div className="absolute inset-0 overflow-hidden">
          <motion.div style={{ x }} className="flex gap-12 md:gap-24 px-[20vw] items-center pt-24 h-full">
            {[
              { id: 1, title: ar ? 'مسقط' : 'Muscat', tag: ar ? 'تراث وحداثة' : 'Heritage & Modernity', img: IMG.mosque },
              { id: 2, title: ar ? 'وادي شاب' : 'Wadi Shab', tag: ar ? 'مغامرة طبيعية' : 'Natural Adventure', img: IMG.wadi },
              { id: 3, title: ar ? 'الجبل الأخضر' : 'Jebel Akhdar', tag: ar ? 'ملاذ جبلي' : 'Mountain Retreat', img: IMG.mountain },
              { id: 4, title: ar ? 'ظفار' : 'Dhofar', tag: ar ? 'سحر الخريف' : 'Khareef Magic', img: IMG.coast },
              { id: 5, title: ar ? 'نزوى' : 'Nizwa', tag: ar ? 'عبق التاريخ' : 'Scent of History', img: IMG.fort },
            ].map((region, idx) => (
              <div key={region.id} className="relative w-[85vw] md:w-[45vw] h-[60vh] md:h-[70vh] shrink-0 group">
                <div className="w-full h-full overflow-hidden rounded-sm relative">
                  {/* Internal Parallax Image */}
                  <motion.img 
                    src={region.img} alt={region.title}
                    className="w-full h-[120%] object-cover absolute top-0 -translate-y-[10%]"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                </div>
                {/* Text Content */}
                <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end">
                  <div className="text-white">
                    <p className="text-[#d4a880] text-xs uppercase tracking-widest mb-2" style={{ fontFamily: 'system-ui, sans-serif' }}>0{idx+1} — {region.tag}</p>
                    <h4 className="text-4xl md:text-6xl font-light">{region.title}</h4>
                  </div>
                  <Link href={`/${locale}/destinations`} className="w-16 h-16 rounded-full border border-white/30 flex items-center justify-center backdrop-blur-md hover:bg-white hover:text-black transition-colors duration-500">
                    <ArrowRight className={ar ? 'rotate-180' : ''} />
                  </Link>
                </div>
              </div>
            ))}
          </motion.div>
          </div>
        </div>
      </section>

      {/* =========================================
                      4. INTERACTIVE 3D PLANNER
          ========================================= */}
      <section className="py-32 md:py-48 px-6 lg:px-24 bg-[#0a0a0a] min-h-screen flex items-center relative overflow-hidden z-10" onMouseMove={handlePlannerMove} onMouseLeave={handlePlannerLeave}>
        {/* Abstract Background Elements */}
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 150, repeat: Infinity, ease: 'linear' }} 
          className="absolute -top-[20%] -right-[10%] w-[60vw] h-[60vw] border border-[#d4a880]/10 rounded-full border-dashed opacity-50 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center w-full">
          <div>
            <div className="flex items-center gap-3 text-[#d4a880] mb-8">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm uppercase tracking-widest" style={{ fontFamily: 'system-ui, sans-serif' }}>{ar ? 'صانع الرحلات الذكي' : 'AI Trip Planner'}</span>
            </div>
            <TextReveal>
              <h2 className="text-5xl md:text-7xl font-light leading-tight mb-8">
                {ar ? 'خطط لرحلتك' : 'Plan Your Trip'} <br/>
                <span className="italic text-[#d4a880]">{ar ? 'بذكاء اصطناعي' : 'With AI'}</span>
              </h2>
            </TextReveal>
            <TextReveal delay={0.2}>
              <p className="text-white/40 text-lg md:text-xl font-light mb-12" style={{ fontFamily: 'system-ui, sans-serif' }}>
                 {ar 
                  ? 'دع خوارزمياتنا تبني لك جدولاً مخصصاً بالدقيقة. من حجز الفنادق الموثوقة إلى تحديد أفضل المطاعم والأماكن السياحية.'
                  : 'Let our algorithms build a minute-by-minute custom itinerary. From trusted hotels to the best restaurants and sights.'}
              </p>
            </TextReveal>
            <TextReveal delay={0.3}>
              <div className="flex flex-col sm:flex-row gap-4" style={{ fontFamily: 'system-ui, sans-serif' }}>
                <Link href={`/${locale}/planner`} className="px-8 py-4 bg-[#d4a880] text-black font-medium tracking-wide uppercase text-sm hover:bg-white transition-colors duration-500 text-center">
                  {ar ? 'ابدأ التخطيط الآن' : 'Start Planning Now'}
                </Link>
                <Link href={`/${locale}/chat`} className="px-8 py-4 border border-white/20 text-white font-medium tracking-wide uppercase text-sm hover:bg-white/10 transition-colors duration-500 text-center flex items-center justify-center gap-2">
                  <Sparkles size={16} /> {ar ? 'المساعد الذكي' : 'AI Assistant'}
                </Link>
              </div>
            </TextReveal>
          </div>

          {/* 3D Floating UI Card */}
          <div className="relative h-[600px] w-full [perspective:1000px] flex items-center justify-center">
            <motion.div 
              ref={plannerRef}
              style={{ rotateX: springRotateX, rotateY: springRotateY }}
              className="w-full max-w-md h-[500px] bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4a880] rounded-full mix-blend-screen filter blur-[80px] opacity-20" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#d4a880] rounded-full mix-blend-screen filter blur-[80px] opacity-20" />
              
              {/* Mock UI Elements matching planner setup */}
              <div className="space-y-6 relative z-10" style={{ fontFamily: 'system-ui, sans-serif' }}>
                <div className="w-full h-12 bg-white/5 rounded-lg border border-white/10 flex items-center px-4 gap-3 text-white/50 text-sm">
                  <MapPin size={16} /> {ar ? 'ما هي وجهتك؟ (مثال: صلالة)' : 'Where to? (e.g., Salalah)'}
                </div>
                <div className="flex gap-4">
                  <div className="w-1/2 h-12 bg-white/5 rounded-lg border border-white/10 flex items-center px-4 text-white/50 text-sm">
                    {ar ? 'تاريخ الوصول' : 'Arrival'}
                  </div>
                  <div className="w-1/2 h-12 bg-white/5 rounded-lg border border-white/10 flex items-center px-4 text-white/50 text-sm">
                     {ar ? 'تاريخ المغادرة' : 'Departure'}
                  </div>
                </div>
                
                <div className="pt-6 mt-6 border-t border-white/10">
                  <p className="text-sm text-white/70 mb-4">{ar ? 'الاهتمامات:' : 'Interests:'}</p>
                  <div className="flex flex-wrap gap-2">
                    {[ar?'طبيعة':'Nature', ar?'تاريخ':'History', ar?'ثقافة':'Culture', ar?'مغامرة':'Adventure'].map(tag => (
                      <span key={tag} className="px-4 py-2 rounded-full border border-white/20 text-xs text-white/60 bg-white/5">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-8 w-full h-12 bg-[#d4a880]/20 text-[#d4a880] rounded-lg border border-[#d4a880]/30 flex items-center justify-center cursor-pointer hover:bg-[#d4a880]/30 transition">
                  {ar ? 'توليد خطة ذكية ✦' : 'Generate Smart Plan ✦'}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =========================================
                      5. MAGNETIC IMAGE GALLERY
          ========================================= */}
      <section className="py-24 md:py-48 px-6 bg-[#0b0b0b] overflow-hidden z-10 relative">
        <div className="text-center mb-24">
          <TextReveal><h2 className="text-3xl md:text-5xl font-light italic text-[#d4a880]">{ar ? 'جمال بلا حدود' : 'Boundless Beauty'}</h2></TextReveal>
        </div>

        <div ref={gridContainerRef} onMouseMove={handleGridMove} onMouseLeave={handleGridLeave} className="max-w-[1400px] mx-auto h-[80vh] md:h-[100vh] relative">
          
          {/* Main Center Image */}
          <motion.div style={{ x: rx, y: ry }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] md:w-[40%] h-[50%] md:h-[60%] z-20">
            <img src={IMG.hero} alt="Gallery 1" className="w-full h-full object-cover rounded-sm shadow-2xl grayscale-[20%] hover:grayscale-0 transition-all duration-700" />
          </motion.div>

          {/* Orbiting Images */}
          <motion.div style={{ x: useTransform(rx, v => v * -1.5), y: useTransform(ry, v => v * -1.5) }} className="absolute top-[10%] left-[5%] md:left-[15%] w-[35%] md:w-[20%] h-[30%] md:h-[35%] z-10">
            <img src={IMG.market} alt="Gallery 2" className="w-full h-full object-cover rounded-sm shadow-xl" />
          </motion.div>

          <motion.div style={{ x: useTransform(rx, v => v * 1.8), y: useTransform(ry, v => v * 1.2) }} className="absolute bottom-[5%] right-[5%] md:right-[15%] w-[40%] md:w-[25%] h-[25%] md:h-[35%] z-30">
            <img src={IMG.culture} alt="Gallery 3" className="w-full h-full object-cover rounded-sm shadow-xl" />
          </motion.div>

          <motion.div style={{ x: useTransform(rx, v => v * 1.2), y: useTransform(ry, v => v * -2) }} className="absolute top-[5%] right-[2%] md:right-[10%] w-[30%] md:w-[15%] h-[25%] md:h-[30%] z-10 hidden sm:block">
             <img src={IMG.wadi} alt="Gallery 4" className="w-full h-full object-cover rounded-sm shadow-xl grayscale-[40%]" />
          </motion.div>

          <motion.div style={{ x: useTransform(rx, v => v * -2), y: useTransform(ry, v => v * 1.5) }} className="absolute bottom-[10%] left-[2%] md:left-[10%] w-[25%] md:w-[18%] h-[20%] md:h-[25%] z-30 hidden md:block">
             <img src={IMG.fort} alt="Gallery 5" className="w-full h-full object-cover rounded-sm shadow-xl grayscale-[40%]" />
          </motion.div>
        </div>
      </section>

      {/* =========================================
                      6. PARALLAX FOOTER / CTA
          ========================================= */}
      <section className="h-[80vh] bg-[#000] relative z-0 flex items-center justify-center overflow-hidden">
        {/* Background dark 4K */}
        <div className="absolute inset-0 opacity-40">
           <img src={IMG.mosque} alt="Footer BG" className="w-full h-full object-cover filter blur-[2px]" />
           <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/30" />
        </div>
        
        <div className="relative z-10 text-center px-4 flex flex-col items-center">
           <TextReveal>
             <h2 className="text-[clamp(3rem,8vw,10rem)] font-light tracking-tight text-white/90">
               {ar ? 'دُروب بانتظارك' : 'DUROOB AWAITS'}
             </h2>
           </TextReveal>
           <TextReveal delay={0.2}>
             <p className="mt-6 text-[#d4a880] text-lg uppercase tracking-[0.4em]" style={{ fontFamily: 'system-ui, sans-serif' }}>
               {ar ? 'دعنا نصنع ذكرياتك' : 'Let\'s create memories'}
             </p>
           </TextReveal>
           
           <motion.div initial={{ opacity:0, y:50 }} whileInView={{ opacity:1, y:0 }} transition={{ delay: 0.5, duration: 1 }} viewport={{ once:true }} className="mt-16">
             <Link href={`/${locale}/planner`} className="w-32 h-32 md:w-48 md:h-48 rounded-full border border-white/30 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-700 text-sm md:text-base tracking-widest uppercase">
               {ar ? 'ابدأ' : 'Begin'}
             </Link>
           </motion.div>
        </div>

        {/* Real Footer bottom text */}
        <div className="absolute bottom-6 w-full text-center flex flex-col sm:flex-row justify-between px-12 text-white/30 text-xs tracking-widest uppercase" style={{ fontFamily: 'system-ui, sans-serif' }}>
           <span>{ar ? 'دُروب — السياحة الذكية' : 'DUROOB — SMART TOURISM'}</span>
           <span>© 2026 {ar ? 'جميع الحقوق محفوظة' : 'ALL RIGHTS RESERVED'}</span>
        </div>
      </section>

    </div>
  );
}
