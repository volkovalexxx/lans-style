import { useEffect, useState } from 'react';
import SmartImage from './SmartImage';

const HERO_VIDEO_HEVC = 'https://cdn.lans-style.by/static/hero-1080-hevc.mp4';
const HERO_VIDEO_AVC = 'https://cdn.lans-style.by/static/hero-1080-avc.mp4';
const HERO_DESKTOP = 'https://cdn.lans-style.by/static/hero-desktop.webp';

export default function HeroBackground() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return (
    <>
      <div className="absolute inset-0 hidden md:block" style={{ backgroundColor: '#DBDBDB' }} />

      {isMobile && (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover object-center"
        >
          <source src={HERO_VIDEO_HEVC} type='video/mp4; codecs="hvc1"' />
          <source src={HERO_VIDEO_AVC} type="video/mp4" />
        </video>
      )}

      <div className="absolute right-0 top-0 h-full hidden md:block" style={{ width: '70%' }}>
        <SmartImage
          src={HERO_DESKTOP}
          alt=""
          eager
          className="w-full h-full object-cover"
          style={{ objectPosition: '60% center' }}
        />
        <div className="absolute inset-y-0 left-0 pointer-events-none" style={{ width: '280px', background: 'linear-gradient(to right, #DBDBDB, transparent)' }} />
      </div>
    </>
  );
}
