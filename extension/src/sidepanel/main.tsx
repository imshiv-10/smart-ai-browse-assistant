import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../popup/App';
import '@/styles/globals.css';

// Side panel uses the same App component as popup
// but with different sizing (handled in CSS)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
