import React, { useState } from 'react';
import Modal from './Modal';
import { importClients, importClientsFile } from '../../lib/api';

export type ClientImportProps = {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
};

export default function ClientImport({ open, onClose, onImported }: ClientImportProps) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    try {
      setLoading(true);
      setError(null);
      if (file) {
        await importClientsFile(file);
      } else if (text.trim()) {
        const json = JSON.parse(text);
        await importClients(json);
      } else {
        setError('Provide JSON text or choose a file');
        return;
      }
      onImported();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to import');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Import Clients">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <textarea
          placeholder="Paste JSON array here"
          value={text}
          onChange={e => setText(e.target.value)}
          rows={8}
          style={{ width: '100%' }}
        />
        <div>
          <input
            type="file"
            accept="application/json"
            onChange={e => setFile(e.target.files?.[0] || null)}
          />
        </div>
        {error && (
          <div style={{ color: 'var(--error)', fontSize: '0.875rem' }}>{error}</div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
              color: 'var(--text)',
              border: 'none',
              borderRadius: 'var(--radius)',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
            }}
          >
            {loading ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
