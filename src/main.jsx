import React from "react"; // untuk memastikan React tersedia
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./App.css"; // Tailwind + custom CSS
import App from "./App.jsx";
// inisialisasi Handsontable global (wajib sebelum HotTable dipakai)
import "./handsontable.config.js";

import "handsontable/styles/handsontable.min.css";
import "handsontable/styles/ht-theme-main.min.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
