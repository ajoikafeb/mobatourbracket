import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-orange-500/30 bg-orange-500/20 text-orange-400",
        waiting: "border-zinc-500/30 bg-zinc-500/20 text-zinc-400",
        live: "border-red-500/30 bg-red-500/20 text-red-400",
        finished: "border-green-500/30 bg-green-500/20 text-green-400",
        upcoming: "border-blue-500/30 bg-blue-500/20 text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
