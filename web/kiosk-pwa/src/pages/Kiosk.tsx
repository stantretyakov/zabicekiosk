import React, { useState } from 'react';
import CameraScanner from '../components/CameraScanner';
import { redeem } from '../lib/api';
import beep from '../lib/beep';

export default function Kiosk() {
  const [message, setMessage] = useState('');

  const handleToken = async (token: string) => {
    try {
      const res = await redeem(token);
      setMessage(res.message);
      beep(res.status === 'ok');
    } catch (err) {
      console.error(err);
      setMessage('Ошибка сканирования');
      beep(false);
    }
  };

  return (
    <div>
      <CameraScanner onToken={handleToken} />
      {message && <p>{message}</p>}
    </div>
  );
}
