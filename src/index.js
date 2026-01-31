import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';  // ← Esta línea es importante
import MaskShiftUltimate from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <MaskShiftUltimate />
  </React.StrictMode>
);