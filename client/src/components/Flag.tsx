import { HiOutlineGlobeAlt } from 'react-icons/hi2';

type FlagCode = 'by' | 'ru' | 'world';

interface Props {
  code: FlagCode;
  className?: string;
}

export default function Flag({ code, className = 'w-6 h-6' }: Props) {
  const shared = `${className} rounded-full overflow-hidden inline-block shadow-sm ring-1 ring-black/5`;

  if (code === 'by') {
    return (
      <span className={shared} aria-label="Belarus">
        <svg viewBox="0 0 60 60" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <rect width="60" height="40" fill="#C8313E" />
          <rect y="40" width="60" height="20" fill="#4AA657" />
          <rect width="6" height="60" fill="#FFFFFF" />
          <g fill="#C8313E">
            <rect x="0.7" y="2" width="1" height="2" />
            <rect x="2.5" y="2" width="1" height="2" />
            <rect x="4.3" y="2" width="1" height="2" />
            <rect x="0.7" y="6" width="1" height="2" />
            <rect x="2.5" y="6" width="1" height="2" />
            <rect x="4.3" y="6" width="1" height="2" />
            <rect x="1.6" y="10" width="1" height="2" />
            <rect x="3.4" y="10" width="1" height="2" />
            <rect x="0.7" y="14" width="1" height="2" />
            <rect x="2.5" y="14" width="1" height="2" />
            <rect x="4.3" y="14" width="1" height="2" />
            <rect x="1.6" y="18" width="1" height="2" />
            <rect x="3.4" y="18" width="1" height="2" />
            <rect x="0.7" y="22" width="1" height="2" />
            <rect x="2.5" y="22" width="1" height="2" />
            <rect x="4.3" y="22" width="1" height="2" />
            <rect x="1.6" y="26" width="1" height="2" />
            <rect x="3.4" y="26" width="1" height="2" />
            <rect x="0.7" y="30" width="1" height="2" />
            <rect x="2.5" y="30" width="1" height="2" />
            <rect x="4.3" y="30" width="1" height="2" />
            <rect x="1.6" y="34" width="1" height="2" />
            <rect x="3.4" y="34" width="1" height="2" />
            <rect x="0.7" y="38" width="1" height="2" />
            <rect x="2.5" y="38" width="1" height="2" />
            <rect x="4.3" y="38" width="1" height="2" />
            <rect x="1.6" y="42" width="1" height="2" />
            <rect x="3.4" y="42" width="1" height="2" />
            <rect x="0.7" y="46" width="1" height="2" />
            <rect x="2.5" y="46" width="1" height="2" />
            <rect x="4.3" y="46" width="1" height="2" />
            <rect x="1.6" y="50" width="1" height="2" />
            <rect x="3.4" y="50" width="1" height="2" />
            <rect x="0.7" y="54" width="1" height="2" />
            <rect x="2.5" y="54" width="1" height="2" />
            <rect x="4.3" y="54" width="1" height="2" />
          </g>
        </svg>
      </span>
    );
  }

  if (code === 'ru') {
    return (
      <span className={shared} aria-label="Russia">
        <svg viewBox="0 0 60 60" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <rect width="60" height="20" fill="#FFFFFF" />
          <rect y="20" width="60" height="20" fill="#0039A6" />
          <rect y="40" width="60" height="20" fill="#D52B1E" />
        </svg>
      </span>
    );
  }

  // world
  return (
    <span className={`${className} inline-flex items-center justify-center rounded-full bg-[#F5F0EB] text-[#C4A882]`} aria-label="World">
      <HiOutlineGlobeAlt className="w-[70%] h-[70%]" />
    </span>
  );
}
