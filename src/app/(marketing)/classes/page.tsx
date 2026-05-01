import { PagePlaceholder } from "@/components/sections/page-placeholder";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Classes",
  description:
    "Classes page placeholder for future Pilates class types, service categories, and beginner guidance.",
  path: "/classes",
});

export default function ClassesPage() {
  return (
    <PagePlaceholder
      description="This page will outline class types and help visitors understand where to start. Real schedules and booking details are intentionally out of scope for this milestone."
      eyebrow="Classes"
      title="Class overview placeholder"
    />
  );
}
