import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './app/store.js';
import App from './App.jsx';
import { restoreSession } from './modules/auth/api/restoreSession.js';
import './styles/tokens.css';
import './styles/global.css';

// A reload keeps the session: one refresh before protected routes decide (TASK-049).
restoreSession(store.dispatch);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
