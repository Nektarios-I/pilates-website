import { PagePlaceholder } from "@/components/sections/page-placeholder";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Home",
  description:
    "Foundation homepage placeholder for Corehouse Pilates Studio while the full homepage shell is prepared in a later milestone.",
});

export default function HomePage() {
  return (
    <PagePlaceholder
      description="This foundation route is ready for the future homepage structure. The full hero, class previews, instructor preview, trust signals, and final CTA will be implemented after Milestone 1."
      eyebrow="Milestone 1 scaffold"
      nextStep={{ label: "View classes placeholder", href: "/classes" }}
      title="Corehouse Pilates Studio"
    />
  );
}
