import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import colors from '../styles/colors';
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const Modal = ({ open, onClose, children }) => {
  if (!open) return null;

  return (
    <div 
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}
    >
      <div 
        onClick={e => e.stopPropagation()} 
        style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          maxWidth: '90%',
          width: '400px',
          position: 'relative',
          '@media (min-width: 768px)': {
            width: '500px'
          }
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            right: '10px',
            top: '10px',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '5px',
            color: '#666',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999
  },
  modal: {
    backgroundColor: colors.background.paper,
    borderRadius: '8px',
    padding: '20px',
    maxWidth: '90%',
    width: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative',
    zIndex: 100000
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