'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { Crown, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAvatarColor, getInitials } from '@/lib/utils/avatar';

const AvatarRoot = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn('relative inline-flex items-center justify-center flex-shrink-0', className)}
    {...props}
  />
));
AvatarRoot.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('h-full w-full rounded-full object-cover', className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & {
    style?: React.CSSProperties;
  }
>(({ className, style, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex items-center justify-center rounded-full font-semibold text-sm',
      className
    )}
    style={style}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

interface AvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarRoot> {
  /** Image source URL (optional) */
  src?: string;
  /** User name for initials fallback */
  name: string;
  /** Avatar size: xs (24px), sm (32px), md (40px), lg (56px), xl (80px) */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Show online status indicator */
  showStatus?: boolean;
  /** Show admin crown badge */
  isAdmin?: boolean;
}

const sizeMap = {
  xs: { size: 'h-6 w-6', fontSize: 'text-xs' },
  sm: { size: 'h-8 w-8', fontSize: 'text-sm' },
  md: { size: 'h-10 w-10', fontSize: 'text-sm' },
  lg: { size: 'h-14 w-14', fontSize: 'text-base' },
  xl: { size: 'h-20 w-20', fontSize: 'text-lg' },
};

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      name,
      size = 'md',
      showStatus = false,
      isAdmin = false,
      className,
      ...props
    },
    ref
  ) => {
    const colors = getAvatarColor(name);
    const initials = getInitials(name);
    const sizeClasses = sizeMap[size];

    return (
      <div ref={ref} className="relative inline-flex" {...props}>
        <AvatarRoot className={cn(sizeClasses.size, className)}>
          {src && <AvatarImage src={src} alt={name} />}
          <AvatarFallback
            style={{
              backgroundColor: colors.bg,
              color: colors.text,
            }}
            className={sizeClasses.fontSize}
          >
            {initials}
          </AvatarFallback>
        </AvatarRoot>

        {/* Admin crown badge */}
        {isAdmin && (
          <div className="absolute -top-1 -right-1">
            <div
              className={cn(
                'rounded-full bg-purple-500 p-0.5 shadow-md',
                size === 'xs' && 'hidden',
                size === 'sm' && 'h-4 w-4 flex items-center justify-center',
                size === 'md' && 'h-5 w-5 flex items-center justify-center',
                size === 'lg' && 'h-6 w-6 flex items-center justify-center',
                size === 'xl' && 'h-7 w-7 flex items-center justify-center'
              )}
            >
              <Crown
                className={cn(
                  'text-white',
                  size === 'sm' && 'h-2 w-2',
                  size === 'md' && 'h-3 w-3',
                  size === 'lg' && 'h-4 w-4',
                  size === 'xl' && 'h-5 w-5'
                )}
              />
            </div>
          </div>
        )}

        {/* Online status indicator */}
        {showStatus && (
          <div
            className={cn(
              'absolute bottom-0 right-0 rounded-full bg-green-500 border-2 border-white shadow-md',
              size === 'xs' && 'h-1.5 w-1.5',
              size === 'sm' && 'h-2 w-2',
              size === 'md' && 'h-2.5 w-2.5',
              size === 'lg' && 'h-3 w-3',
              size === 'xl' && 'h-4 w-4'
            )}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export {
  AvatarRoot,
  AvatarImage,
  AvatarFallback,
};
