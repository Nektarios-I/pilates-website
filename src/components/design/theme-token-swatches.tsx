'use client';

import { useSyncExternalStore } from 'react';

import { SEMANTIC_THEME_TOKENS, THEME_TOKEN_VALUES } from '@/config/theme-tokens';

type ResolvedToken = {
  name: string;
  cssVar: string;
  value: string;
  previewClass: string;
  role: string;
};

function resolve_tokens_from_dom(): ResolvedToken[] {
  const styles = getComputedStyle(document.documentElement);

  return SEMANTIC_THEME_TOKENS.map((token) => ({
    name: token.name,
    cssVar: token.cssVar,
    value: styles.getPropertyValue(token.cssVar).trim(),
    previewClass: token.previewClass,
    role: token.role,
  }));
}

function resolve_tokens_from_config(): ResolvedToken[] {
  return SEMANTIC_THEME_TOKENS.map((token) => ({
    name: token.name,
    cssVar: token.cssVar,
    value: THEME_TOKEN_VALUES[token.cssVar] ?? '',
    previewClass: token.previewClass,
    role: token.role,
  }));
}

function subscribe() {
  return () => {};
}

export function ThemeTokenSwatches() {
  const tokens = useSyncExternalStore(subscribe, resolve_tokens_from_dom, resolve_tokens_from_config);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {tokens.map((token) => (
        <article
          key={token.name}
          className="overflow-hidden rounded-2xl border border-border bg-background"
        >
          <div className={`flex min-h-28 items-end justify-between p-4 ${token.previewClass}`}>
            <span className="text-xs font-semibold uppercase tracking-[0.2em]">{token.name}</span>
            <span className="text-xs font-medium">{token.value || '…'}</span>
          </div>
          <div className="space-y-1 border-t border-border p-4">
            <p className="font-mono text-sm font-semibold text-foreground">{token.cssVar}</p>
            <p className="text-sm text-foreground/70">{token.role}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
