import React from 'react';
import ReactDOM from 'react-dom/client';
import Kiosk from './pages/Kiosk';
import './styles/tokens.css';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Kiosk />
  </React.StrictMode>
);
