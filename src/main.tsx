// src/main.tsx
import { ConvexProvider } from 'convex/react';
import { createRoot } from 'react-dom/client';
import App from './App';

const root = createRoot(document.getElementById('root')!);

root.render(
  <ConvexProvider>
    <App />
  </ConvexProvider>
);

// تسجيل service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}