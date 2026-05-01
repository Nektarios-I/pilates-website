import { PagePlaceholder } from "@/components/sections/page-placeholder";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Blog",
  description:
    "Blog index placeholder for future Corehouse Pilates Studio articles, updates, and educational content.",
  path: "/blog",
});

export default function BlogPage() {
  return (
    <PagePlaceholder
      description="This page will list future educational articles and studio updates. Article data and CMS integration are not part of Milestone 1."
      eyebrow="Blog"
      title="Article index placeholder"
    />
  );
}
