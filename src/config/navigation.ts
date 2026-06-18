export type NavigationItem = {
  label: string;
  href: "/" | `/${string}`;
  description: string;
};

export const primaryNavigation = [
  {
    label: "Home",
    href: "/",
    description: "Return to the corehouse Pilates Studio homepage.",
  },
  {
    label: "Classes",
    href: "/classes",
    description: "Explore reformer and mat Pilates classes.",
  },
  {
    label: "Pricing",
    href: "/pricing",
    description: "Review monthly membership pricing.",
  },
  {
    label: "Instructors",
    href: "/instructors",
    description: "Meet the corehouse teaching team.",
  },
  {
    label: "Contact",
    href: "/contact",
    description: "Phone and studio hours.",
  },
  {
    label: "FAQ",
    href: "/faq",
    description: "Practical answers before your visit.",
  },
] satisfies NavigationItem[];
