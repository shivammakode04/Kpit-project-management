import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variants = {
      default: "bg-blue-600 text-white hover:bg-blue-700",
      secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
      destructive: "bg-red-600 text-white hover:bg-red-700",
      outline: "border border-gray-300 text-gray-900 hover:bg-gray-50",
      ghost: "text-gray-900 hover:bg-gray-100",
    };

    const sizes = {
      default: "px-4 py-2 text-sm",
      sm: "px-3 py-1 text-xs",
      lg: "px-6 py-3 text-lg",
    };

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className || ""}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
