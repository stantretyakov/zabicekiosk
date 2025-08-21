import { useState } from 'react';
import type { Client } from '../types';
import { createPass } from '../lib/api';

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
    active: initial?.active ?? true,
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [passPlan, setPassPlan] = useState(4);
  const [passMsg, setPassMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, value, checked } = e.target;
    setValues({ ...values, [name]: type === 'checkbox' ? checked : value });
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
    body.active = values.active;
    try {
      setBusy(true);
      await onSubmit(body);
      onClose();
    } catch (e: any) {
      setError(e.message || String(e));
      setBusy(false);
    }
  };

  const handleCreatePass = async () => {
    if (!initial?.id) return;
    try {
      const res = await createPass({
        clientId: initial.id,
        planSize: passPlan,
        purchasedAt: new Date().toISOString(),
      });
      setPassMsg(`Token: ${res.rawToken}`);
    } catch (e: any) {
      setPassMsg(e.message || String(e));
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
        <label>
          Active
          <input
            type="checkbox"
            name="active"
            checked={values.active}
            onChange={handleChange}
          />
        </label>
        <div>
          <button type="submit" disabled={busy}>Save</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </div>
        {mode === 'edit' && initial?.id && (
          <div className="create-pass">
            <h3>Create pass</h3>
            <select value={passPlan} onChange={e => setPassPlan(Number(e.target.value))}>
              <option value={4}>4</option>
              <option value={8}>8</option>
            </select>
            <button type="button" onClick={handleCreatePass}>Generate</button>
            {passMsg && <p>{passMsg}</p>}
          </div>
        )}
      </form>
    </div>
  );
}
