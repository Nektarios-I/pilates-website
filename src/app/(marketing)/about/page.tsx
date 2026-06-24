import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "About",
  description:
    "About page placeholder for the future Corehouse Pilates Studio identity, values, and studio story.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-24">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 items-center">
        <div className="md:col-span-5">
          <p className="font-sans font-semibold text-[13px] uppercase tracking-widest text-[#2D3A1F] opacity-80">
            About
          </p>
          <h1 className="mt-4 font-serif font-semibold text-3xl md:text-5xl leading-tight tracking-tight text-[#2D3A1F]">
            Studio story placeholder
          </h1>
          <p className="mt-6 font-sans text-lg md:text-xl leading-relaxed text-[#2D3A1F]">
            This page will introduce the studio identity, atmosphere, and approach once final
            business copy is confirmed.
          </p>
        </div>
        <div className="md:col-span-7">
          <ImagePlaceholder className="aspect-[4/3] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
