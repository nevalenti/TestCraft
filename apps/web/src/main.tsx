import '@/styles.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from '@/App.tsx';
import { installGlobalErrorHandlers } from '@/lib/globalErrorHandlers';

installGlobalErrorHandlers();

createRoot(document.querySelector('#root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
