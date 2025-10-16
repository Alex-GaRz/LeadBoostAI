import React from 'react';

interface AvatarProps {
  src: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
};

const Avatar: React.FC<AvatarProps> = ({ src, alt = '', size = 'md', className }) => {
  return (
    <img
      src={src}
      alt={alt}
      className={['rounded-full border border-border object-cover', sizeMap[size], className].join(' ')}
    />
  );
};

export default Avatar;
