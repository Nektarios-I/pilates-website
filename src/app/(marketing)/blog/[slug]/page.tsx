import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/sections/page-placeholder";
import { createPageMetadata } from "@/lib/metadata";

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;

  return createPageMetadata({
    title: "Blog Article",
    description:
      "Blog article placeholder for future Corehouse Pilates Studio educational content.",
    path: `/blog/${slug}`,
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const readableSlug = slug.replace(/-/g, " ");

  return (
    <PagePlaceholder
      description={`This placeholder is reserved for a future article entry named "${readableSlug}". Article content and metadata generation will be added in a later milestone.`}
      eyebrow="Blog article"
      nextStep={{ label: "Back to blog", href: "/blog" }}
      title="Article placeholder"
    />
  );
}
