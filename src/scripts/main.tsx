import { createRoot } from 'react-dom/client';
import { getElement } from './dom';
import App from './App';

createRoot(getElement('#root', HTMLElement)).render(<App />);
