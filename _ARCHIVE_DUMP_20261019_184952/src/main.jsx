import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import AppRoutes from './App.jsx';
import AudioWrapper from './components/AudioWrapper.jsx';
import './main.css';

// Purge legacy static store IDs that break UUID validation
if (localStorage.getItem('ceekay-store') === 'benoni') {
  localStorage.removeItem('ceekay-store');
}



// Auto-purge legacy cart once
const CART_VERSION = 'v3-hard-reset';
if (localStorage.getItem('ceekay-cart-version') !== CART_VERSION) {
  localStorage.removeItem('ceekay-cart');
  localStorage.setItem('ceekay-cart-version', CART_VERSION);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <AudioWrapper>
        <AppRoutes />
      </AudioWrapper>
    </HashRouter>
  </React.StrictMode>
);