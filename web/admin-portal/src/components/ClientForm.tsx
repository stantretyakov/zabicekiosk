import { useState } from 'react';
import type { Client } from '../types';

interface Props {
  mode: 'create' | 'edit';
  initial?: Partial<Client>;
  onSubmit: (values: Partial<Client>) => Promise<void> | void;
  onClose: () => void;
}

function normPhone(v: string) {
  const digits = v.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('381')) return '+' + digits;
  return '+381' + digits.replace(/^0+/, '');
}

export default function ClientForm({ mode, initial, onSubmit, onClose }: Props) {
  const [values, setValues] = useState({
    parentName: initial?.parentName ?? '',
    childName: initial?.childName ?? '',
    phone: initial?.phone ?? '',
    telegram: initial?.telegram ?? '',
    instagram: initial?.instagram ?? '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: any = {
      parentName: values.parentName.trim(),
      childName: values.childName.trim(),
    };
    if (!body.parentName || !body.childName) {
      setError('Parent and child names are required');
      return;
    }
    if (values.phone) body.phone = normPhone(values.phone);
    if (values.telegram) body.telegram = values.telegram.replace(/^@/, '');
    if (values.instagram) {
      let ig = values.instagram.trim();
      if (ig.startsWith('@')) ig = ig.slice(1);
      if (!/^https?:\/\//.test(ig)) ig = `https://instagram.com/${ig}`;
      body.instagram = ig;
    }
    try {
      setBusy(true);
      await onSubmit(body);
      onClose();
    } catch (e: any) {
      setError(e.message || String(e));
      setBusy(false);
    }
  };

  return (
    <div className="modal">
      <form className="modal-body" onSubmit={handleSubmit}>
        <h2>{mode === 'create' ? 'Add client' : 'Edit client'}</h2>
        {error && <p className="error">{error}</p>}
        <label>
          Parent name
          <input name="parentName" value={values.parentName} onChange={handleChange} maxLength={80} required />
        </label>
        <label>
          Child name
          <input name="childName" value={values.childName} onChange={handleChange} maxLength={80} required />
        </label>
        <label>
          Phone
          <input name="phone" value={values.phone} onChange={handleChange} />
        </label>
        <label>
          Telegram
          <input name="telegram" value={values.telegram} onChange={handleChange} />
        </label>
        <label>
          Instagram
          <input name="instagram" value={values.instagram} onChange={handleChange} />
        </label>
        <div>
          <button type="submit" disabled={busy}>Save</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
