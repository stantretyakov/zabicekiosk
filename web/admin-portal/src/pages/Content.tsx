import { useState } from 'react';

export default function Content() {
  const [promo, setPromo] = useState('');
  const [items, setItems] = useState<string[]>([]);

  const publish = () => {
    const text = promo.trim();
    if (!text) return;
    setItems([...items, text]);
    setPromo('');
  };

  return (
    <section>
      <h1>Content</h1>
      <div>
        <textarea
          value={promo}
          onChange={e => setPromo(e.target.value)}
          placeholder="Promo text"
          rows={4}
        />
        <button type="button" onClick={publish}>Publish</button>
      </div>
      <ul>
        {items.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
    </section>
  );
}

