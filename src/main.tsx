import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { NotifyProvider } from "./notify";

const loader = document.getElementById('app-loader');
if (loader) loader.style.display = 'none';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <NotifyProvider>
      <App />
    </NotifyProvider>
  </StrictMode>
);
