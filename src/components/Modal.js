import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import colors from '../styles/colors';

const Modal = ({ children, onClose }) => {
  const [modalRoot, setModalRoot] = useState(null);

  useEffect(() => {
    let element = document.getElementById('modal-root');
    if (!element) {
      element = document.createElement('div');
      element.id = 'modal-root';
      document.body.appendChild(element);
    }
    setModalRoot(element);
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
      style={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div style={styles.modal}>
        <button 
          onClick={onClose}
          style={styles.closeButton}
          aria-label="Close modal"
        >
          ×
        </button>
        <div style={styles.content}>
          {children}
        </div>
      </div>
    </div>,
    modalRoot
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(44, 62, 53, 0.6)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: '20px'
  },
  modal: {
    background: colors.background.paper,
    borderRadius: '12px',
    width: '95%',
    maxWidth: '400px',
    position: 'relative',
    boxShadow: `0 10px 25px ${colors.background.overlay}`,
    transform: 'translateY(0)',
    animation: 'modalSlideIn 0.3s ease-out',
    maxHeight: '90vh',
    overflowY: 'auto',
    '@media (min-width: 768px)': {
      width: '380px'
    }
  },
  closeButton: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '24px',
    height: '24px',
    border: 'none',
    background: 'none',
    fontSize: '24px',
    lineHeight: '24px',
    padding: 0,
    cursor: 'pointer',
    color: colors.text.secondary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s',
    ':hover': {
      color: colors.text.primary
    }
  },
  content: {
    padding: '24px',
    '@media (min-width: 768px)': {
      padding: '32px'
    }
  }
};

// Add keyframe animation to head
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(styleSheet);

export default Modal; 