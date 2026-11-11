import React from 'react';
import ReactDOM from 'react-dom/client';
import 'katex/dist/katex.min.css';
import './styles.css';
import App from './App';
import { presentation } from '../presentation.config';
import { applyTheme } from './theme';
document.title = presentation.title;
document.documentElement.lang = presentation.locale;
applyTheme();
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
