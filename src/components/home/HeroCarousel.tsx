import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { HERO_SLIDES } from "@/data/categories";
import { AnimatePresence, motion } from "framer-motion";

export function HeroCarousel() {
  const [i, setI] = useState(0);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % HERO_SLIDES.length), 5500);
    return () => clearInterval(t);
  }, []);
  // Preload all slide images so transitions feel instant after the first paint
  useEffect(() => {
    HERO_SLIDES.forEach((slide, idx) => {
      const img = new Image();
      img.src = slide.image;
      img.onload = () => setLoaded((p) => (p[idx] ? p : { ...p, [idx]: true }));
    });
  }, []);
  const s = HERO_SLIDES[i];
  const isLoaded = loaded[i];
  return (
    <div className="relative overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-sm md:bg-[#111827]">
      {/* MOBILE: stacked image + text card */}
      <div className="md:hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`m-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="relative h-[220px] w-full overflow-hidden bg-[#111827]">
              {!isLoaded && (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#1f2937] via-[#374151] to-[#1f2937]" />
              )}
              <img
                src={s.image}
                alt={s.headline}
                onLoad={() => setLoaded((p) => ({ ...p, [i]: true }))}
                style={{ objectPosition: "center 40%" }}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                  isLoaded ? "opacity-100" : "opacity-0"
                }`}
              />
            </div>
            <div className="bg-white p-4">
              <p className="inline-block rounded-full bg-[#F0F9F4] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-primary-dark">
                {s.eyebrow}
              </p>
              <h1 className="mt-2 line-clamp-2 text-[22px] font-bold leading-tight tracking-tight text-[#111827]">
                {s.headline}
              </h1>
              <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-[#6B7280]">
                {s.subtext}
              </p>
              <Link
                to={s.href}
                className="mt-3 inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
              >
                {s.cta}
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* DESKTOP: overlay layout */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`d-${i}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="relative hidden h-[480px] w-full md:block"
        >
          {/* Skeleton shimmer while image loads */}
          {!isLoaded && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#1f2937] via-[#374151] to-[#1f2937]" />
          )}
          <img
            src={s.image}
            alt={s.headline}
            onLoad={() => setLoaded((p) => ({ ...p, [i]: true }))}
            style={{ objectPosition: "center 40%" }}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
          <div
            className={`absolute inset-0 bg-gradient-to-r from-[#1B3A6B]/85 via-[#1B3A6B]/60 to-transparent transition-opacity duration-700 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
          <div className="relative z-10 flex h-full max-w-7xl items-center px-6 md:px-12">
            <div
              className={`max-w-xl text-white transition-all duration-500 ${
                isLoaded ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
              }`}
            >
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#86EFAC]">{s.eyebrow}</p>
              <h1 className="mt-2 line-clamp-2 text-[40px] font-bold leading-tight tracking-tight">{s.headline}</h1>
              <p className="mt-3 line-clamp-2 text-base text-white/90">{s.subtext}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to={s.href}
                  className="inline-flex items-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
                >
                  {s.cta}
                </Link>
                <Link
                  to="/prescriptions"
                  className="inline-flex items-center rounded-md border border-white/80 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white hover:text-primary"
                >
                  Upload a Prescription
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}