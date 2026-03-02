import { useState } from 'react';
import { BRANDING } from '../constants/branding';

interface BrandLogoProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function BrandLogo({ className = '', size = 'medium' }: BrandLogoProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    small: 'h-12 w-auto',
    medium: 'h-36 w-auto md:h-44',
    large: 'h-44 w-auto md:h-56',
  };

  const fallbackSizeClasses = {
    small: 'text-2xl font-extrabold',
    medium: 'text-5xl font-extrabold md:text-6xl',
    large: 'text-6xl font-extrabold md:text-7xl',
  };

  if (imageError) {
    return (
      <div className={`flex items-center justify-center ${fallbackSizeClasses[size]} ${className}`}>
        <span className="text-primary tracking-tight">{BRANDING.appName}</span>
      </div>
    );
  }

  return (
    <img
      src={BRANDING.logo.src}
      alt={BRANDING.logo.alt}
      className={`${sizeClasses[size]} object-contain ${className}`}
      onError={() => setImageError(true)}
      loading="eager"
    />
  );
}
