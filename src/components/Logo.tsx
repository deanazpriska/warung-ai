import { Store, Sparkles } from "lucide-react";

export function Logo({ size = 56 }: { size?: number }) {
  return (
    <div
      className="relative flex items-center justify-center rounded-2xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]"
      style={{ width: size, height: size }}
    >
      <Store className="text-primary-foreground" style={{ width: size * 0.5, height: size * 0.5 }} />
      <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-warning text-warning-foreground shadow-md">
        <Sparkles className="h-3.5 w-3.5" />
      </span>
    </div>
  );
}
