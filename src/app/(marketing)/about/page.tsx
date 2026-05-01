import { PagePlaceholder } from "@/components/sections/page-placeholder";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "About",
  description:
    "About page placeholder for the future Corehouse Pilates Studio identity, values, and studio story.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <PagePlaceholder
      description="This page will introduce the studio identity, atmosphere, and approach once final business copy is confirmed."
      eyebrow="About"
      title="Studio story placeholder"
    />
  );
}
