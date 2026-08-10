import { cn } from "@/lib/utils";

/**
 * Base skeleton primitive with a smooth left-to-right shimmer effect.
 * Colors are driven by the app theme tokens (`--muted`, `--muted-foreground`)
 * so skeletons stay consistent in both light and dark mode.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("sk-shimmer rounded-md bg-muted", className)} {...props} />;
}

export { Skeleton };