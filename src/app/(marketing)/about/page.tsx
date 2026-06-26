import { ContentImage } from '@/components/ui/content-image';
import { site_images } from '@/config/site_images';
import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'About',
  description:
    'Learn about corehouse Pilates Studio — our approach, atmosphere, and commitment to precise, calm movement.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-24">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 items-center">
        <div className="md:col-span-5">
          <p className="font-sans font-semibold text-[13px] uppercase tracking-widest text-foreground opacity-80">
            About
          </p>
          <h1 className="mt-4 font-serif font-semibold text-3xl md:text-5xl leading-tight tracking-tight text-foreground">
            A calm place to practice
          </h1>
          <p className="mt-6 font-sans text-lg md:text-xl leading-relaxed text-foreground">
            corehouse is a focused Pilates studio offering reformer and mat classes with attentive
            instruction, a steady weekly schedule, and a warm, welcoming space.
          </p>
        </div>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-surface md:col-span-7">
          <ContentImage
            alt={site_images.about.studio.alt}
            sizes="(max-width: 768px) 100vw, 55vw"
            src={site_images.about.studio.src}
          />
        </div>
      </div>
    </div>
  );
}
