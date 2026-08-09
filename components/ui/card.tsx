"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "relative rounded-xl bg-white dark:bg-[#121214] text-gray-900 dark:text-white transition-all duration-300 ease-out overflow-hidden",
  {
    variants: {
      variant: {
        default: "border border-gray-200 dark:border-[#27272a]",
        outline: "border-2 border-gray-200 dark:border-[#27272a]",
        ghost: "border-transparent hover:bg-gray-50 dark:hover:bg-[#1f1f22]",
      },
      size: {
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

export {
  Card,
  cardVariants,
};
