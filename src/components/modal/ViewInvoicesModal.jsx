import React, { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TablePagination,
  TextField,
} from "@mui/material";
import { Plus, Edit, CreditCard, Receipt, Trash2 } from "lucide-react";
import { HotTable } from "@handsontable/react";
import api from "../../api/api";
import LoadingOverlay from "../loading/LoadingOverlay";
import { filterBySearch } from "../../utils/filter";
import { formatDate } from "../../utils/FormatDate";
import { formatValue } from "../../utils/formatValue";
import FormInvoicesModal from "./FormInvoicesModal";
import ViewInvoicePaymentsModal from "./ViewInvoicePaymentsModal";
import FormInvoicePaymentsModal from "./FormInvoicePaymentsModal";
import ViewHoldingTaxModal from "./ViewHoldingTaxModal";
import FormHoldingTaxModal from "./FormHoldingTaxModal";

const ViewInvoicesModal = ({
  open,
  onClose,
  projectId,
  year,
  onDataUpdated,
}) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const hotTableRef = useRef(null);
  const [openFormModal, setOpenFormModal] = useState(false);
  const [openPaymentsModal, setOpenPaymentsModal] = useState(false);
  const [openViewWhtModal, setOpenViewWhtModal] = useState(false);
  const [openFormWhtModal, setOpenFormWhtModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedInvoiceData, setSelectedInvoiceData] = useState(null);
  const [selectedInvoiceForWht, setSelectedInvoiceForWht] = useState(null);
  const [selectedInvoiceForDelete, setSelectedInvoiceForDelete] =
    useState(null);

  const fetchInvoices = async () => {
    if (!projectId || !year) return;
    setLoading(true);
    try {
      const response = await api.get("/finance/invoices", {
        params: { project_id: projectId, year },
      });
      const invoicesData = response.data.invoices || [];
      const invoicesWithOutstanding = invoicesData.map((invoice) => ({
        ...invoice,
        outstanding_payment:
          invoice.invoice_value - (invoice.total_payment_amount || 0),
        has_wht: invoice.nilai_pph23 > 0 || invoice.nilai_pph42 > 0,
      }));
      setInvoices(invoicesWithOutstanding);
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && projectId && year) {
      fetchInvoices();
    }
  }, [open, projectId, year]);

  // Reset page to 0 when search term changes
  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  const dateRenderer = (instance, td, row, col, prop, value) => {
    if (value === null || value === undefined || value === "") {
      td.innerText = "-";
    } else {
      td.innerText = formatDate(value);
    }
    return td;
  };

  const currencyRenderer = (instance, td, row, col, prop, value) => {
    if (value === null || value === undefined || value === "") {
      td.innerText = "-";
    } else {
      td.innerText = formatValue(value).formatted;
    }
    return td;
  };

  const defaultRenderer = (instance, td, row, col, prop, value) => {
    if (value === null || value === undefined || value === "") {
      td.innerText = "-";
    } else {
      td.innerText = value;
    }
    return td;
  };

  const statusRenderer = (instance, td, row, col, prop, value) => {
    const statusColors = {
      unpaid: "#f44336",
      partial: "#ff9800",
      paid: "#4caf50",
    };
    if (value === null || value === undefined || value === "") {
      td.innerText = "-";
    } else {
      td.innerText = value.charAt(0).toUpperCase() + value.slice(1);
    }
    td.style.color = statusColors[value] || "#000";
    td.style.fontWeight = "bold";
    return td;
  };

  const actionsRenderer = (
    instance,
    td,
    row,
    col,
    prop,
    value,
    cellProperties
  ) => {
    const invoice = cellProperties.instance.getSourceDataAtRow(row);

    // Hapus isi lama
    td.innerHTML = "";

    // Bungkus container
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.gap = "8px";
    container.style.justifyContent = "flex-start";
    container.style.height = "100%";

    // Utility function untuk buat tombol
    const createButton = (label, color, bgColor, hoverBg, iconSvg) => {
      const btn = document.createElement("button");

      // Style tombol
      btn.style.display = "flex";
      btn.style.alignItems = "center";
      btn.style.gap = "4px";
      btn.style.padding = "4px 8px";
      btn.style.border = "1px solid transparent";
      btn.style.borderRadius = "6px";
      btn.style.fontSize = "0.75rem";
      btn.style.background = bgColor;
      btn.style.color = color;
      btn.style.cursor = "pointer";
      btn.style.transition = "all 0.2s ease";

      // Isi tombol (ikon + teks)
      btn.innerHTML = `${iconSvg}<span>${label}</span>`;

      // Hover effect
      btn.addEventListener("mouseenter", () => {
        btn.style.background = hoverBg;
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.background = bgColor;
      });

      return btn;
    };

    // Tombol Edit
    const editBtn = createButton(
      "Edit",
      "#fff",
      "#1976d2",
      "#125ea6",
      `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
    `
    );
    editBtn.addEventListener("click", () => {
      setSelectedInvoiceData(invoice);
      setOpenFormModal(true);
    });

    // Tombol Payments
    const paymentBtn = createButton(
      "Payments",
      "#fff",
      "#2e7d32",
      "#256628",
      `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
        <line x1="2" y1="10" x2="22" y2="10"></line>
      </svg>
    `
    );
    paymentBtn.addEventListener("click", () => {
      setSelectedInvoice(invoice.invoice_id);
      setSelectedInvoiceData(invoice);
      setOpenPaymentsModal(true);
    });

    // Tombol Delete
    const deleteBtn = createButton(
      "Delete",
      "#fff",
      "#f44336",
      "#d32f2f",
      `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3,6 5,6 21,6"></polyline>
        <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
      </svg>
    `
    );
    deleteBtn.addEventListener("click", () => {
      setSelectedInvoiceForDelete(invoice);
      setOpenDeleteModal(true);
    });

    // Tombol WHT - hanya tampil jika invoice memiliki WHT
    if (invoice.has_wht) {
      const whtBtn = createButton(
        "WHT",
        "#fff",
        "#ed6c02",
        "#c05500",
        `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14,2 14,8 20,8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10,9 9,9 8,9"></polyline>
        </svg>
      `
      );
      whtBtn.addEventListener("click", () => {
        setSelectedInvoiceForWht(invoice.invoice_id);
        setOpenViewWhtModal(true);
      });
      container.appendChild(whtBtn);
    }

    // Masukkan ke container
    container.appendChild(editBtn);
    container.appendChild(paymentBtn);
    container.appendChild(deleteBtn);
    td.appendChild(container);

    // Pastikan cell tidak override
    td.style.textAlign = "left";
    td.style.verticalAlign = "middle";
    td.style.paddingLeft = "8px";

    return td;
  };

  const columns = [
    {
      data: "actions",
      title: "Actions",
      renderer: actionsRenderer,
      readOnly: true,
      width: 350,
    },
    { data: "invoice_id", title: "Invoice ID", renderer: defaultRenderer },
    { data: "no_faktur", title: "No Faktur", renderer: defaultRenderer },
    { data: "invoice_date", title: "Invoice Date", renderer: dateRenderer },
    {
      data: "invoice_description",
      title: "Description",
      renderer: defaultRenderer,
    },
    {
      data: "invoice_value",
      title: "Invoice Value",
      renderer: currencyRenderer,
    },
    {
      data: "total_payment_amount",
      title: "Total Payment",
      renderer: currencyRenderer,
    },
    {
      data: "outstanding_payment",
      title: "Outstanding Payment",
      renderer: currencyRenderer,
    },
    {
      data: "nilai_ppn",
      title: "Nilai PPN",
      renderer: currencyRenderer,
    },
    {
      data: "nilai_pph23",
      title: "Nilai PPH23",
      renderer: currencyRenderer,
    },
    {
      data: "nilai_pph42",
      title: "Nilai PPH42",
      renderer: currencyRenderer,
    },
    {
      data: "total_invoice",
      title: "Total Invoice",
      renderer: currencyRenderer,
    },
    {
      data: "expected_payment",
      title: "Expected Payment",
      renderer: currencyRenderer,
    },
    {
      data: "payment_actual_date",
      title: "Payment Actual Date",
      renderer: dateRenderer,
    },
    { data: "invoice_due_date", title: "Due Date", renderer: dateRenderer },
    {
      data: "payment_status",
      title: "Payment Status",
      renderer: statusRenderer,
    },
    { data: "remarks", title: "Remarks", renderer: defaultRenderer },
  ];

  const filteredData = filterBySearch(invoices, searchTerm);

  const paginatedData = filteredData.slice(
    page * pageSize,
    page * pageSize + pageSize
  );

  const tableHeight = Math.min(pageSize * 40 + 50, 400);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangePageSize = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDelete = async () => {
    if (!selectedInvoiceForDelete) return;

    try {
      await api.delete(
        `/finance/invoices/${selectedInvoiceForDelete.invoice_id}`
      );
      setOpenDeleteModal(false);
      setSelectedInvoiceForDelete(null);
      fetchInvoices();
      if (onDataUpdated) {
        onDataUpdated();
      }
    } catch (error) {
      console.error("Failed to delete invoice:", error);
    }
  };

  const handleTableClick = (event) => {
    const target = event.target;
    if (target.classList.contains("action-btn")) {
      const action = target.getAttribute("data-action");
      const invoice = JSON.parse(target.getAttribute("data-invoice"));

      switch (action) {
        case "edit":
          setSelectedInvoiceData(invoice);
          setOpenFormModal(true);
          break;
        case "payments":
          setSelectedInvoice(invoice.invoice_id);
          setSelectedInvoiceData(invoice);
          setOpenPaymentsModal(true);
          break;
        default:
          break;
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Invoices for Project {projectId} ({year})
          </Typography>
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            size="small"
            sx={{ minWidth: "auto" }}
            onClick={() => setOpenFormModal(true)}
          >
            Add Invoice
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ position: "relative" }}>
          <LoadingOverlay loading={loading} />

          <Box mb={2}>
            <TextField
              size="small"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                width: 240,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  paddingRight: 0,
                },
                "& .MuiInputBase-input": {
                  padding: "6px 10px",
                  fontSize: "0.875rem",
                },
              }}
            />
          </Box>

          {paginatedData.length > 0 ? (
            <div onClick={handleTableClick}>
              <HotTable
                ref={hotTableRef}
                data={paginatedData}
                colHeaders={columns.map((c) => c.title)}
                columns={columns}
                width="100%"
                height={tableHeight}
                manualColumnResize
                licenseKey="non-commercial-and-evaluation"
                manualColumnFreeze
                fixedColumnsLeft={2}
                stretchH="all"
                filters
                dropdownMenu
                className="ht-theme-horizon"
                manualColumnMove
              />
            </div>
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No invoice data available for this project
              </Typography>
            </Box>
          )}

          {paginatedData.length > 0 && (
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <TablePagination
                component="div"
                count={filteredData.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={pageSize}
                onRowsPerPageChange={handleChangePageSize}
                rowsPerPageOptions={[10, 25, 50]}
              />
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>

      {/* Form Modal */}
      <FormInvoicesModal
        open={openFormModal}
        onClose={() => {
          setOpenFormModal(false);
          setSelectedInvoiceData(null);
        }}
        projectId={projectId}
        invoiceData={selectedInvoiceData}
        onSave={() => {
          fetchInvoices();
          if (onDataUpdated) {
            onDataUpdated();
          }
        }}
      />

      {/* Payments View Modal */}
      <ViewInvoicePaymentsModal
        open={openPaymentsModal}
        onClose={() => {
          setOpenPaymentsModal(false);
          setSelectedInvoice(null);
          setSelectedInvoiceData(null);
        }}
        invoiceId={selectedInvoice}
        invoiceData={selectedInvoiceData}
        onDataUpdated={() => {
          fetchInvoices();
          if (onDataUpdated) {
            onDataUpdated();
          }
        }}
      />

      {/* WHT View Modal */}
      <ViewHoldingTaxModal
        open={openViewWhtModal}
        onClose={() => {
          setOpenViewWhtModal(false);
          setSelectedInvoiceForWht(null);
        }}
        invoiceId={selectedInvoiceForWht}
        onEdit={() => {
          setOpenViewWhtModal(false);
          setOpenFormWhtModal(true);
        }}
      />

      {/* WHT Form Modal */}
      <FormHoldingTaxModal
        open={openFormWhtModal}
        onClose={() => {
          setOpenFormWhtModal(false);
          setOpenViewWhtModal(true); // Return to view modal
        }}
        invoiceId={selectedInvoiceForWht}
        onSave={() => {
          setOpenFormWhtModal(false);
          setOpenViewWhtModal(true); // Return to view modal after save
          fetchInvoices(); // Refresh data after save
        }}
      />

      {/* Delete Confirmation Modal */}
      <Dialog
        open={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete invoice{" "}
            <strong>{selectedInvoiceForDelete?.invoice_id}</strong>? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteModal(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default ViewInvoicesModal;
