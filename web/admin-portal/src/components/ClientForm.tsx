import { useState, useRef, useEffect } from 'react';
import type { Client } from '../types';
import { createPass, listPasses } from '../lib/api';
import QRCodeStyling from 'qr-code-styling';
import frog from '../assets/frog.svg';

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

function PassDisplay({ token, url }: { token: string; url: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const qrCode = useRef<QRCodeStyling | null>(null);

  useEffect(() => {
    const qr = new QRCodeStyling({
      width: 200,
      height: 200,
      type: 'svg',
      data: url,
      image: frog,
      dotsOptions: { type: 'rounded' },
      cornersSquareOptions: { type: 'extra-rounded' },
      imageOptions: { margin: 4 },
    });
    if (ref.current) {
      ref.current.innerHTML = '';
      qr.append(ref.current);
      qrCode.current = qr;
    }
  }, [url]);

  const roundCorners = async (blob: Blob, radius = 20) => {
    const img = new Image();
    const u = URL.createObjectURL(blob);
    img.src = u;
    await new Promise((res, rej) => {
      img.onload = () => res(null);
      img.onerror = err => rej(err);
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    const r = radius;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(canvas.width - r, 0);
    ctx.quadraticCurveTo(canvas.width, 0, canvas.width, r);
    ctx.lineTo(canvas.width, canvas.height - r);
    ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - r, canvas.height);
    ctx.lineTo(r, canvas.height);
    ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, 0, 0);
    const rounded = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'));
    URL.revokeObjectURL(u);
    if (!rounded) throw new Error('Failed to create image');
    return rounded;
  };

  const handleShare = async () => {
    if (!qrCode.current) return;
    try {
      const raw = await qrCode.current.getRawData('png');
      const rounded = await roundCorners(raw);
      const file = new File([rounded], 'pass.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Pass QR', text: url });
      } else {
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}`, '_blank');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="pass-qr">
      <div ref={ref}></div>
      <p>
        <code>{token}</code>
      </p>
      <button type="button" onClick={handleShare}>
        Send to Telegram
      </button>
    </div>
  );
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
  const [passes, setPasses] = useState<{ id: string; token: string; url: string }[]>([]);

  useEffect(() => {
    if (mode === 'edit' && initial?.id) {
      loadPasses();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initial?.id]);

  const loadPasses = () => {
    if (!initial?.id) return;
    listPasses({ clientId: initial.id })
      .then(res => {
        const base =
          (import.meta.env.VITE_CARD_URL_BASE as string | undefined) ||
          window.location.origin + '/card';
        const ps = res.items.map(p => ({
          id: p.id,
          token: p.token!,
          url: `${base}?token=${encodeURIComponent(p.token!)}`,
        }));
        setPasses(ps);
      })
      .catch(e => setPassMsg(e.message || String(e)));
  };

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
      await createPass({
        clientId: initial.id,
        planSize: passPlan,
        purchasedAt: new Date().toISOString(),
      });
      setPassMsg('');
      loadPasses();
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
            {passMsg && <p className="error">{passMsg}</p>}
            {passes.length > 0 && (
              <div className="pass-list">
                {passes.map(p => (
                  <PassDisplay key={p.id} token={p.token} url={p.url} />
                ))}
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
