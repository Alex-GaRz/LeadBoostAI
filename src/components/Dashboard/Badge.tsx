import React from 'react';

interface BadgeProps {
  color?: 'active' | 'paused' | 'completed' | 'default';
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const colorMap = {
  active: 'bg-badge-active text-success',
  paused: 'bg-badge-paused text-warning',
  completed: 'bg-badge-completed text-primary',
  default: 'bg-secondary text-label',
};

const Badge: React.FC<BadgeProps> = ({ color = 'default', children, icon, className }) => {
  return (
    <span className={['inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold', colorMap[color], className].join(' ')}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </span>
  );
};

export default Badge;
