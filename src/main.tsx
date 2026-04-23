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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
