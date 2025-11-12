import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full border border-[#E5E5E5] bg-white px-4 py-2 text-sm text-[#1A1A1A] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#999999] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2D2D2D] focus-visible:border-[#2D2D2D] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 rounded-full',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
