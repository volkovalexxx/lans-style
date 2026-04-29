import { useEffect, useRef } from 'react';
import { HiXMark, HiChevronLeft, HiChevronRight } from 'react-icons/hi2';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  open: boolean;
  images: string[];
  index: number;
  onChange: (index: number) => void;
  onClose: () => void;
}

export default function ImageLightbox({ open, images, index, onChange, onClose }: Props) {
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const activeThumbRef = useRef<HTMLButtonElement>(null);

  const hasMany = images.length > 1;
  const prev = () => onChange((index - 1 + images.length) % images.length);
  const next = () => onChange((index + 1) % images.length);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasMany) prev();
      if (e.key === 'ArrowRight' && hasMany) next();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hasMany, index, images.length]);

  useEffect(() => {
    if (open) activeThumbRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [index, open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-8">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#1A1A1A]/90 md:bg-[#1A1A1A]/70 md:backdrop-blur-sm"
          />

          {/* Container: fullscreen on mobile, centered popup on desktop */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full h-full md:w-auto md:h-auto md:max-w-5xl md:max-h-[90vh] md:bg-white md:rounded-2xl md:shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-[#1A1A1A] shadow-md transition-colors"
              aria-label="Close"
            >
              <HiXMark className="w-5 h-5" />
            </button>

            {/* Main image area */}
            <div
              className="relative flex-1 flex items-center justify-center overflow-hidden md:bg-[#FAFAF8]"
              onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; touchDeltaX.current = 0; }}
              onTouchMove={(e) => { touchDeltaX.current = e.touches[0].clientX - touchStartX.current; }}
              onTouchEnd={() => {
                if (!hasMany) return;
                const threshold = 50;
                if (touchDeltaX.current < -threshold) next();
                else if (touchDeltaX.current > threshold) prev();
              }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.img
                  key={index}
                  src={images[index]}
                  alt=""
                  draggable={false}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="max-w-full max-h-full w-auto h-auto object-contain select-none"
                />
              </AnimatePresence>

              {/* Arrow buttons */}
              {hasMany && (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-[#1A1A1A] shadow-md transition-all hover:scale-105"
                    aria-label="Previous"
                  >
                    <HiChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={next}
                    className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-[#1A1A1A] shadow-md transition-all hover:scale-105"
                    aria-label="Next"
                  >
                    <HiChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {hasMany && (
              <div className="bg-white/95 backdrop-blur-sm md:bg-white border-t border-[#E5E5E3] px-4 md:px-6 py-3 md:py-4">
                <div className="relative">
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-1 px-1">
                    {images.map((img, i) => {
                      const active = i === index;
                      return (
                        <button
                          key={i}
                          ref={active ? activeThumbRef : null}
                          onClick={() => onChange(i)}
                          className={`relative flex-shrink-0 snap-start rounded-lg overflow-hidden transition-all duration-200 w-14 h-16 md:w-16 md:h-20 ring-inset ${
                            active
                              ? 'ring-[3px] ring-[#C4A882]'
                              : 'opacity-60 hover:opacity-100 ring-1 ring-[#E5E5E3]'
                          }`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
                        </button>
                      );
                    })}
                  </div>
                  <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white to-transparent" />
                  <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white to-transparent" />
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
