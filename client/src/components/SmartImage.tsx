interface Props {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
  draggable?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export default function SmartImage({ src, alt, className, eager = false, draggable, onClick, style }: Props) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={eager ? 'high' : 'low'}
      draggable={draggable}
      onClick={onClick}
    />
  );
}
