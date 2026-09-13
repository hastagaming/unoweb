import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './features/auth/auth-context';
import { AppRouter } from './app-router';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </React.StrictMode>
);
