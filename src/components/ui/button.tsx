import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 hover:from-indigo-500 hover:to-violet-500 hover:shadow-lg hover:shadow-indigo-500/35 hover:-translate-y-0.5",
        destructive:
          "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-500/20 hover:from-red-500 hover:to-rose-500 hover:shadow-lg hover:shadow-red-500/30 hover:-translate-y-0.5",
        outline:
          "border border-slate-200/80 bg-white/70 dark:bg-slate-900/60 dark:border-white/10 text-slate-800 dark:text-slate-200 backdrop-blur-md hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white shadow-xs hover:-translate-y-0.5",
        secondary:
          "bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-md shadow-sky-500/20 hover:from-sky-400 hover:to-cyan-400 hover:-translate-y-0.5",
        ghost:
          "text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white",
        link: "text-indigo-600 dark:text-indigo-400 underline-offset-4 hover:underline",
        glass:
          "bg-white/40 dark:bg-white/10 backdrop-blur-xl border border-white/60 dark:border-white/15 text-slate-900 dark:text-white shadow-md hover:bg-white/60 dark:hover:bg-white/20 hover:-translate-y-0.5",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-full text-xs px-3.5",
        lg: "h-12 rounded-full px-7 text-base",
        icon: "size-10 rounded-full",
        "icon-sm": "size-8 rounded-full",
        "icon-lg": "size-12 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
