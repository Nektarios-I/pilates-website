import { PagePlaceholder } from "@/components/sections/page-placeholder";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Instructors",
  description:
    "Instructors page placeholder for future Corehouse Pilates Studio teacher profiles and credentials.",
  path: "/instructors",
});

export default function InstructorsPage() {
  return (
    <PagePlaceholder
      description="This page will introduce the teaching team with confirmed bios, specialties, and credentials."
      eyebrow="Instructors"
      title="Instructor profiles placeholder"
    />
  );
}
