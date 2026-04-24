import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error logger for production debugging
window.onerror = (message, source, lineno, colno, error) => {
  console.error("Global JS Error:", { message, source, lineno, colno, error });
  const root = document.getElementById('root');
  if (root && root.innerHTML === '') {
    root.innerHTML = `<div style="background:#0a0b0d;color:#ff453a;padding:40px;font-family:sans-serif;height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;">
      <div>
        <h1 style="font-size:24px;margin-bottom:16px;">System Critical Error</h1>
        <p style="color:#8e8e93;max-width:400px;margin:0 auto 24px;">A fatal initialization error occurred on this node. Please check your browser's developer console for details.</p>
        <code style="display:block;background:#16181d;padding:16px;border-radius:8px;font-size:12px;color:#fff;overflow:auto;max-width:100%;">${message}</code>
      </div>
    </div>`;
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
