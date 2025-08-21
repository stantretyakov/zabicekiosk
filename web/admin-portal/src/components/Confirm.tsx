import { useState } from 'react';

interface Props {
  message: string;
  onOk: () => Promise<void> | void;
  onClose: () => void;
}

export default function Confirm({ message, onOk, onClose }: Props) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const handleOk = async () => {
    try {
      setBusy(true);
      await onOk();
      onClose();
    } catch (e: any) {
      setError(e.message || String(e));
      setBusy(false);
    }
  };
  return (
    <div className="modal">
      <div className="modal-body">
        <p>{message}</p>
        {error && <p className="error">{error}</p>}
        <button onClick={handleOk} disabled={busy}>
          OK
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
