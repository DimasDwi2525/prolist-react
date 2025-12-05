import Handsontable from "handsontable";

export const formatDate = (val) => {
  if (!val) return "-";
  try {
    const date = new Date(val);
    if (isNaN(date)) return "-";
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    return d + "-" + m + "-" + date.getFullYear();
  } catch {
    return "-";
  }
};

export const dateRenderer = (instance, td, row, col, prop, value) => {
  td.textContent = formatDate(value);
  td.style.color = "#000";
  return td;
};

export const textRenderer = (instance, td, row, col, prop, value) => {
  td.textContent = value || "-";
  td.style.color = "#000";
  return td;
};

export const valueRenderer = (instance, td, row, col, prop, value) => {
  if (value == null || value === "" || isNaN(value)) {
    td.textContent = "-";
    td.style.color = "#9ca3af"; // gray color for invalid values
  } else {
    td.textContent = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
    td.style.fontWeight = "600";
    td.style.color = "green";
  }
  return td;
};

export const statusRenderer = (instance, td, row, col, prop, value) => {
  const statusMap = {
    A: { label: "[A] ✓ Completed", color: "success", variant: "filled" },
    D: { label: "[D] ⏳ No PO Yet", color: "warning", variant: "outlined" },
    E: { label: "[E] ❌ Cancelled", color: "error", variant: "outlined" },
    F: { label: "[F] ⚠️ Lost Bid", color: "warning", variant: "outlined" },
    O: { label: "[O] 🕒 On Going", color: "info", variant: "outlined" },
  };

  const status = statusMap[value] || {
    label: value || "-",
    color: "default",
    variant: "outlined",
  };

  td.innerHTML =
    '<span style="' +
    "background-color: " +
    (status.variant === "filled"
      ? status.color === "success"
        ? "#4caf50"
        : status.color === "error"
        ? "#f44336"
        : "#2196f3"
      : "transparent") +
    "; " +
    "color: " +
    (status.variant === "filled"
      ? "white"
      : status.color === "success"
      ? "#4caf50"
      : status.color === "error"
      ? "#f44336"
      : "#2196f3") +
    "; " +
    "border: " +
    (status.variant === "outlined"
      ? "1px solid " +
        (status.color === "success"
          ? "#4caf50"
          : status.color === "error"
          ? "#f44336"
          : "#2196f3")
      : "none") +
    "; " +
    "padding: 4px 8px; " +
    "border-radius: 4px; " +
    "font-weight: 600; " +
    "font-size: 12px; " +
    "display: inline-block; " +
    "min-width: 120px; " +
    'text-align: center;">' +
    status.label +
    "</span>";

  return td;
};

export const booleanRenderer = (instance, td, row, col, prop, value) => {
  const isYes = Number(value) === 1;
  const label = isYes ? "Yes" : "No";
  const bgColor = isYes ? "#2196f3" : "transparent";
  const color = isYes ? "white" : "black";
  const border = isYes ? "none" : "1px solid #ccc";

  const span = document.createElement("span");
  span.textContent = label;
  span.style.backgroundColor = bgColor;
  span.style.color = color;
  span.style.border = border;
  span.style.padding = "4px 8px";
  span.style.borderRadius = "12px";
  span.style.fontSize = "12px";

  td.innerHTML = ""; // Clear existing content
  td.appendChild(span);

  return td;
};

export const percentageRenderer = (instance, td, row, col, prop, value) => {
  td.innerText = `${value != null ? value : 0}%`;
  return td;
};
