type ImagePlaceholderProps = {
  className?: string;
};

export function ImagePlaceholder({ className }: ImagePlaceholderProps) {
  return (
    <div
      className={["w-full h-full bg-[#E8E2D0] rounded-2xl", className]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
