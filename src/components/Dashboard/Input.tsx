import React from 'react';

interface InputProps {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  type?: string;
  disabled?: boolean;
  className?: string;
}

const Input: React.FC<InputProps> = ({ label, value, onChange, placeholder, error, type = 'text', disabled, className }) => {
  return (
    <div className={['flex flex-col gap-1', className].join(' ')}>
      {label && <label className="text-label text-sm font-medium mb-1">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={["bg-card border border-border rounded-lg px-4 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary", error ? 'border-error' : ''].join(' ')}
      />
      {error && <span className="text-error text-xs mt-1">{error}</span>}
    </div>
  );
};

export default Input;
