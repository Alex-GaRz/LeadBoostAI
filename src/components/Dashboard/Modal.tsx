import React from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, actions, className }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className={["bg-card rounded-xl shadow-lg p-8 max-w-lg w-full", className].join(' ')}>
        {title && <h2 className="text-heading-2 mb-4 font-bold text-text">{title}</h2>}
        <div>{children}</div>
        {actions && <div className="mt-6 flex gap-3 justify-end">{actions}</div>}
        <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-primary">×</button>
      </div>
    </div>
  );
};

export default Modal;
