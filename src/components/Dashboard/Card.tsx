import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  shadow?: boolean;
  padding?: string;
}

const Card: React.FC<CardProps> = ({ children, className, shadow = true, padding = 'p-6' }) => {
  return (
    <div className={['bg-card rounded-xl', shadow ? 'shadow' : '', padding, className].join(' ')}>
      {children}
    </div>
  );
};

export default Card;
