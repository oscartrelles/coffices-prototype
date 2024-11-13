import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const Modal = ({ children, onClose }) => {
  const [modalRoot, setModalRoot] = useState(null);

  useEffect(() => {
    // Find or create modal root
    let element = document.getElementById('modal-root');
    if (!element) {
      element = document.createElement('div');
      element.id = 'modal-root';
      document.body.appendChild(element);
    }
    setModalRoot(element);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!modalRoot) {
    return null;
  }

  return createPortal(
    <div 
      className="auth-modal" 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="auth-modal-content"
        style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '400px',
          position: 'relative',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
      >
        {children}
      </div>
    </div>,
    modalRoot
  );
};

export default Modal; 