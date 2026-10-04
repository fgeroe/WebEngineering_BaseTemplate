import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { getElement } from './dom';

createRoot(getElement('#root', HTMLElement)).render(
  <StrictMode>
    <App />
  </StrictMode>
);
