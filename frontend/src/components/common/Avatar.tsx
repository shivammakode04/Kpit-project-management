import { cn, getAvatarColor, getInitials } from '@/lib/utils';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: AvatarSize;
  className?: string;
}

const sizeMap: Record<AvatarSize, string> = {
  xs: 'w-5 h-5 text-[8px]',
  sm: 'w-6 h-6 text-[9px]',
  md: 'w-8 h-8 text-[11px]',
  lg: 'w-10 h-10 text-sm',
  xl: 'w-20 h-20 text-2xl',
};

export default function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const sizeClass = sizeMap[size];
  const colorClass = getAvatarColor(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover ring-2 ring-white dark:ring-surface-800', sizeClass, className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold text-white ring-2 ring-white dark:ring-surface-800 shrink-0',
        colorClass,
        sizeClass,
        className,
      )}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}
