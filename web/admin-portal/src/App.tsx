import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Passes from './pages/Passes';
import Redeems from './pages/Redeems';
import Settings from './pages/Settings';
import Schedule from './pages/Schedule';
import Content from './pages/Content';
import Layout from './components/Layout';
import { onAuthStateChanged, logout } from './lib/auth';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(u => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) return null;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route element={user ? <Layout onLogout={logout} /> : <Navigate to="/login" replace />}> 
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/passes" element={<Passes />} />
          <Route path="/redeems" element={<Redeems />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/content" element={<Content />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
