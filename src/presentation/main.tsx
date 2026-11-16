import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './fonts.css';
import '../../design-system/tokens.css';
import '../../design-system/components.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
