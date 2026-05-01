import { PagePlaceholder } from "@/components/sections/page-placeholder";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Contact",
  description:
    "Contact page placeholder for future Corehouse Pilates Studio contact, location, and visit information.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <PagePlaceholder
      description="This page will provide contact details, visit information, and future booking direction after final studio details are confirmed."
      eyebrow="Contact"
      nextStep={{ label: "Read FAQ placeholder", href: "/faq" }}
      title="Contact placeholder"
    />
  );
}
