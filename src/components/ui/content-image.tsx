import Image from 'next/image';

type ContentImageProps = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
};

export function ContentImage({
  src,
  alt,
  className,
  imageClassName,
  sizes = '(max-width: 768px) 100vw, 50vw',
  priority = false,
}: ContentImageProps) {
  return (
    <div className={['relative h-full w-full overflow-hidden', className].filter(Boolean).join(' ')}>
      <Image
        alt={alt}
        className={['object-cover', imageClassName].filter(Boolean).join(' ')}
        fill
        priority={priority}
        sizes={sizes}
        src={src}
      />
    </div>
  );
}
