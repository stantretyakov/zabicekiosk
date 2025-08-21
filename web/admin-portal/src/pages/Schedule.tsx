import { useState } from 'react';

export default function Schedule() {
  const [config, setConfig] = useState('');

  return (
    <section>
      <h1>Schedule</h1>
      <textarea
        value={config}
        onChange={e => setConfig(e.target.value)}
        placeholder="Enter schedule configuration"
        rows={8}
        style={{ width: '100%' }}
      />
    </section>
  );
}

