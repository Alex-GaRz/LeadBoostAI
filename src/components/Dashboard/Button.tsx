import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'md' | 'lg';
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', icon, disabled, onClick, children, className }) => {
  const base = 'inline-flex items-center justify-center font-semibold rounded-lg focus:outline-none transition';
  const variants = {
    primary: 'bg-primary text-white hover:bg-accent',
    secondary: 'bg-secondary text-text hover:bg-card',
    danger: 'bg-error text-white hover:bg-error/80',
  };
  const sizes = {
    md: 'px-5 py-2 text-body',
    lg: 'px-6 py-3 text-body-lg',
  };
  return (
    <button
      type="button"
      className={[base, variants[variant], sizes[size], className, disabled ? 'opacity-50 cursor-not-allowed' : ''].join(' ')}
      disabled={disabled}
      onClick={onClick}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
