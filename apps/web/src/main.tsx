import '@/styles.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from '@/App.tsx';
import { initErrorReporting } from '@/lib/errorReporting';
import { installGlobalErrorHandlers } from '@/lib/globalErrorHandlers';

initErrorReporting();
installGlobalErrorHandlers();

createRoot(document.querySelector('#root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
