import React, { useEffect } from 'react';
import { Info, CheckCircle, AlertTriangle } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={18} className="toast-icon" />;
      case 'danger':
        return <AlertTriangle size={18} className="toast-icon" />;
      default:
        return <Info size={18} className="toast-icon" />;
    }
  };

  return (
    <div className={`toast-card ${type}`}>
      {getIcon()}
      <span>{message}</span>
    </div>
  );
}
