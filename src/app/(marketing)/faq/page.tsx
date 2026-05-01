import { PagePlaceholder } from "@/components/sections/page-placeholder";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "FAQ",
  description:
    "FAQ page placeholder for practical Pilates questions, beginner guidance, and visit preparation.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <PagePlaceholder
      description="This page will answer practical beginner and visit questions once the final studio policies are confirmed."
      eyebrow="FAQ"
      title="Frequently asked questions placeholder"
    />
  );
}
