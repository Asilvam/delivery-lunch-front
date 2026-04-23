import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";
import App from "./App.tsx";
import axios from 'axios';
import { installRequestLogger } from './lib/requestLogger';

// Install request logger if enabled via VITE_ENABLE_REQUEST_LOGS
installRequestLogger(axios);
// Expose runtime flag for debugging in the browser console
try {
  // eslint-disable-next-line no-undef
  (window as any).__API_LOGGER = { enabled: import.meta.env.VITE_ENABLE_REQUEST_LOGS };
  console.info('[API LOGGING] VITE_ENABLE_REQUEST_LOGS=', import.meta.env.VITE_ENABLE_REQUEST_LOGS);
} catch {
  /* ignore in non-browser env */
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
