import React from 'react';
import './Common.css';

function Modal({ isOpen, onClose, title, children, onConfirm, confirmText = '확인', cancelText = '취소' }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {children}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>{cancelText}</button>
          <button className="btn-confirm" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

export default Modal;
