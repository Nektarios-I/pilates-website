export type NavigationItem = {
  label: string;
  href: "/" | `/${string}`;
  description: string;
};

export const primaryNavigation = [
  {
    label: "Home",
    href: "/",
    description: "Return to the Corehouse Pilates Studio homepage.",
  },
  {
    label: "About",
    href: "/about",
    description: "Learn about the studio identity and approach.",
  },
  {
    label: "Classes",
    href: "/classes",
    description: "Explore planned Pilates classes and services.",
  },
  {
    label: "Pricing",
    href: "/pricing",
    description: "Review future pricing and introductory offer information.",
  },
  {
    label: "Instructors",
    href: "/instructors",
    description: "Meet the future Corehouse teaching team.",
  },
  {
    label: "Contact",
    href: "/contact",
    description: "Find the simplest way to contact the studio.",
  },
  {
    label: "FAQ",
    href: "/faq",
    description: "Read practical answers for new and returning visitors.",
  },
  {
    label: "Blog",
    href: "/blog",
    description: "Visit the future article and studio update index.",
  },
] satisfies NavigationItem[];
