import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
// Phase 12: must be imported before the app renders so the persisted
// language is active on first paint (see src/i18n/index.ts).
import "./i18n";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
