import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-slate-900 text-white shadow hover:bg-slate-800",
        destructive: "bg-red-500 text-white shadow hover:bg-red-600",
        outline: "border border-slate-200 bg-white shadow-sm hover:bg-slate-50 text-slate-900",
        secondary: "bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-200",
        ghost: "hover:bg-slate-100 text-slate-900",
        link: "text-slate-900 underline-offset-4 hover:underline",
        emerald: "bg-emerald-500 text-white shadow hover:bg-emerald-600",
        red: "bg-red-500 text-white shadow hover:bg-red-600",
        sky: "bg-sky-500 text-white shadow hover:bg-sky-600",
        blue: "bg-blue-500 text-white shadow hover:bg-blue-600",
        violet: "bg-violet-500 text-white shadow hover:bg-violet-600",
        amber: "bg-amber-500 text-white shadow hover:bg-amber-600",
        "outline-emerald": "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300",
        "outline-red": "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300",
        "outline-violet": "border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:border-violet-300",
        "outline-sky": "border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300",
        "outline-slate": "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-lg",
        icon: "h-9 w-9",
        "icon-sm": "h-7 w-7 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
