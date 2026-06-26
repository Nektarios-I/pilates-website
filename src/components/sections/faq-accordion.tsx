"use client";

import { useState } from "react";

type FaqItem = {
  question: string;
  answer: string;
};

type FaqAccordionProps = {
  items: readonly FaqItem[];
};

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [open_index, set_open_index] = useState<number | null>(null);

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col border-t border-border">
      {items.map((item, index) => {
        const is_open = open_index === index;

        return (
          <div key={item.question} className="border-b border-border py-6 cursor-pointer group">
            <button
              aria-expanded={is_open}
              className="w-full min-h-11 text-left"
              type="button"
              onClick={() => set_open_index(is_open ? null : index)}
            >
              <div className="flex justify-between items-center gap-4">
                <span className="font-serif font-medium text-xl md:text-2xl leading-normal text-foreground group-hover:text-accent transition-colors">
                  {item.question}
                </span>
                <svg
                  aria-hidden="true"
                  className={[
                    "w-6 h-6 shrink-0 text-foreground transition-transform duration-300",
                    is_open ? "rotate-45" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
            </button>
            {is_open ? (
              <p className="font-sans text-[17px] leading-relaxed tracking-[0.01em] text-foreground opacity-80 pt-4">
                {item.answer}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
