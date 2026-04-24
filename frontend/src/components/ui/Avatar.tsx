import React from "react";

const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={`relative inline-flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100 ${className || ""}`}
    {...props}
  >
    {children}
  </div>
));
Avatar.displayName = "Avatar";

const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, ...props }, ref) => (
  <img ref={ref} className={`h-full w-full object-cover ${className || ""}`} {...props} />
));
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex h-full w-full items-center justify-center bg-gray-200 text-sm font-medium text-gray-700 ${className || ""}`}
    {...props}
  />
));
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };
