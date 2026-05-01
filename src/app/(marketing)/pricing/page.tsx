import { PagePlaceholder } from "@/components/sections/page-placeholder";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Pricing",
  description:
    "Pricing page placeholder for future Corehouse Pilates Studio offers, packages, and membership information.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <PagePlaceholder
      description="This page will present confirmed pricing and introductory offers clearly once those details are available."
      eyebrow="Pricing"
      title="Pricing placeholder"
    />
  );
}
