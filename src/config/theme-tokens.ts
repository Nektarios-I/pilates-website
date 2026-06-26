export type ThemeTokenDefinition = {
  name: string;
  cssVar: `--${string}`;
  previewClass: string;
  role: string;
};

export const SEMANTIC_THEME_TOKENS: readonly ThemeTokenDefinition[] = [
  {
    name: 'background',
    cssVar: '--background',
    previewClass: 'bg-background text-foreground',
    role: 'Page background',
  },
  {
    name: 'foreground',
    cssVar: '--foreground',
    previewClass: 'bg-foreground text-primary-foreground',
    role: 'Primary text',
  },
  {
    name: 'surface',
    cssVar: '--surface',
    previewClass: 'bg-surface text-foreground',
    role: 'Cards, inputs, panels',
  },
  {
    name: 'surface-2',
    cssVar: '--surface-2',
    previewClass: 'bg-surface-2 text-foreground',
    role: 'Hover states, secondary surfaces',
  },
  {
    name: 'border',
    cssVar: '--border',
    previewClass: 'bg-border text-foreground',
    role: 'Dividers and borders',
  },
  {
    name: 'primary',
    cssVar: '--primary',
    previewClass: 'bg-primary text-primary-foreground',
    role: 'Primary actions, dark bands',
  },
  {
    name: 'primary-foreground',
    cssVar: '--primary-foreground',
    previewClass: 'bg-primary-foreground text-foreground',
    role: 'Text on primary / inverse',
  },
  {
    name: 'accent',
    cssVar: '--accent',
    previewClass: 'bg-accent text-primary-foreground',
    role: 'Accent emphasis, hover fills',
  },
  {
    name: 'muted',
    cssVar: '--muted',
    previewClass: 'bg-muted text-foreground',
    role: 'Muted fills, badges',
  },
  {
    name: 'inverse',
    cssVar: '--inverse',
    previewClass: 'bg-inverse text-primary-foreground',
    role: 'Footer, testimonials, featured cards',
  },
  {
    name: 'destructive',
    cssVar: '--destructive',
    previewClass: 'bg-destructive text-destructive-foreground',
    role: 'Errors, destructive actions',
  },
  {
    name: 'destructive-surface',
    cssVar: '--destructive-surface',
    previewClass: 'bg-destructive-surface text-destructive border border-destructive-border',
    role: 'Error alert backgrounds',
  },
  {
    name: 'warning-surface',
    cssVar: '--warning-surface',
    previewClass: 'bg-warning-surface text-warning-foreground border border-warning-border',
    role: 'Warning alert backgrounds',
  },
  {
    name: 'success-surface',
    cssVar: '--success-surface',
    previewClass: 'bg-success-surface text-success',
    role: 'Success alert backgrounds',
  },
  {
    name: 'info-surface',
    cssVar: '--info-surface',
    previewClass: 'bg-info-surface text-info',
    role: 'Info alert backgrounds',
  },
] as const;

/** Keep in sync with `:root` values in src/app/globals.css */
export const THEME_TOKEN_VALUES: Record<ThemeTokenDefinition['cssVar'], string> = {
  '--background': '#f4f1e8',
  '--foreground': '#2d3a1f',
  '--surface': '#e8e2d0',
  '--surface-2': '#cdd2c9',
  '--border': '#cdd2c9',
  '--primary': '#2d3a1f',
  '--primary-foreground': '#f4f1e8',
  '--accent': '#b8a678',
  '--muted': '#e8e2d0',
  '--inverse': '#2d3a1f',
  '--destructive': '#c62828',
  '--destructive-surface': '#ffebee',
  '--destructive-border': '#fecaca',
  '--warning-surface': '#fffbeb',
  '--warning-border': '#fde68a',
  '--success-surface': '#e8f5e9',
  '--success-border': '#a5d6a7',
  '--info-surface': '#e3f2fd',
  '--info-border': '#bfdbfe',
};
