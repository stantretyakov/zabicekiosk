* { box-sizing: border-box; }
html, body, #root { height: 100%; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
a { color: inherit; }
::selection { background: rgba(75, 222, 160, .25); }

/* Enhanced global styles for better UX */
.toolbar {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, var(--card), var(--panel));
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  border: 1px solid rgba(255, 255, 255, 0.1);
  flex-wrap: wrap;
}

.toolbar input,
.toolbar select {
  background: var(--panel);
  color: var(--text);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius);
  padding: 0.75rem 1rem;
  font-family: var(--font);
  font-size: 0.875rem;
  transition: all 0.3s ease;
  min-width: 120px;
}

.toolbar input:focus,
.toolbar select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 4px rgba(43, 224, 144, 0.1);
  transform: translateY(-1px);
}

.toolbar input::placeholder {
  color: var(--muted);
  font-style: italic;
}

.toolbar button.primary {
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: var(--text);
  border: none;
  border-radius: var(--radius);
  padding: 0.75rem 1.5rem;
  font-family: var(--font);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
}

.toolbar button.primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.toolbar button.primary:hover::before {
  left: 100%;
}

.toolbar button.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(43, 224, 144, 0.4);
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, var(--card), var(--panel));
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.pagination button {
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: var(--text);
  border: none;
  border-radius: var(--radius);
  padding: 0.75rem 1.5rem;
  font-family: var(--font);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  min-width: 100px;
}

.pagination button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(43, 224, 144, 0.3);
}

.pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: var(--muted);
  transform: none;
  box-shadow: none;
}

.error {
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 107, 107, 0.05));
  border: 1px solid var(--error);
  color: var(--error);
  padding: 1rem 1.5rem;
  border-radius: var(--radius);
  margin: 1rem 0;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: var(--shadow);
}

.error::before {
  content: "⚠️";
  font-size: 1.25rem;
  flex-shrink: 0;
}

/* Modal overlay improvements */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
  animation: modalBackdropEnter 0.3s ease-out;
}

@keyframes modalBackdropEnter {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(8px);
  }
}

.modal-body {
  background: linear-gradient(135deg, var(--card), var(--panel));
  border-radius: 16px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1);
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalEnter 0.3s ease-out;
  border: 1px solid rgba(43, 224, 144, 0.2);
  padding: 2rem;
}

@keyframes modalEnter {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Form styles */
.form-grid {
  display: grid;
  gap: 1.5rem;
  margin: 2rem 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text);
  margin-bottom: 0.25rem;
}

.form-input {
  background: var(--panel);
  color: var(--text);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius);
  padding: 0.875rem 1rem;
  font-family: var(--font);
  font-size: 0.875rem;
  transition: all 0.3s ease;
  width: 100%;
}

.form-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 4px rgba(43, 224, 144, 0.1);
  transform: translateY(-1px);
}

.form-input::placeholder {
  color: var(--muted);
  font-style: italic;
}

.checkbox-group {
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-weight: 500;
  user-select: none;
}

.checkbox-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  background: var(--panel);
  position: relative;
  transition: all 0.2s ease;
}

.checkbox-input:checked + .checkbox-custom {
  background: var(--accent);
  border-color: var(--accent);
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--bg);
  font-size: 12px;
  font-weight: bold;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-primary,
.btn-secondary {
  padding: 0.875rem 1.5rem;
  border-radius: var(--radius);
  font-family: var(--font);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 120px;
  justify-content: center;
}

.btn-primary {
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: var(--text);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(43, 224, 144, 0.4);
}

.btn-secondary {
  background: var(--panel);
  color: var(--muted);
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--card);
  color: var(--text);
  border-color: rgba(255, 255, 255, 0.2);
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.client-qr-section,
.passes-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text);
}

.passes-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.pass-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--panel);
  border-radius: var(--radius);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.pass-info {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 600;
}

.pass-remaining {
  color: var(--accent);
  font-size: 1.125rem;
}

.pass-separator {
  color: var(--muted);
}

.pass-total {
  color: var(--text);
  font-size: 1.125rem;
}

.pass-type {
  color: var(--muted);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.no-passes {
  text-align: center;
  padding: 2rem;
  color: var(--muted);
}

.no-passes-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.5rem;
}

.add-pass-form {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.pass-select {
  background: var(--panel);
  color: var(--text);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius);
  padding: 0.75rem 1rem;
  font-family: var(--font);
  font-size: 0.875rem;
  min-width: 80px;
}

.btn-add-pass {
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: var(--text);
  border: none;
  border-radius: var(--radius);
  padding: 0.75rem 1.5rem;
  font-family: var(--font);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-add-pass:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(43, 224, 144, 0.3);
}

/* Responsive improvements */
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
    padding: 1rem;
  }
  
  .toolbar input,
  .toolbar select,
  .toolbar button {
    width: 100%;
    min-width: auto;
  }
  
  .pagination {
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
  }
  
  .pagination button {
    width: 100%;
  }
  
  .form-actions {
    flex-direction: column-reverse;
  }
  
  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
  
  .add-pass-form {
    flex-direction: column;
    align-items: stretch;
  }
  
  .pass-select,
  .btn-add-pass {
    width: 100%;
  }
}