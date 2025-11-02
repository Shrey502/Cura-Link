// src/components/ContactModal.jsx
import React from 'react';
import '../App.css'; // Use App.css for styling

function ContactModal({ title, message, onConfirm, onCancel }) {
  
  // This stops the click from bubbling up and closing the modal
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    // The "toast-backdrop" is the blurry background. We can reuse its style.
    <div className="toast-backdrop" onClick={onCancel}>
      {/* We use "modal-box" for the white popup. We already styled this. */}
      <div className="modal-box" style={{ maxWidth: '400px', textAlign: 'center', background: '#fff', color: '#333' }} onClick={handleModalClick}>
        <h3>{title}</h3>
        <p style={{ fontSize: '1rem', color: '#555' }}>{message}</p>
        <div className="modal-buttons">
          <button onClick={onCancel} className="btn-no">Cancel</button>
          <button onClick={onConfirm} className="btn-yes" style={{ background: '#007bff', border: 'none' }}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

export default ContactModal;

