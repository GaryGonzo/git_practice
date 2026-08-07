import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./lib/AuthProvider.tsx";
import { HouseholdProvider } from "./lib/HouseholdProvider.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <HouseholdProvider>
            <App />
          </HouseholdProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
