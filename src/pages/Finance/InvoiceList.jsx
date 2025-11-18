import React, { useEffect, useState, useRef, useMemo } from "react";
import { HotTable } from "@handsontable/react";
import Handsontable from "handsontable";
import {
  Typography,
  Stack,
  Box,
  Snackbar,
  Alert,
  TextField,
  TablePagination,
  Card,
  CardContent,
} from "@mui/material";
import ReactDOM from "react-dom";

import api from "../../api/api";
import LoadingOverlay from "../../components/loading/LoadingOverlay";
import FilterBar from "../../components/filter/FilterBar";
import { filterBySearch } from "../../utils/filter";
import { formatValue } from "../../utils/formatValue";
import ViewInvoiceModal from "../../components/modal/ViewInvoiceModal";

export default function InvoiceList() {
  const hotTableRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    range_type: "monthly",
    month: null,
    from_date: "",
    to_date: "",
  });

  const [stats, setStats] = useState({
    availableYears: [new Date().getFullYear()],
    totalInvoices: 0,
    totalInvoiceValue: 0,
  });

  // Definisi kolom
  const allColumns = useMemo(
    () => [
      {
        data: "actions",
        title: "Actions",
        renderer: (instance, td, row, col, prop, value, cellProperties) => {
          const invoice = cellProperties.instance.getSourceDataAtRow(row);

          // Clear existing content
          td.innerHTML = "";

          // Create container
          const container = document.createElement("div");
          container.style.display = "flex";
          container.style.alignItems = "center";
          container.style.justifyContent = "center";
          container.style.height = "100%";

          // Create view button
          const viewBtn = document.createElement("button");
          viewBtn.style.display = "flex";
          viewBtn.style.alignItems = "center";
          viewBtn.style.gap = "4px";
          viewBtn.style.padding = "6px 12px";
          viewBtn.style.border = "1px solid #1976d2";
          viewBtn.style.borderRadius = "6px";
          viewBtn.style.fontSize = "0.75rem";
          viewBtn.style.background = "#1976d2";
          viewBtn.style.color = "#fff";
          viewBtn.style.cursor = "pointer";
          viewBtn.style.transition = "all 0.2s ease";

          // Hover effect
          viewBtn.addEventListener("mouseenter", () => {
            viewBtn.style.background = "#125ea6";
            viewBtn.style.borderColor = "#125ea6";
          });
          viewBtn.addEventListener("mouseleave", () => {
            viewBtn.style.background = "#1976d2";
            viewBtn.style.borderColor = "#1976d2";
          });

          // Icon and text
          viewBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span>View</span>
          `;

          // Click handler
          viewBtn.addEventListener("click", () => {
            setSelectedInvoice(invoice);
            setOpenViewModal(true);
          });

          container.appendChild(viewBtn);
          td.appendChild(container);

          // Cell styling
          td.style.textAlign = "center";
          td.style.verticalAlign = "middle";
          td.style.padding = "4px";

          return td;
        },
        readOnly: true,
        width: 100,
      },
      { data: "invoice_id", title: "Invoice ID" },
      { data: "project_number", title: "Project Number" },
      { data: "project_name", title: "Project Name" },
      {
        data: "po_value",
        title: "PO Value",
        renderer: (instance, td, row, col, prop, value) => {
          td.style.fontWeight = "600";
          td.style.color = "green";
          td.innerText = formatValue(value).formatted;
          return td;
        },
      },
      { data: "po_number", title: "PO Number" },
      { data: "client_name", title: "Client Name" },
      { data: "invoice_type", title: "Invoice Type" },
      { data: "no_faktur", title: "No Faktur" },
      { data: "invoice_date", title: "Invoice Date" },
      { data: "invoice_description", title: "Description" },
      {
        data: "invoice_value",
        title: "Invoice Value",
        renderer: (instance, td, row, col, prop, value) => {
          td.style.fontWeight = "600";
          td.style.color = "green";
          td.innerText = formatValue(value).formatted;
          return td;
        },
      },
      { data: "invoice_due_date", title: "Due Date" },
      { data: "payment_status", title: "Payment Status" },
      {
        data: "total_payment_amount",
        title: "Total Payment Amount",
        renderer: (instance, td, row, col, prop, value) => {
          td.style.fontWeight = "600";
          td.style.color = "green";
          td.innerText = formatValue(value).formatted;
          return td;
        },
      },
      {
        data: "payment_percentage",
        title: "Payment Percentage (%)",
        renderer: (instance, td, row, col, prop, value) => {
          td.style.fontWeight = "600";
          td.style.color = "blue";
          td.innerText = `${value}%`;
          return td;
        },
      },
      { data: "remarks", title: "Remarks" },
      { data: "currency", title: "Currency" },
    ],
    []
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/finance/invoice-list", {
        params: filters,
      });
      const data = response.data || {};
      setInvoices(data.data || []);
      setStats((prev) => ({
        ...prev,
        availableYears: data.availableYears || [new Date().getFullYear()],
        totalInvoices: data.total_invoices || 0,
        totalInvoiceValue: data.total_invoice_value || 0,
      }));
    } catch (err) {
      console.error(err.response?.data || err);
      setSnackbar({
        open: true,
        message: "Failed to fetch invoice list data",
        severity: "error",
      });
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  // Reset page to 0 when search term changes
  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  const handleFilter = (newFilters) => {
    const payload = {
      year: newFilters.year,
      range_type: newFilters.rangeType,
    };

    if (newFilters.month) payload.month = newFilters.month;
    if (newFilters.from) payload.from_date = newFilters.from;
    if (newFilters.to) payload.to_date = newFilters.to;

    setFilters(payload);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangePageSize = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredData = filterBySearch(invoices, searchTerm).map((item) => ({
    invoice_id: item.invoice_id || "",
    project_name: item.project_name || "",
    project_number: item.project_number || "",
    po_value: item.po_value || 0,
    po_number: item.po_number || "",
    client_name: item.client_name || "",
    invoice_type: item.invoice_type || "",
    no_faktur: item.no_faktur || "",
    invoice_date: item.invoice_date || "",
    invoice_description: item.invoice_description || "",
    invoice_value: item.invoice_value || 0,
    invoice_due_date: item.invoice_due_date || "",
    payment_status: item.payment_status || "",
    total_payment_amount: item.total_payment_amount || 0,
    payment_percentage: item.payment_percentage || 0,
    remarks: item.remarks || "",
    currency: item.currency || "",
    created_at: item.created_at || "",
  }));

  const paginatedData = filteredData.slice(
    page * pageSize,
    page * pageSize + pageSize
  );

  const tableHeight = Math.min(pageSize * 40 + 50, window.innerHeight - 250);

  return (
    <Box sx={{ position: "relative" }}>
      <LoadingOverlay loading={loading} />

      <FilterBar
        stats={stats}
        onFilter={handleFilter}
        initialFilters={{
          year: new Date().getFullYear(),
          rangeType: "monthly",
          month: null,
          from: "",
          to: "",
        }}
      />

      {/* Compact Cards for Totals */}
      <Stack
        direction="row"
        spacing={2}
        sx={{ mb: 2, mt: 2, justifyContent: "flex-start" }}
      >
        <Card sx={{ minWidth: 200, maxWidth: 250 }}>
          <CardContent sx={{ textAlign: "center", py: 1 }}>
            <Typography variant="body1" color="primary" fontWeight="medium">
              Total Invoices
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {stats.totalInvoices}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 200, maxWidth: 250 }}>
          <CardContent sx={{ textAlign: "center", py: 1 }}>
            <Typography variant="body1" color="primary" fontWeight="medium">
              Total Invoice Value
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {formatValue(stats.totalInvoiceValue).formatted}
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      <Stack
        direction="row"
        spacing={1}
        justifyContent="flex-end"
        alignItems="center"
        mt={3}
        mb={2}
      >
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
      </Stack>

      {/* Handsontable */}
      <div className="table-wrapper">
        <div className="table-inner">
          <HotTable
            ref={hotTableRef}
            data={paginatedData}
            colHeaders={allColumns.map((c) => c.title)}
            columns={allColumns}
            width="auto"
            height={tableHeight}
            manualColumnResize
            licenseKey="non-commercial-and-evaluation"
            manualColumnFreeze
            fixedColumnsLeft={3}
            stretchH="all"
            filters
            dropdownMenu
            className="ht-theme-horizon"
            manualColumnMove
          />
        </div>
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Pagination */}
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

      {/* View Invoice Modal */}
      <ViewInvoiceModal
        open={openViewModal}
        onClose={() => {
          setOpenViewModal(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
      />
    </Box>
  );
}
