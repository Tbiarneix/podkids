import React, { createContext, useContext, useState } from 'react';
import { Toast } from '../components/Toast';

type ToastType = 'success' | 'error';

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('success');

  const showToast = (message: string, type: ToastType) => {
    setMessage(message);
    setType(type);
    setVisible(true);
  };

  const handleHide = () => {
    setVisible(false);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast
        visible={visible}
        message={message}
        type={type}
        onHide={handleHide}
      />
    </ToastContext.Provider>
  );
};
