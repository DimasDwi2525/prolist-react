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
import { Plus, Edit } from "lucide-react";
import { HotTable } from "@handsontable/react";
import api from "../../api/api";
import LoadingOverlay from "../loading/LoadingOverlay";
import { filterBySearch } from "../../utils/filter";
import { formatDate } from "../../utils/FormatDate";
import FormRequestInvoicesModal from "./FormRequestInvoicesModal";
import RequestInvoiceDetailModal from "./RequestInvoiceDetailModal";

const ViewRequestInvoicesModal = ({
  open,
  onClose,
  projectId,
  onDataUpdated,
}) => {
  const [requestInvoices, setRequestInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const hotTableRef = useRef(null);
  const [openFormModal, setOpenFormModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedInvoiceData, setSelectedInvoiceData] = useState(null);

  const fetchRequestInvoices = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const response = await api.get(`/request-invoices/${projectId}`);
      setRequestInvoices(response.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch request invoices:", error);
      setRequestInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && projectId) {
      fetchRequestInvoices();
    }
  }, [open, projectId]);

  // Reset page to 0 when search term changes
  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  const dateRenderer = (instance, td, row, col, prop, value) => {
    td.innerText = formatDate(value);
    return td;
  };

  const statusRenderer = (instance, td, row, col, prop, value) => {
    const statusColors = {
      pending: "#ff9800",
      approved: "#4caf50",
      rejected: "#f44336",
    };
    td.innerText = value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
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

    // Tombol View
    const viewBtn = createButton(
      "View",
      "#fff",
      "#2196f3",
      "#1976d2",
      `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    `
    );
    viewBtn.addEventListener("click", () => {
      setSelectedInvoice(invoice.id);
      setSelectedInvoiceData(invoice);
      setOpenViewModal(true);
    });

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

    // Masukkan ke container
    container.appendChild(viewBtn);
    container.appendChild(editBtn);
    td.appendChild(container);

    // Pastikan cell tidak override
    td.style.textAlign = "left";
    td.style.verticalAlign = "middle";
    td.style.paddingLeft = "8px";

    return td;
  };

  const columns = [
    { data: "request_number", title: "Request Number" },
    { data: "description", title: "Description" },
    {
      data: "status",
      title: "Status",
      renderer: statusRenderer,
    },
    { data: "created_at", title: "Created Date", renderer: dateRenderer },
    {
      data: "actions",
      title: "Actions",
      renderer: actionsRenderer,
      readOnly: true,
    },
  ];

  const filteredData = filterBySearch(requestInvoices, searchTerm);

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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Request Invoices for Project {projectId}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            size="small"
            sx={{ minWidth: "auto" }}
            onClick={() => setOpenFormModal(true)}
          >
            Add Request Invoice
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ position: "relative" }}>
          <LoadingOverlay loading={loading} />

          <Box mb={2}>
            <TextField
              size="small"
              placeholder="Search request invoices..."
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
            <div>
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
                No request invoice data available for this project
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
      <FormRequestInvoicesModal
        open={openFormModal}
        onClose={() => {
          setOpenFormModal(false);
          setSelectedInvoiceData(null);
        }}
        projectId={projectId}
        invoiceData={selectedInvoiceData}
        onSave={() => {
          fetchRequestInvoices();
          if (onDataUpdated) {
            onDataUpdated();
          }
        }}
      />

      {/* View Modal */}
      <RequestInvoiceDetailModal
        open={openViewModal}
        onClose={() => {
          setOpenViewModal(false);
          setSelectedInvoice(null);
          setSelectedInvoiceData(null);
        }}
        invoiceId={selectedInvoice}
      />
    </Dialog>
  );
};

export default ViewRequestInvoicesModal;
