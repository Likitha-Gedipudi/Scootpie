import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center text-sm font-medium tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-[#2D2D2D] text-white hover:bg-[#1A1A1A] shadow-sm',
        destructive: 'bg-[#DC2626] text-white hover:bg-[#B91C1C]',
        outline: 'border border-[#E5E5E5] bg-white text-[#1A1A1A] hover:bg-[#F9F9F9]',
        secondary: 'bg-[#F9F9F9] text-[#1A1A1A] hover:bg-[#F0F0F0]',
        ghost: 'hover:bg-[#F9F9F9] hover:text-[#1A1A1A]',
        link: 'underline-offset-4 hover:underline text-[#1A1A1A]',
      },
      size: {
        default: 'h-11 py-3 px-8 rounded-full',
        sm: 'h-9 px-6 rounded-full',
        lg: 'h-13 px-10 rounded-full',
        icon: 'h-11 w-11 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
