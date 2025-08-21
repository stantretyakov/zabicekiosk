import { useState } from 'react';

export default function Settings() {
  const [singlePrice, setSinglePrice] = useState('');
  const [subscriptionPrice, setSubscriptionPrice] = useState('');
  const [subscriptionSessions, setSubscriptionSessions] = useState('');

  return (
    <section>
      <h1>Settings</h1>
      <form className="settings-form">
        <label>
          Single visit price
          <input
            type="number"
            value={singlePrice}
            onChange={e => setSinglePrice(e.target.value)}
          />
        </label>
        <label>
          Subscription price
          <input
            type="number"
            value={subscriptionPrice}
            onChange={e => setSubscriptionPrice(e.target.value)}
          />
        </label>
        <label>
          Subscription sessions
          <input
            type="number"
            value={subscriptionSessions}
            onChange={e => setSubscriptionSessions(e.target.value)}
          />
        </label>
      </form>
    </section>
  );
}

