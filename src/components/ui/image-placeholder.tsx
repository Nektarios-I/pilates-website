type ImagePlaceholderProps = {
  className?: string;
};

export function ImagePlaceholder({ className }: ImagePlaceholderProps) {
  return (
    <div
      className={["w-full h-full bg-surface rounded-2xl", className]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
