import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import ErrorBoundary from './components/ErrorBoundary';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
  {/* ➕ WRAP APP BẰNG ErrorBoundary */}
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
  </React.StrictMode>

);
