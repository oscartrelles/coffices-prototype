import React from 'react';
import { createPortal } from 'react-dom';
import CloseIcon from '@mui/icons-material/Close';
import { components } from '../styles';

function Modal({ open, onClose, children, title }) {
  if (!open) return null;

  return createPortal(
    <div 
      style={components.modal.overlay}
      onClick={onClose}
    >
      <div 
        style={components.modal.container}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={components.modal.closeButton}
          aria-label="Close modal"
        >
          <CloseIcon />
        </button>
        
        {title && <h2 style={components.modal.title}>{title}</h2>}
        
        <div style={components.modal.content}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default Modal; 